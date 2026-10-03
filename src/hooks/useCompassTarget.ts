import { useEffect } from 'react';
import maplibregl from 'maplibre-gl';
import { destinationPoint, type MapLocation } from '../lib/potentialSampler';

const SOURCE_ID = 'compass-target';
const LINE_LAYER_ID = 'compass-target-line';
const POINT_LAYER_ID = 'compass-target-point';
// 距離リング（useRangeRings）の淡い紫に揃え、点だけ選択色の紫で塗る
const LINE_COLOR = '#c4b5fd';
const POINT_COLOR = '#8b5cf6';

export type CompassTarget = { bearing: number; distance: number };

function targetFeatureCollection(center: MapLocation, target: CompassTarget): GeoJSON.FeatureCollection {
    const point = destinationPoint(center, target.bearing, target.distance);
    return {
        type: 'FeatureCollection',
        features: [
            {
                type: 'Feature',
                properties: {},
                geometry: { type: 'LineString', coordinates: [[center.lng, center.lat], [point.lng, point.lat]] },
            },
            { type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [point.lng, point.lat] } },
        ],
    };
}

// コンパスの文字盤でタップした位置が、地図のどこに当たるかを示す（中心からの線と点）。
// 中心はコンパスと同じ地点（選択地点、なければ現在地）。target が null の間は何も描かない
export function useCompassTarget(
    map: maplibregl.Map | null,
    isLoaded: boolean,
    center: MapLocation | null,
    target: CompassTarget | null,
) {
    useEffect(() => {
        if (!map || !isLoaded) return;
        map.addSource(SOURCE_ID, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
        map.addLayer({
            id: LINE_LAYER_ID,
            type: 'line',
            source: SOURCE_ID,
            filter: ['==', ['geometry-type'], 'LineString'],
            paint: { 'line-color': LINE_COLOR, 'line-width': 1.5, 'line-opacity': 0.85, 'line-dasharray': [1, 2] },
        });
        map.addLayer({
            id: POINT_LAYER_ID,
            type: 'circle',
            source: SOURCE_ID,
            filter: ['==', ['geometry-type'], 'Point'],
            paint: {
                'circle-radius': 7,
                'circle-color': POINT_COLOR,
                'circle-stroke-color': '#ffffff',
                'circle-stroke-width': 2,
            },
        });
        return () => {
            // 地図の破棄（map.remove）後に呼ばれても落ちないようにする
            if (!map.getStyle()) return;
            if (map.getLayer(POINT_LAYER_ID)) map.removeLayer(POINT_LAYER_ID);
            if (map.getLayer(LINE_LAYER_ID)) map.removeLayer(LINE_LAYER_ID);
            if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
        };
    }, [map, isLoaded]);

    const lng = center?.lng;
    const lat = center?.lat;
    const bearing = target?.bearing;
    const distance = target?.distance;

    useEffect(() => {
        if (!map || !isLoaded) return;
        const source = map.getSource<maplibregl.GeoJSONSource>(SOURCE_ID);
        if (!source) return;
        const hasTarget = lng !== undefined && lat !== undefined && bearing !== undefined && distance !== undefined;
        source.setData(hasTarget
            ? targetFeatureCollection({ lng, lat }, { bearing, distance })
            : { type: 'FeatureCollection', features: [] });
    }, [map, isLoaded, lng, lat, bearing, distance]);
}

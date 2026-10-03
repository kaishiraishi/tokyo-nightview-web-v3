import { useEffect, useRef, type RefObject } from 'react';
import maplibregl from 'maplibre-gl';
import { destinationPoint, type MapLocation } from '../lib/potentialSampler';
import { formatDistance, RANGE_GUIDE_FRACTIONS } from '../components/potential/prototypes/canvas';

const SOURCE_ID = 'range-rings';
const OUTER_LAYER_ID = 'range-rings-outer';
const INNER_LAYER_ID = 'range-rings-inner';
const RING_SEGMENTS = 120;
const FIT_PADDING = 32;
const FIT_MAX_ZOOM = 17.5;
// コンパスのカードが地図の上に浮かぶ余白（カード自体の外側のすき間を含む）
const CARD_GAP = 16;
// 地図の他の淡い紫（枠・フォーカス）に合わせる
const RING_COLOR = '#c4b5fd';
const LABEL_CLASS = 'pointer-events-none rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-violet-100 backdrop-blur-sm';

function ringCoordinates(center: MapLocation, radius: number): [number, number][] {
    return Array.from({ length: RING_SEGMENTS + 1 }, (_, index) => {
        const point = destinationPoint(center, (index / RING_SEGMENTS) * 360, radius);
        return [point.lng, point.lat];
    });
}

function ringsFeatureCollection(center: MapLocation, range: number): GeoJSON.FeatureCollection {
    return {
        type: 'FeatureCollection',
        features: RANGE_GUIDE_FRACTIONS.map((fraction) => ({
            type: 'Feature',
            properties: { outer: fraction === 1 },
            geometry: { type: 'LineString', coordinates: ringCoordinates(center, range * fraction) },
        })),
    };
}

// コンパスモード中、コンパスの距離ガイド（range の 1/4・1/2・1）と同じ円を地図に重ねる。
// 円の中心は、コンパスが表示している地点（選択地点、なければ現在地）。
// 開いたとき・range を変えたときは、外側の円が地図に収まるよう表示範囲を合わせる（コンパスとの縮尺の対応）
// obscured: コンパスのカードに隠れる辺と、そのカードの要素。円はカードを避けた見える領域に収める。
// カードの大きさは画面幅と縦横比で決まるので、割合ではなく合わせる時点の実寸を測る
export type ObscuredEdge = { edge: 'top' | 'left'; card: RefObject<HTMLElement | null> };

export function useRangeRings(
    map: maplibregl.Map | null,
    isLoaded: boolean,
    center: MapLocation | null,
    range: number,
    enabled: boolean,
    obscured: ObscuredEdge,
) {
    const markersRef = useRef<{ marker: maplibregl.Marker; element: HTMLDivElement }[]>([]);
    const centerRef = useRef(center);
    const lng = center?.lng;
    const lat = center?.lat;
    const hasCenter = center !== null;
    const { edge, card } = obscured;

    useEffect(() => {
        centerRef.current = lng !== undefined && lat !== undefined ? { lng, lat } : null;
    }, [lng, lat]);

    useEffect(() => {
        if (!map || !isLoaded || !enabled) return;
        map.addSource(SOURCE_ID, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
        map.addLayer({
            id: INNER_LAYER_ID,
            type: 'line',
            source: SOURCE_ID,
            filter: ['==', ['get', 'outer'], false],
            paint: { 'line-color': RING_COLOR, 'line-width': 1.2, 'line-opacity': 0.6, 'line-dasharray': [2, 3] },
        });
        map.addLayer({
            id: OUTER_LAYER_ID,
            type: 'line',
            source: SOURCE_ID,
            filter: ['==', ['get', 'outer'], true],
            paint: { 'line-color': RING_COLOR, 'line-width': 2, 'line-opacity': 0.9 },
        });
        return () => {
            markersRef.current.forEach(({ marker }) => marker.remove());
            markersRef.current = [];
            // 地図の破棄（map.remove）後に呼ばれても落ちないようにする
            if (!map.getStyle()) return;
            if (map.getLayer(OUTER_LAYER_ID)) map.removeLayer(OUTER_LAYER_ID);
            if (map.getLayer(INNER_LAYER_ID)) map.removeLayer(INNER_LAYER_ID);
            if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
        };
    }, [map, isLoaded, enabled]);

    useEffect(() => {
        if (!map || !isLoaded || !enabled || lng === undefined || lat === undefined) return;
        const source = map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
        if (!source) return;
        const origin = { lng, lat };
        source.setData(ringsFeatureCollection(origin, range));

        // 距離ラベルは各円の真北に置く（文字は地図を回しても読める向きのまま）
        RANGE_GUIDE_FRACTIONS.forEach((fraction, index) => {
            const north = destinationPoint(origin, 0, range * fraction);
            let entry = markersRef.current[index];
            if (!entry) {
                const element = document.createElement('div');
                element.className = LABEL_CLASS;
                entry = { marker: new maplibregl.Marker({ element, anchor: 'bottom' }).setLngLat([north.lng, north.lat]).addTo(map), element };
                markersRef.current[index] = entry;
            }
            entry.element.textContent = formatDistance(range * fraction);
            entry.marker.setLngLat([north.lng, north.lat]);
        });
    }, [map, isLoaded, enabled, lng, lat, range]);

    useEffect(() => {
        const origin = centerRef.current;
        if (!map || !isLoaded || !enabled || !origin) return;
        const bounds = new maplibregl.LngLatBounds();
        // 4 方位の端が収まれば円全体が収まる
        [0, 90, 180, 270].forEach((bearing) => {
            const point = destinationPoint(origin, bearing, range);
            bounds.extend([point.lng, point.lat]);
        });
        // 分割表示で地図の枠が変わった直後なので、サイズを取り直してから合わせる
        map.resize();
        // カードは地図と同じ親に絶対配置されている。出現アニメーションの拡大を含まない offset 系の値で測る。
        // カードがまだ無いときは隠れる分なしで合わせる（円が一部カードの下に入るだけで、壊れはしない）
        const cardElement = card.current;
        const cardExtent = cardElement
            ? edge === 'top' ? cardElement.offsetTop + cardElement.offsetHeight : cardElement.offsetLeft + cardElement.offsetWidth
            : 0;
        const reserved = cardExtent + CARD_GAP;
        const padding = { top: FIT_PADDING, bottom: FIT_PADDING, left: FIT_PADDING, right: FIT_PADDING };
        padding[edge] += reserved;
        map.fitBounds(bounds, { padding, maxZoom: FIT_MAX_ZOOM, duration: 600 });
    }, [map, isLoaded, enabled, range, hasCenter, edge, card]);
}

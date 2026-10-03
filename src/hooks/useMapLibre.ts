import { useEffect, useRef, useState, useMemo, type RefObject } from 'react';
import maplibregl from 'maplibre-gl';
import { useGsiTerrainSource as createGsiTerrainSource } from 'maplibre-gl-gsi-terrain';
import { DEFAULT_STYLE } from '../config/mapStyles';
import { readStoredPotentialScope, type PotentialDisplayScope } from '../lib/storedSettings';

// ============================================
// PLATEAU MVT Configuration
// ============================================

const PLATEAU_MVT_URL =
    'https://ysk766.github.io/plateau_tokyo_2023_mvt_lod1/{z}/{x}/{y}.pbf';

const SOURCE_LAYER_ID = 'tokyo_all_fixedgeojsonl';
const HEIGHT_PROPERTY = 'height';

const PLATEAU_SOURCE_ID = 'plateau-bldg-mvt';
export const PLATEAU_LAYER_ID = 'plateau-bldg-extrusion';

// ============================================
// Terrain Configuration
// ============================================

const TERRAIN_SOURCE_ID = 'terrainSource';
const HILLSHADE_SOURCE_ID = 'terrainHillshade';
const HILLSHADE_LAYER_ID = 'terrainHillshadeLayer';
const TERRAIN_EXAGGERATION = 1.8;

const POTENTIAL_SOURCE_ID = 'potential-nightview';
export const POTENTIAL_LAYER_ID = 'potential-nightview-layer';
const POTENTIAL_TILE_SIZE = 256;

const AERIAL_SOURCE_ID = 'aerial-photo';
const AERIAL_LAYER_ID = 'aerial-photo-layer';
const AERIAL_TILE_URL = 'https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg';

// 閾値は生成時に焼き込み済みの WebP なので、通常のラスターソースとして読むだけでよい。
// 閾値以下のタイルも透明な WebP として全て置いてある（404 だと MapLibre が親タイルで代用してしまうため）。
// 表示する範囲（設定の PotentialDisplayScope）ごとに焼き込んだタイルを切り替える。'top10' は上位 10%
// （POTENTIAL_DISPLAY_THRESHOLD）だけの表示用タイル、'all' はサンプリングと同じタイル。
function potentialTileUrl(scope: PotentialDisplayScope): string {
    const dir = scope === 'all' ? 'NightViewPotential_tiles' : 'NightViewPotential_top10_tiles';
    return `${import.meta.env.BASE_URL}${dir}/{z}/{x}/{y}.webp`;
}

export function setPotentialDisplayScope(map: maplibregl.Map, scope: PotentialDisplayScope) {
    const source = map.getSource<maplibregl.RasterTileSource>(POTENTIAL_SOURCE_ID);
    const url = potentialTileUrl(scope);
    if (source && source.tiles[0] !== url) source.setTiles([url]);
}

// スタイルの再読み込みでソースを作り直すときも保存済みの範囲を使う（設定は保存してから反映するため）
function addPotentialLayer(map: maplibregl.Map) {
    if (!map.getSource(POTENTIAL_SOURCE_ID)) {
        map.addSource(POTENTIAL_SOURCE_ID, {
            type: 'raster',
            tiles: [potentialTileUrl(readStoredPotentialScope())],
            tileSize: POTENTIAL_TILE_SIZE,
            minzoom: 10,
            maxzoom: 14,
        });
    }
    if (!map.getLayer(POTENTIAL_LAYER_ID)) {
        const firstSymbolId = map.getStyle().layers?.find((layer) => layer.type === 'symbol')?.id;
        map.addLayer({
            id: POTENTIAL_LAYER_ID,
            type: 'raster',
            source: POTENTIAL_SOURCE_ID,
            layout: { visibility: 'none' },
            paint: { 'raster-opacity': 0.8 },
        }, firstSymbolId);
    }
}

function addAerialPhoto(map: maplibregl.Map) {
    if (!map.getSource(AERIAL_SOURCE_ID)) {
        map.addSource(AERIAL_SOURCE_ID, {
            type: 'raster',
            tiles: [AERIAL_TILE_URL],
            tileSize: 256,
            attribution: '国土地理院',
        });
        console.log('[Aerial] Source added');
    }

    if (!map.getLayer(AERIAL_LAYER_ID)) {
        // ポテンシャル層の下に置く（航空写真モードでは写真の上にポテンシャルを重ねるため）。
        // ポテンシャル層がなければ、ラベルなどの最下層にあるシンボルレイヤーの手前に挿入する
        const firstSymbolId = map.getLayer(POTENTIAL_LAYER_ID)
            ? POTENTIAL_LAYER_ID
            : map.getStyle().layers?.find((l) => l.type === 'symbol')?.id;

        map.addLayer(
            {
                id: AERIAL_LAYER_ID,
                type: 'raster',
                source: AERIAL_SOURCE_ID,
                layout: {
                    visibility: 'none',
                },
                paint: {
                    'raster-opacity': 1,
                },
            },
            firstSymbolId
        );
        console.log('[Aerial] Layer added (hidden by default)');
    }
}

// ============================================
// Overlay Helpers
// ============================================

function ensureOverlays(map: maplibregl.Map) {
    if (!map.getSource('overlays')) {
        map.addSource('overlays', {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: [] },
        });
    }

    if (!map.getLayer('overlay-lines')) {
        map.addLayer({
            id: 'overlay-lines',
            type: 'line',
            source: 'overlays',
            filter: ['==', ['geometry-type'], 'LineString'],
            paint: {
                'line-color': ['coalesce', ['get', 'color'], '#3b82f6'],
                'line-width': 2,
                'line-opacity': 0.8,
            },
        });
    }

    if (!map.getLayer('overlay-points')) {
        map.addLayer({
            id: 'overlay-points',
            type: 'circle',
            source: 'overlays',
            filter: ['==', ['geometry-type'], 'Point'],
            paint: {
                'circle-radius': ['coalesce', ['get', 'radius'], 8],
                'circle-color': ['get', 'color'],
                'circle-stroke-width': 2,
                'circle-stroke-color': '#ffffff',
            },
        });
    }
}

// ============================================
// PLATEAU MVT Buildings
// ============================================

function addPlateauExtrusion(map: maplibregl.Map) {
    if (!map.getSource(PLATEAU_SOURCE_ID)) {
        map.addSource(PLATEAU_SOURCE_ID, {
            type: 'vector',
            tiles: [PLATEAU_MVT_URL],
            minzoom: 10,
            maxzoom: 15,
            attribution: '国土交通省 Project PLATEAU',
        });
        console.log('[PLATEAU] Source added');
    }

    if (!map.getLayer(PLATEAU_LAYER_ID)) {
        const firstSymbolId = map.getStyle().layers?.find((l) => l.type === 'symbol')?.id;

        // ズームレベル13以上で表示、フェードイン効果付き
        map.addLayer(
            {
                id: PLATEAU_LAYER_ID,
                type: 'fill-extrusion',
                source: PLATEAU_SOURCE_ID,
                'source-layer': SOURCE_LAYER_ID,
                minzoom: 13,
                paint: {
                    'fill-extrusion-color': '#9ca3af',
                    // ズーム13-14でフェードイン (0→0.9)
                    'fill-extrusion-opacity': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        13, 0,
                        14, 0.9,
                    ],
                    'fill-extrusion-height': ['coalesce', ['get', HEIGHT_PROPERTY], 10],
                    'fill-extrusion-base': 0,
                },
            },
            firstSymbolId
        );
        console.log('[PLATEAU] Layer added (minzoom: 13)');
    }
}

// ============================================
// Label Localization (Force Japanese)
// ============================================
function forceJapaneseLabels(map: maplibregl.Map) {
    const style = map.getStyle();
    if (!style || !style.layers) return;

    for (const layer of style.layers) {
        if (layer.type === 'symbol') {
            const layout = layer.layout || {};
            // If it has a text-field, overwrite it to prioritize Japanese
            if (layout['text-field']) {
                map.setLayoutProperty(layer.id, 'text-field', [
                    'coalesce',
                    ['get', 'name:ja'],
                    ['get', 'name'],
                    ['get', 'name:latin']
                ]);
            }
        }
    }
    console.log('[Map] Labels forced to Japanese');
}

// ============================================
// Mask Non-Tokyo Areas
// ============================================
// 対象範囲（東京都・神奈川県・千葉県・埼玉県）。範囲外を暗くし、外周と都県境を線で引く。
// 形は国土地理院「地球地図日本」の都道府県界を 1都3県だけ取り出し、本土のみ・約 200m で単純化したもの
// （public/target-area.geojson。kind: mask = 範囲外の面 / area = 1都3県を合わせた形 / pref = 各都県の境界）。
// 作り方は PROJECT.md の「対象範囲」
const TARGET_AREA_SOURCE_ID = 'target-area';
const TARGET_AREA_MASK_LAYER_ID = 'target-area-mask';
const TARGET_AREA_PREF_LAYER_ID = 'target-area-pref';
const TARGET_AREA_OUTLINE_LAYER_ID = 'target-area-outline';

function addTargetArea(map: maplibregl.Map) {
    if (!map.getSource(TARGET_AREA_SOURCE_ID)) {
        map.addSource(TARGET_AREA_SOURCE_ID, {
            type: 'geojson',
            data: `${import.meta.env.BASE_URL}target-area.geojson`,
            attribution: '地球地図日本（国土地理院）',
        });
    }
    if (!map.getLayer(TARGET_AREA_MASK_LAYER_ID)) {
        map.addLayer({
            id: TARGET_AREA_MASK_LAYER_ID,
            type: 'fill',
            source: TARGET_AREA_SOURCE_ID,
            filter: ['==', ['get', 'kind'], 'mask'],
            paint: { 'fill-color': '#000000', 'fill-opacity': 0.4 },
        });
    }
    // 都県境は控えめな破線、1都3県の外周は地図の他の淡い紫（距離リングなど）と同じ色の実線
    if (!map.getLayer(TARGET_AREA_PREF_LAYER_ID)) {
        map.addLayer({
            id: TARGET_AREA_PREF_LAYER_ID,
            type: 'line',
            source: TARGET_AREA_SOURCE_ID,
            filter: ['==', ['get', 'kind'], 'pref'],
            paint: { 'line-color': '#ffffff', 'line-opacity': 0.28, 'line-width': 1, 'line-dasharray': [3, 3] },
        });
    }
    if (!map.getLayer(TARGET_AREA_OUTLINE_LAYER_ID)) {
        map.addLayer({
            id: TARGET_AREA_OUTLINE_LAYER_ID,
            type: 'line',
            source: TARGET_AREA_SOURCE_ID,
            filter: ['==', ['get', 'kind'], 'area'],
            paint: { 'line-color': '#c4b5fd', 'line-opacity': 0.75, 'line-width': ['interpolate', ['linear'], ['zoom'], 8, 1.2, 14, 2.2] },
        });
    }
}

// ============================================
// GSI Terrain
// ============================================

function addTerrain(
    map: maplibregl.Map,
    gsiTerrainSource: maplibregl.RasterDEMSourceSpecification,
    exaggeration: number
) {
    // gsi-terrain は型にない scheme を付けることがあるため、元実装どおり除く。
    // 出典表記は gsi-terrain が空文字にしているので、ここで国土地理院を付ける
    const terrainSource: maplibregl.RasterDEMSourceSpecification & { scheme?: string } = { ...gsiTerrainSource, attribution: '国土地理院' };
    delete terrainSource.scheme;

    if (!map.getSource(TERRAIN_SOURCE_ID)) {
        map.addSource(TERRAIN_SOURCE_ID, terrainSource);
        console.log('[Terrain] Source added');
    }

    try {
        map.setTerrain({ source: TERRAIN_SOURCE_ID, exaggeration });
        console.log('[Terrain] Enabled');
    } catch (err) {
        console.warn('[Terrain] setTerrain error:', err);
    }

    if (!map.getSource(HILLSHADE_SOURCE_ID)) {
        map.addSource(HILLSHADE_SOURCE_ID, { ...terrainSource });
    }

    if (!map.getLayer(HILLSHADE_LAYER_ID)) {
        map.addLayer({
            id: HILLSHADE_LAYER_ID,
            type: 'hillshade',
            source: HILLSHADE_SOURCE_ID,
            paint: { 'hillshade-exaggeration': 0.4 },
        });
        console.log('[Terrain] Hillshade added');
    }
}

// ============================================
// Main Hook
// ============================================

const TOKYO_BOUNDS: maplibregl.LngLatBoundsLike = [
    [138.9, 35.2],
    [140.2, 35.9],
];

export function useMapLibre(containerRef: RefObject<HTMLDivElement>) {
    const mapRef = useRef<maplibregl.Map | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    const gsiTerrainSource = useMemo(
        () => createGsiTerrainSource(maplibregl.addProtocol, { maxzoom: 9 }),
        []
    );

    useEffect(() => {
        if (!containerRef.current || mapRef.current) return;

        const map = new maplibregl.Map({
            container: containerRef.current,
            style: DEFAULT_STYLE,
            center: [139.5, 35.65],
            zoom: 8.5,
            pitch: 0,
            bearing: 0,
            maxPitch: 85,
            // DPR 3 の端末で 3 倍解像度のまま描くと GPU・メモリの負荷が大きいので 2 に抑える
            pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
            // 出典は必要なものだけ。既定で入る「MapLibre」のリンク（必須ではない）は出さない。
            // PLATEAU は建物のタイルが見えるズーム（13 以上）でしか出ないので、常に出す（ソースの表記と同じ文字列なので重複しない）
            attributionControl: { compact: true, customAttribution: '国土交通省 Project PLATEAU' },
        });

        map.scrollZoom?.enable?.();

        map.on('load', () => {
            // Prevent race condition: if this map was already cleaned up (removed), ignore the load event
            if (mapRef.current !== map) return;

            console.log('[Map] Loaded');
            map.fitBounds(TOKYO_BOUNDS, {
                padding: { top: 40, bottom: 40, left: 40, right: 40 },
                pitch: 0,
                bearing: 0,
                duration: 2000,
                maxZoom: 11,
            });
            ensureOverlays(map);
            addTerrain(map, gsiTerrainSource, TERRAIN_EXAGGERATION);
            addPlateauExtrusion(map);
            addPotentialLayer(map);
            addAerialPhoto(map);

            // 対象範囲（1都3県）の外を暗くし、境界を線で引く
            addTargetArea(map);

            // Apply label fix
            forceJapaneseLabels(map);

            setIsLoaded(true);
        });

        map.on('style.load', () => {
            console.log('[Map] Style reloaded');
            addTerrain(map, gsiTerrainSource, TERRAIN_EXAGGERATION);
            addPotentialLayer(map);
            addAerialPhoto(map);
            addPlateauExtrusion(map);

            // 対象範囲（1都3県）の外を暗くし、境界を線で引く
            addTargetArea(map);

            // Apply label fix
            forceJapaneseLabels(map);
        });

        mapRef.current = map;

        return () => {
            map.remove();
            mapRef.current = null;
            setIsLoaded(false);
        };
    }, [containerRef, gsiTerrainSource]);

    return { map: mapRef.current, isLoaded };
}

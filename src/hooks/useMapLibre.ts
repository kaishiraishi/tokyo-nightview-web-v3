import { useEffect, useRef, useState, useMemo, type RefObject } from 'react';
import maplibregl from 'maplibre-gl';
import { useGsiTerrainSource as createGsiTerrainSource } from 'maplibre-gl-gsi-terrain';
import { DEFAULT_STYLE } from '../config/mapStyles';
import { applyPotentialThreshold } from '../lib/potentialSampler';

// ============================================
// PLATEAU MVT Configuration
// ============================================

const PLATEAU_MVT_URL =
    'https://ysk766.github.io/plateau_tokyo_2023_mvt_lod1/{z}/{x}/{y}.pbf';

const SOURCE_LAYER_ID = 'tokyo_all_fixedgeojsonl';
const HEIGHT_PROPERTY = 'height';

const PLATEAU_SOURCE_ID = 'plateau-bldg-mvt';
const PLATEAU_LAYER_ID = 'plateau-bldg-extrusion';

// ============================================
// Terrain Configuration
// ============================================

const TERRAIN_SOURCE_ID = 'terrainSource';
const HILLSHADE_SOURCE_ID = 'terrainHillshade';
const HILLSHADE_LAYER_ID = 'terrainHillshadeLayer';
const TERRAIN_EXAGGERATION = 1.8;

export const POTENTIAL_SOURCE_ID = 'potential-nightview';
export const POTENTIAL_LAYER_ID = 'potential-nightview-layer';
export const POTENTIAL_MODES = [
    { id: 'wide', threshold: 0.00025, label: '広く探す', description: '弱い気配も含めて、周辺を広く見渡す' },
    { id: 'clue', threshold: 0.0015, label: '手がかり', description: '見つけやすい候補を手がかりにする' },
    { id: 'focused', threshold: 0.006, label: '絞って探す', description: '強い候補に絞って探す' },
] as const;
export const POTENTIAL_FILTERED_LAYER_PREFIX = 'potential-filtered-';

const FILTERED_POTENTIAL_PROTOCOL = 'potential-filtered';
const TILE_SIZE = 256;

maplibregl.addProtocol(FILTERED_POTENTIAL_PROTOCOL, async (request) => {
    const requestUrl = new URL(request.url);
    const [zoom, x, rawY] = requestUrl.pathname.split('/').filter(Boolean);
    const y = rawY?.replace(/\.png$/, '');
    const threshold = Number(requestUrl.searchParams.get('threshold'));
    if (!zoom || !x || !y || !Number.isFinite(threshold)) {
        throw new Error(`Invalid filtered potential tile URL: ${request.url}`);
    }
    const tileUrl = `${import.meta.env.BASE_URL}NightViewPotential_tiles/${zoom}/${x}/${y}.png`;
    const response = await fetch(tileUrl);
    if (!response.ok) throw new Error(`Potential tile request failed: ${response.status}`);

    const bitmap = await createImageBitmap(await response.blob());
    const canvas = document.createElement('canvas');
    canvas.width = TILE_SIZE;
    canvas.height = TILE_SIZE;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) {
        bitmap.close();
        throw new Error('Could not process potential tile');
    }
    context.drawImage(bitmap, 0, 0, TILE_SIZE, TILE_SIZE);
    bitmap.close();
    const image = context.getImageData(0, 0, TILE_SIZE, TILE_SIZE);
    applyPotentialThreshold(image.data, threshold);
    context.putImageData(image, 0, 0);
    const png = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Could not encode potential tile')), 'image/png');
    });
    return { data: await png.arrayBuffer() };
});

const AERIAL_SOURCE_ID = 'aerial-photo';
const AERIAL_LAYER_ID = 'aerial-photo-layer';
const AERIAL_TILE_URL = 'https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg';

function addPotentialLayer(map: maplibregl.Map) {
    for (const mode of POTENTIAL_MODES) {
        const sourceId = `${POTENTIAL_FILTERED_LAYER_PREFIX}source-${mode.id}`;
        const layerId = `${POTENTIAL_FILTERED_LAYER_PREFIX}${mode.id}`;
        if (!map.getSource(sourceId)) {
            map.addSource(sourceId, {
                type: 'raster',
                tiles: [`${FILTERED_POTENTIAL_PROTOCOL}://tiles/{z}/{x}/{y}.png?threshold=${mode.threshold}`],
                tileSize: TILE_SIZE,
                minzoom: 10,
                maxzoom: 14,
            });
        }
        if (!map.getLayer(layerId)) {
            const firstSymbolId = map.getStyle().layers?.find((l) => l.type === 'symbol')?.id;
            map.addLayer({
                id: layerId,
                type: 'raster',
                source: sourceId,
                layout: { visibility: 'none' },
                paint: { 'raster-opacity': 0.8 },
            }, firstSymbolId);
        }
    }
    // Keep the legacy layer id available to existing callers while the active mode is a filtered layer.
    if (!map.getSource(POTENTIAL_SOURCE_ID)) {
        map.addSource(POTENTIAL_SOURCE_ID, {
            type: 'raster',
            tiles: [`${import.meta.env.BASE_URL}NightViewPotential_tiles/{z}/{x}/{y}.png`],
            tileSize: TILE_SIZE,
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
        // ラベルなどの最下層にあるシンボルレイヤーを取得し、その手前に挿入する
        const firstSymbolId = map.getStyle().layers?.find((l) => l.type === 'symbol')?.id;

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
            attribution: 'plateau_tokyo_2023_mvt_lod1',
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
function addTokyoMask(map: maplibregl.Map) {
    const MASK_SOURCE_ID = 'tokyo-mask-source';
    const MASK_LAYER_ID = 'tokyo-mask-layer';

    const WORLD_BOUNDS = [
        [-180, -90],
        [180, -90],
        [180, 90],
        [-180, 90],
        [-180, -90],
    ];

    // Counter-clockwise for global outer ring (GeoJSON recommendation)
    // Actually MapLibre usually takes external ring as CCW? Or CW?
    // Let's stick to standard: Exterior ring CCW, Interior ring CW. The standard is confusing.
    // Spec says: Exterior ring is CCW.

    // Tokyo Rect (Hole)
    // [138.9, 35.2] to [140.2, 35.9]
    // Clockwise for hole
    const TOKYO_HOLE = [
        [138.9, 35.2], // SW
        [138.9, 35.9], // NW
        [140.2, 35.9], // NE
        [140.2, 35.2], // SE
        [138.9, 35.2], // SW
    ];

    if (!map.getSource(MASK_SOURCE_ID)) {
        map.addSource(MASK_SOURCE_ID, {
            type: 'geojson',
            data: {
                type: 'Feature',
                geometry: {
                    type: 'Polygon',
                    coordinates: [WORLD_BOUNDS, TOKYO_HOLE],
                },
                properties: {},
            },
        });
    }

    if (!map.getLayer(MASK_LAYER_ID)) {
        map.addLayer({
            id: MASK_LAYER_ID,
            type: 'fill',
            source: MASK_SOURCE_ID,
            layout: {},
            paint: {
                'fill-color': '#000000',
                'fill-opacity': 0.4,
            },
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
    const terrainSource: maplibregl.RasterDEMSourceSpecification & { scheme?: string } = { ...gsiTerrainSource };
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

            // Mask non-Tokyo areas
            addTokyoMask(map);

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

            // Mask non-Tokyo areas
            addTokyoMask(map);

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

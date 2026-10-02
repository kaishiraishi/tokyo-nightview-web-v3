import type { PolarPoint } from '../components/polar-heatmap/types';

export type MapLocation = {
    lng: number;
    lat: number;
};

type TileData = {
    pixels: Uint8ClampedArray;
};

type ColorRampStop = {
    value: number;
    color: [number, number, number, number];
};

const TILE_SIZE = 256;
const SAMPLE_ZOOM = 14;
export const MAX_POTENTIAL_VALUE = 0.1635;
// 地図に出すポテンシャルの閾値（「絞って探す」）。タイル生成時に焼き込み済み（scripts/bake-potential-tiles.py の
// --threshold と一致させる）。クライアントでは方向・距離の ViewModel にも同じ値を渡す
export const POTENTIAL_THRESHOLD = 0.006;
const TILE_CACHE = new Map<string, Promise<TileData | null>>();

// Keep this in sync with scripts/make-potential-tiles.sh.
export const POTENTIAL_COLOR_RAMP: ColorRampStop[] = [
    { value: 0, color: [20, 18, 30, 40] },
    { value: 2.58e-13, color: [38, 25, 74, 90] },
    { value: 0.000397, color: [86, 35, 102, 140] },
    { value: 0.0482, color: [190, 75, 70, 200] },
    { value: 0.1635, color: [255, 166, 0, 235] },
    { value: 0.8848, color: [255, 239, 120, 255] },
];

function locationToTilePixel(location: MapLocation, zoom: number) {
    const scale = 2 ** zoom;
    const x = ((location.lng + 180) / 360) * scale;
    const latitude = Math.max(-85.05112878, Math.min(85.05112878, location.lat));
    const latitudeRadians = (latitude * Math.PI) / 180;
    const y = ((1 - Math.asinh(Math.tan(latitudeRadians)) / Math.PI) / 2) * scale;
    const tileX = Math.floor(x);
    const tileY = Math.floor(y);

    return {
        tileX,
        tileY,
        pixelX: Math.floor((x - tileX) * TILE_SIZE),
        pixelY: Math.floor((y - tileY) * TILE_SIZE),
    };
}

async function loadTile(tileX: number, tileY: number, zoom: number) {
    const key = `${zoom}/${tileX}/${tileY}`;
    const cached = TILE_CACHE.get(key);
    if (cached) return cached;

    const request = new Promise<TileData | null>((resolve) => {
        const image = new Image();
        image.decoding = 'async';
        image.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = TILE_SIZE;
            canvas.height = TILE_SIZE;
            const context = canvas.getContext('2d', { willReadFrequently: true });
            if (!context) {
                resolve(null);
                return;
            }

            context.drawImage(image, 0, 0, TILE_SIZE, TILE_SIZE);
            resolve({ pixels: context.getImageData(0, 0, TILE_SIZE, TILE_SIZE).data });
        };
        image.onerror = () => resolve(null);
        image.src = `${import.meta.env.BASE_URL}NightViewPotential_tiles/${zoom}/${tileX}/${tileY}.webp`;
    });

    TILE_CACHE.set(key, request);
    return request;
}

export function potentialValueFromPixel(pixel: [number, number, number, number]) {
    if (pixel[3] < 8) return 0;

    let bestValue = 0;
    let bestError = Number.POSITIVE_INFINITY;

    for (let index = 0; index < POTENTIAL_COLOR_RAMP.length - 1; index += 1) {
        const start = POTENTIAL_COLOR_RAMP[index];
        const end = POTENTIAL_COLOR_RAMP[index + 1];
        const vector = end.color.map((value, channel) => value - start.color[channel]);
        const point = pixel.map((value, channel) => value - start.color[channel]);
        const denominator = vector.reduce((sum, value) => sum + value * value, 0);
        const projection = denominator === 0
            ? 0
            : Math.max(0, Math.min(1, point.reduce((sum, value, channel) => sum + value * vector[channel], 0) / denominator));
        const error = point.reduce((sum, value, channel) => {
            const difference = value - vector[channel] * projection;
            return sum + difference * difference;
        }, 0);

        if (error < bestError) {
            bestError = error;
            bestValue = start.value + (end.value - start.value) * projection;
        }
    }

    return Math.max(0, Math.min(MAX_POTENTIAL_VALUE, bestValue));
}

// 遠くの点まで z14 で読むと、10km 圏で 100 枚近いタイルが要る。距離が離れるほど広いタイル（低いズーム）で読む
function sampleZoomForDistance(distance: number) {
    if (distance <= 1000) return SAMPLE_ZOOM;
    return distance <= 3000 ? 13 : 12;
}

export type PotentialPixelInfo = {
    pixel: [number, number, number, number];
    value: number;
    zoom: number;
    tileX: number;
    tileY: number;
    pixelX: number;
    pixelY: number;
};

async function readPotentialPixel(location: MapLocation, zoom: number): Promise<PotentialPixelInfo | null> {
    const { tileX, tileY, pixelX, pixelY } = locationToTilePixel(location, zoom);
    const tile = await loadTile(tileX, tileY, zoom);
    if (!tile) return null;

    const pixelIndex = (pixelY * TILE_SIZE + pixelX) * 4;
    const pixel: [number, number, number, number] = [
        tile.pixels[pixelIndex],
        tile.pixels[pixelIndex + 1],
        tile.pixels[pixelIndex + 2],
        tile.pixels[pixelIndex + 3],
    ];

    return { pixel, value: potentialValueFromPixel(pixel), zoom, tileX, tileY, pixelX, pixelY };
}

// デバッグモードの検査用: 地点の最も細かい（z14）タイルの画素と、そこから復元した値を返す。タイルがなければ null
export function inspectPotentialPixel(location: MapLocation) {
    return readPotentialPixel(location, SAMPLE_ZOOM);
}

async function samplePotentialValue(location: MapLocation, distance: number) {
    const info = await readPotentialPixel(location, sampleZoomForDistance(distance));
    return info ? info.value : null;
}

export function destinationPoint(origin: MapLocation, angle: number, distance: number): MapLocation {
    const earthRadius = 6_371_000;
    const bearing = (angle * Math.PI) / 180;
    const latitude = (origin.lat * Math.PI) / 180;
    const longitude = (origin.lng * Math.PI) / 180;
    const angularDistance = distance / earthRadius;
    const nextLatitude = Math.asin(
        Math.sin(latitude) * Math.cos(angularDistance) +
        Math.cos(latitude) * Math.sin(angularDistance) * Math.cos(bearing),
    );
    const nextLongitude = longitude + Math.atan2(
        Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(latitude),
        Math.cos(angularDistance) - Math.sin(latitude) * Math.sin(nextLatitude),
    );

    return {
        lat: (nextLatitude * 180) / Math.PI,
        lng: (nextLongitude * 180) / Math.PI,
    };
}

export const SAMPLE_BEARINGS = Array.from({ length: 24 }, (_, index) => index * 15);
// 1km 以内は従来どおり。5km / 10km の範囲用に、遠方の距離を追加している
export const SAMPLE_DISTANCES = [0, 25, 50, 100, 200, 350, 500, 750, 1000, 1500, 2000, 3000, 4000, 5000, 6500, 8000, 10000];

// value は PNG の RGBA から色ランプを逆引きした近似値であり、Float32 の真値ではない。
export type PotentialRawSample = {
    bearing: number;
    distance: number;
    value: number | null;
};

// 遠方のセル（方位 15° × 距離の間隔）は 1km を超えるのに、1 点だけ読むと明るい場所が点の間に落ちて 0 になる。
// このリング以降は、セルの範囲を複数点で読んで集約する。近距離（画素と同程度の間隔）は従来どおり 1 点
const CELL_AGGREGATE_FROM = 500;
const CELL_BEARING_STEPS = [-0.4, -0.2, 0, 0.2, 0.4];
const CELL_RADIAL_STEPS = [-0.35, 0, 0.35];
// 最大値だけだと 1 画素の孤立点で近隣より明るく出るので、平均を少し混ぜて自然な濃淡にする
const CELL_MAX_WEIGHT = 0.7;

// セルの距離方向の範囲: 前後のリングとの中点まで（最外リングは内側の間隔を外側へ折り返す）
function ringExtent(distance: number): { inner: number; outer: number } {
    const index = SAMPLE_DISTANCES.indexOf(distance);
    const previous = SAMPLE_DISTANCES[index - 1] ?? distance;
    const next = SAMPLE_DISTANCES[index + 1];
    const inner = (previous + distance) / 2;
    const outer = next === undefined ? distance + (distance - inner) : (distance + next) / 2;
    return { inner, outer };
}

async function sampleCell(origin: MapLocation, bearing: number, distance: number): Promise<number | null> {
    if (distance < CELL_AGGREGATE_FROM) {
        return samplePotentialValue(destinationPoint(origin, bearing, distance), distance);
    }

    const bearingStep = 360 / SAMPLE_BEARINGS.length;
    const { inner, outer } = ringExtent(distance);
    const radialSpan = outer - inner;
    const requests = CELL_BEARING_STEPS.flatMap((bearingOffset) =>
        CELL_RADIAL_STEPS.map((radialOffset) =>
            samplePotentialValue(
                destinationPoint(origin, bearing + bearingOffset * bearingStep, distance + radialOffset * radialSpan),
                distance,
            ),
        ),
    );
    // タイルが読めなかった点は無視し、全点が読めなければ null（データなし）にする
    const values = (await Promise.all(requests)).filter((value): value is number => value !== null);
    if (values.length === 0) return null;

    const max = Math.max(...values);
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
    return max * CELL_MAX_WEIGHT + mean * (1 - CELL_MAX_WEIGHT);
}

// 中心 (distance = 0) は 1 回だけ取得し、全方位で共有する。
// maxDistance 以内の距離だけ取得する（200m の範囲で遠くのタイルまで読まないため）。
export async function samplePotentialGrid(origin: MapLocation, maxDistance: number): Promise<PotentialRawSample[]> {
    const centerValue = samplePotentialValue(origin, 0);
    const rings = await Promise.all(
        SAMPLE_DISTANCES.filter((distance) => distance <= maxDistance).map(async (distance) => {
            if (distance === 0) {
                const value = await centerValue;
                return SAMPLE_BEARINGS.map((bearing) => ({ bearing, distance, value }));
            }
            return Promise.all(
                SAMPLE_BEARINGS.map(async (bearing) => ({
                    bearing,
                    distance,
                    value: await sampleCell(origin, bearing, distance),
                })),
            );
        }),
    );

    return rings.flat();
}

export function polarPointsFromGrid(samples: PotentialRawSample[]): PolarPoint[] {
    return samples
        .filter((sample): sample is PotentialRawSample & { value: number } => sample.value !== null)
        .map((sample) => ({
            angle: sample.bearing,
            distance: sample.distance,
            strength: Math.max(0, Math.min(1, sample.value / MAX_POTENTIAL_VALUE)),
        }));
}

export function deriveDirectionPeaks(points: PolarPoint[]) {
    const directionValues = Array.from({ length: 24 }, (_, index) => {
        const values = points.filter((point) => point.angle === index * 15).map((point) => point.strength);
        return values.length > 0 ? Math.max(...values) : 0;
    });

    const candidates = directionValues
        .map((strength, index) => ({ index, strength }))
        .sort((a, b) => b.strength - a.strength);
    const selected: typeof candidates = [];

    for (const candidate of candidates) {
        const tooClose = selected.some((item) => {
            const difference = Math.abs(item.index - candidate.index);
            const circularDifference = Math.min(difference, 24 - difference);
            return circularDifference < 3;
        });
        if (!tooClose && (candidate.strength > 0.015 || selected.length === 0)) selected.push(candidate);
        if (selected.length === 5) break;
    }

    return selected.map(({ index, strength }) => ({
        angle: index * 15,
        strength,
        spread: 28,
    }));
}

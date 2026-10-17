import { loadPotentialTile, TILE_SIZE, type MapLocation, type TileData } from './potentialSampler';

// コンパスの円に出す「中心の周りのヒートマップの切り取り」。地図と同じ WebP タイルを、中心から range までが
// 円の半径になる縮尺で描き直す（北が上。回転は描画側で掛ける）。距離は等間隔（中心からの実距離に比例）。

const MIN_ZOOM = 10;
const MAX_ZOOM = 14;
const EARTH_CIRCUMFERENCE = 40_075_016.686;

function metersPerPixel(latitude: number, zoom: number) {
    return (EARTH_CIRCUMFERENCE * Math.cos((latitude * Math.PI) / 180)) / (TILE_SIZE * 2 ** zoom);
}

// 出力 1 画素より細かいタイルの中で一番粗いズーム（z14 より細かいタイルはない）
export function discZoom(latitude: number, range: number, diameter: number) {
    const target = (2 * range) / diameter;
    for (let zoom = MIN_ZOOM; zoom <= MAX_ZOOM; zoom += 1) {
        if (metersPerPixel(latitude, zoom) <= target) return zoom;
    }
    return MAX_ZOOM;
}

function worldPixel(location: MapLocation, zoom: number) {
    const scale = TILE_SIZE * 2 ** zoom;
    const latitude = Math.max(-85.05112878, Math.min(85.05112878, location.lat));
    const radians = (latitude * Math.PI) / 180;
    return {
        x: ((location.lng + 180) / 360) * scale,
        y: ((1 - Math.asinh(Math.tan(radians)) / Math.PI) / 2) * scale,
    };
}

/**
 * 直径 diameter 画素の円の画像（円の外は透明）。タイルが読めない場所（データ範囲外）は透明。
 * タイルの画素は双線形補間（アルファで重み付け）して、拡大しても角が立たないようにする。
 */
export async function renderPotentialDisc(center: MapLocation, range: number, diameter: number, dir: string): Promise<ImageData> {
    const zoom = discZoom(center.lat, range, diameter);
    // 出力 1 画素あたりのタイル画素数（メルカトルは局所的に等角なので縦横同じ）
    const step = (2 * range) / diameter / metersPerPixel(center.lat, zoom);
    const origin = worldPixel(center, zoom);
    const half = diameter / 2;
    const left = origin.x - half * step;
    const top = origin.y - half * step;
    const right = origin.x + half * step;
    const bottom = origin.y + half * step;

    const tiles = new Map<string, TileData | null>();
    const tileCount = 2 ** zoom;
    const requests: Promise<void>[] = [];
    // 補間で隣の画素も読むので、端の 1 画素ぶん広く読む
    for (let tileY = Math.floor((top - 1) / TILE_SIZE); tileY <= Math.floor((bottom + 1) / TILE_SIZE); tileY += 1) {
        for (let tileX = Math.floor((left - 1) / TILE_SIZE); tileX <= Math.floor((right + 1) / TILE_SIZE); tileX += 1) {
            if (tileY < 0 || tileY >= tileCount) continue;
            const key = `${tileX}/${tileY}`;
            requests.push(loadPotentialTile(tileX, tileY, zoom, dir).then((tile) => {
                tiles.set(key, tile);
            }));
        }
    }
    await Promise.all(requests);

    const pixelAt = (x: number, y: number, out: number[]) => {
        const tileX = Math.floor(x / TILE_SIZE);
        const tileY = Math.floor(y / TILE_SIZE);
        const tile = tiles.get(`${tileX}/${tileY}`);
        if (!tile) {
            out[0] = 0; out[1] = 0; out[2] = 0; out[3] = 0;
            return;
        }
        const index = ((y - tileY * TILE_SIZE) * TILE_SIZE + (x - tileX * TILE_SIZE)) * 4;
        out[0] = tile.pixels[index];
        out[1] = tile.pixels[index + 1];
        out[2] = tile.pixels[index + 2];
        out[3] = tile.pixels[index + 3];
    };

    const image = new ImageData(diameter, diameter);
    const data = image.data;
    const corners = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
    for (let row = 0; row < diameter; row += 1) {
        for (let column = 0; column < diameter; column += 1) {
            const dx = column + 0.5 - half;
            const dy = row + 0.5 - half;
            if (dx * dx + dy * dy > half * half) continue;
            // タイル画素の中心は (i + 0.5)。補間の基準を左上の画素に合わせる
            const sourceX = left + (column + 0.5) * step - 0.5;
            const sourceY = top + (row + 0.5) * step - 0.5;
            const x0 = Math.floor(sourceX);
            const y0 = Math.floor(sourceY);
            const fx = sourceX - x0;
            const fy = sourceY - y0;
            pixelAt(x0, y0, corners[0]);
            pixelAt(x0 + 1, y0, corners[1]);
            pixelAt(x0, y0 + 1, corners[2]);
            pixelAt(x0 + 1, y0 + 1, corners[3]);
            const weights = [(1 - fx) * (1 - fy), fx * (1 - fy), (1 - fx) * fy, fx * fy];
            let alpha = 0;
            let red = 0;
            let green = 0;
            let blue = 0;
            for (let corner = 0; corner < 4; corner += 1) {
                const weight = weights[corner] * corners[corner][3];
                alpha += weight;
                red += weight * corners[corner][0];
                green += weight * corners[corner][1];
                blue += weight * corners[corner][2];
            }
            if (alpha <= 0) continue;
            const offset = (row * diameter + column) * 4;
            data[offset] = red / alpha;
            data[offset + 1] = green / alpha;
            data[offset + 2] = blue / alpha;
            data[offset + 3] = alpha;
        }
    }
    return image;
}

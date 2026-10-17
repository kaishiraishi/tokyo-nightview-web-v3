import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { destinationPoint, POTENTIAL_THRESHOLD, readPotentialValueAt, type MapLocation } from '../../lib/potentialSampler';
import { discZoom, renderPotentialDisc } from '../../lib/potentialDisc';
import { rotateCompassCanvas } from './compassCanvas';
import { CANVAS_SIZE, CENTER, drawCenterMarker, RANGE_GUIDE_FRACTIONS, useDrawCanvas } from './prototypes/canvas';
import { getVisualStrength, normalizePotential } from './prototypes/colorScale';
import type { PolarPick } from './prototypes/PolarHeatmap';
import type { PolarCell } from './prototypes/types';

// 円の半径（論理キャンバス 300 の中）。中心から range までが、この半径に等間隔で対応する
export const DISC_RADIUS = 146;

type Disc = { canvas: HTMLCanvasElement; key: string };

export type HeatmapDiscProps = {
    center: MapLocation;
    range: number;
    // 端末方位（なければ 0 = 北が上）。円をこの角度だけ逆に回し、画面の上を向いている方向にする
    rotation: number;
    // 地図と同じ見た目にするため、地図の「表示するスコア」と同じタイルを読む
    tileDir: string;
    onHoverChange?: (pick: PolarPick | null) => void;
    onPick?: (pick: PolarPick | null) => void;
};

function discKey(center: MapLocation, range: number, tileDir: string) {
    return `${center.lng.toFixed(6)},${center.lat.toFixed(6)},${range},${tileDir}`;
}

// 地図のヒートマップを、中心の周りで円形に切り取って出す。距離は中心からの実距離に比例（等間隔）
export function HeatmapDisc({ center, range, rotation, tileDir, onHoverChange, onPick }: HeatmapDiscProps) {
    const [disc, setDisc] = useState<Disc | null>(null);
    const [failed, setFailed] = useState(false);
    const key = discKey(center, range, tileDir);
    const { lng, lat } = center;

    useEffect(() => {
        let cancelled = false;
        const ratio = Math.min(2, window.devicePixelRatio || 1);
        const diameter = Math.round(2 * DISC_RADIUS * ratio);
        renderPotentialDisc({ lng, lat }, range, diameter, tileDir)
            .then((image) => {
                if (cancelled) return;
                const canvas = document.createElement('canvas');
                canvas.width = diameter;
                canvas.height = diameter;
                const context = canvas.getContext('2d');
                if (!context) throw new Error('canvas 2D を使えません');
                context.putImageData(image, 0, 0);
                setDisc({ canvas, key: discKey({ lng, lat }, range, tileDir) });
                setFailed(false);
            })
            .catch((reason: unknown) => {
                if (cancelled) return;
                console.error('[HeatmapDisc] render failed', reason);
                setFailed(true);
            });
        return () => {
            cancelled = true;
        };
    }, [lng, lat, range, tileDir]);

    const ref = useDrawCanvas((context) => {
        context.save();
        rotateCompassCanvas(context, CENTER, rotation);
        context.beginPath();
        context.arc(CENTER, CENTER, DISC_RADIUS, 0, Math.PI * 2);
        context.clip();
        if (disc) context.drawImage(disc.canvas, CENTER - DISC_RADIUS, CENTER - DISC_RADIUS, DISC_RADIUS * 2, DISC_RADIUS * 2);

        // 距離ガイド（range の 1/4・1/2・1）。地図に重ねる円（useRangeRings）と同じ割合
        for (const fraction of RANGE_GUIDE_FRACTIONS) {
            context.beginPath();
            context.arc(CENTER, CENTER, fraction * DISC_RADIUS - (fraction === 1 ? 0.5 : 0), 0, Math.PI * 2);
            context.strokeStyle = fraction === 1 ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.16)';
            context.setLineDash(fraction === 1 ? [] : [3, 4]);
            context.lineWidth = 1;
            context.stroke();
        }
        context.setLineDash([]);
        context.restore();
        drawCenterMarker(context);
    }, [disc, rotation]);

    // 読み取り値: タップ（なぞった）地点の値を、分析と同じサンプリング用タイルから読む（非同期）。古い要求の結果は捨てる
    const pickRequestRef = useRef(0);
    const hoverRequestRef = useRef(0);

    const pointerToPick = (event: PointerEvent<HTMLCanvasElement>) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * CANVAS_SIZE - CENTER;
        const y = ((event.clientY - rect.top) / rect.height) * CANVAS_SIZE - CENTER;
        const radius = Math.hypot(x, y);
        if (radius > DISC_RADIUS) return null;
        const screenBearing = (((Math.atan2(y, x) * 180) / Math.PI + 90) % 360 + 360) % 360;
        return { bearing: (screenBearing + rotation) % 360, distance: (radius / DISC_RADIUS) * range };
    };

    const resolveCell = async (bearing: number, distance: number): Promise<PolarCell | null> => {
        const point = destinationPoint({ lng, lat }, bearing, distance);
        const rawValue = await readPotentialValueAt(point, discZoom(lat, range, 2 * DISC_RADIUS));
        if (rawValue === null) return null;
        return {
            bearing,
            distance,
            rawValue,
            strength: normalizePotential(rawValue),
            visualStrength: getVisualStrength(rawValue, POTENTIAL_THRESHOLD),
        };
    };

    const report = (
        polar: { bearing: number; distance: number } | null,
        requestRef: { current: number },
        callback: ((pick: PolarPick | null) => void) | undefined,
    ) => {
        if (!callback) return;
        requestRef.current += 1;
        const request = requestRef.current;
        if (!polar) {
            callback(null);
            return;
        }
        callback({ ...polar, cell: null });
        resolveCell(polar.bearing, polar.distance)
            .then((cell) => {
                if (request === requestRef.current && cell) callback({ ...polar, cell });
            })
            .catch((reason: unknown) => console.error('[HeatmapDisc] value lookup failed', reason));
    };

    const isStale = disc !== null && disc.key !== key;

    return (
        <div className="relative">
            <canvas
                ref={ref}
                className="block h-auto w-full touch-pan-y"
                style={{ aspectRatio: '1 / 1', opacity: isStale ? 0.6 : 1, transition: 'opacity 160ms' }}
                onPointerMove={(event) => event.pointerType === 'mouse' && report(pointerToPick(event), hoverRequestRef, onHoverChange)}
                onPointerUp={(event) => report(pointerToPick(event), pickRequestRef, onPick)}
                onPointerLeave={() => report(null, hoverRequestRef, onHoverChange)}
                aria-label="現在地のまわりの夜景ポテンシャル（円形に切り取った地図のヒートマップ）"
            />
            {(failed || disc === null) && (
                <div className="pointer-events-none absolute inset-0 grid place-items-center px-8 text-center text-[11px] leading-relaxed text-white/45">
                    {failed ? 'ヒートマップを表示できませんでした' : '夜景ポテンシャルを読み込んでいます…'}
                </div>
            )}
        </div>
    );
}

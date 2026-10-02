import { useState, type PointerEvent } from 'react';
import { potentialColorCss } from './colorScale';
import { annularSector, CANVAS_SIZE, CENTER, compassName, drawCenterMarker, formatDistance, POLAR_INNER_RADIUS, POLAR_OUTER_RADIUS, useDrawCanvas } from './canvas';
import { drawCompassLabels, rotateCompassCanvas } from '../compassCanvas';
import type { PolarCell, PotentialViewModel } from './types';

const INNER_RADIUS = POLAR_INNER_RADIUS;
const OUTER_RADIUS = POLAR_OUTER_RADIUS;

export function PolarHeatmapView({
    data,
    rotation = 0,
    showCompassLabels = true,
    showDistanceLabels = true,
}: { data: PotentialViewModel; rotation?: number; showCompassLabels?: boolean; showDistanceLabels?: boolean }) {
    const [hovered, setHovered] = useState<PolarCell | null>(null);
    const { bearingCount, distanceCount, cells } = data.polarField;

    const ref = useDrawCanvas((context) => {
        const stepBearing = 360 / bearingCount;
        const ringWidth = (OUTER_RADIUS - INNER_RADIUS) / distanceCount;
        const ratio = context.getTransform().a || 1;

        // セルは (フィルタなしで) オフスクリーンに描き、ぼかしは 1 回の drawImage だけに掛ける
        const layer = document.createElement('canvas');
        layer.width = context.canvas.width;
        layer.height = context.canvas.height;
        const layerContext = layer.getContext('2d');
        if (!layerContext) return;
        layerContext.setTransform(ratio, 0, 0, ratio, 0, 0);
        cells.forEach((cell, index) => {
            const inner = INNER_RADIUS + (index % distanceCount) * ringWidth;
            annularSector(layerContext, inner, inner + ringWidth + 0.4, cell.bearing - stepBearing / 2, cell.bearing + stepBearing / 2 + 0.3);
            layerContext.fillStyle = potentialColorCss(cell.visualStrength, 0.12 + cell.visualStrength * 0.78);
            layerContext.fill();
        });

        context.save();
        rotateCompassCanvas(context, CENTER, rotation);
        context.beginPath();
        context.arc(CENTER, CENTER, OUTER_RADIUS + 1, 0, Math.PI * 2);
        context.clip();
        // 表示補間: 実測は 24 方向 × 9 距離。境界は弱いぼかしに留める
        context.filter = 'blur(1.5px)';
        context.drawImage(layer, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
        context.restore();

        context.save();
        rotateCompassCanvas(context, CENTER, rotation);
        // 距離ガイド (range/4, range/2, range)
        context.font = '11px system-ui, sans-serif';
        context.textAlign = 'left';
        context.textBaseline = 'alphabetic';
        for (const fraction of [0.25, 0.5, 1]) {
            const radius = INNER_RADIUS + fraction * (OUTER_RADIUS - INNER_RADIUS);
            context.beginPath();
            context.arc(CENTER, CENTER, radius, 0, Math.PI * 2);
            context.strokeStyle = 'rgba(255,255,255,0.14)';
            context.lineWidth = 1;
            context.stroke();
            if (showDistanceLabels) {
                context.fillStyle = 'rgba(255,255,255,0.4)';
                context.fillText(formatDistance(data.range * fraction), CENTER + 3, CENTER - radius - 2);
            }
        }

        drawCenterMarker(context);
        if (showCompassLabels) drawCompassLabels(context, CENTER, CANVAS_SIZE / 2 - 12, 14);
        context.restore();
    }, [cells, data.range, rotation, showCompassLabels, showDistanceLabels]);

    const handlePointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * CANVAS_SIZE - CENTER;
        const y = ((event.clientY - rect.top) / rect.height) * CANVAS_SIZE - CENTER;
        const radius = Math.hypot(x, y);
        if (radius < INNER_RADIUS || radius > OUTER_RADIUS) {
            setHovered(null);
            return;
        }
        const screenBearing = (((Math.atan2(y, x) * 180) / Math.PI + 90) % 360 + 360) % 360;
        const bearing = (screenBearing + rotation) % 360;
        const bearingIndex = Math.round(bearing / (360 / bearingCount)) % bearingCount;
        const distanceIndex = Math.min(distanceCount - 1, Math.floor(((radius - INNER_RADIUS) / (OUTER_RADIUS - INNER_RADIUS)) * distanceCount));
        setHovered(cells[bearingIndex * distanceCount + distanceIndex] ?? null);
    };

    return (
        <div className="relative">
            <canvas
                ref={ref}
                className="block h-auto w-full touch-pan-y"
                style={{ aspectRatio: '1 / 1' }}
                onPointerMove={handlePointerMove}
                onPointerLeave={() => setHovered(null)}
                aria-label="Polar Heatmap: 方向×距離×強度"
            />
            {hovered && (
                <div className="pointer-events-none absolute left-2 top-2 rounded-lg border border-white/10 bg-black/80 px-2 py-1.5 text-[10px] leading-relaxed text-white/80">
                    <div className="font-semibold">{compassName(hovered.bearing)} {Math.round(hovered.bearing)}°</div>
                    <div>距離 {Math.round(hovered.distance)}m</div>
                    <div>Potential {hovered.rawValue.toFixed(3)} <span className="text-white/45">(PNGから復元した近似値)</span></div>
                    <div>表示強度 {Math.round(hovered.visualStrength * 100)}%</div>
                </div>
            )}
        </div>
    );
}

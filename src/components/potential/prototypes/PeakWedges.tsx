import { potentialColorCss } from './colorScale';
import { CANVAS_SIZE, CENTER, bearingToRadians, drawCenterMarker, drawCompassLabels, polarToXY, useDrawCanvas } from './canvas';
import type { PotentialViewModel } from './types';

const INNER_RADIUS = 14;
const OUTER_RADIUS = 122;

export function PeakWedgesView({ data }: { data: PotentialViewModel }) {
    const ref = useDrawCanvas((context) => {
        context.beginPath();
        context.arc(CENTER, CENTER, OUTER_RADIUS, 0, Math.PI * 2);
        context.strokeStyle = 'rgba(255,255,255,0.08)';
        context.lineWidth = 10;
        context.stroke();

        for (const peak of data.peaks) {
            // 順位で色は変えない。強さだけで brightness / opacity / 幅を変える
            const width = peak.spread * (0.7 + peak.visualStrength * 0.3);
            const gradient = context.createRadialGradient(CENTER, CENTER, INNER_RADIUS, CENTER, CENTER, OUTER_RADIUS);
            gradient.addColorStop(0, potentialColorCss(peak.visualStrength, 0));
            gradient.addColorStop(1, potentialColorCss(peak.visualStrength, 0.3 + peak.visualStrength * 0.6));

            // 外側の層ほど狭く重ねて、縁を柔らかくする
            for (const scale of [1, 0.66, 0.36]) {
                const half = (width * scale) / 2;
                context.beginPath();
                context.moveTo(CENTER, CENTER);
                context.arc(CENTER, CENTER, OUTER_RADIUS, bearingToRadians(peak.bearing - half), bearingToRadians(peak.bearing + half));
                context.closePath();
                context.globalAlpha = 0.45;
                context.fillStyle = gradient;
                context.fill();
            }
            context.globalAlpha = 1;

            // 最大値になった距離の目印
            const markerRadius = INNER_RADIUS + (peak.distance / data.range) * (OUTER_RADIUS - INNER_RADIUS);
            const { x, y } = polarToXY(peak.bearing, markerRadius);
            context.beginPath();
            context.arc(x, y, 3, 0, Math.PI * 2);
            context.fillStyle = 'rgba(255,255,255,0.85)';
            context.fill();
        }

        drawCenterMarker(context);
        drawCompassLabels(context, CANVAS_SIZE / 2 - 12);

        if (data.peaks.length === 0) {
            context.fillStyle = 'rgba(255,255,255,0.45)';
            context.font = '13px system-ui, sans-serif';
            context.textAlign = 'center';
            context.fillText('強い方向なし', CENTER, CENTER + 44);
        }
    }, [data.peaks, data.range]);

    return <canvas ref={ref} className="block h-auto w-full" style={{ aspectRatio: '1 / 1' }} aria-label="Peak Wedges: 強い方向を最大5つ" />;
}

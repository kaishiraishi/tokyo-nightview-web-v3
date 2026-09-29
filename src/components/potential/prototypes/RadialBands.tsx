import { potentialColorCss } from './colorScale';
import { annularSector, CANVAS_BACKGROUND, CANVAS_SIZE, drawCenterMarker, drawCompassLabels, useDrawCanvas } from './canvas';
import type { PotentialViewModel } from './types';

const INNER_RADIUS = 18;
const OUTER_RADIUS = 120;
const GAP_PX = 1.5;

export function RadialBandsView({ data }: { data: PotentialViewModel }) {
    const bandCount = data.bandEdges.length - 1;

    const ref = useDrawCanvas((context) => {
        const ringWidth = (OUTER_RADIUS - INNER_RADIUS) / bandCount;

        for (const band of data.bands) {
            const bandIndex = data.bandEdges.indexOf(band.from);
            const inner = INNER_RADIUS + bandIndex * ringWidth;
            const outer = inner + ringWidth;
            // 同じ弧長のギャップになるよう、半径ごとに角度ギャップを変える
            const gapDegrees = ((GAP_PX / ((inner + outer) / 2)) * 180) / Math.PI;
            annularSector(context, inner, outer - GAP_PX / 2, band.bearing - 7.5 + gapDegrees / 2, band.bearing + 7.5 - gapDegrees / 2);
            context.fillStyle = band.visualStrength > 0 ? potentialColorCss(band.visualStrength, 0.3 + band.visualStrength * 0.7) : 'rgba(255,255,255,0.04)';
            context.fill();
        }

        context.beginPath();
        context.arc(CANVAS_SIZE / 2, CANVAS_SIZE / 2, INNER_RADIUS - 4, 0, Math.PI * 2);
        context.fillStyle = CANVAS_BACKGROUND;
        context.fill();
        drawCenterMarker(context);
        drawCompassLabels(context, OUTER_RADIUS + 18);
    }, [data.bands, data.bandEdges]);

    return <canvas ref={ref} className="block h-auto w-full" style={{ aspectRatio: '1 / 1' }} aria-label="Radial Bands: 方向×距離の区画" />;
}

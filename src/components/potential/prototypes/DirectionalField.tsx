import { useMemo } from 'react';
import { getPotentialColor, potentialColorCss } from './colorScale';
import { annularSector, CANVAS_SIZE, CENTER, drawCenterMarker, drawCompassLabels, useDrawCanvas } from './canvas';
import { smoothProfile } from './interpolation';
import type { PotentialViewModel } from './types';

const FIELD_STYLE = { innerRadius: 104, baseThickness: 10, maxExpansion: 12 };
const SEGMENT_DEGREES = 2;

export function DirectionalFieldView({ data }: { data: PotentialViewModel }) {
    const smoothed = useMemo(() => smoothProfile(data.directionProfile.map((value) => value.visualStrength)), [data.directionProfile]);

    const ref = useDrawCanvas((context) => {
        const { innerRadius, baseThickness, maxExpansion } = FIELD_STYLE;

        // 2 base ring (0 値と「UI が存在しない」状態を区別する)
        annularSector(context, innerRadius, innerRadius + baseThickness, 0, 359.99);
        context.fillStyle = 'rgba(255,255,255,0.08)';
        context.fill();

        const segments = Array.from({ length: 360 / SEGMENT_DEGREES }, (_, index) => {
            const start = index * SEGMENT_DEGREES;
            const strength = Math.max(0, Math.min(1, smoothed[start + SEGMENT_DEGREES / 2] ?? 0));
            return { start, strength, outer: innerRadius + baseThickness + strength * maxExpansion };
        }).filter((segment) => segment.strength > 0.02);

        // 3 diffuse glow (高い場所だけが自然に浮き上がる程度)
        context.save();
        for (const { start, strength, outer } of segments) {
            if (strength < 0.35) continue;
            context.shadowBlur = 6 + strength * 18;
            context.shadowColor = potentialColorCss(strength, 0.08 + strength * 0.32);
            annularSector(context, innerRadius, outer, start, start + SEGMENT_DEGREES + 0.6);
            context.fillStyle = potentialColorCss(strength, 0.05);
            context.fill();
        }
        context.restore();

        // 4 potential field: brightness (色) と opacity を強度に連動
        for (const { start, strength, outer } of segments) {
            annularSector(context, innerRadius, outer, start, start + SEGMENT_DEGREES + 0.6);
            context.fillStyle = potentialColorCss(strength, 0.25 + strength * 0.75);
            context.fill();
        }

        // 5 highlight
        context.lineWidth = 1.5;
        for (const { start, strength, outer } of segments) {
            if (strength < 0.5) continue;
            const [r, g, b] = getPotentialColor(Math.min(1, strength + 0.15));
            context.beginPath();
            context.arc(CENTER, CENTER, outer, ((start - 90) * Math.PI) / 180, ((start + SEGMENT_DEGREES + 0.6 - 90) * Math.PI) / 180);
            context.strokeStyle = `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${strength * 0.6})`;
            context.stroke();
        }

        // 6 center marker / 7 N E S W
        drawCenterMarker(context);
        drawCompassLabels(context, CANVAS_SIZE / 2 - 10);
    }, [smoothed]);

    return <canvas ref={ref} className="block h-auto w-full" style={{ aspectRatio: '1 / 1' }} aria-label="Directional Field: 方向ごとの強さ" />;
}

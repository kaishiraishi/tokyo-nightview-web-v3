import { useMemo } from 'react';
import { getPotentialColor, potentialColorCss } from './colorScale';
import { annularSector, CANVAS_SIZE, CENTER, drawCenterMarker, useDrawCanvas } from './canvas';
import { drawCompassLabels, rotateCompassCanvas } from '../compassCanvas';
import { smoothProfile } from './interpolation';
import type { PotentialViewModel } from './types';

// mini: 地図左上のミニコンパス（64px 表示、Figma 準拠）。背景なしの細いリングに、方位文字の代わりに
// 外側の短い目盛りを描く。中心マーカーは描かない（中央に Range を重ねる）。
const FIELD_STYLES = {
    full: { innerRadius: 104, baseThickness: 10, maxExpansion: 12, glowBase: 6, glowBoost: 18, highlightWidth: 1.5, baseRingAlpha: 0.08 },
    mini: { innerRadius: 104, baseThickness: 18, maxExpansion: 10, glowBase: 8, glowBoost: 16, highlightWidth: 3, baseRingAlpha: 0.18 },
} as const;
const MINI_TICK = { inner: 138, outer: 150, width: 6 };

function drawMiniTicks(context: CanvasRenderingContext2D) {
    [0, 90, 180, 270].forEach((bearing) => {
        const angle = ((bearing - 90) * Math.PI) / 180;
        context.beginPath();
        context.moveTo(CENTER + Math.cos(angle) * MINI_TICK.inner, CENTER + Math.sin(angle) * MINI_TICK.inner);
        context.lineTo(CENTER + Math.cos(angle) * MINI_TICK.outer, CENTER + Math.sin(angle) * MINI_TICK.outer);
        context.strokeStyle = bearing === 0 ? 'rgba(248, 113, 113, 0.95)' : 'rgba(255, 255, 255, 0.55)';
        context.lineWidth = MINI_TICK.width;
        context.lineCap = 'round';
        context.stroke();
    });
}
const SEGMENT_DEGREES = 2;

export function DirectionalFieldView({ data, rotation = 0, variant = 'full' }: { data: PotentialViewModel; rotation?: number; variant?: 'full' | 'mini' }) {
    const smoothed = useMemo(() => smoothProfile(data.directionProfile.map((value) => value.visualStrength)), [data.directionProfile]);

    const ref = useDrawCanvas((context) => {
        const { innerRadius, baseThickness, maxExpansion, glowBase, glowBoost, highlightWidth, baseRingAlpha } = FIELD_STYLES[variant];

        context.save();
        rotateCompassCanvas(context, CENTER, rotation);

        // 2 base ring (0 値と「UI が存在しない」状態を区別する)
        annularSector(context, innerRadius, innerRadius + baseThickness, 0, 359.99);
        context.fillStyle = `rgba(255,255,255,${baseRingAlpha})`;
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
            context.shadowBlur = glowBase + strength * glowBoost;
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
        context.lineWidth = highlightWidth;
        for (const { start, strength, outer } of segments) {
            if (strength < 0.5) continue;
            const [r, g, b] = getPotentialColor(Math.min(1, strength + 0.15));
            context.beginPath();
            context.arc(CENTER, CENTER, outer, ((start - 90) * Math.PI) / 180, ((start + SEGMENT_DEGREES + 0.6 - 90) * Math.PI) / 180);
            context.strokeStyle = `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${strength * 0.6})`;
            context.stroke();
        }

        // 6 center marker / 7 N E S W
        if (variant === 'full') {
            drawCenterMarker(context);
            drawCompassLabels(context, CENTER, CANVAS_SIZE / 2 - 10, 15);
        } else {
            drawMiniTicks(context);
        }
        context.restore();
    }, [rotation, smoothed, variant], { transparent: variant === 'mini' });

    return <canvas ref={ref} className="block h-auto w-full touch-pan-y" style={{ aspectRatio: '1 / 1' }} aria-label="Directional Field: 方向ごとの強さ" />;
}

import { useEffect, useMemo, useRef } from 'react';
import { colorForValue } from './colors';
import { normalizeAngle } from './field';
import type { DirectionalPalette, FieldSample, SelectedDirection } from './types';

type DirectionalFieldCanvasProps = {
    size: number;
    samples: FieldSample[];
    palette: DirectionalPalette;
    showForward: boolean;
    interactive: boolean;
    onHover: (direction: SelectedDirection | null) => void;
    onSelect: (direction: SelectedDirection) => void;
};

function drawRingSegment(
    context: CanvasRenderingContext2D,
    center: number,
    angle: number,
    innerRadius: number,
    outerRadius: number,
    gap: number,
) {
    const start = ((angle - 0.5) * Math.PI) / 180 - gap;
    const end = ((angle + 0.5) * Math.PI) / 180 + gap;
    const startCanvasAngle = start - Math.PI / 2;
    const endCanvasAngle = end - Math.PI / 2;

    context.beginPath();
    context.arc(center, center, outerRadius, startCanvasAngle, endCanvasAngle);
    context.arc(center, center, innerRadius, endCanvasAngle, startCanvasAngle, true);
    context.closePath();
    context.fill();
}

export function DirectionalFieldCanvas({
    size,
    samples,
    palette,
    showForward,
    interactive,
    onHover,
    onSelect,
}: DirectionalFieldCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animatedValuesRef = useRef<number[]>(Array.from({ length: 360 }, () => 0));
    const animationFrameRef = useRef<number | null>(null);
    const targetValues = useMemo(() => samples.map((sample) => sample.value), [samples]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        if (!context) return;

        const dpr = window.devicePixelRatio || 1;
        canvas.width = size * dpr;
        canvas.height = size * dpr;
        canvas.style.width = `${size}px`;
        canvas.style.height = `${size}px`;
        context.setTransform(dpr, 0, 0, dpr, 0, 0);

        const center = size / 2;
        const radius = size * (118 / 320);
        const baseThickness = size * (14 / 320);
        const maxThicknessBoost = size * (8 / 320);
        const glowRadius = size * (22 / 320);
        const innerRadius = radius;

        const drawFrame = () => {
            const values = animatedValuesRef.current;
            let settled = true;

            for (let index = 0; index < values.length; index += 1) {
                const target = targetValues[index] ?? 0;
                const next = values[index] + (target - values[index]) * 0.12;
                values[index] = Math.abs(target - next) < 0.001 ? target : next;
                if (Math.abs(target - values[index]) > 0.001) settled = false;
            }

            context.clearRect(0, 0, size, size);

            const background = context.createRadialGradient(center, center, 0, center, center, size * 0.56);
            background.addColorStop(0, '#18212a');
            background.addColorStop(0.65, '#0d1319');
            background.addColorStop(1, '#080c10');
            context.fillStyle = background;
            context.fillRect(0, 0, size, size);

            context.beginPath();
            context.arc(center, center, innerRadius + baseThickness / 2, 0, Math.PI * 2);
            context.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            context.lineWidth = 1;
            context.stroke();

            values.forEach((value, index) => {
                if (value < 0.02) return;
                const angle = index;
                const outerRadius = innerRadius + baseThickness + value * maxThicknessBoost;
                const color = colorForValue(value, palette, 0.18 + value * 0.34);

                context.save();
                context.fillStyle = color;
                context.shadowColor = colorForValue(value, palette, 0.9);
                context.shadowBlur = glowRadius * (0.7 + value * 0.55);
                drawRingSegment(context, center, angle, innerRadius, outerRadius + glowRadius * 0.34, 0.001);
                context.restore();
            });

            values.forEach((value, index) => {
                if (value < 0.008) return;
                const outerRadius = innerRadius + baseThickness + value * maxThicknessBoost;
                context.fillStyle = colorForValue(value, palette, 0.28 + value * 0.68);
                drawRingSegment(context, center, index, innerRadius, outerRadius, 0.001);

                if (value > 0.8) {
                    context.strokeStyle = `rgba(255, 249, 220, ${0.24 + value * 0.34})`;
                    context.lineWidth = Math.max(1, size * 0.006);
                    context.beginPath();
                    const start = ((index - 0.46) * Math.PI) / 180 - Math.PI / 2;
                    const end = ((index + 0.46) * Math.PI) / 180 - Math.PI / 2;
                    context.arc(center, center, outerRadius - size * 0.012, start, end);
                    context.stroke();
                }
            });

            if (showForward) {
                context.strokeStyle = 'rgba(255, 255, 255, 0.32)';
                context.lineWidth = 1;
                context.beginPath();
                context.moveTo(center, center - radius - size * 0.09);
                context.lineTo(center, center - radius - size * 0.04);
                context.stroke();
            }

            if (!settled) animationFrameRef.current = requestAnimationFrame(drawFrame);
        };

        if (animationFrameRef.current !== null) cancelAnimationFrame(animationFrameRef.current);
        drawFrame();

        return () => {
            if (animationFrameRef.current !== null) cancelAnimationFrame(animationFrameRef.current);
        };
    }, [palette, showForward, size, targetValues]);

    const directionFromPointer = (event: React.PointerEvent<HTMLCanvasElement>): SelectedDirection => {
        const bounds = event.currentTarget.getBoundingClientRect();
        const x = event.clientX - bounds.left - bounds.width / 2;
        const y = event.clientY - bounds.top - bounds.height / 2;
        const angle = normalizeAngle((Math.atan2(y, x) * 180) / Math.PI + 90);
        const index = Math.round(angle) % 360;
        return { angle, strength: samples[index]?.value ?? 0 };
    };

    return (
        <canvas
            ref={canvasRef}
            width={size}
            height={size}
            className="block touch-pan-y rounded-full"
            onPointerMove={interactive ? (event) => onHover(directionFromPointer(event)) : undefined}
            onPointerLeave={interactive ? () => onHover(null) : undefined}
            onPointerDown={interactive ? (event) => onSelect(directionFromPointer(event)) : undefined}
            aria-label="方向ごとの夜景ポテンシャル"
        />
    );
}

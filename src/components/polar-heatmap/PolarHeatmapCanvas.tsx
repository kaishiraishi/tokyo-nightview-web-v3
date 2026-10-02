import { useEffect, useRef } from 'react';
import type { PointerEvent } from 'react';
import { colorForStrength } from './colors';
import { normalizeAngle } from './field';
import { drawCompassLabels, rotateCompassCanvas } from '../potential/compassCanvas';
import type { PolarPalette, PolarSample } from './types';

type PolarHeatmapCanvasProps = {
    size: number;
    rotation: number;
    samples: PolarSample[];
    maxDistance: number;
    palette: PolarPalette;
    showGrid: boolean;
    interactive: boolean;
    onHover: (value: { angle: number; distance: number; strength: number } | null) => void;
};

export function PolarHeatmapCanvas({
    size,
    rotation,
    samples,
    maxDistance,
    palette,
    showGrid,
    interactive,
    onHover,
}: PolarHeatmapCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animatedValuesRef = useRef<number[]>(samples.map((sample) => sample.strength));
    const animationFrameRef = useRef<number | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const context = canvas.getContext('2d');
        if (!context) return;

        const dpr = Math.min(2, window.devicePixelRatio || 1);
        canvas.width = size * dpr;
        canvas.height = size * dpr;
        canvas.style.width = `${size}px`;
        canvas.style.height = `${size}px`;
        context.setTransform(dpr, 0, 0, dpr, 0, 0);

        const center = size / 2;
        const radius = size * (150 / 360);
        const innerRadius = size * (30 / 360);
        const angularResolution = 180;
        const radialResolution = 72;

        const drawFrame = () => {
            const targetValues = samples.map((sample) => sample.strength);
            const values = animatedValuesRef.current;
            let settled = values.length === targetValues.length;

            if (values.length !== targetValues.length) {
                animatedValuesRef.current = targetValues.map(() => 0);
                return drawFrame();
            }

            for (let index = 0; index < values.length; index += 1) {
                const target = targetValues[index] ?? 0;
                const next = values[index] + (target - values[index]) * 0.12;
                values[index] = Math.abs(target - next) < 0.001 ? target : next;
                if (Math.abs(target - values[index]) > 0.001) settled = false;
            }

            context.clearRect(0, 0, size, size);
            const background = context.createRadialGradient(center, center, 0, center, center, size * 0.56);
            background.addColorStop(0, '#101925');
            background.addColorStop(1, '#081019');
            context.fillStyle = background;
            context.fillRect(0, 0, size, size);

            context.save();
            rotateCompassCanvas(context, center, rotation);

            for (let radialIndex = 0; radialIndex < radialResolution; radialIndex += 1) {
                const inner = innerRadius + ((radius - innerRadius) * radialIndex) / radialResolution;
                const outer = innerRadius + ((radius - innerRadius) * (radialIndex + 1)) / radialResolution;

                for (let angularIndex = 0; angularIndex < angularResolution; angularIndex += 1) {
                    const sampleIndex = radialIndex * angularResolution + angularIndex;
                    const value = values[sampleIndex] ?? 0;
                    const start = ((angularIndex * 360 / angularResolution) - 90) * Math.PI / 180;
                    const end = (((angularIndex + 1) * 360 / angularResolution) - 90) * Math.PI / 180;

                    context.beginPath();
                    context.arc(center, center, outer, start, end);
                    context.arc(center, center, inner, end, start, true);
                    context.closePath();
                    context.fillStyle = colorForStrength(value, palette, 0.96);
                    context.fill();
                }
            }

            // Keep the ego position quiet and readable above the heatmap.
            context.beginPath();
            context.arc(center, center, innerRadius, 0, Math.PI * 2);
            context.fillStyle = 'rgba(8, 16, 25, 0.96)';
            context.fill();

            if (showGrid) {
                context.strokeStyle = 'rgba(255, 255, 255, 0.13)';
                context.lineWidth = 1;
                [0.33, 0.66, 1].forEach((ratio) => {
                    context.beginPath();
                    context.arc(center, center, innerRadius + (radius - innerRadius) * ratio, 0, Math.PI * 2);
                    context.stroke();
                });

                for (let angle = 0; angle < 360; angle += 45) {
                    const radians = (angle - 90) * Math.PI / 180;
                    context.beginPath();
                    context.moveTo(center + Math.cos(radians) * innerRadius, center + Math.sin(radians) * innerRadius);
                    context.lineTo(center + Math.cos(radians) * radius, center + Math.sin(radians) * radius);
                    context.stroke();
                }
            }

            context.beginPath();
            context.arc(center, center, radius, 0, Math.PI * 2);
            context.strokeStyle = 'rgba(255, 255, 255, 0.24)';
            context.stroke();

            drawCompassLabels(context, center, radius + size * 0.07, Math.max(9, size * 0.03));
            context.restore();

            if (!settled) animationFrameRef.current = requestAnimationFrame(drawFrame);
        };

        if (animationFrameRef.current !== null) cancelAnimationFrame(animationFrameRef.current);
        drawFrame();

        return () => {
            if (animationFrameRef.current !== null) cancelAnimationFrame(animationFrameRef.current);
        };
    }, [maxDistance, palette, rotation, samples, showGrid, size]);

    const valueFromPointer = (event: PointerEvent<HTMLCanvasElement>) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        const dx = event.clientX - bounds.left - bounds.width / 2;
        const dy = event.clientY - bounds.top - bounds.height / 2;
        const pixelDistance = Math.sqrt(dx * dx + dy * dy);
        const radius = bounds.width * (150 / 360);
        const normalizedDistance = Math.max(0, Math.min(1, pixelDistance / radius));
        const screenAngle = normalizeAngle((Math.atan2(dy, dx) * 180) / Math.PI + 90);
        const angle = normalizeAngle(screenAngle + rotation);
        const angularIndex = Math.min(179, Math.floor((angle / 360) * 180));
        const radialIndex = Math.min(71, Math.floor(normalizedDistance * 72));
        const sample = samples[radialIndex * 180 + angularIndex];

        return {
            angle,
            distance: normalizedDistance * maxDistance,
            strength: sample?.strength ?? 0,
        };
    };

    return (
        <canvas
            ref={canvasRef}
            width={size}
            height={size}
            className="block touch-pan-y rounded-full"
            onPointerMove={interactive ? (event) => onHover(valueFromPointer(event)) : undefined}
            onPointerLeave={interactive ? () => onHover(null) : undefined}
            aria-label="方向と距離ごとの夜景ポテンシャル"
        />
    );
}

import { useEffect, useRef } from 'react';

// 全 Prototype 共通の論理キャンバスサイズ。表示は CSS で縮小する。
export const CANVAS_SIZE = 300;
export const CANVAS_BACKGROUND = '#080b10';
export const CENTER = CANVAS_SIZE / 2;

const COMPASS_LABELS = ['N', 'E', 'S', 'W'];

export function bearingToRadians(bearing: number) {
    return ((bearing - 90) * Math.PI) / 180;
}

export function polarToXY(bearing: number, radius: number) {
    const angle = bearingToRadians(bearing);
    return { x: CENTER + Math.cos(angle) * radius, y: CENTER + Math.sin(angle) * radius };
}

export function compassName(bearing: number) {
    const names = ['北', '北東', '東', '南東', '南', '南西', '西', '北西'];
    return names[Math.round((((bearing % 360) + 360) % 360) / 45) % 8];
}

export function formatDistance(distance: number) {
    return distance >= 1000 ? `${distance / 1000} km` : `${Math.round(distance)} m`;
}

export function useDrawCanvas(draw: (context: CanvasRenderingContext2D) => void, deps: unknown[]) {
    const ref = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = ref.current;
        const context = canvas?.getContext('2d');
        if (!canvas || !context) return;
        const ratio = Math.min(2, window.devicePixelRatio || 1);
        canvas.width = CANVAS_SIZE * ratio;
        canvas.height = CANVAS_SIZE * ratio;
        context.setTransform(ratio, 0, 0, ratio, 0, 0);
        context.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
        context.fillStyle = CANVAS_BACKGROUND;
        context.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
        draw(context);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);

    return ref;
}

export function annularSector(
    context: CanvasRenderingContext2D,
    innerRadius: number,
    outerRadius: number,
    startBearing: number,
    endBearing: number,
) {
    context.beginPath();
    context.arc(CENTER, CENTER, outerRadius, bearingToRadians(startBearing), bearingToRadians(endBearing));
    context.arc(CENTER, CENTER, innerRadius, bearingToRadians(endBearing), bearingToRadians(startBearing), true);
    context.closePath();
}

export function drawCompassLabels(context: CanvasRenderingContext2D, radius: number) {
    context.save();
    context.font = '600 15px system-ui, sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillStyle = 'rgba(255,255,255,0.55)';
    COMPASS_LABELS.forEach((label, index) => {
        const { x, y } = polarToXY(index * 90, radius);
        context.fillText(label, x, y);
    });
    context.restore();
}

export function drawCenterMarker(context: CanvasRenderingContext2D) {
    context.beginPath();
    context.arc(CENTER, CENTER, 4, 0, Math.PI * 2);
    context.fillStyle = 'rgba(255,255,255,0.9)';
    context.fill();
    context.beginPath();
    context.arc(CENTER, CENTER, 8, 0, Math.PI * 2);
    context.strokeStyle = 'rgba(255,255,255,0.3)';
    context.lineWidth = 1;
    context.stroke();
}

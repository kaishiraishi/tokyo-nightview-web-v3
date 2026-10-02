const COMPASS_LABELS = ['N', 'E', 'S', 'W'] as const;

export function drawCompassLabels(
    context: CanvasRenderingContext2D,
    center: number,
    radius: number,
    fontSize: number,
) {
    context.save();
    context.font = `600 ${fontSize}px system-ui, sans-serif`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';

    COMPASS_LABELS.forEach((label, index) => {
        const bearing = index * 90;
        const radians = ((bearing - 90) * Math.PI) / 180;
        const x = center + Math.cos(radians) * radius;
        const y = center + Math.sin(radians) * radius;
        context.fillStyle = label === 'N' ? 'rgba(248, 113, 113, 0.95)' : 'rgba(255, 255, 255, 0.55)';
        context.fillText(label, x, y);
    });
    context.restore();
}

export function rotateCompassCanvas(context: CanvasRenderingContext2D, center: number, rotation: number) {
    context.translate(center, center);
    context.rotate((-rotation * Math.PI) / 180);
    context.translate(-center, -center);
}

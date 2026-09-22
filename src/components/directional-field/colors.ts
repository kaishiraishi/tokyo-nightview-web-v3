import type { DirectionalPalette } from './types';

type Rgb = { r: number; g: number; b: number };
type ColorStop = { value: number; color: string };

const PALETTES: Record<DirectionalPalette, ColorStop[]> = {
    opportunity: [
        { value: 0, color: '#244E9B' },
        { value: 0.35, color: '#27C6D9' },
        { value: 0.65, color: '#DCEB52' },
        { value: 0.85, color: '#FFB02E' },
        { value: 1, color: '#FF8B38' },
    ],
    proximity: [
        { value: 0, color: '#244E9B' },
        { value: 0.35, color: '#DCEB52' },
        { value: 0.7, color: '#FFB02E' },
        { value: 1, color: '#E85D45' },
    ],
    signal: [
        { value: 0, color: '#244E9B' },
        { value: 0.45, color: '#27C6D9' },
        { value: 1, color: '#E8F6FF' },
    ],
};

function parseHex(hex: string): Rgb {
    const value = hex.replace('#', '');
    return {
        r: Number.parseInt(value.slice(0, 2), 16),
        g: Number.parseInt(value.slice(2, 4), 16),
        b: Number.parseInt(value.slice(4, 6), 16),
    };
}

function toRgba({ r, g, b }: Rgb, alpha: number) {
    return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${alpha})`;
}

export function colorForValue(value: number, palette: DirectionalPalette, alpha = 1) {
    const stops = PALETTES[palette];
    const normalized = Math.max(0, Math.min(1, value));
    const upperIndex = stops.findIndex((stop) => stop.value >= normalized);

    if (upperIndex <= 0) return toRgba(parseHex(stops[0].color), alpha);
    if (upperIndex === -1) return toRgba(parseHex(stops[stops.length - 1].color), alpha);

    const lower = stops[upperIndex - 1];
    const upper = stops[upperIndex];
    const progress = (normalized - lower.value) / (upper.value - lower.value);
    const lowerRgb = parseHex(lower.color);
    const upperRgb = parseHex(upper.color);

    return toRgba({
        r: lowerRgb.r + (upperRgb.r - lowerRgb.r) * progress,
        g: lowerRgb.g + (upperRgb.g - lowerRgb.g) * progress,
        b: lowerRgb.b + (upperRgb.b - lowerRgb.b) * progress,
    }, alpha);
}

import type { PolarPalette } from './types';

type Rgb = { r: number; g: number; b: number };
type ColorStop = { value: number; color: string; alpha?: number };

const PALETTES: Record<PolarPalette, ColorStop[]> = {
    thermal: [
        { value: 0, color: '#071B57' },
        { value: 0.2, color: '#123BB4' },
        { value: 0.4, color: '#0089DF' },
        { value: 0.55, color: '#31C9DD' },
        { value: 0.68, color: '#B8E34A' },
        { value: 0.8, color: '#FFE43B' },
        { value: 0.9, color: '#FF9F1C' },
        { value: 1, color: '#EF3423' },
    ],
    signal: [
        { value: 0, color: '#071B57' },
        { value: 0.45, color: '#0089DF' },
        { value: 0.75, color: '#31C9DD' },
        { value: 1, color: '#E8F6FF' },
    ],
    cool: [
        { value: 0, color: '#0A1733' },
        { value: 0.35, color: '#2256A6' },
        { value: 0.7, color: '#37B8D0' },
        { value: 1, color: '#BCEBFF' },
    ],
    // Mirrors the potential tile color ramp (scripts/make-potential-tiles.sh),
    // normalized against MAX_POTENTIAL_VALUE (src/lib/potentialSampler.ts).
    // Alpha rises with value so low potential fades into the dark canvas
    // background instead of painting a flat, opaque field (glow-style heatmap).
    potential: [
        { value: 0, color: '#14121e', alpha: 0.16 },
        { value: 0.00243, color: '#26194a', alpha: 0.35 },
        { value: 0.2948, color: '#be4b46', alpha: 0.78 },
        { value: 1, color: '#ffa600', alpha: 0.92 },
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

export function colorForStrength(value: number, palette: PolarPalette, alpha = 1) {
    const stops = PALETTES[palette];
    const normalized = Math.max(0, Math.min(1, value));
    const upperIndex = stops.findIndex((stop) => stop.value >= normalized);

    const stopAlpha = (stop: ColorStop) => (stop.alpha ?? 1) * alpha;

    if (upperIndex <= 0) return toRgba(parseHex(stops[0].color), stopAlpha(stops[0]));
    if (upperIndex === -1) {
        const last = stops[stops.length - 1];
        return toRgba(parseHex(last.color), stopAlpha(last));
    }

    const lower = stops[upperIndex - 1];
    const upper = stops[upperIndex];
    const progress = (normalized - lower.value) / (upper.value - lower.value);
    const lowerRgb = parseHex(lower.color);
    const upperRgb = parseHex(upper.color);
    const blendedAlpha = stopAlpha(lower) + (stopAlpha(upper) - stopAlpha(lower)) * progress;

    return toRgba({
        r: lowerRgb.r + (upperRgb.r - lowerRgb.r) * progress,
        g: lowerRgb.g + (upperRgb.g - lowerRgb.g) * progress,
        b: lowerRgb.b + (upperRgb.b - lowerRgb.b) * progress,
    }, blendedAlpha);
}

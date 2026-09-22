import type { DirectionPeak, FieldSample } from './types';

export function normalizeAngle(angle: number) {
    return ((angle % 360) + 360) % 360;
}

export function angleDistance(a: number, b: number) {
    const diff = Math.abs(normalizeAngle(a) - normalizeAngle(b)) % 360;
    return Math.min(diff, 360 - diff);
}

export function contribution(angle: number, peak: DirectionPeak) {
    const spread = Math.max(5, peak.spread);
    const distance = angleDistance(angle, peak.angle);
    const strength = Math.max(0, Math.min(1, peak.strength));
    return strength * Math.exp(-(distance * distance) / (2 * spread * spread));
}

export function combine(values: number[]) {
    return Math.max(0, Math.min(1, 1 - values.reduce((product, value) => product * (1 - Math.max(0, Math.min(1, value))), 1)));
}

export function sampleField(peaks: DirectionPeak[], segments = 360): FieldSample[] {
    return Array.from({ length: segments }, (_, index) => {
        const angle = (index * 360) / segments;
        const values = peaks.map((peak) => contribution(angle, peak));
        return { angle, value: combine(values) };
    });
}

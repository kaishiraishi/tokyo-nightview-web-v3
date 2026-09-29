import { MAX_POTENTIAL_VALUE, POTENTIAL_COLOR_RAMP } from '../../../lib/potentialSampler';

export function normalizePotential(value: number) {
    return Math.max(0, Math.min(1, value / MAX_POTENTIAL_VALUE));
}

export function getVisualStrength(rawValue: number, threshold: number) {
    if (rawValue < threshold) return 0;
    const normalized = (rawValue - threshold) / (MAX_POTENTIAL_VALUE - threshold);
    return Math.pow(Math.max(0, Math.min(1, normalized)), 0.55);
}

// 既存の色ランプ (地図タイル・凡例と同じ) を 0〜1 に等間隔で割り当てる。全 Prototype 共通。
export function getPotentialColor(strength: number): [number, number, number] {
    const stops = POTENTIAL_COLOR_RAMP;
    const position = Math.max(0, Math.min(1, strength)) * (stops.length - 1);
    const index = Math.min(stops.length - 2, Math.floor(position));
    const t = position - index;
    const start = stops[index].color;
    const end = stops[index + 1].color;
    return [
        start[0] + (end[0] - start[0]) * t,
        start[1] + (end[1] - start[1]) * t,
        start[2] + (end[2] - start[2]) * t,
    ];
}

export function potentialColorCss(strength: number, alpha = 1) {
    const [r, g, b] = getPotentialColor(strength);
    return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${alpha})`;
}

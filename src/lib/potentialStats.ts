import { POTENTIAL_QUANTILES } from './potentialQuantiles';

const STEPS = POTENTIAL_QUANTILES.length - 1;

// 光っている地点（閾値以上）の中で、この値以上の画素が全体の何 % か（「上位 X%」）。
// 同じ値の画素が多い飽和値（MAX_POTENTIAL_VALUE）は、その値の塊の先頭から数える。
// 閾値未満（値 0）は分布に入っていないので null。
export function upperPercent(value: number): number | null {
    if (value <= 0) return null;
    let low = 0;
    let high = STEPS;
    // POTENTIAL_QUANTILES は昇順。value 以上になる最初の位置を二分探索する
    while (low < high) {
        const middle = (low + high) >> 1;
        if (POTENTIAL_QUANTILES[middle] >= value) high = middle;
        else low = middle + 1;
    }
    return (1 - low / STEPS) * 100;
}

// 「上位 X%」の境目の値（upper = 10 なら、光っている画素の上位 10% が始まる値）
export function valueAtUpperPercent(upper: number): number {
    const index = Math.round((1 - upper / 100) * STEPS);
    return POTENTIAL_QUANTILES[Math.max(0, Math.min(STEPS, index))];
}

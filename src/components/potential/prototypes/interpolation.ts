import { SAMPLE_BEARINGS } from '../../../lib/potentialSampler';

const BEARING_STEP = 360 / SAMPLE_BEARINGS.length;

function normalizeBearing(bearing: number) {
    return ((bearing % 360) + 360) % 360;
}

function circularDifference(a: number, b: number) {
    const difference = Math.abs(normalizeBearing(a) - normalizeBearing(b));
    return Math.min(difference, 360 - difference);
}

function gaussian(deltaAngle: number, sigma: number) {
    return Math.exp(-(deltaAngle * deltaAngle) / (2 * sigma * sigma));
}

// 24 方向の値を円周方向のガウス重み付き平均で 360 方向へ補間する。
export function smoothProfile(values: number[], sigma = 18): number[] {
    return Array.from({ length: 360 }, (_, degree) => {
        let weightSum = 0;
        let valueSum = 0;
        values.forEach((value, index) => {
            const weight = gaussian(circularDifference(degree, index * BEARING_STEP), sigma);
            weightSum += weight;
            valueSum += weight * value;
        });
        return weightSum === 0 ? 0 : valueSum / weightSum;
    });
}

// values[bearingIndex][distanceIndex] を方位 (円周) と距離で双一次補間する。
export function bilinearSample(values: number[][], distances: number[], bearing: number, distance: number) {
    const bearingPosition = normalizeBearing(bearing) / BEARING_STEP;
    const b0 = Math.floor(bearingPosition) % values.length;
    const b1 = (b0 + 1) % values.length;
    const bt = bearingPosition - Math.floor(bearingPosition);

    let d1 = distances.findIndex((value) => value >= distance);
    if (d1 === -1) d1 = distances.length - 1;
    const d0 = Math.max(0, d1 - 1);
    const span = distances[d1] - distances[d0];
    const dt = span === 0 ? 0 : (distance - distances[d0]) / span;

    const near = values[b0][d0] * (1 - dt) + values[b0][d1] * dt;
    const far = values[b1][d0] * (1 - dt) + values[b1][d1] * dt;
    return near * (1 - bt) + far * bt;
}

import { SAMPLE_BEARINGS, SAMPLE_DISTANCES, type PotentialRawSample } from '../../../lib/potentialSampler';
import { getVisualStrength, normalizePotential } from './colorScale';
import { bilinearSample } from './interpolation';
import type {
    DirectionValue,
    PolarCell,
    PotentialBand,
    PotentialPeak,
    PotentialRange,
    PotentialSample,
    PotentialSampleGrid,
    PotentialViewModel,
} from './types';

const POLAR_BEARINGS = 180;
const POLAR_DISTANCES = 72;
const MAX_PEAKS = 5;
const MIN_PEAK_SEPARATION = 45;

const BAND_EDGES: Record<PotentialRange, number[]> = {
    50: [0, 25, 50],
    100: [0, 50, 100],
    200: [0, 50, 100, 200],
    500: [0, 100, 200, 350, 500],
    1000: [0, 100, 200, 350, 500, 750, 1000],
};

function toSample(bearing: number, distance: number, rawValue: number | null, threshold: number): PotentialSample {
    const value = rawValue ?? 0;
    return {
        bearing,
        distance,
        rawValue,
        strength: normalizePotential(value),
        visualStrength: getVisualStrength(value, threshold),
    };
}

export function buildSampleGrid(
    center: { lng: number; lat: number },
    rawSamples: PotentialRawSample[],
    range: PotentialRange,
    threshold: number,
): PotentialSampleGrid {
    return {
        center,
        range,
        threshold,
        samples: rawSamples.map((sample) => toSample(sample.bearing, sample.distance, sample.value, threshold)),
    };
}

function buildDirectionProfile(grid: PotentialSampleGrid): DirectionValue[] {
    return SAMPLE_BEARINGS.map((bearing) => {
        let best = { rawValue: 0, distance: 0 };
        for (const sample of grid.samples) {
            if (sample.bearing !== bearing || sample.distance > grid.range) continue;
            if ((sample.rawValue ?? 0) > best.rawValue) best = { rawValue: sample.rawValue ?? 0, distance: sample.distance };
        }
        return {
            bearing,
            distance: best.distance,
            rawValue: best.rawValue,
            strength: normalizePotential(best.rawValue),
            visualStrength: getVisualStrength(best.rawValue, grid.threshold),
        };
    });
}

function buildPolarField(grid: PotentialSampleGrid): PotentialViewModel['polarField'] {
    const distances = SAMPLE_DISTANCES.filter((distance) => distance <= grid.range);
    const values = SAMPLE_BEARINGS.map((bearing) =>
        distances.map((distance) => grid.samples.find((sample) => sample.bearing === bearing && sample.distance === distance)?.rawValue ?? 0),
    );

    const cells: PolarCell[] = [];
    for (let b = 0; b < POLAR_BEARINGS; b += 1) {
        const bearing = (b / POLAR_BEARINGS) * 360;
        for (let d = 0; d < POLAR_DISTANCES; d += 1) {
            const distance = ((d + 0.5) / POLAR_DISTANCES) * grid.range;
            const rawValue = Math.max(0, bilinearSample(values, distances, bearing, distance));
            cells.push({
                bearing,
                distance,
                rawValue,
                strength: normalizePotential(rawValue),
                visualStrength: getVisualStrength(rawValue, grid.threshold),
            });
        }
    }
    return { bearingCount: POLAR_BEARINGS, distanceCount: POLAR_DISTANCES, cells };
}

function circularIndexDistance(a: number, b: number, count: number) {
    const difference = Math.abs(a - b);
    return Math.min(difference, count - difference);
}

function detectPeaks(profile: DirectionValue[]): PotentialPeak[] {
    const count = profile.length;
    const step = 360 / count;
    const selected: number[] = [];

    const candidates = profile
        .map((value, index) => ({ value, index }))
        .filter(({ value }) => value.visualStrength > 0)
        .sort((a, b) => b.value.rawValue - a.value.rawValue);

    for (const { index } of candidates) {
        if (selected.some((other) => circularIndexDistance(other, index, count) * step < MIN_PEAK_SEPARATION)) continue;
        selected.push(index);
        if (selected.length === MAX_PEAKS) break;
    }

    return selected.map((index) => {
        const peak = profile[index];
        const half = peak.rawValue / 2;
        let reach = 0;
        while (reach < count / 2 && profile[(index + reach + 1) % count].rawValue >= half) reach += 1;
        let backReach = 0;
        while (backReach < count / 2 && profile[(index - backReach - 1 + count) % count].rawValue >= half) backReach += 1;
        const halfWidth = (reach + backReach + 1) * step;
        return {
            bearing: peak.bearing,
            strength: peak.strength,
            visualStrength: peak.visualStrength,
            distance: peak.distance,
            spread: Math.max(20, Math.min(60, halfWidth)),
        };
    });
}

function buildBands(grid: PotentialSampleGrid, edges: number[]): PotentialBand[] {
    const bands: PotentialBand[] = [];
    for (const bearing of SAMPLE_BEARINGS) {
        for (let index = 0; index < edges.length - 1; index += 1) {
            const from = edges[index];
            const to = edges[index + 1];
            let rawValue = 0;
            for (const sample of grid.samples) {
                if (sample.bearing !== bearing || sample.distance > to) continue;
                if (sample.distance < from || (sample.distance === from && from !== 0)) continue;
                rawValue = Math.max(rawValue, sample.rawValue ?? 0);
            }
            bands.push({
                bearing,
                from,
                to,
                rawValue,
                strength: normalizePotential(rawValue),
                visualStrength: getVisualStrength(rawValue, grid.threshold),
            });
        }
    }
    return bands;
}

export function buildPotentialViewModel(grid: PotentialSampleGrid): PotentialViewModel {
    const directionProfile = buildDirectionProfile(grid);
    const bandEdges = BAND_EDGES[grid.range];
    return {
        center: grid.center,
        range: grid.range,
        threshold: grid.threshold,
        samples: grid.samples,
        directionProfile,
        polarField: buildPolarField(grid),
        peaks: detectPeaks(directionProfile),
        bandEdges,
        bands: buildBands(grid, bandEdges),
    };
}

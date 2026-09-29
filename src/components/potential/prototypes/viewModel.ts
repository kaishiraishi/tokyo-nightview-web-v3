import { SAMPLE_BEARINGS, SAMPLE_DISTANCES, type PotentialRawSample } from '../../../lib/potentialSampler';
import { getVisualStrength, normalizePotential } from './colorScale';
import { bilinearSample } from './interpolation';
import type {
    DirectionValue,
    PolarCell,
    PotentialRange,
    PotentialSample,
    PotentialSampleGrid,
    PotentialViewModel,
} from './types';

const POLAR_BEARINGS = 180;
const POLAR_DISTANCES = 72;
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

export function buildPotentialViewModel(grid: PotentialSampleGrid): PotentialViewModel {
    const directionProfile = buildDirectionProfile(grid);
    return {
        center: grid.center,
        range: grid.range,
        threshold: grid.threshold,
        samples: grid.samples,
        directionProfile,
        polarField: buildPolarField(grid),
    };
}

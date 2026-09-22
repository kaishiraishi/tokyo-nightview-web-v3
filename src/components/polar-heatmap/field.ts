import type { PolarPoint, PolarSample } from './types';

export function normalizeAngle(angle: number) {
    return ((angle % 360) + 360) % 360;
}

export function angleDistance(a: number, b: number) {
    const diff = Math.abs(normalizeAngle(a) - normalizeAngle(b)) % 360;
    return Math.min(diff, 360 - diff);
}

function combine(values: number[]) {
    return Math.max(0, Math.min(1, 1 - values.reduce((product, value) => product * (1 - value), 1)));
}

export function samplePolarField(
    points: PolarPoint[],
    maxDistance: number,
    angularResolution = 180,
    radialResolution = 72,
): PolarSample[] {
    const safeMaxDistance = Math.max(1, maxDistance);
    const smoothing = safeMaxDistance <= 50 ? 0.035 : safeMaxDistance <= 250 ? 0.06 : 0.1;
    const samples: PolarSample[] = [];

    for (let radialIndex = 0; radialIndex < radialResolution; radialIndex += 1) {
        const distance = (radialIndex + 0.5) / radialResolution;

        for (let angularIndex = 0; angularIndex < angularResolution; angularIndex += 1) {
            const angle = (angularIndex + 0.5) * (360 / angularResolution);
            const values = points.flatMap((point) => {
                const pointDistance = point.distance / safeMaxDistance;
                const distanceSpread = point.distanceSpread ?? smoothing;
                const angleSpread = Math.max(4, point.angleSpread ?? 20);

                // Points well outside the current navigation range should not bleed into the viewport.
                if (pointDistance - distanceSpread * 3 > 1 || pointDistance + distanceSpread * 3 < 0) return [];

                const angularWeight = Math.exp(-(angleDistance(angle, point.angle) ** 2) / (2 * angleSpread ** 2));
                const radialWeight = Math.exp(-((distance - pointDistance) ** 2) / (2 * distanceSpread ** 2));
                return [Math.max(0, Math.min(1, point.strength)) * angularWeight * radialWeight];
            });

            samples.push({ angle, distance, strength: combine(values) });
        }
    }

    return samples;
}

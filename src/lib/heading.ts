const FULL_TURN = 360;

export type DeviceOrientationInput = Pick<DeviceOrientationEvent, 'alpha' | 'absolute'> & {
    webkitCompassHeading?: number;
    webkitCompassAccuracy?: number;
};

export type DeviceHeadingReading = {
    heading: number;
    lowAccuracy: boolean;
};

function isFiniteNumber(value: number | null | undefined): value is number {
    return typeof value === 'number' && Number.isFinite(value);
}

/** Normalize a clockwise compass angle to [0, 360). Invalid values become north. */
export function normalizeAngle(angle: number): number {
    if (!Number.isFinite(angle)) return 0;
    return ((angle % FULL_TURN) + FULL_TURN) % FULL_TURN;
}

/** Return the shortest signed clockwise difference from `from` to `to`. */
export function shortestAngleDifference(from: number, to: number): number {
    const difference = normalizeAngle(to) - normalizeAngle(from);
    if (difference > 180) return difference - FULL_TURN;
    if (difference <= -180) return difference + FULL_TURN;
    return difference;
}

function clamp01(value: number): number {
    return Math.min(1, Math.max(0, value));
}

/** Interpolate two compass angles without taking the long way around north. */
export function circularLerp(from: number, to: number, amount: number, hysteresis = 1): number {
    const difference = shortestAngleDifference(from, to);
    if (Math.abs(difference) < hysteresis) return normalizeAngle(from);
    return normalizeAngle(from + difference * clamp01(amount));
}

/** Smooth a new heading; null means that this is the first valid reading. */
export function smoothHeading(
    previous: number | null,
    next: number,
    amount = 0.18,
    hysteresis = 1,
): number {
    if (previous === null) return normalizeAngle(next);
    return circularLerp(previous, next, amount, hysteresis);
}

/** Apply the display's clockwise rotation to a heading measured from the device frame. */
export function correctHeadingForScreen(heading: number, screenAngle: number): number {
    return normalizeAngle(heading + screenAngle);
}

/**
 * Convert a DeviceOrientationEvent to a clockwise heading (0° = north).
 *
 * This is a magnetic-north heading. Magnetic declination is intentionally not
 * corrected here; the UI follows the platform sensor rather than a
 * location-dependent model.
 */
export function headingFromDeviceOrientation(
    event: DeviceOrientationInput,
    screenAngle = 0,
    allowRelativeFallback = false,
): DeviceHeadingReading | null {
    const iosHeading = event.webkitCompassHeading;
    if (isFiniteNumber(iosHeading)) {
        const accuracy = event.webkitCompassAccuracy;
        return {
            heading: correctHeadingForScreen(iosHeading, screenAngle),
            lowAccuracy: isFiniteNumber(accuracy) && (accuracy < 0 || accuracy > 20),
        };
    }

    if (!event.absolute && !allowRelativeFallback) return null;
    if (!isFiniteNumber(event.alpha)) return null;

    // Alpha is counter-clockwise in the device coordinate system; convert it
    // to the clockwise compass convention. The regular deviceorientation
    // fallback can opt into this best-effort path when no absolute stream exists.
    return {
        heading: correctHeadingForScreen(FULL_TURN - event.alpha, screenAngle),
        lowAccuracy: false,
    };
}

/**
 * Convert an AbsoluteOrientationSensor quaternion [x, y, z, w] to a compass
 * heading. The screen correction keeps the display's top edge as forward.
 */
export function headingFromQuaternion(
    quaternion: ArrayLike<number> | null | undefined,
    screenAngle = 0,
): number | null {
    if (!quaternion || quaternion.length < 4) return null;

    const x = quaternion[0];
    const y = quaternion[1];
    const z = quaternion[2];
    const w = quaternion[3];
    if (![x, y, z, w].every((value) => Number.isFinite(value))) return null;

    const magnitude = Math.hypot(x, y, z, w);
    if (magnitude < Number.EPSILON) return null;

    const nx = x / magnitude;
    const ny = y / magnitude;
    const nz = z / magnitude;
    const nw = w / magnitude;
    const yaw = (Math.atan2(2 * (nw * nz + nx * ny), 1 - 2 * (ny * ny + nz * nz)) * 180) / Math.PI;

    return correctHeadingForScreen(FULL_TURN - yaw, screenAngle);
}

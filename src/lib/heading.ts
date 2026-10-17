const FULL_TURN = 360;
const DEG = Math.PI / 180;

export type DeviceOrientationInput = Pick<DeviceOrientationEvent, 'alpha' | 'beta' | 'gamma' | 'absolute'> & {
    webkitCompassHeading?: number;
    webkitCompassAccuracy?: number;
};

export type DeviceHeadingReading = {
    heading: number;
    lowAccuracy: boolean;
};

type Vec3 = readonly [number, number, number];

/** Device axes expressed in the earth frame (x = east, y = north, z = up). */
export type DeviceAxes = {
    x: Vec3;
    y: Vec3;
    z: Vec3;
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

/** Device axes from W3C DeviceOrientation Euler angles (intrinsic Z-X'-Y'', degrees). */
export function axesFromEuler(alpha: number, beta: number, gamma: number): DeviceAxes {
    const ca = Math.cos(alpha * DEG);
    const sa = Math.sin(alpha * DEG);
    const cb = Math.cos(beta * DEG);
    const sb = Math.sin(beta * DEG);
    const cg = Math.cos(gamma * DEG);
    const sg = Math.sin(gamma * DEG);
    return {
        x: [ca * cg - sa * sb * sg, sa * cg + ca * sb * sg, -cb * sg],
        y: [-sa * cb, ca * cb, sb],
        z: [ca * sg + sa * sb * cg, sa * sg - ca * sb * cg, cb * cg],
    };
}

/** Device axes from an AbsoluteOrientationSensor quaternion [x, y, z, w] (device → earth). */
export function axesFromQuaternion(quaternion: ArrayLike<number> | null | undefined): DeviceAxes | null {
    if (!quaternion || quaternion.length < 4) return null;
    const values = [quaternion[0], quaternion[1], quaternion[2], quaternion[3]];
    if (!values.every((value) => Number.isFinite(value))) return null;
    const magnitude = Math.hypot(...values);
    if (magnitude < Number.EPSILON) return null;
    const [x, y, z, w] = values.map((value) => value / magnitude);
    return {
        x: [1 - 2 * (y * y + z * z), 2 * (x * y + z * w), 2 * (x * z - y * w)],
        y: [2 * (x * y - z * w), 1 - 2 * (x * x + z * z), 2 * (y * z + x * w)],
        z: [2 * (x * z + y * w), 2 * (y * z - x * w), 1 - 2 * (x * x + y * y)],
    };
}

function smoothstep(edge0: number, edge1: number, value: number): number {
    const t = clamp01((value - edge0) / (edge1 - edge0));
    return t * t * (3 - 2 * t);
}

// How far the screen has to face the horizon before the back of the phone becomes "forward".
// 0.5 ≈ 30° and 0.9 ≈ 64° away from lying flat.
const BACK_BLEND_START = 0.5;
const BACK_BLEND_END = 0.9;

/**
 * The direction the user is facing (clockwise from north), not the direction of the device's top edge.
 *
 * Lying flat, the user looks down at the screen, so forward is the top of the screen as displayed
 * (screenAngle accounts for landscape UI). Held up, the user looks through the screen, so forward is
 * the back of the device. Using the top edge there makes the heading swing sideways whenever the phone
 * is rolled (tilting it left made "left" the front). The two are blended by how upright the screen is.
 */
export function forwardHeading(axes: DeviceAxes, screenAngle = 0): number | null {
    const sinScreen = Math.sin(screenAngle * DEG);
    const cosScreen = Math.cos(screenAngle * DEG);
    // Top of the displayed screen, in the earth frame (horizontal part only).
    const upEast = axes.x[0] * sinScreen + axes.y[0] * cosScreen;
    const upNorth = axes.x[1] * sinScreen + axes.y[1] * cosScreen;
    // The back of the device is -z.
    const backEast = -axes.z[0];
    const backNorth = -axes.z[1];
    const backLength = Math.hypot(backEast, backNorth);
    const weight = backLength > 1e-6 ? smoothstep(BACK_BLEND_START, BACK_BLEND_END, backLength) : 0;
    const east = (1 - weight) * upEast + (weight > 0 ? (weight * backEast) / backLength : 0);
    const north = (1 - weight) * upNorth + (weight > 0 ? (weight * backNorth) / backLength : 0);
    if (Math.hypot(east, north) < 1e-3) return null;
    return normalizeAngle(Math.atan2(east, north) / DEG);
}

/**
 * One sample of the offset between iOS's arbitrary alpha reference and magnetic north.
 *
 * iOS reports alpha relative to an arbitrary start direction and gives north only as
 * webkitCompassHeading, which is the heading of the device's top edge. In the Z-X-Y Euler
 * convention that top-edge heading is exactly −alpha whenever cos(beta) > 0, so
 * heading + alpha is the reference offset. Near upright (cos(beta) → 0) the top edge points at
 * the sky and its heading is unstable, so those samples are skipped and the last offset is kept.
 */
export function compassOffsetSample(event: DeviceOrientationInput): number | null {
    const { webkitCompassHeading: compass, alpha, beta, gamma } = event;
    if (!isFiniteNumber(compass) || !isFiniteNumber(alpha) || !isFiniteNumber(beta) || !isFiniteNumber(gamma)) return null;
    if (Math.cos(beta * DEG) < 0.35 || Math.abs(gamma) > 70) return null;
    return normalizeAngle(compass + alpha);
}

/** Blend a new offset sample into the running offset (offsets drift slowly; readings are noisy). */
export function updateCompassOffset(previous: number | null, sample: number | null): number | null {
    if (sample === null) return previous;
    if (previous === null) return sample;
    return circularLerp(previous, sample, 0.08, 0);
}

/**
 * Convert a DeviceOrientationEvent to the forward heading (0° = north, clockwise).
 *
 * This is a magnetic-north heading. Magnetic declination is intentionally not
 * corrected here; the UI follows the platform sensor rather than a
 * location-dependent model.
 *
 * `compassOffset` is the iOS reference offset from compassOffsetSample (null on other platforms
 * or before the first usable sample).
 */
export function headingFromDeviceOrientation(
    event: DeviceOrientationInput,
    screenAngle = 0,
    allowRelativeFallback = false,
    compassOffset: number | null = null,
): DeviceHeadingReading | null {
    const { alpha, beta, gamma } = event;
    const hasEuler = isFiniteNumber(alpha) && isFiniteNumber(beta) && isFiniteNumber(gamma);
    const iosHeading = event.webkitCompassHeading;
    if (isFiniteNumber(iosHeading)) {
        const accuracy = event.webkitCompassAccuracy;
        const lowAccuracy = isFiniteNumber(accuracy) && (accuracy < 0 || accuracy > 20);
        if (hasEuler && compassOffset !== null) {
            // Absolute alpha = relative alpha − offset (see compassOffsetSample)
            const heading = forwardHeading(axesFromEuler(alpha - compassOffset, beta, gamma), screenAngle);
            if (heading !== null) return { heading, lowAccuracy };
        }
        return { heading: correctHeadingForScreen(iosHeading, screenAngle), lowAccuracy };
    }

    if (!event.absolute && !allowRelativeFallback) return null;
    if (!isFiniteNumber(alpha)) return null;

    if (hasEuler) {
        const heading = forwardHeading(axesFromEuler(alpha, beta, gamma), screenAngle);
        if (heading !== null) return { heading, lowAccuracy: false };
    }

    // Alpha is counter-clockwise in the device coordinate system; convert it
    // to the clockwise compass convention. The regular deviceorientation
    // fallback can opt into this best-effort path when no absolute stream exists.
    return {
        heading: correctHeadingForScreen(FULL_TURN - alpha, screenAngle),
        lowAccuracy: false,
    };
}

/**
 * Convert an AbsoluteOrientationSensor quaternion [x, y, z, w] (device reference frame)
 * to the forward heading. The screen angle keeps the displayed top edge as forward when flat.
 */
export function headingFromQuaternion(
    quaternion: ArrayLike<number> | null | undefined,
    screenAngle = 0,
): number | null {
    const axes = axesFromQuaternion(quaternion);
    return axes ? forwardHeading(axes, screenAngle) : null;
}

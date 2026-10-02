import { useCallback, useEffect, useRef, useState } from 'react';
import { headingFromDeviceOrientation, headingFromQuaternion, smoothHeading, type DeviceHeadingReading } from '../lib/heading';

export type DeviceHeadingStatus = 'off' | 'requesting' | 'active' | 'denied' | 'unsupported' | 'error';

export type UseDeviceHeadingResult = {
    status: DeviceHeadingStatus;
    heading: number | null;
    lowAccuracy: boolean;
    error: string | null;
    isSupported: boolean;
    start: () => void;
    stop: () => void;
};

type SensorPermissionName = 'accelerometer' | 'gyroscope' | 'magnetometer';

type SensorPermissionDescriptor = PermissionDescriptor & {
    name: SensorPermissionName;
};

type OrientationConstructor = {
    requestPermission?: () => Promise<'granted' | 'denied'>;
};

type AbsoluteOrientationSensorLike = EventTarget & {
    quaternion: ArrayLike<number> | null;
    start: () => void;
    stop: () => void;
};

type AbsoluteOrientationSensorConstructor = new (options?: {
    frequency?: number;
    referenceFrame?: 'device' | 'screen';
}) => AbsoluteOrientationSensorLike;

type SensorWindow = Window & {
    AbsoluteOrientationSensor?: AbsoluteOrientationSensorConstructor;
};

type ActiveSession = {
    id: number;
    sensor: AbsoluteOrientationSensorLike | null;
    removeListeners: Array<() => void>;
    fallbackTimer: number | null;
    dataTimer: number | null;
    hasReading: boolean;
    source: 'absolute' | 'deviceorientation' | 'sensor';
    cleaned: boolean;
    cleanup: () => void;
};

const SENSOR_PERMISSION_NAMES: SensorPermissionName[] = ['accelerometer', 'gyroscope', 'magnetometer'];
const ABSOLUTE_FALLBACK_DELAY_MS = 1200;
const NO_DATA_TIMEOUT_MS = 4000;

class PermissionDeniedError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'PermissionDeniedError';
    }
}

function errorMessage(reason: unknown, fallback: string): string {
    if (reason instanceof Error && reason.message) return reason.message;
    if (typeof reason === 'string' && reason.trim()) return reason;
    return fallback;
}

function isPermissionDenied(reason: unknown): boolean {
    return (
        reason instanceof PermissionDeniedError ||
        (reason instanceof DOMException && reason.name === 'NotAllowedError') ||
        (reason instanceof Error && reason.name === 'NotAllowedError')
    );
}

function getOrientationConstructor(): OrientationConstructor | null {
    if (typeof window === 'undefined' || typeof window.DeviceOrientationEvent === 'undefined') return null;
    return window.DeviceOrientationEvent as unknown as OrientationConstructor;
}

function getSensorConstructor(): AbsoluteOrientationSensorConstructor | null {
    if (typeof window === 'undefined') return null;
    return (window as SensorWindow).AbsoluteOrientationSensor ?? null;
}

function hasTouchInput(): boolean {
    return navigator.maxTouchPoints > 0 || 'ontouchstart' in window;
}

function canUseDeviceHeading(): boolean {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
    if (!window.isSecureContext) return false;
    if (getSensorConstructor() && hasTouchInput()) return true;
    return Boolean(getOrientationConstructor()) && hasTouchInput();
}

function unsupportedReason(): string {
    if (typeof window !== 'undefined' && !window.isSecureContext) return 'HTTPS 接続が必要です';
    return 'この端末では方位センサーを利用できません';
}

function screenAngle(): number {
    if (typeof window === 'undefined') return 0;
    return window.screen.orientation?.angle ?? 0;
}

async function assertSensorPermissions(): Promise<void> {
    if (typeof navigator === 'undefined' || !navigator.permissions) return;

    for (const name of SENSOR_PERMISSION_NAMES) {
        let permission: PermissionStatus;
        try {
            permission = await navigator.permissions.query({ name } as SensorPermissionDescriptor);
        } catch (reason) {
            throw new Error(`センサー権限を確認できませんでした: ${errorMessage(reason, 'Permissions API エラー')}`);
        }
        if (permission.state === 'denied') {
            throw new PermissionDeniedError(`${name} センサーの利用が許可されていません`);
        }
    }
}

export function useDeviceHeading(): UseDeviceHeadingResult {
    const initialSupport = canUseDeviceHeading();
    const [status, setStatus] = useState<DeviceHeadingStatus>(initialSupport ? 'off' : 'unsupported');
    const [heading, setHeading] = useState<number | null>(null);
    const [lowAccuracy, setLowAccuracy] = useState(false);
    const [error, setError] = useState<string | null>(initialSupport ? null : unsupportedReason());
    const [isSupported, setIsSupported] = useState(initialSupport);

    const mountedRef = useRef(true);
    const sessionRef = useRef<ActiveSession | null>(null);
    const sessionIdRef = useRef(0);
    const pendingReadingRef = useRef<DeviceHeadingReading | null>(null);
    const smoothedHeadingRef = useRef<number | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    const cancelAnimation = useCallback(() => {
        if (animationFrameRef.current !== null) {
            window.cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
        pendingReadingRef.current = null;
    }, []);

    const stop = useCallback(() => {
        sessionIdRef.current += 1;
        sessionRef.current?.cleanup();
        sessionRef.current = null;
        cancelAnimation();
        smoothedHeadingRef.current = null;
        if (!mountedRef.current) return;
        setHeading(null);
        setLowAccuracy(false);
        setError(null);
        setStatus('off');
    }, [cancelAnimation]);

    const start = useCallback(() => {
        if (sessionRef.current) return;

        const id = sessionIdRef.current + 1;
        sessionIdRef.current = id;
        setError(null);
        setHeading(null);
        setLowAccuracy(false);
        smoothedHeadingRef.current = null;

        if (!canUseDeviceHeading()) {
            setIsSupported(false);
            setStatus('unsupported');
            setError(unsupportedReason());
            return;
        }

        let cleaned = false;
        const session: ActiveSession = {
            id,
            sensor: null,
            removeListeners: [],
            fallbackTimer: null,
            dataTimer: null,
            hasReading: false,
            source: 'deviceorientation',
            cleaned: false,
            cleanup: () => {
                if (cleaned) return;
                cleaned = true;
                session.cleaned = true;
                if (session.fallbackTimer !== null) window.clearTimeout(session.fallbackTimer);
                if (session.dataTimer !== null) window.clearTimeout(session.dataTimer);
                session.removeListeners.forEach((remove) => remove());
                session.sensor?.stop();
            },
        };
        sessionRef.current = session;
        setStatus('requesting');

        const isCurrent = () => mountedRef.current && sessionRef.current?.id === session.id && sessionIdRef.current === session.id;

        const finish = (nextStatus: DeviceHeadingStatus, reason: string) => {
            if (!isCurrent()) return;
            session.cleanup();
            sessionRef.current = null;
            cancelAnimation();
            smoothedHeadingRef.current = null;
            setHeading(null);
            setLowAccuracy(false);
            if (nextStatus === 'unsupported') setIsSupported(false);
            setStatus(nextStatus);
            setError(reason);
        };

        const scheduleFrame = (reading: DeviceHeadingReading) => {
            if (!isCurrent()) return;
            session.hasReading = true;
            if (session.dataTimer !== null) {
                window.clearTimeout(session.dataTimer);
                session.dataTimer = null;
            }
            pendingReadingRef.current = reading;
            if (animationFrameRef.current !== null) return;

            animationFrameRef.current = window.requestAnimationFrame(() => {
                animationFrameRef.current = null;
                const pending = pendingReadingRef.current;
                pendingReadingRef.current = null;
                if (!pending || !isCurrent()) return;
                const nextHeading = smoothHeading(smoothedHeadingRef.current, pending.heading);
                smoothedHeadingRef.current = nextHeading;
                setHeading(nextHeading);
                setLowAccuracy(pending.lowAccuracy);
            });
        };

        const readDeviceOrientation = (event: DeviceOrientationEvent, allowRelativeFallback = false) => {
            const reading = headingFromDeviceOrientation(event, screenAngle(), allowRelativeFallback);
            if (reading) scheduleFrame(reading);
        };

        const addRegularOrientationListener = () => {
            if (!isCurrent()) return;
            session.source = 'deviceorientation';
            const readRegularOrientation = (event: DeviceOrientationEvent) => readDeviceOrientation(event, true);
            window.addEventListener('deviceorientation', readRegularOrientation);
            session.removeListeners.push(() => window.removeEventListener('deviceorientation', readRegularOrientation));
        };

        const beginOrientation = () => {
            session.source = 'absolute';
            const readAbsoluteOrientation = (event: DeviceOrientationEvent) => {
                if (session.source !== 'absolute') return;
                readDeviceOrientation(event);
                if (session.hasReading && session.fallbackTimer !== null) {
                    window.clearTimeout(session.fallbackTimer);
                    session.fallbackTimer = null;
                }
            };
            window.addEventListener('deviceorientationabsolute', readAbsoluteOrientation);
            const removeAbsoluteListener = () => window.removeEventListener('deviceorientationabsolute', readAbsoluteOrientation);
            session.removeListeners.push(removeAbsoluteListener);
            session.fallbackTimer = window.setTimeout(() => {
                if (!isCurrent() || session.hasReading) return;
                removeAbsoluteListener();
                session.source = 'deviceorientation';
                addRegularOrientationListener();
            }, ABSOLUTE_FALLBACK_DELAY_MS);
            session.dataTimer = window.setTimeout(() => {
                if (!session.hasReading) finish('unsupported', '方位センサーのデータを取得できませんでした');
            }, NO_DATA_TIMEOUT_MS);
            setStatus('active');
        };

        const beginAbsoluteSensor = async (constructor: AbsoluteOrientationSensorConstructor) => {
            try {
                await assertSensorPermissions();
                if (!isCurrent()) return;
                // Use the device frame here; headingFromQuaternion applies the
                // current screen orientation exactly once below.
                const sensor = new constructor({ frequency: 30, referenceFrame: 'device' });
                session.sensor = sensor;
                session.source = 'sensor';
                const readSensor = () => {
                    if (session.source !== 'sensor') return;
                    const nextHeading = headingFromQuaternion(sensor.quaternion, screenAngle());
                    if (nextHeading !== null) scheduleFrame({ heading: nextHeading, lowAccuracy: false });
                };
                const handleSensorError = (event: Event) => {
                    const sensorEvent = event as Event & { error?: DOMException | Error };
                    const reason = sensorEvent.error ?? event;
                    finish(isPermissionDenied(reason) ? 'denied' : 'error', errorMessage(reason, '方位センサーでエラーが発生しました'));
                };
                sensor.addEventListener('reading', readSensor);
                sensor.addEventListener('error', handleSensorError);
                session.removeListeners.push(() => sensor.removeEventListener('reading', readSensor));
                session.removeListeners.push(() => sensor.removeEventListener('error', handleSensorError));
                sensor.start();
                session.dataTimer = window.setTimeout(() => {
                    if (!session.hasReading) finish('unsupported', '方位センサーのデータを取得できませんでした');
                }, NO_DATA_TIMEOUT_MS);
                setStatus('active');
            } catch (reason) {
                if (!isCurrent()) return;
                finish(isPermissionDenied(reason) ? 'denied' : 'error', errorMessage(reason, '方位センサーを開始できませんでした'));
            }
        };

        const begin = async () => {
            const orientationConstructor = getOrientationConstructor();
            const permissionRequest = orientationConstructor?.requestPermission;
            if (permissionRequest) {
                try {
                    const permission = await orientationConstructor?.requestPermission?.();
                    if (permission !== 'granted') {
                        finish('denied', 'コンパスの利用が許可されていません');
                        return;
                    }
                    if (!isCurrent()) return;
                    addRegularOrientationListener();
                    session.dataTimer = window.setTimeout(() => {
                        if (!session.hasReading) finish('unsupported', '方位センサーのデータを取得できませんでした');
                    }, NO_DATA_TIMEOUT_MS);
                    setStatus('active');
                } catch (reason) {
                    finish(isPermissionDenied(reason) ? 'denied' : 'error', errorMessage(reason, 'コンパスの許可を確認できませんでした'));
                }
                return;
            }

            const sensorConstructor = getSensorConstructor();
            if (sensorConstructor) {
                await beginAbsoluteSensor(sensorConstructor);
                return;
            }

            beginOrientation();
        };

        void begin().catch((reason: unknown) => {
            finish('error', errorMessage(reason, '方位センサーを開始できませんでした'));
        });
    }, [cancelAnimation]);

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
            sessionRef.current?.cleanup();
            sessionRef.current = null;
            cancelAnimation();
        };
    }, [cancelAnimation]);

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') stop();
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [stop]);

    return { status, heading, lowAccuracy, error, isSupported, start, stop };
}

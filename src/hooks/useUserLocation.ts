import { useCallback, useEffect, useRef, useState } from 'react';

export type UserLocationStatus = 'idle' | 'requesting' | 'active' | 'unsupported' | 'denied' | 'error';

type UserLocationState = {
    position: GeolocationPosition | null;
    accuracy: number | null;
    status: UserLocationStatus;
    error: string | null;
};

function getGeolocationErrorMessage(error: GeolocationPositionError): string {
    if (error.code === error.PERMISSION_DENIED) return '位置情報の利用が許可されていません';
    if (error.code === error.POSITION_UNAVAILABLE) return '現在地を取得できませんでした（位置情報が利用できません）';
    if (error.code === error.TIMEOUT) return '現在地の取得がタイムアウトしました';
    return error.message || '現在地を取得できませんでした';
}

function getErrorMessage(reason: unknown): string {
    return reason instanceof Error && reason.message ? reason.message : '現在地を取得できませんでした';
}

export function useUserLocation(): UserLocationState & { start: () => void; stop: () => void } {
    const [state, setState] = useState<UserLocationState>({
        position: null,
        accuracy: null,
        status: 'idle',
        error: null,
    });
    const watchIdRef = useRef<number | null>(null);
    const mountedRef = useRef(false);

    const clearWatch = useCallback(() => {
        if (watchIdRef.current === null) return;
        if (typeof navigator !== 'undefined') navigator.geolocation?.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
    }, []);

    const stop = useCallback(() => {
        clearWatch();
        if (!mountedRef.current) return;
        setState((current) => ({ ...current, status: 'idle', error: null }));
    }, [clearWatch]);

    const start = useCallback(() => {
        if (watchIdRef.current !== null) return;

        if (typeof navigator === 'undefined' || !navigator.geolocation) {
            setState((current) => ({ ...current, status: 'unsupported', error: 'このブラウザでは位置情報を利用できません' }));
            return;
        }

        setState((current) => ({ ...current, status: 'requesting', error: null }));

        try {
            const watchId = navigator.geolocation.watchPosition(
                (position) => {
                    if (!mountedRef.current) return;
                    const accuracy = Number.isFinite(position.coords.accuracy) && position.coords.accuracy >= 0
                        ? position.coords.accuracy
                        : null;
                    setState({ position, accuracy, status: 'active', error: null });
                },
                (error) => {
                    if (!mountedRef.current) return;
                    clearWatch();
                    setState((current) => ({
                        ...current,
                        status: error.code === error.PERMISSION_DENIED ? 'denied' : 'error',
                        error: getGeolocationErrorMessage(error),
                    }));
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0,
                },
            );
            watchIdRef.current = watchId;
        } catch (reason) {
            setState((current) => ({ ...current, status: 'error', error: getErrorMessage(reason) }));
        }
    }, [clearWatch]);

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
            clearWatch();
        };
    }, [clearWatch]);

    return { ...state, start, stop };
}

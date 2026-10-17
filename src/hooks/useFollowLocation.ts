import { useCallback, useEffect, useRef } from 'react';
import type maplibregl from 'maplibre-gl';
import type { MapLocation } from '../lib/potentialSampler';
import { obscuredSize, type ObscuredEdge } from './useRangeRings';

// 地図を手で動かしたあと、追従に戻るまでの時間
const RESUME_AFTER_MS = 10_000;
// 位置の更新ごとの移動。車で動いているときも途切れず流れるよう、一定の速さ（linear）で動かす
const FOLLOW_DURATION_MS = 900;

/**
 * コンパスモード中、現在地を「カードに隠れていない地図の部分」の中心に置き続ける（車などで移動しているとき、
 * 現在地ボタンを押し直さなくてよいように）。ズームと地図の向きは変えない。
 * 地図をドラッグしている間と、離してから RESUME_AFTER_MS は追従しない（周りを見たいとき）。
 * ピンチなど、こちらが動かしていない移動の最中も邪魔しない（次の位置の更新で戻す）。
 * 返す recenter は、すぐに追従へ戻して中心に合わせる（現在地ボタン）。
 */
export function useFollowLocation(
    map: maplibregl.Map | null,
    isLoaded: boolean,
    location: MapLocation | null,
    enabled: boolean,
    obscured: ObscuredEdge,
) {
    const lng = location?.lng;
    const lat = location?.lat;
    const locationRef = useRef(location);
    const pausedUntilRef = useRef(0);
    const resumeTimerRef = useRef<number | null>(null);
    // 追従の移動中かどうか（自分の移動なら、次の更新で上書きしてよい）
    const followingMoveRef = useRef(false);
    const obscuredRef = useRef(obscured);

    useEffect(() => {
        locationRef.current = lng !== undefined && lat !== undefined ? { lng, lat } : null;
    }, [lng, lat]);

    useEffect(() => {
        obscuredRef.current = obscured;
    }, [obscured]);

    const moveTo = useCallback((target: MapLocation, duration: number) => {
        if (!map) return;
        const { edge } = obscuredRef.current;
        const reserved = obscuredSize(obscuredRef.current);
        // カードに隠れていない部分の中心 = 地図の中心から、隠れる幅の半分だけ反対側
        const offset: [number, number] = edge === 'top' ? [0, reserved / 2] : [reserved / 2, 0];
        followingMoveRef.current = true;
        map.easeTo({ center: [target.lng, target.lat], offset, duration, easing: (t) => t, essential: true });
    }, [map]);

    const clearResumeTimer = () => {
        if (resumeTimerRef.current !== null) {
            window.clearTimeout(resumeTimerRef.current);
            resumeTimerRef.current = null;
        }
    };

    const recenter = useCallback(() => {
        clearResumeTimer();
        pausedUntilRef.current = 0;
        const target = locationRef.current;
        if (target) moveTo(target, 600);
    }, [moveTo]);

    // 手で地図を動かしたら追従を止め、離して RESUME_AFTER_MS 後に戻る
    useEffect(() => {
        if (!map || !isLoaded || !enabled) return;
        pausedUntilRef.current = 0;
        const handleDragStart = (event: maplibregl.MapLibreEvent<MouseEvent | TouchEvent | undefined>) => {
            if (!event.originalEvent) return;
            clearResumeTimer();
            followingMoveRef.current = false;
            pausedUntilRef.current = Number.POSITIVE_INFINITY;
        };
        const handleDragEnd = (event: maplibregl.MapLibreEvent<MouseEvent | TouchEvent | undefined>) => {
            if (!event.originalEvent) return;
            pausedUntilRef.current = Date.now() + RESUME_AFTER_MS;
            clearResumeTimer();
            resumeTimerRef.current = window.setTimeout(() => {
                resumeTimerRef.current = null;
                pausedUntilRef.current = 0;
                const target = locationRef.current;
                if (target) moveTo(target, 800);
            }, RESUME_AFTER_MS);
        };
        const handleMoveEnd = () => {
            followingMoveRef.current = false;
        };
        map.on('dragstart', handleDragStart);
        map.on('dragend', handleDragEnd);
        map.on('moveend', handleMoveEnd);
        return () => {
            clearResumeTimer();
            map.off('dragstart', handleDragStart);
            map.off('dragend', handleDragEnd);
            map.off('moveend', handleMoveEnd);
        };
    }, [map, isLoaded, enabled, moveTo]);

    // 現在地が変わるたびに、隠れていない部分の中心へ動かす
    useEffect(() => {
        if (!map || !isLoaded || !enabled || lng === undefined || lat === undefined) return;
        if (Date.now() < pausedUntilRef.current) return;
        // 開いたときの範囲合わせ（fitBounds）や、ピンチなど人の操作の最中は邪魔しない
        if (map.isMoving() && !followingMoveRef.current) return;
        moveTo({ lng, lat }, FOLLOW_DURATION_MS);
    }, [map, isLoaded, enabled, lng, lat, moveTo]);

    return { recenter };
}

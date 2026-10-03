import { useCallback, useEffect, useState } from 'react';
import type { Post } from '../lib/postsApi';
import type { MapLocation } from '../lib/potentialSampler';
import { distanceMeters, readUnlockedPostIds, UNLOCK_RADIUS_M, writeUnlockedPostIds } from '../lib/postReveal';

// 現在地が投稿の地点から UNLOCK_RADIUS_M 以内に入ったら、その投稿を解放する。解放はこの端末に残る。
// revealAll（デバッグモード）のときは、記録は変えずに全部を解放済みとして扱う。
// onUnlock: 新しく解放した投稿（到着の知らせを出すため）
export function usePostReveal(
    posts: Post[],
    currentLocation: MapLocation | null,
    revealAll: boolean,
    onUnlock: (posts: Post[]) => void,
) {
    const [unlockedIds, setUnlockedIds] = useState<string[]>(() => readUnlockedPostIds());

    useEffect(() => {
        if (!currentLocation) return;
        const arrived = posts.filter((post) => !unlockedIds.includes(post.id)
            && distanceMeters(currentLocation, { lng: post.location.lng, lat: post.location.lat }) <= UNLOCK_RADIUS_M);
        if (arrived.length === 0) return;
        setUnlockedIds(writeUnlockedPostIds([...unlockedIds, ...arrived.map((post) => post.id)]));
        onUnlock(arrived);
    }, [currentLocation, onUnlock, posts, unlockedIds]);

    const isUnlocked = useCallback((post: Post) => revealAll || unlockedIds.includes(post.id), [revealAll, unlockedIds]);
    return { isUnlocked };
}

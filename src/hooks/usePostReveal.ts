import { useCallback, useEffect, useState } from 'react';
import type { Post } from '../lib/postsApi';
import type { MapLocation } from '../lib/potentialSampler';
import { distanceMeters, readUnlockedPostIds, UNLOCK_RADIUS_M, writeUnlockedPostIds } from '../lib/postReveal';

// 測位の誤差（精度）がこれより大きいときは判定しない（Wi-Fi などの粗い測位で、行っていない投稿が解放されないように）
const MAX_ACCURACY_M = 100;

// 現在地が投稿の地点から UNLOCK_RADIUS_M 以内に入ったら、その投稿を解放する。解放はこの端末に残る。
// active: 判定するか（投稿モードのときだけ）。revealAll（確認用）のときは、記録は変えずに全部を解放済みとして扱う。
// onUnlock: 新しく解放した投稿（到着の知らせを出すため。この画面を開いたあとにできた投稿＝自分の投稿は除く）
export function usePostReveal(
    posts: Post[],
    currentLocation: MapLocation | null,
    accuracy: number | null,
    active: boolean,
    revealAll: boolean,
    onUnlock: (posts: Post[]) => void,
) {
    const [unlockedIds, setUnlockedIds] = useState<string[]>(() => readUnlockedPostIds());
    const [openedAt] = useState(() => Date.now());

    useEffect(() => {
        if (!active || !currentLocation || accuracy === null || accuracy > MAX_ACCURACY_M) return;
        const arrived = posts.filter((post) => !unlockedIds.includes(post.id)
            && distanceMeters(currentLocation, { lng: post.location.lng, lat: post.location.lat }) <= UNLOCK_RADIUS_M);
        if (arrived.length === 0) return;
        setUnlockedIds(writeUnlockedPostIds([...unlockedIds, ...arrived.map((post) => post.id)]));
        const others = arrived.filter((post) => !(Date.parse(post.createdAt) >= openedAt));
        if (others.length > 0) onUnlock(others);
    }, [accuracy, active, currentLocation, onUnlock, openedAt, posts, unlockedIds]);

    const isUnlocked = useCallback((post: Post) => revealAll || unlockedIds.includes(post.id), [revealAll, unlockedIds]);
    return { isUnlocked };
}

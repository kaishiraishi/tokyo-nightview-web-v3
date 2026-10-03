// 投稿の「着いたら分かる」仕組み。着く前は、本当の地点から少しずらした中心の円（だいたいの場所）だけを見せ、
// 本当の地点から UNLOCK_RADIUS_M 以内に入ったら、写真と正確な場所を見せる（解放）。解放した投稿はこの端末の
// localStorage に残す。
// 注意: 正確な座標は投稿データとしてクライアントに届いている（見せ方で隠しているだけ）。本当に隠すには、
// サーバー側で解放の判定をしてから座標と写真を返す必要がある（STATE.md）。
import type { Post } from './postsApi';
import { destinationPoint, type MapLocation } from './potentialSampler';

export const UNLOCK_RADIUS_M = 100;
export const AREA_RADIUS_M = 300;
// 円の中心を本当の地点からずらす距離（円の中に本当の地点が必ず入るよう、半径より十分小さくする）
const AREA_OFFSET_MIN_M = 80;
const AREA_OFFSET_MAX_M = 200;

const UNLOCKED_STORAGE_KEY = 'nightview.unlockedPosts';

export function distanceMeters(a: MapLocation, b: MapLocation): number {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
    return 2 * 6371000 * Math.asin(Math.sqrt(h));
}

// 投稿 ID から決まる 0〜1 の値（毎回同じ位置にずらすため。乱数だと開くたびに円が動き、重ねると本当の地点が分かる）
function hashUnit(text: string, salt: number): number {
    let hash = 2166136261 ^ salt;
    for (let index = 0; index < text.length; index += 1) {
        hash ^= text.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
    }
    return ((hash >>> 0) % 10000) / 10000;
}

export function approximateArea(post: Post): { center: MapLocation; radius: number } {
    const bearing = hashUnit(post.id, 1) * 360;
    const offset = AREA_OFFSET_MIN_M + hashUnit(post.id, 2) * (AREA_OFFSET_MAX_M - AREA_OFFSET_MIN_M);
    return { center: destinationPoint({ lng: post.location.lng, lat: post.location.lat }, bearing, offset), radius: AREA_RADIUS_M };
}

export function formatDistanceAway(meters: number): string {
    return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters / 10) * 10} m`;
}

export function readUnlockedPostIds(): string[] {
    try {
        const raw = window.localStorage.getItem(UNLOCKED_STORAGE_KEY);
        if (!raw) return [];
        const parsed: unknown = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
    } catch (error) {
        console.warn(`Failed to read ${UNLOCKED_STORAGE_KEY}`, error);
        return [];
    }
}

export function writeUnlockedPostIds(ids: string[]): string[] {
    try {
        window.localStorage.setItem(UNLOCKED_STORAGE_KEY, JSON.stringify(ids));
    } catch (error) {
        console.warn(`Failed to persist ${UNLOCKED_STORAGE_KEY}`, error);
    }
    return ids;
}

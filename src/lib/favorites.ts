// お気に入りの場所。アカウントがないので、この端末のブラウザ（localStorage）にだけ保存する。
// 読めない・壊れている値は捨てて空として扱い、保存に失敗してもそのセッション中は画面の値を使う。
export type FavoritePlace = {
    id: string;
    name: string;
    lng: number;
    lat: number;
    // ISO 8601
    savedAt: string;
};

const FAVORITES_STORAGE_KEY = 'nightview.favorites';
// 一覧が際限なく伸びないように。古いものから落とす
export const MAX_FAVORITES = 100;

// 同じ地点を二重に登録しないための識別子（小数 5 桁 ≒ 1m）
export function favoriteId(lng: number, lat: number): string {
    return `${lat.toFixed(5)},${lng.toFixed(5)}`;
}

function isFavoritePlace(value: unknown): value is FavoritePlace {
    if (typeof value !== 'object' || value === null) return false;
    const item = value as Record<string, unknown>;
    return typeof item.id === 'string'
        && typeof item.name === 'string'
        && typeof item.lng === 'number' && Number.isFinite(item.lng)
        && typeof item.lat === 'number' && Number.isFinite(item.lat)
        && typeof item.savedAt === 'string';
}

export function readStoredFavorites(): FavoritePlace[] {
    try {
        const raw = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
        if (!raw) return [];
        const parsed: unknown = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.filter(isFavoritePlace) : [];
    } catch (error) {
        console.warn(`Failed to read ${FAVORITES_STORAGE_KEY}`, error);
        return [];
    }
}

export function writeStoredFavorites(favorites: FavoritePlace[]): FavoritePlace[] {
    try {
        window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
    } catch (error) {
        console.warn(`Failed to persist ${FAVORITES_STORAGE_KEY}`, error);
    }
    return favorites;
}

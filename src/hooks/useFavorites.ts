import { useCallback, useState } from 'react';
import { favoriteId, MAX_FAVORITES, readStoredFavorites, writeStoredFavorites, type FavoritePlace } from '../lib/favorites';

export type FavoriteInput = { name: string; lng: number; lat: number };

// お気に入りの一覧と、追加・削除。新しいものを先頭に置く
export function useFavorites() {
    const [favorites, setFavorites] = useState<FavoritePlace[]>(() => readStoredFavorites());

    const add = useCallback((place: FavoriteInput) => {
        const id = favoriteId(place.lng, place.lat);
        setFavorites((current) => {
            if (current.some((item) => item.id === id)) return current;
            const next: FavoritePlace = { id, name: place.name, lng: place.lng, lat: place.lat, savedAt: new Date().toISOString() };
            return writeStoredFavorites([next, ...current].slice(0, MAX_FAVORITES));
        });
    }, []);

    const remove = useCallback((id: string) => {
        setFavorites((current) => writeStoredFavorites(current.filter((item) => item.id !== id)));
    }, []);

    return { favorites, add, remove };
}

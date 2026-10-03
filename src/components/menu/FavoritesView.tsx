import { Heart, LocateFixed, MapPin, Trash } from '../ui/icons';
import type { FavoritePlace } from '../../lib/favorites';
import { textMuted, textPrimary } from '../../styles/ui';

type FavoritesViewProps = {
    favorites: FavoritePlace[];
    onSelect: (favorite: FavoritePlace) => void;
    onRemove: (id: string) => void;
    onAddCurrentLocation: () => void;
    // 現在地を取得中（追加ボタンを押してから位置が届くまで）
    isLocating: boolean;
    // 現在地を追加できなかった理由（位置情報の拒否など）
    locateError: string | null;
};

const savedAtFormat = new Intl.DateTimeFormat('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });

function formatSavedAt(savedAt: string) {
    const date = new Date(savedAt);
    return Number.isNaN(date.getTime()) ? '' : `${savedAtFormat.format(date)} に保存`;
}

// お気に入りの場所の一覧。押すとその地点へ地図を動かし、ピンを立てる。保存はこの端末のブラウザだけ
export function FavoritesView({ favorites, onSelect, onRemove, onAddCurrentLocation, isLocating, locateError }: FavoritesViewProps) {
    return (
        <div className="space-y-4">
            <button
                type="button"
                onClick={onAddCurrentLocation}
                disabled={isLocating}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-violet-300/30 bg-violet-700/70 px-4 text-sm font-semibold text-white transition-colors hover:bg-violet-600 disabled:cursor-wait disabled:opacity-60"
            >
                <LocateFixed size={18} aria-hidden="true" />
                {isLocating ? '現在地を取得しています…' : '現在地をお気に入りに追加'}
            </button>
            {locateError && <p role="status" className="px-1 text-[11px] leading-relaxed text-red-300/90">{locateError}</p>}

            {favorites.length === 0 ? (
                <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] px-5 py-6 text-center">
                    <Heart size={28} className="mx-auto text-white/30" aria-hidden="true" />
                    <p className={`mt-3 text-sm font-semibold ${textPrimary}`}>まだお気に入りはありません</p>
                    <p className={`mt-2 text-xs leading-relaxed ${textMuted}`}>
                        場所を検索して、地図に立ったピンの「お気に入りに追加」を押すか、上のボタンで今いる場所を保存できます。
                    </p>
                </div>
            ) : (
                <ul className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.03] shadow-inner">
                    {favorites.map((favorite, index) => (
                        <li key={favorite.id} className={`flex items-center ${index < favorites.length - 1 ? 'border-b border-white/10' : ''}`}>
                            <button
                                type="button"
                                onClick={() => onSelect(favorite)}
                                className="flex min-h-14 min-w-0 flex-1 items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/5"
                            >
                                <MapPin size={20} className="shrink-0 text-violet-200" aria-hidden="true" />
                                <span className="min-w-0">
                                    <span className={`block truncate text-sm font-semibold ${textPrimary}`}>{favorite.name}</span>
                                    <span className={`block text-[11px] ${textMuted}`}>{formatSavedAt(favorite.savedAt)}</span>
                                </span>
                            </button>
                            <button
                                type="button"
                                onClick={() => onRemove(favorite.id)}
                                aria-label={`${favorite.name} をお気に入りから削除`}
                                className="mr-2 grid h-11 w-11 shrink-0 place-items-center rounded-full text-white/45 transition-colors hover:bg-white/10 hover:text-white"
                            >
                                <Trash size={18} aria-hidden="true" />
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            <p className={`px-1 text-[11px] leading-relaxed ${textMuted}`}>
                お気に入りはこの端末のブラウザにだけ保存されます。ブラウザのデータを消すと消えます。
            </p>
        </div>
    );
}

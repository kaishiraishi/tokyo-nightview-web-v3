import { MapPin, Search, X } from '../ui/icons';
import type { GeocodingResult } from '../../lib/api/geocodingApi';

type SearchFieldProps = {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    onSearchSubmit: () => void;
    isSearching: boolean;
    searchResults: GeocodingResult[];
    showResults: boolean;
    onSelectResult: (result: GeocodingResult) => void;
    onCloseResults: () => void;
    onFocusSearch: () => void;
    variant?: 'top' | 'sheet' | 'side' | 'floating';
    // 検索結果を欄の下に出すか上に出すか。below-screen は、狭い検索バーでも読めるよう画面幅いっぱい（左右 16px）に
    // 広げて下に出す（スマホの探索モード。バーの左右の位置は PotentialMapView の SEARCH_BAR_LEFT / MOBILE_SEARCH_BAR_RIGHT）
    resultsPlacement?: 'below' | 'above' | 'below-screen';
};

const variantClasses = {
    top: {
        field: 'rounded-full border border-white/10 bg-black/60 px-4 shadow-lg backdrop-blur-md group-focus-within:bg-black/80 group-focus-within:border-white/20',
        height: 'h-12',
        placeholder: '場所を検索...',
    },
    sheet: {
        field: 'rounded-2xl border border-white/10 bg-white/[0.06] px-4 shadow-inner backdrop-blur-md focus-within:bg-white/[0.09]',
        height: 'h-12',
        placeholder: '場所を検索',
    },
    side: {
        field: 'rounded-2xl border border-white/10 bg-white/[0.05] px-3 shadow-inner backdrop-blur-md focus-within:bg-white/[0.08]',
        height: 'h-11',
        placeholder: '場所を検索',
    },
    // FloatingSearchBar のピルの中に置く。面と枠はピル側（glassControl）が持つので、欄自体は透明
    // 上の帯に収める（スマホでは幅が 180px 前後）ので、余白を詰め、右端の飾りのピンは出さない
    floating: {
        field: 'rounded-full gap-2 px-2',
        height: 'h-[var(--btn-h)]',
        placeholder: '場所を検索',
    },
} as const;

const RESULTS_PLACEMENT_CLASSES = {
    below: 'absolute left-0 right-0 top-[calc(100%+8px)] animate-ui-drop',
    above: 'absolute left-0 right-0 bottom-[calc(100%+8px)] animate-ui-rise',
    // 外側のピルはぼかし（backdrop-filter）を持つので position: fixed は画面基準にならない。ピルからの相対で、
    // 左はミニコンパスの分（88px − 16px）、右はモード切替の分（--btn-h × 2 + 18px）だけ外へ広げる
    'below-screen': 'absolute left-[-72px] right-[calc(var(--btn-h)*-2-18px)] top-[calc(100%+8px)] animate-ui-drop',
} as const;

export function SearchField({
    searchQuery,
    onSearchChange,
    onSearchSubmit,
    isSearching,
    searchResults,
    showResults,
    onSelectResult,
    onCloseResults,
    onFocusSearch,
    variant = 'top',
    resultsPlacement = 'below',
}: SearchFieldProps) {
    const classes = variantClasses[variant];

    return (
        // floating では位置の基準を外側のピルにして、検索結果をピル全体の幅で出す
        <div className={`group z-20 w-full min-w-0 flex-1 ${variant === 'floating' ? '' : 'relative'}`}>
            <div className={`flex w-full items-center ${variant === 'floating' ? '' : 'gap-3'} transition-colors ${classes.field} ${classes.height}`}>
                {/* 上の帯のバーはスマホでは幅が狭いので、虫めがねは出さない（案内文「場所を検索」で伝わる） */}
                <Search className={`h-5 w-5 shrink-0 text-white/50 ${variant === 'floating' ? 'max-md:hidden' : ''}`} aria-hidden="true" />
                <input
                    // 16px 未満だと iOS Safari がフォーカス時に画面を拡大するので、スマホは 16px にする
                    // ブラウザ標準の消去ボタンは隠す（右側に独自の × を出すので二重になる）
                    className="h-full min-w-0 flex-1 bg-transparent text-base text-white placeholder-white/45 outline-none md:text-sm [&::-webkit-search-cancel-button]:appearance-none"
                    placeholder={classes.placeholder}
                    type="search"
                    value={searchQuery}
                    onChange={(event) => onSearchChange(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter') onSearchSubmit();
                        if (event.key === 'Escape') onCloseResults();
                    }}
                    onFocus={onFocusSearch}
                    aria-label="場所を検索"
                />
                {isSearching ? (
                    <div className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-white/20 border-t-white" aria-label="検索中" />
                ) : searchQuery ? (
                    <button
                        type="button"
                        onClick={() => {
                            onSearchChange('');
                            onCloseResults();
                        }}
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-white/45 transition-colors hover:bg-white/10 hover:text-white"
                        aria-label="検索をクリア"
                    >
                        <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                ) : variant === 'floating' ? null : (
                    <MapPin className="h-4 w-4 shrink-0 text-white/25" aria-hidden="true" />
                )}
            </div>

            {showResults && searchResults.length > 0 && (
                <div
                    className={`${RESULTS_PLACEMENT_CLASSES[resultsPlacement]} overflow-hidden rounded-2xl border border-white/15 bg-[#05070b]/95 shadow-2xl backdrop-blur-xl`}
                    onMouseLeave={onCloseResults}
                >
                    <div className="max-h-[42dvh] overflow-y-auto py-2">
                        {searchResults.map((result, index) => {
                            const parts = result.displayName.split(',');
                            const name = parts[0];
                            const address = parts.slice(1).join(', ').trim();

                            return (
                                <button
                                    key={`${result.displayName}-${index}`}
                                    type="button"
                                    onClick={() => onSelectResult(result)}
                                    className="flex min-h-12 w-full flex-col gap-0.5 px-4 py-2.5 text-left transition-colors hover:bg-white/10"
                                >
                                    <span className="text-sm font-semibold text-white">{name}</span>
                                    {address && <span className="line-clamp-1 text-xs text-white/50">{address}</span>}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

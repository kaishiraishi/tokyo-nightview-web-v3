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
    variant?: 'top' | 'sheet' | 'side';
};

const variantClasses = {
    top: {
        field: 'rounded-full bg-black/60 px-4 shadow-lg backdrop-blur-md group-focus-within:bg-black/80 group-focus-within:border-white/20',
        height: 'h-12',
        placeholder: '場所を検索...',
    },
    sheet: {
        field: 'rounded-2xl bg-white/[0.06] px-4 shadow-inner backdrop-blur-md focus-within:bg-white/[0.09]',
        height: 'h-12',
        placeholder: '場所を検索',
    },
    side: {
        field: 'rounded-2xl bg-white/[0.05] px-3 shadow-inner backdrop-blur-md focus-within:bg-white/[0.08]',
        height: 'h-11',
        placeholder: '場所を検索',
    },
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
}: SearchFieldProps) {
    const classes = variantClasses[variant];

    return (
        <div className="group relative z-20 w-full min-w-0 flex-1">
            <div className={`flex w-full items-center gap-3 border border-white/10 transition-colors ${classes.field} ${classes.height}`}>
                <Search className="h-5 w-5 shrink-0 text-white/50" aria-hidden="true" />
                <input
                    className="h-full min-w-0 flex-1 bg-transparent text-sm text-white placeholder-white/45 outline-none"
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
                ) : (
                    <MapPin className="h-4 w-4 shrink-0 text-white/25" aria-hidden="true" />
                )}
            </div>

            {showResults && searchResults.length > 0 && (
                <div
                    className="absolute left-0 right-0 top-[calc(100%+8px)] overflow-hidden rounded-2xl border border-white/10 bg-black/95 shadow-2xl backdrop-blur-xl"
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

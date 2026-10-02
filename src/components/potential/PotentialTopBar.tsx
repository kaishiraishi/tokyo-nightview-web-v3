import { MapPinned, Search } from '../ui/icons';
import type { GeocodingResult } from '../../lib/api/geocodingApi';

type PotentialTopBarProps = {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    onSearchSubmit: () => void;
    isSearching: boolean;
    searchResults: GeocodingResult[];
    showResults: boolean;
    onSelectResult: (result: GeocodingResult) => void;
    onCloseResults: () => void;
};

export function PotentialTopBar({
    searchQuery,
    onSearchChange,
    onSearchSubmit,
    isSearching,
    searchResults,
    showResults,
    onSelectResult,
    onCloseResults,
}: PotentialTopBarProps) {
    return (
        <div className="absolute top-[calc(16px+env(safe-area-inset-top))] left-4 right-4 z-[5000] flex flex-col gap-3 pointer-events-none md:left-auto md:right-5 md:w-[520px]">
            <div className="pointer-events-auto flex items-center gap-2">
                <div className="hidden h-12 shrink-0 items-center gap-2 rounded-full border border-white/10 bg-black/65 px-4 text-white shadow-xl backdrop-blur-md sm:flex">
                    <MapPinned className="h-4 w-4 text-violet-300" />
                    <span className="text-xs font-semibold tracking-[0.16em] text-white/80">NIGHTVIEW POTENTIAL</span>
                </div>

                <div className="group relative flex-1">
                    <div className="flex h-12 w-full items-center gap-3 rounded-full border border-white/10 bg-black/65 px-4 shadow-xl backdrop-blur-md transition-colors focus-within:border-violet-300/50 focus-within:bg-black/80">
                        <Search className="h-5 w-5 shrink-0 text-white/50" />
                        <input
                            className="h-full w-full bg-transparent text-sm text-white outline-none placeholder:text-white/50"
                            placeholder="場所を検索…"
                            type="search"
                            value={searchQuery}
                            onChange={(event) => onSearchChange(event.target.value)}
                            onKeyDown={(event) => event.key === 'Enter' && onSearchSubmit()}
                            aria-label="場所を検索"
                        />
                        {isSearching && <div className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-white/20 border-t-white" />}
                    </div>

                    {showResults && searchResults.length > 0 && (
                        <div
                            className="absolute left-0 right-0 top-14 z-[6000] overflow-hidden rounded-2xl border border-white/10 bg-black/90 shadow-2xl backdrop-blur-xl"
                            onMouseLeave={onCloseResults}
                        >
                            <div className="max-h-[60vh] overflow-y-auto py-2">
                                {searchResults.map((result, index) => {
                                    const [name, ...addressParts] = result.displayName.split(',');
                                    return (
                                        <button
                                            key={`${result.lat}-${result.lng}-${index}`}
                                            type="button"
                                            onClick={() => onSelectResult(result)}
                                            className="flex w-full flex-col gap-0.5 px-4 py-3 text-left transition-colors hover:bg-white/10"
                                        >
                                            <span className="text-sm font-semibold text-white">{name}</span>
                                            {addressParts.length > 0 && (
                                                <span className="line-clamp-1 text-xs text-white/50">{addressParts.join(', ').trim()}</span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="pointer-events-auto self-end rounded-full border border-white/10 bg-black/55 px-3 py-1.5 text-[11px] font-medium tracking-wide text-white/65 shadow-lg backdrop-blur-md">
                色が明るいほど夜景ポテンシャルが高いエリア
            </div>
        </div>
    );
}

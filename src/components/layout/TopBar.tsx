import { Search, Sparkles, User } from '../ui/icons';
import { useState } from 'react';
import type { GeocodingResult } from '../../lib/api/geocodingApi';
import type { PanelView } from '../potential/PanelViewSelector';
import { AppMenu } from '../menu/AppMenu';
import type { FanConfig } from '../map/types';
import { SearchField } from './SearchField';

// Mock stats for the profile menu
const MOCK_PROFILE_STATS = {
    foundCount: 4,
    favoriteCount: 3,
};

type TopBarProps = {
    mode: 'explore' | 'analyze';
    onModeChange: (mode: 'explore' | 'analyze') => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    onSearchSubmit: () => void;
    isSearching: boolean;
    searchResults: GeocodingResult[];
    showResults: boolean;
    onSelectResult: (result: GeocodingResult) => void;
    onCloseResults: () => void;
    onFocusSearch: () => void;
    guidance?: {
        steps: { key: string; label: string }[];
        currentStep: string;
    } | null;
    onStepClick?: (key: string) => void;
    fanConfig?: FanConfig;
    onFanConfigChange?: (config: FanConfig) => void;
    onViewPosts?: () => void;
    postCount?: number;
    panelView?: PanelView;
    onPanelViewChange?: (panelView: PanelView) => void;
    debugMode?: boolean;
    onDebugModeChange?: (enabled: boolean) => void;
    hideSearch?: boolean;
};

export function TopBar({
    mode,
    onModeChange,
    searchQuery,
    onSearchChange,
    onSearchSubmit,
    isSearching,
    searchResults,
    showResults,
    onSelectResult,
    onCloseResults,
    onFocusSearch,
    guidance,
    onStepClick,
    fanConfig,
    onFanConfigChange,
    onViewPosts,
    postCount = 0,
    panelView,
    onPanelViewChange,
    debugMode,
    onDebugModeChange,
    hideSearch = false,
}: TopBarProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <div className="absolute top-[calc(16px+env(safe-area-inset-top))] left-4 right-4 md:left-auto md:right-4 md:w-[520px] z-[5000] flex flex-col gap-2 pointer-events-none">
            {/* Search & Mode Container - Floating Island */}
            <div className="flex items-center gap-2 pointer-events-auto">
                <button
                    type="button"
                    onClick={() => setIsMenuOpen(true)}
                    aria-label="メニューを開く"
                    className={`
                        h-12 w-12 shrink-0 flex items-center justify-center rounded-full border border-white/10 shadow-lg backdrop-blur-md transition-all
                        ${isMenuOpen ? 'bg-white text-black' : 'bg-black/60 text-white/80 hover:bg-black/80 hover:text-white'}
                    `}
                    title="メニュー"
                >
                    <User className="h-5 w-5" />
                </button>

                {!hideSearch && (
                    <SearchField
                        searchQuery={searchQuery}
                        onSearchChange={onSearchChange}
                        onSearchSubmit={onSearchSubmit}
                        isSearching={isSearching}
                        searchResults={searchResults}
                        showResults={showResults}
                        onSelectResult={onSelectResult}
                        onCloseResults={onCloseResults}
                        onFocusSearch={onFocusSearch}
                    />
                )}

                {/* Mode Toggle (Capsule) */}
                <div className="flex items-center rounded-full border border-white/10 bg-black/60 p-1 shadow-lg backdrop-blur-md">
                    <button
                        type="button"
                        onClick={() => onModeChange('explore')}
                        aria-label="探索モード"
                        aria-pressed={mode === 'explore'}
                        className={`flex h-10 w-10 items-center justify-center rounded-full transition-all ${mode === 'explore' ? 'bg-white text-black shadow-sm' : 'text-white/70 hover:text-white'}`}
                        title="探索モード"
                    >
                        <Search className="h-5 w-5" aria-hidden="true" />
                    </button>
                    <button
                        type="button"
                        onClick={() => onModeChange('analyze')}
                        aria-label="投稿モード"
                        aria-pressed={mode === 'analyze'}
                        className={`flex h-10 w-10 items-center justify-center rounded-full transition-all ${mode === 'analyze' ? 'bg-violet-700 text-white shadow-sm' : 'text-white/70 hover:text-white'}`}
                        title="投稿モード"
                    >
                        <Sparkles className="h-5 w-5" aria-hidden="true" />
                    </button>
                </div>
            </div>

            {/* Guidance Stepper - Horizontal ribbon below search */}
            {mode === 'explore' && guidance && (
                <div className="flex w-full bg-black/60 backdrop-blur-md border border-white/10 rounded-full p-1.5 items-center gap-1 pointer-events-auto shadow-xl animate-in slide-in-from-top-1 duration-300">
                    {guidance.steps.map((step, index) => {
                        const isActive = step.key === guidance.currentStep;
                        // Find if current step is past this step (simple heuristic)
                        const currentIndex = guidance.steps.findIndex(s => s.key === guidance.currentStep);
                        const isCompleted = index < currentIndex;

                        return (
                            <div key={step.key} className="flex flex-1 items-center">
                                {index > 0 && (
                                    <div className={`w-2 h-0.5 mx-0.5 rounded-full ${isCompleted ? 'bg-violet-700/50' : 'bg-white/10'}`} />
                                )}
                                <button
                                    onClick={() => onStepClick?.(step.key)}
                                    className={`
                                        flex-1 px-1 py-1.5 rounded-full text-[10px] font-bold transition-all whitespace-nowrap pointer-events-auto
                                        ${isActive 
                                            ? 'bg-violet-700 text-white shadow-sm scale-105' 
                                            : isCompleted 
                                                ? 'bg-violet-700/20 text-violet-300 hover:bg-violet-700/30' 
                                                : 'text-white/40 hover:text-white/60'
                                        }
                                    `}
                                >
                                    {index + 1}. {step.label}
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* App Menu Overlay */}
            <AppMenu 
                isOpen={isMenuOpen}
                onClose={() => setIsMenuOpen(false)}
                displayName="KAZUNE"
                memberId="No.0001"
                foundCount={MOCK_PROFILE_STATS.foundCount}
                favoriteCount={MOCK_PROFILE_STATS.favoriteCount}
                postCount={postCount}
                onViewPosts={onViewPosts}
                fanConfig={fanConfig}
                onFanConfigChange={onFanConfigChange}
                panelView={panelView}
                onPanelViewChange={onPanelViewChange}
                debugMode={debugMode}
                onDebugModeChange={onDebugModeChange}
            />
        </div>
    );
}

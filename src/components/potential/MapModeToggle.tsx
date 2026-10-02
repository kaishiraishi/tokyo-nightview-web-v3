import { MapIcon, Sparkle } from '../ui/icons';
import { glassControl } from '../../styles/ui';

type MapModeToggleProps = {
    mode: 'explore' | 'analyze';
    onModeChange: (mode: 'explore' | 'analyze') => void;
    className?: string;
};

// 右上の探索 / 投稿切替。投稿ボタンは主ボタンとして常に紫で塗り、選択中は白い縁で示す。
export function MapModeToggle({ mode, onModeChange, className = '' }: MapModeToggleProps) {
    const isExplore = mode === 'explore';

    return (
        <div className={`flex items-center rounded-full ${glassControl} p-1 ${className}`} role="group" aria-label="モード切替">
            <button
                type="button"
                onClick={() => onModeChange('explore')}
                aria-label="探索モード"
                aria-pressed={isExplore}
                title="探索モード"
                className={`grid h-[var(--btn-h)] w-[var(--btn-h)] place-items-center rounded-full transition-colors ${isExplore ? 'bg-white text-black shadow-sm' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
            >
                <MapIcon className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
                type="button"
                onClick={() => onModeChange('analyze')}
                aria-label="投稿モード"
                aria-pressed={!isExplore}
                title="投稿モード"
                className={`grid h-[var(--btn-h)] w-[var(--btn-h)] place-items-center rounded-full bg-violet-700 text-white shadow-sm transition-colors hover:bg-violet-600 ${!isExplore ? 'ring-2 ring-white/90' : ''}`}
            >
                <Sparkle className="h-5 w-5" aria-hidden="true" />
            </button>
        </div>
    );
}

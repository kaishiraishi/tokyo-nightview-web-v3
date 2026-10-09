import { MapIcon, Sparkle } from '../ui/icons';
import { glassControl } from '../../styles/ui';

type MapModeToggleProps = {
    mode: 'explore' | 'analyze';
    onModeChange: (mode: 'explore' | 'analyze') => void;
    className?: string;
};

// 右上の探索 / 投稿切替。選択中の背景（どちらも紫）が左右に滑って移る。
// 投稿を選んでいないときも、スパークルを紫にして投稿の入口だと分かるようにする。
// 動きは motion-safe のときだけ（prefers-reduced-motion では即座に切り替える）
export function MapModeToggle({ mode, onModeChange, className = '' }: MapModeToggleProps) {
    const isExplore = mode === 'explore';

    return (
        // 外側の位置指定（absolute など）は呼び出し側の className で決める。滑る背景はその中で絶対配置する
        <div className={`flex items-center rounded-full ${glassControl} p-1 ${className || 'relative'}`} role="group" aria-label="モード切替" data-tutorial="mode-toggle">
            <span
                aria-hidden="true"
                className={`pointer-events-none absolute left-1 top-1 h-[var(--btn-h)] w-[var(--btn-h)] rounded-full shadow-sm motion-safe:transition-[transform,background-color] motion-safe:duration-300 motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)] bg-violet-700 ${isExplore ? 'translate-x-0' : 'translate-x-[var(--btn-h)]'}`}
            />
            <button
                type="button"
                onClick={() => onModeChange('explore')}
                aria-label="探索モード"
                aria-pressed={isExplore}
                title="探索モード"
                className={`relative grid h-[var(--btn-h)] w-[var(--btn-h)] place-items-center rounded-full transition-colors duration-300 ${isExplore ? 'text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
            >
                <MapIcon className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
                type="button"
                onClick={() => onModeChange('analyze')}
                aria-label="投稿モード"
                aria-pressed={!isExplore}
                title="投稿モード"
                className={`relative grid h-[var(--btn-h)] w-[var(--btn-h)] place-items-center rounded-full transition-colors duration-300 ${!isExplore ? 'text-white' : 'text-violet-300 hover:bg-white/10 hover:text-violet-200'}`}
            >
                <Sparkle className="h-5 w-5" aria-hidden="true" />
            </button>
        </div>
    );
}

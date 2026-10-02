import type { CSSProperties } from 'react';
import { MapFilled, Navigation } from '../ui/icons';

type MapControlStackProps = {
    onLocate: () => void;
    onOpenMapModes: () => void;
    isMapModesOpen: boolean;
    style?: CSSProperties;
    className?: string;
};

// 右下の縦並びボタン。現在地への移動と Map Modes（レイヤー設定）を 1 本のピルにまとめる。
export function MapControlStack({ onLocate, onOpenMapModes, isMapModesOpen, style, className = '' }: MapControlStackProps) {
    const buttonClass = 'grid h-[var(--btn-h)] w-[var(--btn-h)] place-items-center rounded-full transition-colors active:scale-95';

    return (
        <div style={style} className={`flex flex-col gap-1 rounded-full border border-white/10 bg-black/60 p-1 shadow-lg backdrop-blur-md ${className}`}>
            <button type="button" onClick={onLocate} aria-label="現在地へ移動" title="現在地へ移動" className={`${buttonClass} text-white/90 hover:bg-white/10`}>
                <Navigation className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
                type="button"
                onClick={onOpenMapModes}
                aria-label="表示モードを開く"
                aria-expanded={isMapModesOpen}
                title="表示モード"
                className={`${buttonClass} ${isMapModesOpen ? 'bg-violet-700/80 text-white' : 'text-white/90 hover:bg-white/10'}`}
            >
                <MapFilled className="h-5 w-5" aria-hidden="true" />
            </button>
        </div>
    );
}

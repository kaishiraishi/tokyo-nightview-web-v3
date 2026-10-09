import type { CSSProperties } from 'react';
import { MapFilled, Navigation } from '../ui/icons';
import { glassControl } from '../../styles/ui';

type MapControlStackProps = {
    onLocate: () => void;
    onOpenMapModes: () => void;
    isMapModesOpen: boolean;
    style?: CSSProperties;
    className?: string;
    // 投稿モードでは、ピルの一番上に投稿（＋）ボタンの場所を空ける。ボタン本体は PostComposer が
    // この場所に重ねて置く（投稿フォームの開閉を PostComposer が持つため）
    reserveTopSlot?: boolean;
};

// 右下の縦並びボタン。現在地への移動と Map Modes（レイヤー設定）を 1 本のピルにまとめる。
export function MapControlStack({ onLocate, onOpenMapModes, isMapModesOpen, style, className = '', reserveTopSlot = false }: MapControlStackProps) {
    const buttonClass = 'grid h-[var(--btn-h)] w-[var(--btn-h)] place-items-center rounded-full transition-colors active:scale-95';

    return (
        <div style={style} className={`flex flex-col gap-1 rounded-full ${glassControl} p-1 ${className}`}>
            {/* 投稿モードに入ると、＋ の場所が上にふわっと現れる（ボタン列が急に伸びない） */}
            {reserveTopSlot && <div className="h-[var(--btn-h)] w-[var(--btn-h)] animate-ui-pop" aria-hidden="true" />}
            <button type="button" data-tutorial="locate" onClick={onLocate} aria-label="現在地へ移動" title="現在地へ移動" className={`${buttonClass} text-white/90 hover:bg-white/10`}>
                <Navigation className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
                type="button"
                data-tutorial="map-modes"
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

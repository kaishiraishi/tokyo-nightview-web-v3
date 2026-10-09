import { glassControl } from '../../styles/ui';
import { DirectionalFieldView } from './prototypes/DirectionalField';
import type { PotentialRange, PotentialViewModel } from './prototypes/types';

type MiniCompassProps = {
    data: PotentialViewModel | null;
    rotation: number;
    range: PotentialRange;
    isLoading: boolean;
    // 端末の向きが取れている間だけ、前方の扇形を出す（向きが分からないのに出すと誤解させるため）
    facing: boolean;
    onClick: () => void;
};

function rangeLabel(range: PotentialRange) {
    return range >= 1000 ? `${range / 1000}km` : `${range}m`;
}

// カード内の Directional Field（試作 field）を縮小したもの。端末方位（なければ地図の bearing）で回転し、中央は Range を示す。
export function MiniCompass({ data, rotation, range, isLoading, facing, onClick }: MiniCompassProps) {
    const label = rangeLabel(range);

    return (
        <button
            type="button"
            data-tutorial="compass"
            onClick={onClick}
            aria-label={`コンパスモードを開く（範囲 ${label}）`}
            title="コンパスモード"
            // 地図の道路やラベルと重なっても読めるよう、他の地図ボタンと同じガラス調の円を敷く
            className={`relative grid h-16 w-16 shrink-0 place-items-center rounded-full ${glassControl} transition-transform active:scale-95`}
        >
            <span className={`pointer-events-none absolute inset-0 ${isLoading ? 'opacity-45' : ''}`} aria-hidden="true">
                {data ? (
                    <DirectionalFieldView data={data} rotation={rotation} variant="mini" />
                ) : (
                    // データがない間も、mini の基礎リング（内半径 104 / 太さ 18、300px 座標）と目盛りを同じ位置に出す
                    <span className="absolute inset-0" style={{ transform: `rotate(${-rotation}deg)` }}>
                        <span className="absolute inset-[9.3%] rounded-full border-4 border-white/[0.18]" />
                        {[0, 90, 180, 270].map((bearing) => (
                            <span key={bearing} className="absolute inset-0" style={{ transform: `rotate(${bearing}deg)` }}>
                                <span className={`absolute left-1/2 top-0 h-[3px] w-[1.5px] -translate-x-1/2 rounded-full ${bearing === 0 ? 'bg-red-400' : 'bg-white/55'}`} />
                            </span>
                        ))}
                    </span>
                )}
            </span>
            {facing && (
                // 文字盤（リング）は端末の向きで回るが、この扇形は画面の上に固定。端末が向いている方向を示す
                <svg viewBox="-100 -100 200 200" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
                    <defs>
                        <radialGradient id="mini-facing-cone" cx="0" cy="0" r="88" gradientUnits="userSpaceOnUse">
                            <stop offset="0.35" stopColor="rgba(255,255,255,0)" />
                            <stop offset="1" stopColor="rgba(255,255,255,0.3)" />
                        </radialGradient>
                    </defs>
                    <path d="M0 0 L-37.2 -79.8 A88 88 0 0 1 37.2 -79.8 Z" fill="url(#mini-facing-cone)" />
                    <path d="M-37.2 -79.8 A88 88 0 0 1 37.2 -79.8" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="5" strokeLinecap="round" />
                </svg>
            )}
            {/* 背景を塗らないので、明るい地図の上でも Range が読めるよう文字に影を付ける */}
            <span className="pointer-events-none relative text-[11px] font-medium tabular-nums text-white/90 [text-shadow:0_1px_3px_rgba(0,0,0,0.8)]" aria-hidden="true">
                {label}
            </span>
        </button>
    );
}

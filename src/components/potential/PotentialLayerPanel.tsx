import { Layers, SlidersHorizontal, Sparkles } from 'lucide-react';
import { LayerMenu } from '../layout/LayerMenu';

type PotentialLayerPanelProps = {
    isOpen: boolean;
    onToggle: () => void;
    isVisible: boolean;
    onVisibilityChange: (visible: boolean) => void;
    opacity: number;
    onOpacityChange: (opacity: number) => void;
};

export function PotentialLayerPanel({
    isOpen,
    onToggle,
    isVisible,
    onVisibilityChange,
    opacity,
    onOpacityChange,
}: PotentialLayerPanelProps) {
    return (
        <LayerMenu isOpen={isOpen} onToggle={onToggle}>
            <div className="flex h-full flex-col text-white">
                <div className="border-b border-white/10 px-5 pb-5 pt-5">
                    <div className="flex items-center gap-2 text-white/70">
                        <Layers className="h-4 w-4" />
                        <span className="text-xs font-bold uppercase tracking-[0.16em]">Map layers</span>
                    </div>
                    <h1 className="mt-3 text-xl font-semibold tracking-tight">夜景ポテンシャル</h1>
                    <p className="mt-2 text-sm leading-relaxed text-white/55">
                        地形や周辺の明るさから算出した、夜景が見える可能性を地図上に重ねています。
                    </p>
                </div>

                <div className="flex-1 overflow-y-auto p-5">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <span className={`h-3 w-3 rounded-full ${isVisible ? 'bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.8)]' : 'bg-white/20'}`} />
                                <div>
                                    <p className="text-sm font-semibold text-white/90">ポテンシャルレイヤー</p>
                                    <p className="mt-0.5 text-xs text-white/45">Tokyo / zoom 10–14</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => onVisibilityChange(!isVisible)}
                                className={`rounded-full px-3 py-1.5 text-[11px] font-bold transition-colors ${isVisible ? 'bg-emerald-500 text-black' : 'bg-white/10 text-white/55 hover:bg-white/15'}`}
                                aria-pressed={isVisible}
                            >
                                {isVisible ? '表示中' : '非表示'}
                            </button>
                        </div>

                        <div className="mt-5 border-t border-white/10 pt-4">
                            <div className="flex items-center justify-between text-xs text-white/65">
                                <span className="flex items-center gap-2"><SlidersHorizontal className="h-3.5 w-3.5" />不透明度</span>
                                <span className="tabular-nums text-white/45">{Math.round(opacity * 100)}%</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={opacity}
                                onChange={(event) => onOpacityChange(Number(event.target.value))}
                                className="mt-3 h-1.5 w-full cursor-pointer accent-emerald-400"
                                aria-label="夜景ポテンシャルレイヤーの不透明度"
                            />
                        </div>
                    </div>

                    <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
                        <div className="flex items-center gap-2 text-xs font-semibold text-white/75">
                            <Sparkles className="h-3.5 w-3.5 text-violet-300" />
                            ポテンシャルの目安
                        </div>
                        <div className="mt-4 h-3 rounded-full bg-gradient-to-r from-[#223b83] via-[#29b47b] to-[#f4c84b]" />
                        <div className="mt-2 flex justify-between text-[11px] text-white/45">
                            <span>低い</span>
                            <span>高い</span>
                        </div>
                        <p className="mt-4 text-xs leading-relaxed text-white/45">
                            まずは色の濃淡から候補エリアを見つけ、地図を拡大して周辺を確認できます。
                        </p>
                    </div>
                </div>

                <div className="border-t border-white/10 px-5 py-4 text-[11px] leading-relaxed text-white/35">
                    データ範囲: 東京都周辺<br />
                    ベースマップ: OpenStreetMap / CARTO
                </div>
            </div>
        </LayerMenu>
    );
}

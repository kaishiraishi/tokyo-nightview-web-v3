import type { ReactNode } from 'react';
import { Layers, Sparkles } from '../ui/icons';
import { CompassControl, type CompassControlProps } from './CompassControl';
import { DirectionalField } from '../directional-field/DirectionalField';
import type { DirectionPeak } from '../directional-field/types';
import { PolarHeatmap } from '../polar-heatmap/PolarHeatmap';
import type { PolarPoint } from '../polar-heatmap/types';
import { PrototypeControls } from './prototypes/PrototypePanel';
import type { PotentialRange } from './prototypes/types';

type ClassicPanelView = 'classicField' | 'classicPolar';

type ClassicPanelsProps = {
    view: ClassicPanelView;
    directionPeaks: DirectionPeak[];
    potentialPoints: PolarPoint[];
    maxDistance: PotentialRange;
    onRangeChange: (range: PotentialRange) => void;
    status: string;
    error: string | null;
    hasSelection: boolean;
    streetViewBlock: ReactNode;
    rotation: number;
    compass: CompassControlProps;
};

function EmptyPanel({ hasSelection }: { hasSelection: boolean }) {
    return (
        <div className="grid aspect-square place-items-center rounded-2xl border border-dashed border-white/10 text-xs text-white/40">
            {hasSelection ? 'この地点のデータを表示できません' : '地図上をクリックして地点を選択'}
        </div>
    );
}

function PanelStatus({ status, error }: Pick<ClassicPanelsProps, 'status' | 'error'>) {
    return (
        <>
            <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-center text-[11px] text-white/45">{status}</div>
            {error && <p className="text-center text-[11px] text-amber-200/80">{error}</p>}
        </>
    );
}

export function ClassicPanels({
    view,
    directionPeaks,
    potentialPoints,
    maxDistance,
    onRangeChange,
    status,
    error,
    hasSelection,
    streetViewBlock,
    rotation,
    compass,
}: ClassicPanelsProps) {
    return (
        <div className="mt-4 space-y-3">
            <PrototypeControls range={maxDistance} onRangeChange={onRangeChange} />
            <CompassControl {...compass} />
            <PanelStatus status={status} error={error} />

            {view === 'classicField' ? (
                <div className="rounded-2xl border border-white/10 bg-[#080c10] p-3">
                    <div className="flex items-center justify-between gap-3 px-1">
                        <div>
                            <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-white/75">
                                <Sparkles className="h-4 w-4 text-violet-300" />
                                Directional Field
                            </div>
                            <p className="mt-1 text-[11px] text-white/40">周囲の強い方向を気配で表示</p>
                        </div>
                    </div>

                    {directionPeaks.length > 0 ? (
                        <DirectionalField
                            peaks={directionPeaks}
                            size={246}
                            rotation={rotation}
                            palette="opportunity"
                            showForward
                            interactive
                            className="mx-auto mt-2"
                        />
                    ) : (
                        <EmptyPanel hasSelection={hasSelection} />
                    )}
                    {streetViewBlock}
                </div>
            ) : (
                <div className="rounded-2xl border border-white/10 bg-[#081019] p-3">
                    <div className="px-1">
                        <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-white/75">
                            <Layers className="h-4 w-4 text-cyan-300" />
                            Polar Heatmap
                        </div>
                        <p className="mt-1 text-[11px] text-white/40">方向 × 距離 × 強度</p>
                    </div>

                    {potentialPoints.length > 0 ? (
                        <PolarHeatmap
                            points={potentialPoints}
                            maxDistance={maxDistance}
                            size={246}
                            rotation={rotation}
                            palette="potential"
                            showGrid
                            showCenter
                            interactive
                            className="mx-auto mt-2"
                        />
                    ) : (
                        <EmptyPanel hasSelection={hasSelection} />
                    )}
                    <div
                        className="mt-3 h-2 rounded-full"
                        style={{
                            background:
                                'linear-gradient(to right, rgba(20,18,30,0.16), rgba(38,25,74,0.35), rgba(190,75,70,0.78), rgba(255,166,0,0.92))',
                        }}
                    />
                    <div className="mt-1 flex justify-between text-[10px] text-white/35">
                        <span>LOW</span>
                        <span>HIGH</span>
                    </div>
                    {streetViewBlock}
                </div>
            )}
        </div>
    );
}

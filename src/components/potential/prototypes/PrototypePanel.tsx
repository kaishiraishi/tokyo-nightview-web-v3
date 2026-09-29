import type { ReactNode } from 'react';
import { PrototypeCard } from './PrototypeCard';
import { PrototypeCompare } from './PrototypeCompare';
import { PROTOTYPE_META, PrototypeView, prototypeSubtitle } from './PrototypeViews';
import { POTENTIAL_RANGES, type PotentialRange, type PotentialViewModel, type PrototypeType } from './types';

type PrototypePanelProps = {
    data: PotentialViewModel | null;
    type: PrototypeType | 'compare';
    isUpdating: boolean;
    range: PotentialRange;
    onRangeChange: (range: PotentialRange) => void;
    status: ReactNode;
    error: string | null;
    children?: ReactNode;
};

const segmentClass = (selected: boolean) =>
    `inline-flex min-h-11 flex-1 items-center justify-center whitespace-nowrap rounded-lg px-1.5 py-1.5 text-xs font-medium transition-colors ${selected ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white/80'}`;

export function PrototypeControls({
    range,
    onRangeChange,
}: Pick<PrototypePanelProps, 'range' | 'onRangeChange'>) {
    return (
        <div className="space-y-2">
            <div>
                <span className="text-[11px] text-white/40">Range</span>
                <div className="mt-1 flex rounded-xl bg-white/5 p-1 ring-1 ring-white/10" role="group" aria-label="表示距離">
                    {POTENTIAL_RANGES.map((value) => (
                        <button key={value} type="button" aria-pressed={range === value} onClick={() => onRangeChange(value)} className={segmentClass(range === value)}>
                            {value >= 1000 ? '1km' : value}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

export function PrototypePanel({ data, type, isUpdating, status, error, children, ...controls }: PrototypePanelProps) {
    return (
        <div className="space-y-3">
            <PrototypeControls {...controls} />
            <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-center text-[11px] text-white/45">{status}</div>
            {error && <p className="text-center text-[11px] text-amber-200/80">{error}</p>}
            {data && type === 'compare' ? (
                <PrototypeCompare data={data} isUpdating={isUpdating} />
            ) : data && type !== 'compare' ? (
                <PrototypeCard title={PROTOTYPE_META[type].title} subtitle={prototypeSubtitle(type, data)} isUpdating={isUpdating}>
                    <PrototypeView type={type} data={data} />
                </PrototypeCard>
            ) : (
                <div className="grid aspect-square place-items-center rounded-2xl border border-dashed border-white/10 text-xs text-white/40">
                    地図上をクリックして地点を選択
                </div>
            )}
            {children}
        </div>
    );
}

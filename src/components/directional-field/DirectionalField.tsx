import { useMemo, useState } from 'react';
import { UserRound } from 'lucide-react';
import { sampleField } from './field';
import { DirectionalFieldCanvas } from './DirectionalFieldCanvas';
import type { DirectionalPalette, DirectionPeak, SelectedDirection } from './types';

export type DirectionalFieldProps = {
    peaks: DirectionPeak[];
    size?: number;
    palette?: DirectionalPalette;
    showForward?: boolean;
    interactive?: boolean;
    className?: string;
    onDirectionSelect?: (direction: SelectedDirection) => void;
};

export function DirectionalField({
    peaks,
    size = 320,
    palette = 'opportunity',
    showForward = true,
    interactive = true,
    className = '',
    onDirectionSelect,
}: DirectionalFieldProps) {
    const [hoveredDirection, setHoveredDirection] = useState<SelectedDirection | null>(null);
    const samples = useMemo(() => sampleField(peaks), [peaks]);

    return (
        <div className={`relative grid place-items-center overflow-visible rounded-3xl bg-[#080c10] ${className}`} style={{ width: size, height: size }}>
            <DirectionalFieldCanvas
                size={size}
                samples={samples}
                palette={palette}
                showForward={showForward}
                interactive={interactive}
                onHover={setHoveredDirection}
                onSelect={(direction) => onDirectionSelect?.(direction)}
            />

            <div className="pointer-events-none absolute inset-0 grid place-items-center">
                <div className="flex flex-col items-center gap-1 text-white/55">
                    <div className="grid h-9 w-9 place-items-center rounded-full border border-white/20 bg-black/35 shadow-lg backdrop-blur-sm">
                        <UserRound className="h-4 w-4" />
                    </div>
                    <span className="text-[10px] font-semibold tracking-[0.18em]">YOU</span>
                </div>
            </div>

            {showForward && <span className="pointer-events-none absolute top-[4%] text-[10px] font-medium tracking-[0.18em] text-white/40">前</span>}

            {hoveredDirection && (
                <div className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 rounded-full border border-white/10 bg-black/75 px-3 py-1 text-[10px] tabular-nums text-white/80 shadow-lg backdrop-blur-md">
                    {Math.round(hoveredDirection.angle)}° · {Math.round(hoveredDirection.strength * 100)}%
                </div>
            )}
        </div>
    );
}

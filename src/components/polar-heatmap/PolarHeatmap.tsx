import { useMemo, useState } from 'react';
import { UserRound } from 'lucide-react';
import { samplePolarField } from './field';
import { PolarHeatmapCanvas } from './PolarHeatmapCanvas';
import type { PolarPalette, PolarPoint } from './types';

type PolarHeatmapProps = {
    points: PolarPoint[];
    size?: number;
    maxDistance: number;
    palette?: PolarPalette;
    showGrid?: boolean;
    showCenter?: boolean;
    interactive?: boolean;
    className?: string;
};

function formatDistance(distance: number) {
    return distance >= 1000 ? `${distance / 1000} km` : `${distance} m`;
}

export function PolarHeatmap({
    points,
    size = 360,
    maxDistance,
    palette = 'thermal',
    showGrid = true,
    showCenter = true,
    interactive = true,
    className = '',
}: PolarHeatmapProps) {
    const [hoveredValue, setHoveredValue] = useState<{ angle: number; distance: number; strength: number } | null>(null);
    const samples = useMemo(() => samplePolarField(points, maxDistance), [maxDistance, points]);

    return (
        <div className={`relative grid place-items-center overflow-visible rounded-3xl bg-[#081019] ${className}`} style={{ width: size, height: size }}>
            <PolarHeatmapCanvas
                size={size}
                samples={samples}
                maxDistance={maxDistance}
                palette={palette}
                showGrid={showGrid}
                interactive={interactive}
                onHover={setHoveredValue}
            />

            {showCenter && (
                <div className="pointer-events-none absolute inset-0 grid place-items-center">
                    <div className="grid h-9 w-9 place-items-center rounded-full border border-white/25 bg-[#081019]/90 text-white/65 shadow-lg">
                        <UserRound className="h-4 w-4" />
                    </div>
                </div>
            )}

            <div className="pointer-events-none absolute top-[3%] text-[10px] font-medium tracking-[0.16em] text-white/45">前</div>
            <div className="pointer-events-none absolute right-[2%] top-1/2 -translate-y-1/2 text-[10px] text-white/35">右</div>
            <div className="pointer-events-none absolute bottom-[3%] text-[10px] font-medium tracking-[0.16em] text-white/35">後</div>
            <div className="pointer-events-none absolute left-[2%] top-1/2 -translate-y-1/2 text-[10px] text-white/35">左</div>

            {hoveredValue && (
                <div className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/10 bg-black/80 px-3 py-1 text-[10px] tabular-nums text-white/85 shadow-lg backdrop-blur-md">
                    {Math.round(hoveredValue.angle)}° · {formatDistance(Math.round(hoveredValue.distance))} · {Math.round(hoveredValue.strength * 100)}%
                </div>
            )}
        </div>
    );
}

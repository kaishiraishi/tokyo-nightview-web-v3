import { DirectionalFieldView } from './DirectionalField';
import { PolarHeatmapView } from './PolarHeatmap';
import { formatDistance } from './canvas';
import type { PotentialViewModel, PrototypeType } from './types';

export const PROTOTYPE_META: Record<PrototypeType, { title: string; caption: string }> = {
    field: { title: 'Directional Field', caption: '方向の強さ' },
    polar: { title: 'Polar Heatmap', caption: '方向 × 距離 × 強度' },
};

export function PrototypeView({ type, data, rotation = 0, showCompassLabels = true }: { type: PrototypeType; data: PotentialViewModel; rotation?: number; showCompassLabels?: boolean }) {
    switch (type) {
        case 'field':
            return <DirectionalFieldView data={data} rotation={rotation} />;
        case 'polar':
            return <PolarHeatmapView data={data} rotation={rotation} showCompassLabels={showCompassLabels} />;
    }
}

export function prototypeSubtitle(type: PrototypeType, data: PotentialViewModel) {
    return `${PROTOTYPE_META[type].caption} · ${formatDistance(data.range)}以内`;
}

import { DirectionalFieldView } from './DirectionalField';
import { PolarHeatmapView } from './PolarHeatmap';
import { formatDistance } from './canvas';
import type { PotentialViewModel, PrototypeType } from './types';

export const PROTOTYPE_META: Record<PrototypeType, { title: string; caption: string }> = {
    field: { title: 'Directional Field', caption: '方向の強さ' },
    polar: { title: 'Polar Heatmap', caption: '方向 × 距離 × 強度' },
};

export function PrototypeView({ type, data }: { type: PrototypeType; data: PotentialViewModel }) {
    switch (type) {
        case 'field':
            return <DirectionalFieldView data={data} />;
        case 'polar':
            return <PolarHeatmapView data={data} />;
    }
}

export function prototypeSubtitle(type: PrototypeType, data: PotentialViewModel) {
    return `${PROTOTYPE_META[type].caption} · ${formatDistance(data.range)}以内`;
}

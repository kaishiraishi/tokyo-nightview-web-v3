import { DirectionalFieldView } from './DirectionalField';
import { PeakWedgesView } from './PeakWedges';
import { PolarHeatmapView } from './PolarHeatmap';
import { RadialBandsView } from './RadialBands';
import { formatDistance } from './canvas';
import type { PotentialViewModel, PrototypeType } from './types';

export const PROTOTYPE_META: Record<PrototypeType, { title: string; caption: string }> = {
    field: { title: 'Directional Field', caption: '方向の強さ' },
    polar: { title: 'Polar Heatmap', caption: '方向 × 距離 × 強度' },
    bands: { title: 'Radial Bands', caption: '方向 × 距離の区画' },
    peaks: { title: 'Peak Wedges', caption: '強い方向を最大5つ' },
};

export function PrototypeView({ type, data }: { type: PrototypeType; data: PotentialViewModel }) {
    switch (type) {
        case 'field':
            return <DirectionalFieldView data={data} />;
        case 'polar':
            return <PolarHeatmapView data={data} />;
        case 'bands':
            return <RadialBandsView data={data} />;
        case 'peaks':
            return <PeakWedgesView data={data} />;
    }
}

export function prototypeSubtitle(type: PrototypeType, data: PotentialViewModel) {
    const base = `${PROTOTYPE_META[type].caption} · ${formatDistance(data.range)}以内`;
    return type === 'bands' ? `${base} · 帯 ${data.bandEdges.join('–')} m` : base;
}

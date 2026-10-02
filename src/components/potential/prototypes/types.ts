// 方位角は地理方位で統一: 0° = 北, 90° = 東, 180° = 南, 270° = 西。
export type PotentialRange = 50 | 100 | 200 | 500 | 1000 | 5000 | 10000;

export const POTENTIAL_RANGES: PotentialRange[] = [50, 100, 200, 500, 1000, 5000, 10000];

export type PotentialSample = {
    bearing: number;
    distance: number;
    // RGBA から色ランプを逆引きした近似値。Float32 の真値ではない。
    rawValue: number | null;
    // 0〜1 に正規化した値 (rawValue / 0.1635)
    strength: number;
    // 閾値と非線形変換を加えた表示用の値
    visualStrength: number;
};

export type PotentialSampleGrid = {
    center: { lng: number; lat: number };
    samples: PotentialSample[];
    range: PotentialRange;
    threshold: number;
};

export type DirectionValue = {
    bearing: number;
    rawValue: number;
    strength: number;
    visualStrength: number;
    // range 内でこの方向が最大になった距離
    distance: number;
};

export type PolarCell = {
    bearing: number;
    distance: number;
    rawValue: number;
    strength: number;
    visualStrength: number;
};

export type PolarField = {
    bearingCount: number;
    distanceCount: number;
    // index = bearingIndex * distanceCount + distanceIndex
    cells: PolarCell[];
};

export type PotentialViewModel = {
    center: { lng: number; lat: number };
    range: PotentialRange;
    threshold: number;
    samples: PotentialSample[];
    directionProfile: DirectionValue[];
    polarField: PolarField;
};

export type PrototypeType = 'field' | 'polar';

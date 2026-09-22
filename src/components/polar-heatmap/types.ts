export type PolarPoint = {
    angle: number;
    distance: number;
    strength: number;
    angleSpread?: number;
    distanceSpread?: number;
};

export type PolarSample = {
    angle: number;
    distance: number;
    strength: number;
};

export type PolarPalette = 'thermal' | 'signal' | 'cool';

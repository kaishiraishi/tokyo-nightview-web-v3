export type DirectionPeak = {
    angle: number;
    strength: number;
    spread: number;
};

export type FieldSample = {
    angle: number;
    value: number;
};

export type DirectionalPalette = 'opportunity' | 'proximity' | 'signal';

export type SelectedDirection = {
    angle: number;
    strength: number;
};

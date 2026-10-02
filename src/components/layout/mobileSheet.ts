export type MobileSheetLevel = 'collapsed' | 'medium' | 'expanded';

// Keep the sheet height and the floating map controls on the same boundary.
export const MOBILE_SHEET_HEIGHTS: Record<MobileSheetLevel, string> = {
    collapsed: 'calc(132px + env(safe-area-inset-bottom))',
    medium: 'min(56dvh, 540px)',
    expanded: 'min(78dvh, 760px)',
};

export const MOBILE_SHEET_CONTROL_BOTTOMS: Record<MobileSheetLevel, string> = {
    collapsed: 'calc(148px + env(safe-area-inset-bottom))',
    medium: 'calc(min(56dvh, 540px) + 16px)',
    expanded: 'calc(min(78dvh, 760px) + 16px)',
};

export function nextMobileSheetLevel(level: MobileSheetLevel): MobileSheetLevel {
    if (level === 'collapsed') return 'medium';
    if (level === 'medium') return 'expanded';
    return 'collapsed';
}

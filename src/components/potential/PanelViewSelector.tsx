import type { PrototypeType } from './prototypes/types';

export type PanelView = 'current' | PrototypeType | 'compare';

export const PANEL_VIEWS: ReadonlyArray<{ id: PanelView; label: string }> = [
    { id: 'current', label: '現状' },
    { id: 'field', label: 'Field' },
    { id: 'polar', label: 'Polar' },
    { id: 'compare', label: '比較' },
];

const DEFAULT_PANEL_VIEW: PanelView = 'current';
const PANEL_VIEW_STORAGE_KEY = 'nightview.panelView';

export function isPanelView(value: unknown): value is PanelView {
    return typeof value === 'string' && PANEL_VIEWS.some((view) => view.id === value);
}

export function readStoredPanelView(): PanelView {
    try {
        const storedView = window.localStorage.getItem(PANEL_VIEW_STORAGE_KEY);
        return isPanelView(storedView) ? storedView : DEFAULT_PANEL_VIEW;
    } catch {
        return DEFAULT_PANEL_VIEW;
    }
}

export function writeStoredPanelView(panelView: PanelView): PanelView {
    if (!isPanelView(panelView)) return DEFAULT_PANEL_VIEW;

    try {
        window.localStorage.setItem(PANEL_VIEW_STORAGE_KEY, panelView);
        return panelView;
    } catch {
        return DEFAULT_PANEL_VIEW;
    }
}

type PanelViewSelectorProps = {
    value: PanelView;
    onChange: (value: PanelView) => void;
};

export function PanelViewSelector({ value, onChange }: PanelViewSelectorProps) {
    return (
        <div className="grid grid-cols-4 gap-1 rounded-2xl bg-white/[0.04] p-1" role="group" aria-label="方向・距離表示の切り替え">
            {PANEL_VIEWS.map((view) => {
                const isSelected = value === view.id;

                return (
                    <button
                        key={view.id}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => onChange(view.id)}
                        className={`min-h-11 rounded-xl px-1 text-xs font-semibold transition-colors ${
                            isSelected
                                ? 'bg-violet-700 text-white shadow-lg shadow-violet-900/20'
                                : 'text-white/50 hover:bg-white/10 hover:text-white/90'
                        }`}
                    >
                        {view.label}
                    </button>
                );
            })}
        </div>
    );
}

import { useEffect } from 'react';
import { Layers, X } from '../ui/icons';

type MapModeId = 'standard' | 'potential' | 'aerial';

export type MapModesModalProps = {
    isOpen: boolean;
    onClose: () => void;
    potentialEnabled: boolean;
    setPotentialEnabled: (enabled: boolean) => void;
    aerialEnabled: boolean;
    setAerialEnabled: (enabled: boolean) => void;
    potentialOpacity: number;
    setPotentialOpacity: (opacity: number) => void;
};

const MODES: Array<{ id: MapModeId; label: string; className: string }> = [
    { id: 'standard', label: '標準', className: 'bg-[radial-gradient(circle_at_65%_35%,rgba(255,255,255,0.18),transparent_25%),linear-gradient(145deg,#2a3040,#11151f_60%,#080a10)]' },
    { id: 'potential', label: 'ポテンシャル', className: 'bg-[linear-gradient(145deg,#19152f_4%,#4f236c_38%,#bd4b46_68%,#ffa600_86%,#fff078)]' },
    { id: 'aerial', label: '航空写真', className: 'bg-[radial-gradient(ellipse_at_30%_20%,rgba(140,170,135,0.72),transparent_32%),linear-gradient(145deg,#384d43,#887c67_52%,#252d2c)]' },
];

function activeMode(potentialEnabled: boolean, aerialEnabled: boolean): MapModeId | null {
    const active = [potentialEnabled, aerialEnabled].filter(Boolean).length;
    if (active === 0) return 'standard';
    if (active !== 1) return null;
    if (potentialEnabled) return 'potential';
    return 'aerial';
}

function ModeThumbnail({ mode, selected, onSelect }: { mode: (typeof MODES)[number]; selected: boolean; onSelect: () => void }) {
    return (
        <button type="button" onClick={onSelect} aria-pressed={selected} className="min-w-0 text-left">
            <span
                className={`block aspect-[1.18] w-full rounded-2xl border shadow-inner transition-all ${mode.className} ${selected ? 'border-violet-200/90 ring-2 ring-violet-300/30' : 'border-white/10 hover:border-white/30'}`}
            />
            <span className={`mt-2 block truncate text-center text-[11px] ${selected ? 'font-semibold text-white' : 'text-white/55'}`}>{mode.label}</span>
        </button>
    );
}

function SwitchRow({ label, enabled, onChange }: { label: string; enabled: boolean; onChange: (enabled: boolean) => void }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={enabled}
            onClick={() => onChange(!enabled)}
            className="flex min-h-12 w-full items-center justify-between gap-3 border-b border-white/10 px-3 text-left last:border-b-0"
        >
            <span className="text-sm text-white/85">{label}</span>
            <span className={`relative h-7 w-12 shrink-0 rounded-full p-1 transition-colors ${enabled ? 'bg-violet-500/90' : 'bg-white/15'}`}>
                <span className={`block h-5 w-5 rounded-full bg-white shadow-md transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0'}`} />
            </span>
        </button>
    );
}

export function MapModesModal({
    isOpen,
    onClose,
    potentialEnabled,
    setPotentialEnabled,
    aerialEnabled,
    setAerialEnabled,
    potentialOpacity,
    setPotentialOpacity,
}: MapModesModalProps) {
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const selectedMode = activeMode(potentialEnabled, aerialEnabled);
    const selectMode = (mode: MapModeId) => {
        setPotentialEnabled(mode === 'potential');
        setAerialEnabled(mode === 'aerial');
    };

    return (
        <div className="fixed inset-0 z-[9000] grid place-items-center bg-black/60 px-3 py-6 backdrop-blur-sm" role="presentation" onMouseDown={onClose}>
            <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="map-modes-title"
                className="max-h-full w-full max-w-[540px] overflow-y-auto rounded-[28px] border border-white/15 bg-[#121218]/95 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.65)] backdrop-blur-2xl sm:p-5"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <header className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <Layers className="h-4 w-4 text-violet-200" aria-hidden="true" />
                        <h2 id="map-modes-title" className="text-base font-semibold tracking-wide text-white">表示モード</h2>
                    </div>
                    <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white/70 transition-colors hover:bg-white/15 hover:text-white" aria-label="表示モードを閉じる">
                        <X className="h-5 w-5" aria-hidden="true" />
                    </button>
                </header>

                <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
                    {MODES.map((mode) => (
                        <ModeThumbnail key={mode.id} mode={mode} selected={selectedMode === mode.id} onSelect={() => selectMode(mode.id)} />
                    ))}
                </div>

                <div className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035]">
                    <SwitchRow label="夜景ポテンシャル" enabled={potentialEnabled} onChange={setPotentialEnabled} />
                    <SwitchRow label="航空写真" enabled={aerialEnabled} onChange={setAerialEnabled} />
                </div>

                <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.035] px-3 py-3">
                    <div className="flex items-center justify-between gap-3 text-xs text-white/65">
                        <label htmlFor="map-modes-potential-opacity">ポテンシャルの不透明度</label>
                        <span className="tabular-nums text-white/45">{Math.round(potentialOpacity * 100)}%</span>
                    </div>
                    <input
                        id="map-modes-potential-opacity"
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={potentialOpacity}
                        onChange={(event) => setPotentialOpacity(Number(event.target.value))}
                        className="mt-3 h-1.5 w-full accent-violet-400"
                    />
                    <div className="mt-2 h-2 rounded-full bg-[linear-gradient(to_right,rgba(20,18,30,0.16),rgba(38,25,74,0.35),rgba(86,35,102,0.55),rgba(190,75,70,0.78),rgba(255,166,0,0.92),rgba(255,239,120,1))]" />
                    <div className="mt-1 flex justify-between text-[10px] text-white/35"><span>低い</span><span>高い</span></div>
                </div>

                <p className="mt-4 text-[10px] leading-relaxed text-white/40">© OpenStreetMap contributors · © CARTO · 国土地理院</p>
            </section>
        </div>
    );
}

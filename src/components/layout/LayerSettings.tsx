import { Layers } from 'lucide-react';

type LayerSettingsProps = {
    viirsEnabled: boolean;
    setViirsEnabled: (enabled: boolean) => void;
    potentialEnabled: boolean;
    setPotentialEnabled: (enabled: boolean) => void;
    aerialEnabled: boolean;
    setAerialEnabled: (enabled: boolean) => void;
};

export function LayerSettings({
    viirsEnabled,
    setViirsEnabled,
    potentialEnabled,
    setPotentialEnabled,
    aerialEnabled,
    setAerialEnabled,
}: LayerSettingsProps) {
    return (
        <div className="p-4 border-b border-white/5 bg-white/[0.02]">
            <div className="flex items-center gap-2 mb-3">
                <Layers className="w-4 h-4 text-white/50" />
                <span className="text-xs font-bold text-white/70 uppercase tracking-wider">表示レイヤー設定</span>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {/* VIIRS Layer */}
                <button
                    type="button"
                    onClick={() => setViirsEnabled(!viirsEnabled)}
                    aria-pressed={viirsEnabled}
                    className="group flex min-h-11 w-full items-center justify-between text-left"
                >
                    <span className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${viirsEnabled ? 'bg-violet-300' : 'bg-white/20'}`} />
                        <span className="text-sm text-white/90">夜間光 (VIIRS)</span>
                    </span>
                    <span
                        className={`rounded-full px-3 py-1 text-[10px] font-bold transition-all ${viirsEnabled
                                ? 'bg-violet-700 text-white'
                                : 'bg-white/10 text-white/50 group-hover:bg-white/20'
                            }`}
                    >
                        {viirsEnabled ? 'ON' : 'OFF'}
                    </span>
                </button>

                {/* Night View Potential Layer */}
                <button
                    type="button"
                    onClick={() => setPotentialEnabled(!potentialEnabled)}
                    aria-pressed={potentialEnabled}
                    className="group flex min-h-11 w-full items-center justify-between border-t border-white/5 pt-3 text-left"
                >
                    <span className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${potentialEnabled ? 'bg-emerald-400' : 'bg-white/20'}`} />
                        <span className="text-sm text-white/90">夜景ポテンシャル</span>
                    </span>
                    <span
                        className={`rounded-full px-3 py-1 text-[10px] font-bold transition-all ${potentialEnabled
                                ? 'bg-emerald-600 text-white'
                                : 'bg-white/10 text-white/50 group-hover:bg-white/20'
                            }`}
                    >
                        {potentialEnabled ? 'ON' : 'OFF'}
                    </span>
                </button>

                {/* Aerial Photo Layer */}
                <button
                    type="button"
                    onClick={() => setAerialEnabled(!aerialEnabled)}
                    aria-pressed={aerialEnabled}
                    className="group flex min-h-11 w-full items-center justify-between border-t border-white/5 pt-3 text-left"
                >
                    <span className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${aerialEnabled ? 'bg-blue-500' : 'bg-white/20'}`} />
                        <span className="text-sm text-white/90">航空写真 (国土地理院)</span>
                    </span>
                    <span
                        className={`rounded-full px-3 py-1 text-[10px] font-bold transition-all ${aerialEnabled
                                ? 'bg-blue-500 text-white'
                                : 'bg-white/10 text-white/50 group-hover:bg-white/20'
                            }`}
                    >
                        {aerialEnabled ? 'ON' : 'OFF'}
                    </span>
                </button>
            </div>
        </div>
    );
}

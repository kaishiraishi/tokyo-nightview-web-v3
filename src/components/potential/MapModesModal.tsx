import { useEffect } from 'react';
import { BookOpen, ChevronRight, Layers, X } from '../ui/icons';
import { closeButton, glassSurface } from '../../styles/ui';
import aerialThumbnail from '../../assets/map-modes/aerial.webp';
import potentialThumbnail from '../../assets/map-modes/potential.webp';
import standardThumbnail from '../../assets/map-modes/standard.webp';

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

// サムネイルはこのアプリの地図を各モードで撮影したもの（川崎市多摩区付近、z13）。地図の見た目を変えたら撮り直す
const MODES: Array<{ id: MapModeId; label: string; thumbnail: string }> = [
    { id: 'standard', label: '標準', thumbnail: standardThumbnail },
    { id: 'potential', label: 'ポテンシャル', thumbnail: potentialThumbnail },
    { id: 'aerial', label: '航空写真', thumbnail: aerialThumbnail },
];

// モードは 1 つだけ選ぶ（Apple マップの Map Modes と同じ）。航空写真を選ぶとポテンシャルは消える
function activeMode(potentialEnabled: boolean, aerialEnabled: boolean): MapModeId {
    if (aerialEnabled) return 'aerial';
    if (potentialEnabled) return 'potential';
    return 'standard';
}

// 値の算出方法はここには書かない（算出元は別リポジトリ・ローカルのデータで、このアプリは結果のタイルを読むだけ）。
// 読み方と限界だけを、アプリが実際にしていることに沿って説明する
function PotentialExplainer() {
    return (
        <details className="group mt-3 rounded-2xl border border-white/10 bg-white/[0.035]">
            <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-3 py-2.5 text-xs font-semibold text-white/85 [&::-webkit-details-marker]:hidden">
                <BookOpen className="h-4 w-4 text-violet-200" aria-hidden="true" />
                <span className="flex-1">夜景ポテンシャルとは</span>
                <ChevronRight className="h-4 w-4 text-white/45 transition-transform group-open:rotate-90" aria-hidden="true" />
            </summary>
            <div className="space-y-3 px-3 pb-3.5 text-[11px] leading-relaxed text-white/65">
                <p>東京都の各地点について、夜景を楽しめそうな度合いを色で表した地図です。夜景スポットを探すときの目安にします。</p>
                <div>
                    <h3 className="mb-1 font-semibold text-white/85">見かた</h3>
                    <ul className="list-disc space-y-1 pl-4">
                        <li>黄色・オレンジに近いほど高く、暗い紫ほど低い値です。</li>
                        <li>値が小さい場所は色を付けず、地図をそのまま見せています。</li>
                    </ul>
                </div>
                <div>
                    <h3 className="mb-1 font-semibold text-white/85">コンパスで探す</h3>
                    <p>左上のコンパスをタップすると、今いる場所（ピンを立てたときはその地点）の周りで、どの方向のどのくらい先が高いかを見られます。範囲は 50m から 10km まで切り替えられます。</p>
                </div>
                <div>
                    <h3 className="mb-1 font-semibold text-white/85">ご注意</h3>
                    <ul className="list-disc space-y-1 pl-4">
                        <li>実際の眺めを保証するものではありません。現地で安全と立入の可否を確認してください。</li>
                        <li>濃い色同士は一定以上で同じ色になり、高い場所どうしの優劣は比べられません。</li>
                        <li>5km 以上の遠方は、粗い情報から読み取っています。</li>
                    </ul>
                </div>
            </div>
        </details>
    );
}

function ModeThumbnail({ mode, selected, onSelect }: { mode: (typeof MODES)[number]; selected: boolean; onSelect: () => void }) {
    return (
        <button type="button" onClick={onSelect} aria-pressed={selected} className="group min-w-0 text-left">
            <span
                className={`block overflow-hidden rounded-[20px] p-[3px] transition-all ${selected ? 'bg-violet-300/90' : 'bg-transparent'}`}
            >
                <img
                    src={mode.thumbnail}
                    alt=""
                    className={`block aspect-square w-full rounded-[17px] border object-cover transition-opacity ${selected ? 'border-black/40' : 'border-white/15 opacity-85 group-hover:opacity-100'}`}
                    draggable={false}
                />
            </span>
            <span className={`mt-2 block truncate text-center text-xs ${selected ? 'font-semibold text-white' : 'text-white/60'}`}>{mode.label}</span>
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
                className={`max-h-full w-full max-w-[540px] overflow-y-auto rounded-[28px] ${glassSurface} p-4 sm:p-5`}
                onMouseDown={(event) => event.stopPropagation()}
            >
                <header className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <Layers className="h-4 w-4 text-violet-200" aria-hidden="true" />
                        <h2 id="map-modes-title" className="text-base font-semibold tracking-wide text-white">表示モード</h2>
                    </div>
                    <button type="button" onClick={onClose} className={closeButton} aria-label="表示モードを閉じる">
                        <X className="h-5 w-5" aria-hidden="true" />
                    </button>
                </header>

                <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
                    {MODES.map((mode) => (
                        <ModeThumbnail key={mode.id} mode={mode} selected={selectedMode === mode.id} onSelect={() => selectMode(mode.id)} />
                    ))}
                </div>

                <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.035] px-3 py-3">
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

                <PotentialExplainer />

                <p className="mt-4 text-[10px] leading-relaxed text-white/40">© OpenStreetMap contributors · © CARTO · 国土地理院</p>
            </section>
        </div>
    );
}

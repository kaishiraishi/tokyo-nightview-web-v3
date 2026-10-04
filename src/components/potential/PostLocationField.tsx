import { LocateFixed, Pin } from '../ui/icons';

export type LocationMode = 'current' | 'pin';

type PostLocationFieldProps = {
    mode: LocationMode;
    onModeChange: (mode: LocationMode) => void;
    currentLocation: { lat: number; lng: number } | null;
    pinLocation: { lat: number; lng: number } | null;
    onReselectPin: () => void;
};

const OPTIONS: Array<{ id: LocationMode; label: string; icon: typeof Pin }> = [
    { id: 'current', label: '今いる場所', icon: LocateFixed },
    { id: 'pin', label: '地図で選ぶ', icon: Pin },
];

function formatPoint(point: { lat: number; lng: number }) {
    return `${point.lat.toFixed(4)}, ${point.lng.toFixed(4)}`;
}

// 投稿フォームの「場所」。今いる場所か、地図をタップして選んだ場所かを 2 択（表示モード画面の「表示するスコア」と同じ形）で選び、
// その下に、どこに投稿されるか（または、まだ決まっていない理由）を 1 行で出す
export function PostLocationField({ mode, onModeChange, currentLocation, pinLocation, onReselectPin }: PostLocationFieldProps) {
    return (
        <div>
            <span id="post-location-label" className="mb-2 block text-xs font-semibold text-white/80">場所</span>
            <div role="group" aria-labelledby="post-location-label" className="flex rounded-full border border-white/10 bg-black/30 p-0.5">
                {OPTIONS.map(({ id, label, icon: Icon }) => {
                    const selected = id === mode;
                    return (
                        <button
                            key={id}
                            type="button"
                            aria-pressed={selected}
                            onClick={() => onModeChange(id)}
                            className={`flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-full text-xs transition-colors ${selected ? 'bg-violet-500/85 font-semibold text-white' : 'text-white/60 hover:text-white/85'}`}
                        >
                            <Icon className="h-4 w-4" aria-hidden="true" />
                            {label}
                        </button>
                    );
                })}
            </div>
            <div className="mt-2 flex min-h-6 items-center justify-between gap-2 text-[11px] leading-relaxed">
                {mode === 'current' ? (
                    currentLocation ? (
                        <span className="text-white/50">今いる場所に投稿します</span>
                    ) : (
                        <span className="text-white/50">現在地を取得しています…（位置情報の許可が必要です）</span>
                    )
                ) : pinLocation ? (
                    <>
                        <span className="tabular-nums text-white/50">選んだ地点 {formatPoint(pinLocation)}</span>
                        <button type="button" onClick={onReselectPin} className="min-h-11 shrink-0 px-1 font-semibold text-violet-200 hover:text-violet-100">
                            選び直す
                        </button>
                    </>
                ) : (
                    <span className="text-white/50">地図をタップして、投稿する場所を選んでください</span>
                )}
            </div>
        </div>
    );
}

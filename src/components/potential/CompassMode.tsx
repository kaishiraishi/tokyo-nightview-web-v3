import { X } from '../ui/icons';
import type { DeviceHeadingStatus } from '../../hooks/useDeviceHeading';
import { compassName, formatDistance } from './prototypes/canvas';
import { PrototypeView } from './prototypes/PrototypeViews';
import { POTENTIAL_RANGES, type PotentialRange, type PotentialViewModel } from './prototypes/types';

export type CompassModeProps = {
    data: PotentialViewModel | null;
    isLoading: boolean;
    range: PotentialRange;
    onRangeChange: (range: PotentialRange) => void;
    status: DeviceHeadingStatus;
    heading: number | null;
    lowAccuracy: boolean;
    error: string | null;
    isSupported: boolean;
    onClose: () => void;
};

function statusMessage(status: DeviceHeadingStatus, isSupported: boolean, error: string | null) {
    if (!isSupported || status === 'unsupported') return error ?? 'この端末ではコンパスを利用できません';
    if (status === 'requesting') return '方位センサーの許可を確認中…';
    if (status === 'denied') return error ?? 'コンパスの利用が許可されていません';
    if (status === 'error') return error ?? 'コンパスを開始できませんでした';
    if (status === 'off') return 'コンパスは停止中です';
    return '端末の向きに連動中';
}

function guideDistance(distance: number) {
    if (distance >= 1000) return `${(distance / 1000).toFixed(1).replace(/\.0$/, '')}km`;
    return `${Math.round(distance)}m`;
}

function strongestDirection(data: PotentialViewModel | null) {
    if (!data) return null;
    return data.directionProfile.reduce<PotentialViewModel['directionProfile'][number] | null>(
        (strongest, value) => (strongest === null || value.strength > strongest.strength ? value : strongest),
        null,
    );
}

export function CompassMode({
    data,
    isLoading,
    range,
    onRangeChange,
    status,
    heading,
    lowAccuracy,
    error,
    isSupported,
    onClose,
}: CompassModeProps) {
    const dialRotation = heading ?? 0;
    const strongest = strongestDirection(data);
    const hasUsefulDirection = strongest !== null && strongest.strength > 0.015;
    const message = error && !data && !isLoading ? error : statusMessage(status, isSupported, error);

    return (
        <div className="fixed inset-0 z-[8500] flex flex-col overflow-hidden bg-black/65 text-white backdrop-blur-[2px]">
            <header className="relative z-10 flex shrink-0 items-start justify-between px-4 pt-[calc(16px+env(safe-area-inset-top))] sm:px-6">
                <div>
                    <p className="text-[11px] font-semibold tracking-[0.2em] text-white/55">NIGHTVIEW</p>
                    <h2 className="mt-1 text-base font-semibold">コンパスモード</h2>
                    <p className="mt-1 max-w-[250px] text-[11px] leading-relaxed text-white/50">{message}</p>
                </div>
                <button type="button" onClick={onClose} className="grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-black/45 text-white/75 backdrop-blur-md transition-colors hover:bg-white/10 hover:text-white" aria-label="コンパスモードを閉じる">
                    <X className="h-5 w-5" aria-hidden="true" />
                </button>
            </header>

            <div className="pointer-events-none absolute left-1/2 top-[calc(76px+env(safe-area-inset-top))] z-10 -translate-x-1/2 text-center">
                <div className="text-lg leading-none text-white/90">▲</div>
                <div className="mt-1 whitespace-nowrap text-3xl font-light tabular-nums tracking-tight">{heading === null ? '—°' : `${Math.round(heading)}°`}</div>
                <div className="text-[11px] font-medium tracking-[0.18em] text-white/55">{heading === null ? '方位待機中' : compassName(heading)}</div>
            </div>

            <main className="relative flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto px-4 pb-[calc(110px+env(safe-area-inset-bottom))] pt-[calc(90px+env(safe-area-inset-top))]">
                <div className="relative shrink-0" style={{ width: 'min(85vmin, calc(100vw - 32px), 620px)', aspectRatio: '1 / 1' }}>
                    <div className="absolute inset-[-5%] rounded-full border border-white/15 bg-black/25 shadow-[0_0_80px_rgba(0,0,0,0.65)]" />
                    <div className="absolute inset-[-3%] rounded-full border border-white/10" />
                    <div
                        className="pointer-events-none absolute inset-[-1%] rounded-full opacity-80"
                        style={{
                            background: 'repeating-conic-gradient(rgba(255,255,255,0.3) 0deg 0.7deg, transparent 0.7deg 15deg)',
                            transform: `rotate(${-dialRotation}deg)`,
                            maskImage: 'radial-gradient(transparent 0 92%, black 92% 100%)',
                            WebkitMaskImage: 'radial-gradient(transparent 0 92%, black 92% 100%)',
                        }}
                    />
                    <div className="pointer-events-none absolute inset-0" style={{ transform: `rotate(${-dialRotation}deg)` }}>
                        <span className="absolute left-1/2 top-[-1%] -translate-x-1/2 text-sm font-bold tracking-widest text-red-400">N</span>
                        <span className="absolute right-[-1%] top-1/2 -translate-y-1/2 text-sm font-semibold tracking-widest text-white/65">E</span>
                        <span className="absolute bottom-[-1%] left-1/2 -translate-x-1/2 text-sm font-semibold tracking-widest text-white/65">S</span>
                        <span className="absolute left-[-1%] top-1/2 -translate-y-1/2 text-sm font-semibold tracking-widest text-white/65">W</span>
                    </div>

                    <div className="absolute inset-[7%] overflow-hidden rounded-full border border-white/15 bg-[#080b10]/90 shadow-[inset_0_0_40px_rgba(0,0,0,0.55)]">
                        {data ? (
                            <PrototypeView type="polar" data={data} rotation={dialRotation} showCompassLabels={false} />
                        ) : (
                            <div className="grid h-full place-items-center px-8 text-center text-xs leading-relaxed text-white/45">
                                {isLoading ? '夜景ポテンシャルを読み込んでいます…' : '選択地点または現在地のデータがありません'}
                            </div>
                        )}
                    </div>

                    {hasUsefulDirection && strongest && (
                        <div className="pointer-events-none absolute inset-0" style={{ transform: `rotate(${strongest.bearing - dialRotation}deg)` }}>
                            <div className="absolute left-1/2 top-[8%] h-4 w-4 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-sm border border-violet-100/90 bg-violet-400/90 shadow-[0_0_18px_rgba(167,139,250,0.9)]" />
                        </div>
                    )}
                </div>

                <p className="mt-5 min-h-5 text-center text-sm text-white/75">
                    {hasUsefulDirection && strongest
                        ? `この方向（${compassName(strongest.bearing)}）に ${guideDistance(strongest.distance)}先が明るい`
                        : data
                            ? 'この範囲に目立った方向の手がかりはありません'
                            : '夜景ポテンシャルを表示できません'}
                </p>

                {lowAccuracy && status === 'active' && <p className="mt-2 text-center text-[11px] text-amber-200/85">精度が低い状態です。端末を8の字に振って補正してください</p>}
            </main>

            <div className="absolute bottom-0 left-0 right-0 z-10 px-4 pb-[calc(16px+env(safe-area-inset-bottom))] sm:px-6">
                <div className="mx-auto max-w-[620px] rounded-2xl border border-white/12 bg-black/60 p-3 shadow-2xl backdrop-blur-xl">
                    <div className="mb-2 flex items-center justify-between text-[11px] text-white/45"><span>Range</span><span>{formatDistance(range)}以内</span></div>
                    <div className="flex rounded-xl bg-white/5 p-1 ring-1 ring-white/10" role="group" aria-label="コンパス表示距離">
                        {POTENTIAL_RANGES.map((value) => (
                            <button key={value} type="button" aria-pressed={range === value} onClick={() => onRangeChange(value)} className={`min-h-10 flex-1 rounded-lg px-1 text-xs font-medium transition-colors ${range === value ? 'bg-violet-700 text-white' : 'text-white/50 hover:text-white/80'}`}>
                                {value >= 1000 ? '1km' : value}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

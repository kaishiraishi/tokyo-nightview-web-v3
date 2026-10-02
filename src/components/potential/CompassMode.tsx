import { useMemo } from 'react';
import { X } from '../ui/icons';
import type { DeviceHeadingStatus } from '../../hooks/useDeviceHeading';
import { CANVAS_SIZE, formatDistance, POLAR_INNER_RADIUS, POLAR_OUTER_RADIUS } from './prototypes/canvas';
import { SAMPLE_BEARINGS } from '../../lib/potentialSampler';
import { potentialColorCss } from './prototypes/colorScale';
import { smoothProfile } from './prototypes/interpolation';
import { PolarHeatmapView } from './prototypes/PolarHeatmap';
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
    // 向きセンサーを開始する（スマホを横向きにして自動で開いたときは、タップによる開始がないため）
    onStartSensor: () => void;
    onClose: () => void;
};

// 文字盤の大きさ: main（container）の短辺に対する比率と、文字盤の中の Polar の円の比率（inset 7%）。
// 目盛り（ベゼル）は文字盤の外へ 12% ずつはみ出すので、全体（1.24 倍）が短辺に収まる値にする
const DIAL_SCALE = 0.78;
const DISK_SCALE = 0.86;
const DIAL_SIZE = `calc(min(100cqw, 100cqh) * ${DIAL_SCALE})`;
// 縮尺バーの長さ = 文字盤上で中心から range までの長さ（Polar の INNER → OUTER）
const SCALE_BAR_WIDTH = `calc(min(100cqw, 100cqh) * ${DIAL_SCALE * DISK_SCALE * ((POLAR_OUTER_RADIUS - POLAR_INNER_RADIUS) / CANVAS_SIZE)})`;

const TICKS = Array.from({ length: 72 }, (_, index) => index * 5);

function statusMessage(status: DeviceHeadingStatus, isSupported: boolean, error: string | null) {
    if (!isSupported || status === 'unsupported') return error ?? 'この端末ではコンパスを利用できません';
    if (status === 'requesting') return '方位センサーの許可を確認中…';
    if (status === 'denied') return error ?? 'コンパスの利用が許可されていません';
    if (status === 'error') return error ?? 'コンパスを開始できませんでした';
    if (status === 'off') return 'コンパスは停止中です';
    return '端末の向きに連動中';
}

function strongestDirection(data: PotentialViewModel | null) {
    if (!data) return null;
    return data.directionProfile.reduce<PotentialViewModel['directionProfile'][number] | null>(
        (strongest, value) => (strongest === null || value.strength > strongest.strength ? value : strongest),
        null,
    );
}

// 目盛り用の方向ごとの強さ。directionProfile は中心（距離 0）の値も全方向に含むため、
// 中心が明るい地点では全方向が同じ値になって差が消える。目盛りでは中心を除いた最大値を使う
function outerDirectionStrengths(data: PotentialViewModel) {
    return SAMPLE_BEARINGS.map((bearing) => data.samples
        .filter((sample) => sample.bearing === bearing && sample.distance > 0 && sample.distance <= data.range)
        .reduce((max, sample) => Math.max(max, sample.visualStrength), 0));
}

// ベゼルの座標（SVG 単位、半径 100 = 文字盤幅の 0.62 倍）: Polar の円 ≈ 69、方位文字 77、目盛りは 84 から外へ伸びる
const LABEL_RADIUS = 77;
const TICK_INNER_RADIUS = 84;
const TICK_MAX_GROWTH = 9;
const MIN_STRENGTH_SPREAD = 0.03;

// 目盛り自体を方向ごとの強さの棒グラフにする。全方向が同程度に明るい場所でも差が見えるよう、
// 最小〜最大で正規化した相対値で長さと濃さを決め、上位の方向だけをポテンシャルの色で伸ばす。
// 方向による差がほとんどない（最大 − 最小 が小さい）場合は、どれも強調しない。
// 5° ごとに細、30° ごとに長、東西南北を最長に（北は常に赤）。端末方位に合わせて回す
function CompassBezel({ rotation, profile }: { rotation: number; profile: number[] | null }) {
    const maxStrength = profile ? Math.max(...profile) : 0;
    const minStrength = profile ? Math.min(...profile) : 0;
    const spread = maxStrength - minStrength;
    return (
        <svg viewBox="-100 -100 200 200" className="pointer-events-none absolute inset-[-12%] h-[124%] w-[124%]" style={{ transform: `rotate(${-rotation}deg)` }} aria-hidden="true">
            {TICKS.map((bearing) => {
                const isCardinal = bearing % 90 === 0;
                const isMajor = bearing % 30 === 0;
                const strength = Math.max(0, Math.min(1, profile?.[bearing] ?? 0));
                const relative = spread > MIN_STRENGTH_SPREAD ? (strength - minStrength) / spread : 0;
                const emphasis = Math.max(0, (relative - 0.5) / 0.5) ** 1.5;
                const hasSignal = emphasis > 0.05;
                const length = (isCardinal ? 7 : isMajor ? 5 : 3) + emphasis * TICK_MAX_GROWTH;
                const stroke = bearing === 0
                    ? 'rgba(248,113,113,0.95)'
                    : hasSignal
                        ? potentialColorCss(strength, 0.45 + emphasis * 0.55)
                        : isMajor ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.3)';
                return (
                    <line
                        key={bearing}
                        x1="0" y1={-TICK_INNER_RADIUS} x2="0" y2={-(TICK_INNER_RADIUS + length)}
                        stroke={stroke}
                        strokeWidth={isMajor ? 1.6 : hasSignal ? 1.4 : 0.8}
                        strokeLinecap="round"
                        transform={`rotate(${bearing})`}
                    />
                );
            })}
            {(['N', 'E', 'S', 'W'] as const).map((label, index) => {
                const radians = (index * Math.PI) / 2;
                const x = Math.sin(radians) * LABEL_RADIUS;
                const y = -Math.cos(radians) * LABEL_RADIUS;
                return (
                    <text
                        key={label}
                        x={x} y={y}
                        // SVG 全体を -rotation 回しているので、文字だけ +rotation 戻して常に正立させる
                        transform={`rotate(${rotation} ${x} ${y})`}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize="7"
                        fontWeight={label === 'N' ? 700 : 600}
                        fill={label === 'N' ? 'rgba(248,113,113,0.95)' : 'rgba(255,255,255,0.6)'}
                    >
                        {label}
                    </text>
                );
            })}
        </svg>
    );
}

// 端末が向いている方向（画面の上）を示す視野の扇形。文字盤は回るが、これは固定
function ForwardCone() {
    return (
        <svg viewBox="-100 -100 200 200" className="pointer-events-none absolute inset-[7%] h-[86%] w-[86%]" aria-hidden="true">
            <defs>
                <radialGradient id="compass-forward-cone" cx="0" cy="0" r="100" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stopColor="rgba(255,255,255,0)" />
                    <stop offset="1" stopColor="rgba(255,255,255,0.16)" />
                </radialGradient>
            </defs>
            <path d="M0 0 L-42.3 -90.6 A100 100 0 0 1 42.3 -90.6 Z" fill="url(#compass-forward-cone)" />
            <path d="M-42.3 -90.6 A100 100 0 0 1 42.3 -90.6" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    );
}

// カーナビ風の縮尺表示: 左下に実寸の縮尺バー、右下に ＋（詳細 = 範囲を狭く）／−（広域 = 範囲を広く）
function NavScale({ range, onRangeChange }: { range: PotentialRange; onRangeChange: (range: PotentialRange) => void }) {
    const index = POTENTIAL_RANGES.indexOf(range);
    const narrower = index > 0 ? POTENTIAL_RANGES[index - 1] : null;
    const wider = index >= 0 && index < POTENTIAL_RANGES.length - 1 ? POTENTIAL_RANGES[index + 1] : null;
    const buttonClass = 'grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-black/50 text-lg leading-none text-white/85 transition-colors hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-black/50';

    return (
        <>
            <div className="pointer-events-none absolute bottom-2 left-4 flex flex-col items-start gap-0.5" aria-live="polite">
                <span className="text-[11px] font-semibold tabular-nums text-white/85">{formatDistance(range)}</span>
                <span className="block h-1.5 border-x-2 border-b-2 border-white/80" style={{ width: SCALE_BAR_WIDTH }} aria-hidden="true" />
                <span className="sr-only">表示範囲 {formatDistance(range)}</span>
            </div>
            <div className="absolute bottom-2 right-4 flex flex-col gap-1.5">
                <button type="button" className={buttonClass} disabled={narrower === null} onClick={() => narrower !== null && onRangeChange(narrower)} aria-label="範囲を狭める（詳細）">＋</button>
                <button type="button" className={buttonClass} disabled={wider === null} onClick={() => wider !== null && onRangeChange(wider)} aria-label="範囲を広げる（広域）">−</button>
            </div>
        </>
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
    onStartSensor,
    onClose,
}: CompassModeProps) {
    const dialRotation = heading ?? 0;
    const strongest = strongestDirection(data);
    const hasUsefulDirection = strongest !== null && strongest.strength > 0.015;
    const profile = useMemo(() => (data ? smoothProfile(outerDirectionStrengths(data)) : null), [data]);
    const message = lowAccuracy && status === 'active'
        ? '精度が低い状態です。端末を8の字に振って補正してください'
        : error && !data && !isLoading ? error : statusMessage(status, isSupported, error);

    return (
        // 分割表示の片側（縦長は上半分、横長は左半分）。もう片側は地図（PotentialMapView 側で配置）
        <div className="flex h-full flex-col overflow-hidden bg-[#06080c] text-white">
            <header className="flex shrink-0 items-center justify-between gap-3 pb-1 pl-[max(1rem,env(safe-area-inset-left))] pr-4 pt-[calc(10px+env(safe-area-inset-top))]">
                <div className="min-w-0">
                    <h2 className="text-sm font-semibold">コンパスモード</h2>
                    {status === 'off' && isSupported ? (
                        <button type="button" onClick={onStartSensor} className="mt-0.5 rounded-full border border-violet-300/40 bg-violet-700/70 px-3 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-violet-600">
                            向きセンサーを開始
                        </button>
                    ) : (
                        <p className={`truncate text-[11px] ${lowAccuracy && status === 'active' ? 'text-amber-200/85' : 'text-white/50'}`}>{message}</p>
                    )}
                </div>
                <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-black/45 text-white/75 transition-colors hover:bg-white/10 hover:text-white" aria-label="コンパスモードを閉じる">
                    <X className="h-5 w-5" aria-hidden="true" />
                </button>
            </header>

            {/* 文字盤は残りの高さと幅の小さい方に合わせる（container query 単位） */}
            <main className="relative grid min-h-0 flex-1 place-items-center px-4 pb-2" style={{ containerType: 'size' }}>
                <div className="relative" style={{ width: DIAL_SIZE, aspectRatio: '1 / 1' }}>
                    <CompassBezel rotation={dialRotation} profile={profile} />

                    <div className="absolute inset-[7%] overflow-hidden rounded-full border border-white/10 bg-[#080b10]/90 shadow-[inset_0_0_40px_rgba(0,0,0,0.55)]">
                        {data ? (
                            <PolarHeatmapView data={data} rotation={dialRotation} showCompassLabels={false} showDistanceLabels={false} />
                        ) : (
                            <div className="grid h-full place-items-center px-6 text-center text-[11px] leading-relaxed text-white/45">
                                {isLoading ? '夜景ポテンシャルを読み込んでいます…' : '選択地点または現在地のデータがありません'}
                            </div>
                        )}
                    </div>

                    <ForwardCone />

                    {hasUsefulDirection && strongest && (
                        <div className="pointer-events-none absolute inset-0" style={{ transform: `rotate(${strongest.bearing - dialRotation}deg)` }}>
                            <div className="absolute left-1/2 top-[12%] h-3 w-3 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-sm border border-violet-100/90 bg-violet-400/90 shadow-[0_0_18px_rgba(167,139,250,0.9)]" />
                        </div>
                    )}
                </div>

                <NavScale range={range} onRangeChange={onRangeChange} />
            </main>
        </div>
    );
}

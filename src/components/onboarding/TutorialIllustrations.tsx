import type { ReactNode } from 'react';
import { Compass, Heart, Lock, MapFilled, MapIcon, MapPin, Navigation, Plus, Sparkle, User } from '../ui/icons';
import { POTENTIAL_COLOR_RAMP } from '../../lib/potentialSampler';
import { glassControl } from '../../styles/ui';
import standardThumbnail from '../../assets/map-modes/standard.webp';
import potentialThumbnail from '../../assets/map-modes/potential.webp';
import aerialThumbnail from '../../assets/map-modes/aerial.webp';

// チュートリアルの右に出す、説明している部品の拡大図。見た目は主画面の部品（MapControlStack・MapModesModal・
// CompassMode・FloatingSearchBar・mapPin・MapModeToggle・PostComposer）に合わせた静的な絵で、押しても何も起きない

const rgb = ([r, g, b]: number[]) => `rgb(${r}, ${g}, ${b})`;
// 色ランプの最初の 2 段はほぼ透明で凡例では見えないので、色が付く段から使う（色はタイル・サンプラーと同じ定義を読む）
const LEGEND_COLORS = POTENTIAL_COLOR_RAMP.slice(2).map((stop) => rgb(stop.color));
const [MID_COLOR, HIGH_COLOR, TOP_COLOR] = POTENTIAL_COLOR_RAMP.slice(3).map((stop) => rgb(stop.color));

function MapFrame({ children, imageOpacity = 'opacity-50' }: { children?: ReactNode; imageOpacity?: string }) {
    return (
        <div className="relative h-[116px] w-full overflow-hidden rounded-2xl border border-white/10 bg-black">
            <img src={potentialThumbnail} alt="" className={`absolute inset-0 h-full w-full object-cover ${imageOpacity}`} />
            {children}
        </div>
    );
}

export function LegendIllustration() {
    return (
        <div className="w-full space-y-3">
            <MapFrame imageOpacity="opacity-100" />
            <div>
                <div className="h-2.5 w-full rounded-full" style={{ background: `linear-gradient(90deg, ${LEGEND_COLORS.join(', ')})` }} />
                <div className="mt-1.5 flex justify-between text-[11px] text-white/50">
                    <span>低い</span>
                    <span className="font-semibold text-amber-200">高い</span>
                </div>
            </div>
        </div>
    );
}

const MODES = [
    { label: '標準', src: standardThumbnail, selected: false },
    { label: 'ポテンシャル', src: potentialThumbnail, selected: true },
    { label: '航空写真', src: aerialThumbnail, selected: false },
];

export function ModesIllustration() {
    return (
        <div className="w-full space-y-3">
            <div className="flex items-center gap-2 text-[12px] font-semibold text-white/90">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-violet-700/80">
                    <MapFilled size={16} />
                </span>
                表示モード
            </div>
            <div className="grid grid-cols-3 gap-1.5">
                {MODES.map((mode) => (
                    <div key={mode.label} className="min-w-0 text-center">
                        <img
                            src={mode.src}
                            alt=""
                            className={`aspect-square w-full rounded-xl object-cover ${mode.selected ? 'ring-2 ring-violet-400' : 'opacity-70'}`}
                        />
                        <div className={`mt-1 whitespace-nowrap text-[9px] ${mode.selected ? 'font-semibold text-white' : 'text-white/50'}`}>{mode.label}</div>
                    </div>
                ))}
            </div>
            <div className="flex rounded-full bg-white/[0.06] p-0.5 text-[11px]">
                <span className="flex-1 rounded-full bg-violet-700 py-1.5 text-center font-semibold text-white">高のみ</span>
                <span className="flex-1 py-1.5 text-center text-white/50">高・中・低</span>
            </div>
        </div>
    );
}

// 方向ごとの強さ（見本）。北東と南南西に高い場所がある想定
const SAMPLE_STRENGTHS = [0.3, 0.45, 0.7, 0.95, 0.8, 0.5, 0.25, 0.15, 0.1, 0.2, 0.3, 0.5, 0.75, 0.85, 0.6, 0.35, 0.2, 0.1, 0.1, 0.15, 0.2, 0.15, 0.2, 0.25];
const DIAL = { center: 80, ring: 44, barStart: 48, barMax: 26 };

function barColor(strength: number) {
    if (strength >= 0.9) return TOP_COLOR;
    if (strength >= 0.7) return HIGH_COLOR;
    if (strength >= 0.5) return MID_COLOR;
    return 'rgba(255, 255, 255, 0.28)';
}

function polar(bearing: number, radius: number) {
    const radians = ((bearing - 90) * Math.PI) / 180;
    return { x: DIAL.center + radius * Math.cos(radians), y: DIAL.center + radius * Math.sin(radians) };
}

export function CompassIllustration() {
    const target = polar(45, DIAL.ring * 0.72);
    const fanLeft = polar(-28, DIAL.ring);
    const fanRight = polar(28, DIAL.ring);
    return (
        <div className="flex w-full flex-col items-center gap-2">
            <svg viewBox="0 0 160 160" className="h-[150px] w-[150px]">
                {/* 向いている方向（端末の上）の扇形 */}
                <path
                    d={`M ${DIAL.center} ${DIAL.center} L ${fanLeft.x} ${fanLeft.y} A ${DIAL.ring} ${DIAL.ring} 0 0 1 ${fanRight.x} ${fanRight.y} Z`}
                    fill="rgba(255, 255, 255, 0.1)"
                />
                <circle cx={DIAL.center} cy={DIAL.center} r={DIAL.ring} fill="none" stroke="rgba(255, 255, 255, 0.35)" strokeWidth="1" />
                {SAMPLE_STRENGTHS.map((strength, index) => {
                    const bearing = index * 15;
                    const start = polar(bearing, DIAL.barStart);
                    const end = polar(bearing, DIAL.barStart + 3 + strength * DIAL.barMax);
                    return (
                        <line key={bearing} x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke={barColor(strength)} strokeWidth="3.5" strokeLinecap="round" />
                    );
                })}
                {[
                    { label: 'N', bearing: 0, fill: '#ef4444' },
                    { label: 'E', bearing: 90, fill: 'rgba(255,255,255,0.8)' },
                    { label: 'S', bearing: 180, fill: 'rgba(255,255,255,0.8)' },
                    { label: 'W', bearing: 270, fill: 'rgba(255,255,255,0.8)' },
                ].map(({ label, bearing, fill }) => {
                    const point = polar(bearing, DIAL.ring - 11);
                    return (
                        <text key={label} x={point.x} y={point.y} fill={fill} fontSize="11" fontWeight="700" textAnchor="middle" dominantBaseline="central">
                            {label}
                        </text>
                    );
                })}
                {/* 文字盤を押した地点 */}
                <line x1={DIAL.center} y1={DIAL.center} x2={target.x} y2={target.y} stroke="#c4b5fd" strokeWidth="1.5" strokeDasharray="3 3" />
                <circle cx={target.x} cy={target.y} r="4.5" fill="#a78bfa" stroke="white" strokeWidth="1.5" />
                <circle cx={DIAL.center} cy={DIAL.center} r="3" fill="white" />
            </svg>
            <div className="flex w-full items-center justify-between gap-2">
                <div className="flex flex-col items-start text-[11px] font-semibold text-white/80">
                    1 km
                    <span className="mt-0.5 h-1.5 w-12 border-x-2 border-b-2 border-white/70" />
                </div>
                <div className={`flex items-center rounded-full ${glassControl}`}>
                    <span className="grid h-8 w-8 place-items-center text-lg leading-none text-white/90">−</span>
                    <span className="h-4 w-px bg-white/15" />
                    <span className="grid h-8 w-8 place-items-center text-white/90">
                        <Plus size={16} />
                    </span>
                </div>
            </div>
        </div>
    );
}

export function SearchIllustration() {
    return (
        <div className="w-full space-y-2.5">
            <div className={`flex h-10 items-center gap-2 rounded-full px-1.5 ${glassControl}`}>
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/10">
                    <User size={16} className="text-white/80" />
                </span>
                <span className="truncate text-[13px] text-white/90">東京タワー</span>
                <span className="h-4 w-px shrink-0 bg-violet-300" />
            </div>
            <MapFrame>
                <div className="absolute left-1/2 top-2 -translate-x-1/2 whitespace-nowrap rounded-xl border border-white/15 bg-[#05070b]/90 px-2.5 py-1.5 text-[11px] shadow-lg">
                    <div className="font-semibold text-white">東京タワー</div>
                    <div className="mt-0.5 flex items-center gap-1 text-violet-200">
                        <Heart size={12} />
                        お気に入りに追加
                    </div>
                </div>
                <div className="map-pin map-pin--white absolute bottom-3 left-1/2 -translate-x-1/2">
                    <span className="map-pin__head" />
                    <span className="map-pin__stem" />
                    <span className="map-pin__base" />
                </div>
            </MapFrame>
        </div>
    );
}

export function PostIllustration() {
    return (
        <div className="w-full space-y-2.5">
            <div className="flex items-center justify-between gap-2">
                <div className={`flex items-center rounded-full p-0.5 ${glassControl}`}>
                    <span className="grid h-9 w-9 place-items-center rounded-full text-white/70">
                        <MapIcon size={18} />
                    </span>
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-violet-700 text-white">
                        <Sparkle size={18} />
                    </span>
                </div>
                <span className={`grid h-10 w-10 place-items-center rounded-full ring-1 ring-violet-300/70 ${glassControl}`}>
                    <Plus size={20} className="text-white" />
                </span>
            </div>
            <MapFrame imageOpacity="opacity-40">
                <span className="absolute left-1/2 top-[46%] h-[78px] w-[78px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dashed border-violet-300/80 bg-violet-400/10" />
                <span className="absolute left-1/2 top-[46%] grid h-8 w-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-[#05070b]/90">
                    <Lock size={16} className="text-violet-200" />
                </span>
                <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#05070b]/90 px-2 py-0.5 text-[10px] text-white/80">
                    八王子市 付近 · 約 2.3 km
                </span>
            </MapFrame>
        </div>
    );
}

export function LocateIllustration() {
    return (
        <div className="w-full space-y-2.5">
            <MapFrame imageOpacity="opacity-40">
                {/* 現在地の印（UserLocationMarker と同じ色）と、向いている方向の扇形 */}
                <span className="absolute left-1/2 top-1/2 h-0 w-0">
                    <span className="absolute -left-[60px] -top-[60px] h-[60px] w-[60px] origin-bottom-right rotate-45 rounded-tl-full bg-gradient-to-tl from-violet-200/45 to-transparent" />
                    <span className="absolute -left-7 -top-7 h-14 w-14 rounded-full border border-violet-200/50 bg-violet-300/15" />
                    <span className="absolute -left-2 -top-2 h-4 w-4 rounded-full border-[3px] border-white bg-violet-300" />
                </span>
                <span className={`absolute bottom-2 right-2 grid h-10 w-10 place-items-center rounded-full ${glassControl}`}>
                    <Navigation size={18} className="text-white/90" />
                    <span className="tutorial-ping pointer-events-none absolute -inset-[3px] rounded-full border-2 border-violet-300" />
                </span>
            </MapFrame>
            <div className="flex flex-col gap-1.5 text-[11px] text-white/80">
                <span className="flex items-center gap-1.5 rounded-full bg-white/[0.06] px-2.5 py-1.5">
                    <MapPin size={14} className="shrink-0 text-violet-200" />
                    位置情報を「許可」
                </span>
                <span className="flex items-center gap-1.5 rounded-full bg-white/[0.06] px-2.5 py-1.5">
                    <Compass size={14} className="shrink-0 text-violet-200" />
                    向きセンサーを「許可」
                </span>
            </div>
        </div>
    );
}

import { type CSSProperties, type ReactNode, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ChevronLeft, MapFilled, Navigation, Plus, Sparkle, User } from '../ui/icons';
import {
    CompassIllustration,
    LegendIllustration,
    LocateIllustration,
    ModesIllustration,
    PostIllustration,
    SearchIllustration,
} from './TutorialIllustrations';

// 初めて開いた人向けのチュートリアル。実際の画面の部品（data-tutorial を付けた要素）だけを穴あきの幕で照らし、
// その隣に説明のカード（部品の拡大図・本文）を出す。説明は画面にある操作だけ（算出方法は書かない。GuideView と同じ方針）。
// 照らす部品: MiniCompass / FloatingSearchBar / MapModeToggle / MapControlStack の 2 つのボタン。部品が画面にない
// （コンパスモードを開いている等）ときは、照らさずにカードを中央に出す
type TutorialTarget = 'compass' | 'search' | 'mode-toggle' | 'map-modes' | 'locate';

type Step = {
    target: TutorialTarget | null;
    title: string;
    body: ReactNode;
    illustration: ReactNode;
    note?: string;
};

// 本文の中に、画面にあるのと同じアイコンを小さく出す
function InlineIcon({ children, accent = false }: { children: ReactNode; accent?: boolean }) {
    return (
        <span
            className={`mx-0.5 inline-grid h-5 w-5 translate-y-[3px] place-items-center rounded-full ${accent ? 'bg-violet-700 text-white' : 'bg-white/10 text-white/90'}`}
            aria-hidden="true"
        >
            {children}
        </span>
    );
}

// 画面の上から下へ、部品の位置の順に紹介する
const STEPS: Step[] = [
    {
        target: null,
        title: '夜景ポテンシャルの地図へようこそ',
        body: <>東京とその周辺で、夜景を楽しめそうな場所を色で表した地図です。黄色・オレンジに近いほど、夜景ポテンシャルが高い場所です。画面の使い方を順に紹介します。</>,
        illustration: <LegendIllustration />,
    },
    {
        target: 'compass',
        title: 'コンパスで周りを探す',
        body: (
            <>
                このコンパスを押すと、周りのどの方向の、どのくらい先が高いかが分かります。目盛りが長い方向ほど高く、−/
                <InlineIcon><Plus size={12} /></InlineIcon>
                で範囲（50m〜10km）を変えられます。
            </>
        ),
        illustration: <CompassIllustration />,
    },
    {
        target: 'search',
        title: '場所を検索して残す',
        body: (
            <>
                地名や駅名を入れると、その場所に白いピンが立ちます。ピンの「お気に入りに追加」で保存すると、左の
                <InlineIcon><User size={12} /></InlineIcon>
                メニューからいつでも戻れます。
            </>
        ),
        illustration: <SearchIllustration />,
    },
    {
        target: 'mode-toggle',
        title: 'みんなの夜景の投稿',
        body: (
            <>
                <InlineIcon accent><Sparkle size={12} /></InlineIcon>
                で投稿モードにすると、夜景の投稿が地図に出ます。投稿の場所は、100m 以内に着くまで、だいたいの範囲だけが見えます。右下に出る
                <InlineIcon><Plus size={12} /></InlineIcon>
                から自分も投稿できます。
            </>
        ),
        illustration: <PostIllustration />,
    },
    {
        target: 'map-modes',
        title: '地図の表示を切り替える',
        body: (
            <>
                <InlineIcon><MapFilled size={12} /></InlineIcon>
                で「標準 / ポテンシャル / 航空写真」を選べます。「表示するスコア」で、特に高い場所だけにするか、すべて出すかも変えられます。
            </>
        ),
        illustration: <ModesIllustration />,
    },
    {
        target: 'locate',
        title: '今いる場所から探しに行こう',
        body: (
            <>
                <InlineIcon><Navigation size={12} /></InlineIcon>
                で現在地へ移動します。位置情報と向きセンサーの確認が出たら「許可」を選んでください。端末の向きは画面の表示にだけ使い、保存・送信しません。
            </>
        ),
        illustration: <LocateIllustration />,
        note: '実際の眺めを保証するものではありません。夜に出かけるときは、現地の安全と立ち入りできるかを確かめてください。',
    },
];

const SWIPE_THRESHOLD_PX = 50;
// 照らす枠と部品のすき間、枠とカードのすき間、画面端の余白、カードの最大幅
const SPOT_PADDING = 6;
const CARD_GAP = 16;
const EDGE = 16;
const CARD_MAX_WIDTH = 380;
// 部品の入りの動き（animate-ui-drop / rise、最大 260ms）が終わった位置で測り直す
const REMEASURE_DELAY_MS = 300;

type Measured = { rect: DOMRect; viewportWidth: number; viewportHeight: number };

function measureTarget(target: TutorialTarget): Measured | null {
    const element = document.querySelector(`[data-tutorial="${target}"]`);
    if (!element) return null;
    const rect = element.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;
    return { rect, viewportWidth: window.innerWidth, viewportHeight: window.innerHeight };
}

function useTargetMeasure(target: TutorialTarget | null, active: boolean): Measured | null {
    const [measured, setMeasured] = useState<Measured | null>(null);
    useLayoutEffect(() => {
        if (!active || !target) {
            setMeasured(null);
            return;
        }
        const measure = () => setMeasured(measureTarget(target));
        measure();
        const timer = window.setTimeout(measure, REMEASURE_DELAY_MS);
        window.addEventListener('resize', measure);
        window.addEventListener('orientationchange', measure);
        return () => {
            window.clearTimeout(timer);
            window.removeEventListener('resize', measure);
            window.removeEventListener('orientationchange', measure);
        };
    }, [target, active]);
    return measured;
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

// カードは、部品の上下のうち広い側に置き、横は部品の中心に寄せて画面内に収める。矢印は部品の中心を指す
function placeCard({ rect, viewportWidth, viewportHeight }: Measured) {
    const width = Math.min(viewportWidth - EDGE * 2, CARD_MAX_WIDTH);
    const centerX = rect.left + rect.width / 2;
    const left = clamp(centerX - width / 2, EDGE, viewportWidth - EDGE - width);
    const arrowX = clamp(centerX - left, 28, width - 28);
    const placeBelow = viewportHeight - rect.bottom >= rect.top;
    if (placeBelow) {
        const top = rect.bottom + SPOT_PADDING + CARD_GAP;
        const style: CSSProperties = { left, width, top, maxHeight: `calc(${viewportHeight - top - EDGE}px - env(safe-area-inset-bottom))` };
        return { style, arrowSide: 'top' as const, arrowX };
    }
    const bottom = viewportHeight - rect.top + SPOT_PADDING + CARD_GAP;
    const style: CSSProperties = { left, width, bottom, maxHeight: `calc(${viewportHeight - bottom - EDGE}px - env(safe-area-inset-top))` };
    return { style, arrowSide: 'bottom' as const, arrowX };
}

// 照らす枠。外側を大きな影で暗くして、枠の中だけ実際の画面が見えるようにする。部品がないときは中央の大きさ 0 の点
function spotStyle(measured: Measured | null): CSSProperties {
    if (!measured) return { left: '50%', top: '50%', width: 0, height: 0 };
    const { rect } = measured;
    return {
        left: rect.left - SPOT_PADDING,
        top: rect.top - SPOT_PADDING,
        width: rect.width + SPOT_PADDING * 2,
        height: rect.height + SPOT_PADDING * 2,
    };
}

type TutorialOverlayProps = {
    isOpen: boolean;
    // 最後まで見たときもスキップしたときも呼ぶ（クリックの中で呼ぶので、iOS の許可の確認を出せる）
    onClose: () => void;
};

export function TutorialOverlay({ isOpen, onClose }: TutorialOverlayProps) {
    const [index, setIndex] = useState(0);
    const nextButtonRef = useRef<HTMLButtonElement | null>(null);
    const touchStartXRef = useRef<number | null>(null);
    const step = STEPS[index];
    const isLast = index === STEPS.length - 1;
    const measured = useTargetMeasure(step.target, isOpen);
    const placement = measured ? placeCard(measured) : null;

    const goTo = (next: number) => setIndex(clamp(next, 0, STEPS.length - 1));
    const close = () => {
        setIndex(0);
        onClose();
    };

    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIndex(0);
                onClose();
            } else if (event.key === 'ArrowRight') {
                setIndex((current) => Math.min(STEPS.length - 1, current + 1));
            } else if (event.key === 'ArrowLeft') {
                setIndex((current) => Math.max(0, current - 1));
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // カードは段ごとに作り直すので、そのたびに「次へ」へフォーカスを戻す（キーボードで続けて進めるように）
    useEffect(() => {
        if (isOpen) nextButtonRef.current?.focus();
    }, [isOpen, index]);

    if (!isOpen) return null;

    const card = (
        <div
            key={index}
            className={`flex max-h-full flex-col rounded-[24px] border border-white/15 bg-[#0b0d14] text-white shadow-[0_16px_48px_rgba(0,0,0,0.6)] animate-ui-pop ${placement ? 'absolute' : 'relative w-full max-w-[380px]'}`}
            style={placement?.style}
            onTouchStart={(event) => {
                touchStartXRef.current = event.touches[0]?.clientX ?? null;
            }}
            onTouchEnd={(event) => {
                const startX = touchStartXRef.current;
                const endX = event.changedTouches[0]?.clientX;
                touchStartXRef.current = null;
                if (startX === null || endX === undefined) return;
                const deltaX = endX - startX;
                if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX) return;
                goTo(index + (deltaX < 0 ? 1 : -1));
            }}
        >
            {placement && (
                <span
                    aria-hidden="true"
                    className={`absolute h-3.5 w-3.5 rotate-45 border-white/15 bg-[#0b0d14] ${placement.arrowSide === 'top' ? '-top-[7.5px] border-l border-t' : '-bottom-[7.5px] border-b border-r'}`}
                    style={{ left: placement.arrowX - 7 }}
                />
            )}

            <div className="flex items-center justify-between pl-5 pr-3 pt-2">
                <span className="text-xs font-semibold tabular-nums text-white/50">
                    {index + 1} / {STEPS.length}
                </span>
                {isLast ? (
                    <span className="min-h-11" />
                ) : (
                    <button
                        type="button"
                        onClick={close}
                        className="min-h-11 rounded-full px-3 text-xs font-semibold text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                    >
                        スキップ
                    </button>
                )}
            </div>

            {/* 低い画面（スマホの横向きなど）だけスクロールする。スクロールバーは見せない（PC の Chrome で、段の切り替えの途中に
                出たバーが中身があふれていなくても残り、幅が詰まるため） */}
            <div className="min-h-0 flex-auto overflow-y-auto px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <div className="flex justify-center rounded-[18px] border border-white/10 bg-white/[0.03] p-3">
                    <div className="w-full max-w-[240px]">{step.illustration}</div>
                </div>
                <h2 id="tutorial-title" className="mt-4 text-base font-bold tracking-tight text-white/90">
                    {step.title}
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed text-white/70">{step.body}</p>
                {step.note && <p className="mt-2 text-[11px] leading-relaxed text-white/45">{step.note}</p>}
            </div>

            <div className="flex items-center gap-3 px-5 pb-4 pt-3">
                <div className="flex flex-1 items-center gap-0.5" role="group" aria-label="チュートリアルのページ">
                    {STEPS.map((item, dotIndex) => (
                        <button
                            key={item.title}
                            type="button"
                            onClick={() => goTo(dotIndex)}
                            className="grid h-11 w-5 place-items-center"
                            aria-label={`${dotIndex + 1} ページ目: ${item.title}`}
                            aria-current={dotIndex === index ? 'step' : undefined}
                        >
                            <span className={`h-1.5 rounded-full transition-all duration-200 ${dotIndex === index ? 'w-4 bg-violet-300' : 'w-1.5 bg-white/25'}`} />
                        </button>
                    ))}
                </div>
                {index > 0 && (
                    <button
                        type="button"
                        onClick={() => goTo(index - 1)}
                        className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/10 text-white/80 transition-colors hover:bg-white/15"
                        aria-label="前へ"
                    >
                        <ChevronLeft size={20} />
                    </button>
                )}
                <button
                    ref={nextButtonRef}
                    type="button"
                    onClick={() => (isLast ? close() : goTo(index + 1))}
                    className="h-11 shrink-0 rounded-full bg-violet-700 px-6 text-sm font-bold text-white transition-colors hover:bg-violet-600 active:scale-95"
                >
                    {isLast ? 'はじめる' : '次へ'}
                </button>
            </div>
        </div>
    );

    return (
        // 幕全体で地図・部品への操作を止める（照らしている部品も、説明中は押せない）
        <div className="pointer-events-auto fixed inset-0 z-[7500] animate-ui-fade" role="dialog" aria-modal="true" aria-labelledby="tutorial-title">
            <div
                aria-hidden="true"
                className="pointer-events-none fixed rounded-full shadow-[0_0_0_9999px_rgba(3,4,8,0.72)] motion-safe:transition-all motion-safe:duration-300 motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={spotStyle(measured)}
            >
                {measured && (
                    <>
                        <span className="tutorial-glow absolute inset-0 rounded-full ring-2 ring-violet-300" />
                    </>
                )}
            </div>

            {placement ? (
                card
            ) : (
                <div className="absolute inset-0 flex items-center justify-center px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))]">
                    {card}
                </div>
            )}
        </div>
    );
}

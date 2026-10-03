import type { ReactNode } from 'react';
import { Compass, Heart, Image, Layers, Search } from '../ui/icons';
import { textMuted, textPrimary } from '../../styles/ui';

// はじめてガイド。画面にある操作だけを、使う順に説明する（値の算出方法は書かない。表示モード画面の
// 「夜景ポテンシャルとは」と同じ方針）
const STEPS: Array<{ icon: ReactNode; title: string; body: string[] }> = [
    {
        icon: <Layers size={20} aria-hidden="true" />,
        title: '地図の色を見る',
        body: [
            '色の付いた場所ほど、夜景を楽しめそうな度合い（夜景ポテンシャル）が高い場所です。黄色・オレンジに近いほど高くなります。',
            '右下の地図ボタンで「標準 / ポテンシャル / 航空写真」を切り替えられます。「表示するスコア」で、特に高い場所だけ（高のみ）にするか、すべて（高・中・低）出すかを選べます。',
        ],
    },
    {
        icon: <Compass size={20} aria-hidden="true" />,
        title: 'コンパスで周りを探す',
        body: [
            '左上のコンパスを押すと、今いる場所の周りで、どの方向のどのくらい先が高いかを見られます。外側の目盛りが長い方向ほど強く、＋/− で範囲（50m〜10km）を変えられます。',
            '文字盤を押すと、その方向・距離の地点が地図上に点で出ます。スマホでは向きセンサーで、文字盤が向いている方向に合わせて回ります。',
        ],
    },
    {
        icon: <Search size={20} aria-hidden="true" />,
        title: '場所を検索する',
        body: ['検索欄に地名や駅名を入れると、その場所へ地図が動き、白いピンが立ちます。'],
    },
    {
        icon: <Heart size={20} aria-hidden="true" />,
        title: 'お気に入りに残す',
        body: [
            'ピンのポップアップの「お気に入りに追加」か、メニュー →「お気に入り」の「現在地をお気に入りに追加」で保存できます。一覧から押すと、その場所へ戻れます。',
        ],
    },
    {
        icon: <Image size={20} aria-hidden="true" />,
        title: 'みんなの投稿を見る',
        body: ['右上の切り替えで投稿モードにすると、地図上に夜景の投稿が出ます。カメラのボタンから投稿できます。'],
    },
];

export function GuideView() {
    return (
        <div className="space-y-4">
            <ol className="space-y-3">
                {STEPS.map((step, index) => (
                    <li key={step.title} className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
                        <h3 className={`flex items-center gap-3 text-sm font-semibold ${textPrimary}`}>
                            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/[0.06] text-violet-200">{step.icon}</span>
                            <span>
                                <span className="mr-1.5 tabular-nums text-white/40">{index + 1}.</span>
                                {step.title}
                            </span>
                        </h3>
                        <div className={`mt-3 space-y-2 text-xs leading-relaxed ${textMuted}`}>
                            {step.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                        </div>
                    </li>
                ))}
            </ol>
            <p className={`px-1 text-[11px] leading-relaxed ${textMuted}`}>
                実際の眺めを保証するものではありません。夜に出かけるときは、現地の安全と立ち入りできるかを確かめてください。
            </p>
        </div>
    );
}

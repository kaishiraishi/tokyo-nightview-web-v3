import { useState } from 'react';
import type { FavoritePlace } from '../../lib/favorites';
import { clearAppStorage } from '../../lib/demoAccount';
import { textMuted, textPrimary } from '../../styles/ui';

const UNLOCKED_POSTS_KEY = 'nightview.unlockedPosts';
const ATTRIBUTIONS = [
    '国土地理院（標高・陰影・航空写真、地球地図日本）',
    '国土交通省 Project PLATEAU（3D 建物）',
    '© OpenStreetMap contributors（地図・地名検索）',
    '© CARTO（ベースマップ）',
];

function downloadJson(fileName: string, data: unknown) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
}

// 設定の下の「データとプライバシー」「このアプリについて」。アカウント連携を見越した項目だが、
// 今はこの端末のデータだけを扱う（書き出し・リセット・消去は実際に動く）
export function DataAndAboutSettings({ favorites }: { favorites: FavoritePlace[] }) {
    // 消す操作は取り消せないので、1 回目は確認の表示にして、もう一度押したら実行する
    const [pending, setPending] = useState<'unlocked' | 'all' | null>(null);

    const confirmOrRun = (target: 'unlocked' | 'all') => {
        if (pending !== target) {
            setPending(target);
            return;
        }
        clearAppStorage(target === 'unlocked' ? [UNLOCKED_POSTS_KEY] : undefined);
        window.location.reload();
    };

    const rowClass = 'flex min-h-12 w-full items-center justify-between gap-3 px-5 py-3 text-left text-sm transition-colors hover:bg-white/5';

    return (
        <>
            <section>
                <h3 className={`mb-3 px-2 text-sm font-semibold ${textPrimary}`}>データとプライバシー</h3>
                <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.03] shadow-inner">
                    <button
                        type="button"
                        onClick={() => downloadJson('nightview-favorites.json', favorites)}
                        disabled={favorites.length === 0}
                        className={`${rowClass} disabled:cursor-not-allowed disabled:opacity-40`}
                    >
                        <span className={textPrimary}>お気に入りを書き出す</span>
                        <span className={`text-xs ${textMuted}`}>{favorites.length} 件・JSON</span>
                    </button>
                    <button type="button" onClick={() => confirmOrRun('unlocked')} className={`${rowClass} border-t border-white/10`}>
                        <span className={textPrimary}>{pending === 'unlocked' ? 'もう一度押すとリセットします' : '着いた投稿の記録をリセット'}</span>
                    </button>
                    <button type="button" onClick={() => confirmOrRun('all')} className={`${rowClass} border-t border-white/10`}>
                        <span className={pending === 'all' ? 'font-semibold text-white' : textPrimary}>
                            {pending === 'all' ? 'もう一度押すとすべて消します' : 'この端末のデータをすべて消す'}
                        </span>
                    </button>
                </div>
                <p className={`mt-2 px-2 text-[11px] leading-relaxed ${textMuted}`}>
                    端末の向きは画面の表示にだけ使い、保存・送信しません。現在地は、地図とコンパスの表示・投稿に着いたかの判定に使い、
                    投稿したとき（その投稿の場所として送信）と「現在地をお気に入りに追加」したとき（この端末に保存）だけ残ります。
                    お気に入り・着いた投稿・設定はこの端末のブラウザにだけ保存されます。
                </p>
            </section>

            <section>
                <h3 className={`mb-3 px-2 text-sm font-semibold ${textPrimary}`}>このアプリについて</h3>
                <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
                    <p className={`text-xs ${textMuted}`}>出典</p>
                    <ul className={`mt-2 space-y-1 text-xs leading-relaxed ${textPrimary}`}>
                        {ATTRIBUTIONS.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                    <p className={`mt-4 text-[11px] ${textMuted}`}>利用規約・プライバシーポリシー: 準備中</p>
                </div>
            </section>
        </>
    );
}

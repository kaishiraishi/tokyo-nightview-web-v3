import { useState } from 'react';
import { User } from '../ui/icons';
import { readDemoAccount, writeDemoAccount, type DemoAccount } from '../../lib/demoAccount';
import { textMuted, textPrimary } from '../../styles/ui';

const PLANNED_SIGN_IN_METHODS = ['Google', 'Apple', 'メールアドレス'];
const DISPLAY_NAME_MAX = 20;

// アカウント（デモ）。本物のログインはまだないので、デモであることを最初に示す。
// デモアカウントはこの端末の中だけで、表示名を変えたりログアウトしたりできる
export function AccountView() {
    const [account, setAccount] = useState<DemoAccount | null>(() => readDemoAccount());
    const [draftName, setDraftName] = useState(account?.displayName ?? '');
    const trimmedName = draftName.trim();

    const signIn = () => {
        const next = writeDemoAccount({ displayName: 'ゲスト' });
        setAccount(next);
        setDraftName(next?.displayName ?? '');
    };
    const saveName = () => {
        if (!trimmedName) return;
        setAccount(writeDemoAccount({ displayName: trimmedName.slice(0, DISPLAY_NAME_MAX) }));
    };
    const signOut = () => {
        setAccount(writeDemoAccount(null));
        setDraftName('');
    };

    return (
        <div className="space-y-4">
            <p className="rounded-2xl border border-amber-300/20 bg-amber-300/[0.06] px-4 py-3 text-[11px] leading-relaxed text-amber-100/85">
                デモ表示です。実際のログインはまだできません。デモアカウントはこの端末の中だけに保存され、どこにも送信されません。
            </p>

            {account === null ? (
                <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
                    <div className="grid h-12 w-12 place-items-center rounded-full bg-white/[0.06] text-white/60">
                        <User size={24} aria-hidden="true" />
                    </div>
                    <p className={`mt-3 text-sm font-semibold ${textPrimary}`}>ログインしていません</p>
                    <p className={`mt-1 text-xs leading-relaxed ${textMuted}`}>
                        ログインすると、お気に入りや着いた投稿を別の端末でも使えるようにする予定です。
                    </p>
                    <button
                        type="button"
                        onClick={signIn}
                        className="mt-4 flex min-h-12 w-full items-center justify-center rounded-2xl border border-violet-300/30 bg-violet-700/70 text-sm font-semibold text-white transition-colors hover:bg-violet-600"
                    >
                        デモアカウントでログイン
                    </button>
                    <p className={`mt-3 text-[11px] ${textMuted}`}>予定しているログイン方法（準備中）: {PLANNED_SIGN_IN_METHODS.join(' / ')}</p>
                </section>
            ) : (
                <>
                    <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
                        <div className="flex items-center gap-3">
                            <div className={`grid h-12 w-12 place-items-center rounded-full bg-violet-700/60 text-lg font-bold ${textPrimary}`} aria-hidden="true">
                                {account.displayName.charAt(0)}
                            </div>
                            <div className="min-w-0">
                                <p className={`truncate text-base font-semibold ${textPrimary}`}>{account.displayName}</p>
                                <p className={`text-[11px] ${textMuted}`}>デモアカウント（この端末のみ）</p>
                            </div>
                        </div>
                        <label htmlFor="demo-display-name" className={`mt-4 block text-xs ${textMuted}`}>表示名</label>
                        <div className="mt-1.5 flex gap-2">
                            <input
                                id="demo-display-name"
                                value={draftName}
                                maxLength={DISPLAY_NAME_MAX}
                                onChange={(event) => setDraftName(event.target.value)}
                                className="min-h-11 min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.05] px-3 text-base text-white outline-none focus:border-violet-300/60 md:text-sm"
                            />
                            <button
                                type="button"
                                onClick={saveName}
                                disabled={!trimmedName || trimmedName === account.displayName}
                                className="min-h-11 shrink-0 rounded-xl bg-white/10 px-4 text-sm font-semibold text-white transition-colors hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                保存
                            </button>
                        </div>
                        <p className={`mt-2 text-[11px] ${textMuted}`}>メニューの上に表示される名前です（{DISPLAY_NAME_MAX} 文字まで）。</p>
                    </section>

                    <section className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.03]">
                        <div className="flex min-h-12 items-center justify-between px-5 text-sm">
                            <span className={textPrimary}>ログイン方法</span>
                            <span className={`text-xs ${textMuted}`}>デモ</span>
                        </div>
                        <button
                            type="button"
                            onClick={signOut}
                            className="flex min-h-12 w-full items-center border-t border-white/10 px-5 text-left text-sm text-white/90 transition-colors hover:bg-white/5"
                        >
                            ログアウト
                        </button>
                    </section>
                    <p className={`px-1 text-[11px] leading-relaxed ${textMuted}`}>
                        デモアカウントを消すにはログアウトしてください。お気に入りなどのデータは、設定 →「データとプライバシー」で消せます。
                    </p>
                </>
            )}
        </div>
    );
}

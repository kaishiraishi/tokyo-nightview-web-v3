import { Image as ImageIcon, Inbox, Lock, MapPin } from '../ui/icons';
import type { Post } from '../../lib/postsApi';
import { textMuted, textPrimary } from '../../styles/ui';

type PostsViewProps = {
    posts: Post[];
    // まだ着いていない投稿は、正確な場所名を伏せて「〇〇 付近」と出し、写真に鍵の印を重ねる（lib/postReveal.ts）
    isUnlocked: (post: Post) => boolean;
    onSelect: (post: Post) => void;
};

const postedAtFormat = new Intl.DateTimeFormat('ja-JP', { year: 'numeric', month: 'numeric', day: 'numeric' });

function formatPostedAt(createdAt: string) {
    const date = new Date(createdAt);
    return Number.isNaN(date.getTime()) ? '' : postedAtFormat.format(date);
}

function placeLabel(post: Post, unlocked: boolean) {
    if (unlocked) return post.location.placeName || post.location.area || '場所不明';
    return `${post.location.area || 'この辺り'} 付近`;
}

// メニューの投稿一覧。押すとその投稿の場所（着く前はだいたいの場所の円）へ地図を動かす。
// 地図の上にはシートを出さず、一覧はここだけで見る
export function PostsView({ posts, isUnlocked, onSelect }: PostsViewProps) {
    if (posts.length === 0) {
        return (
            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] px-5 py-6 text-center">
                <Inbox size={28} className="mx-auto text-white/30" aria-hidden="true" />
                <p className={`mt-3 text-sm font-semibold ${textPrimary}`}>まだ投稿がありません</p>
                <p className={`mt-2 text-xs leading-relaxed ${textMuted}`}>投稿モードの右下の＋ボタンから投稿できます。</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <ul className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.03] shadow-inner">
                {posts.map((post, index) => {
                    const unlocked = isUnlocked(post);
                    const photoUrl = post.photos?.[0]?.url;
                    return (
                        <li key={post.id} className={index < posts.length - 1 ? 'border-b border-white/10' : ''}>
                            <button
                                type="button"
                                onClick={() => onSelect(post)}
                                className="flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/5"
                            >
                                <span className="relative grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl border border-white/10 bg-black/40">
                                    {photoUrl ? (
                                        <img src={photoUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
                                    ) : (
                                        <ImageIcon size={22} className="text-white/25" aria-hidden="true" />
                                    )}
                                    {!unlocked && (
                                        <span className="absolute bottom-1 right-1 grid h-5 w-5 place-items-center rounded-full bg-black/70">
                                            <Lock size={12} className="text-violet-200" aria-hidden="true" />
                                        </span>
                                    )}
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className={`line-clamp-2 text-sm font-medium leading-snug ${textPrimary}`}>{post.caption || '（コメントなし）'}</span>
                                    <span className={`mt-1 flex items-center gap-1 text-[11px] ${textMuted}`}>
                                        <MapPin size={12} className="shrink-0" aria-hidden="true" />
                                        <span className="truncate">{placeLabel(post, unlocked)}</span>
                                        <span aria-hidden="true">·</span>
                                        <span className="shrink-0">{formatPostedAt(post.createdAt)}</span>
                                    </span>
                                    {!unlocked && <span className="sr-only">まだ着いていない投稿</span>}
                                </span>
                            </button>
                        </li>
                    );
                })}
            </ul>
            <p className={`px-1 text-[11px] leading-relaxed ${textMuted}`}>
                鍵の印の投稿は、まだ着いていない場所です。押すと、だいたいの場所の円へ移動します。100m 以内に近づくと正確な場所がわかります。
            </p>
        </div>
    );
}

import type { Post } from '../../lib/postsApi';
import { Inbox, Image as ImageIcon, Lock, MapPin } from '../ui/icons';

type PostListPanelProps = {
    posts: Post[];
    isLoading?: boolean;
    onPostClick: (post: Post) => void;
    // まだ着いていない投稿は、写真と正確な場所名を伏せる（lib/postReveal.ts）。渡されないときは全部見せる
    isUnlocked?: (post: Post) => boolean;
};

export function PostListPanel({ posts, isLoading, onPostClick, isUnlocked = () => true }: PostListPanelProps) {
    if (isLoading) {
        return <div className="p-8 text-center text-white/50 text-sm">読み込み中...</div>;
    }

    if (posts.length === 0) {
        return (
            <div className="p-8 text-center flex flex-col items-center gap-2">
                <Inbox className="w-12 h-12 opacity-20 text-white" />
                <p className="text-white/50 text-sm">まだ投稿がありません</p>
                <p className="text-white/30 text-xs text-center">
                    右下のカメラボタンから<br/>最初の投稿をしてみましょう
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-transparent text-white">
            <div className="px-4 py-4 border-b border-white/10 shrink-0 flex justify-between items-baseline">
                <div className="text-xs text-white/50 font-medium tracking-wider">LATEST POSTS</div>
                <div className="text-xs text-white/40">{posts.length}件</div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {posts.map((post) => {
                    const unlocked = isUnlocked(post);
                    return (
                    <div 
                        key={post.id}
                        onClick={() => onPostClick(post)}
                        className="group bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 rounded-xl p-3 cursor-pointer transition-all active:scale-[0.98]"
                    >
                        <div className="flex gap-3">
                            {/* Thumbnail or Icon */}
                            <div className="relative w-16 h-16 shrink-0 bg-black/40 rounded-lg overflow-hidden border border-white/10 flex items-center justify-center">
                                {/* 着く前の投稿も写真は見せ、正確な場所だけ伏せる（鍵の印を写真に重ねる） */}
                                {!unlocked && (
                                    <span className="absolute bottom-1 right-1 z-[1] grid h-5 w-5 place-items-center rounded-full bg-black/70" aria-label="まだ着いていない投稿">
                                        <Lock className="h-3 w-3 text-violet-200" aria-hidden="true" />
                                    </span>
                                )}
                                {post.photos?.[0]?.url ? (
                                    <img 
                                        src={post.photos[0].url} 
                                        alt="投稿画像" 
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" 
                                        loading="lazy"
                                        onError={(e) => {
                                            // 画像読み込みエラー時のフォールバック
                                            (e.target as HTMLImageElement).style.display = 'none';
                                            (e.target as HTMLImageElement).parentElement?.classList.add('flex', 'items-center', 'justify-center');
                                            const icon = document.createElement('div');
                                            icon.className = 'text-white/20 text-[10px]';
                                            icon.innerText = 'NO IMG';
                                            (e.target as HTMLImageElement).parentElement?.appendChild(icon);
                                        }}
                                    />
                                ) : (
                                    <ImageIcon className="w-8 h-8 opacity-20" />
                                )}
                            </div>
                            
                            {/* Text Content */}
                            <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                                <div>
                                    <p className="text-sm text-white/90 line-clamp-2 font-medium leading-relaxed">
                                        {post.caption || "（コメントなし）"}
                                    </p>
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] text-white/40">
                                    <MapPin className="w-3 h-3" />
                                    <span className="truncate max-w-[120px]">
                                        {unlocked
                                            ? post.location.placeName || post.location.area || '場所不明'
                                            : `${post.location.area || 'この辺り'} 付近`}
                                    </span>
                                    <span>•</span>
                                    <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    );
                })}
            </div>
        </div>
    );
}

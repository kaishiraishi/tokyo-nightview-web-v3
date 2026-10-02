import { useCallback, useEffect, useState } from 'react';
import { MOCK_POSTS } from '../data/mockPosts';
import { listPosts, type Post } from '../lib/postsApi';
import { isSupabaseConfigured } from '../lib/supabaseClient';

const MOCK_POSTS_TAGGED: Post[] = MOCK_POSTS.map((post) => ({ ...post, source: 'mock' as const }));

// 投稿モードに入ったときだけ取得する（探索モードでは Supabase を呼ばない）
export function usePosts(enabled: boolean): { posts: Post[]; reload: () => Promise<void> } {
    const [posts, setPosts] = useState<Post[]>(MOCK_POSTS_TAGGED);

    const reload = useCallback(async () => {
        if (!isSupabaseConfigured) {
            setPosts(MOCK_POSTS_TAGGED);
            return;
        }
        try {
            const supabasePosts = await listPosts();
            setPosts([...supabasePosts, ...MOCK_POSTS_TAGGED]);
        } catch (err) {
            console.error('[usePosts] 投稿の取得に失敗しました:', err);
            setPosts(MOCK_POSTS_TAGGED);
        }
    }, []);

    useEffect(() => {
        if (enabled) void reload();
    }, [enabled, reload]);

    return { posts, reload };
}

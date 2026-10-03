import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import type { Post } from '../lib/postsApi';
import { favoriteId } from '../lib/favorites';

// このズーム以上で写真付きの詳細カードに切り替える
const IMAGE_ZOOM_THRESHOLD = 13;

function escapeHtml(s: string): string {
    return s
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

// 写真付きカードの右上のハート。押すと投稿の場所をお気に入りに追加 / 解除する（文言が動作を表すので aria-pressed は付けない）
function favoriteButtonHtml(isFavorite: boolean): string {
    const label = isFavorite ? 'この場所をお気に入りから外す' : 'この場所をお気に入りに追加';
    return `<button type="button" class="night-popup-fav" data-favorite="${isFavorite}" aria-label="${label}" title="${label}"><span aria-hidden="true">${isFavorite ? '♥' : '♡'}</span></button>`;
}

function buildPopupHtml(post: Post, expanded: boolean, isFavorite: boolean): string {
    const caption = escapeHtml(post.caption ?? '');
    if (!expanded) {
        return `<div class="night-popup-card night-popup-simple"><div class="night-popup-caption" style="display: block; font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 150px;">${caption}</div></div>`;
    }
    const placeName = escapeHtml(post.location.placeName ?? '');
    const areaText = post.location.area ? `・${escapeHtml(post.location.area)}` : '';
    const authorName = post.author?.name ? `<div class="night-popup-author">@${escapeHtml(post.author.name)}</div>` : '';
    const photoUrl = post.photos?.[0]?.url ?? '';
    return `<div class="night-popup-card">${favoriteButtonHtml(isFavorite)}${photoUrl ? `<img class="night-popup-img" src="${escapeHtml(photoUrl)}" alt="" loading="lazy" decoding="async" width="232" height="131" />` : ''}<div class="night-popup-text"><div class="night-popup-caption">${caption}</div><div class="night-popup-meta-row"><span class="night-popup-meta">${placeName}${areaText}</span>${authorName}</div></div></div>`;
}

// 投稿を MapLibre のポップアップとして地図に重ねる。enabled が false の間は何も残さない。
// favoriteIds: お気に入り登録済みの場所（favoriteId）。カードのハートの塗りに使う
export function usePostPopups(
    map: maplibregl.Map | null,
    isLoaded: boolean,
    posts: Post[],
    enabled: boolean,
    favoriteIds: ReadonlySet<string>,
    onToggleFavorite: (post: Post) => void,
): void {
    // ポップアップは投稿ごとに 1 回だけ作るので、ハートを押したときやズームで描き直すときは最新の値を使う
    const favoriteIdsRef = useRef(favoriteIds);
    const toggleRef = useRef(onToggleFavorite);
    const rerenderRef = useRef<(() => void) | null>(null);
    useEffect(() => {
        favoriteIdsRef.current = favoriteIds;
        toggleRef.current = onToggleFavorite;
        rerenderRef.current?.();
    }, [favoriteIds, onToggleFavorite]);

    useEffect(() => {
        if (!map || !isLoaded || !enabled) return;

        const popups = new Map<string, { popup: maplibregl.Popup; post: Post }>();
        let expanded = map.getZoom() >= IMAGE_ZOOM_THRESHOLD;
        const isFavorite = (post: Post) => favoriteIdsRef.current.has(favoriteId(post.location.lng, post.location.lat));
        const render = (popup: maplibregl.Popup, post: Post) => popup.setHTML(buildPopupHtml(post, expanded, isFavorite(post)));

        for (const post of posts) {
            const popup = new maplibregl.Popup({
                closeButton: false,
                closeOnClick: false,
                closeOnMove: false,
                offset: 12,
                anchor: 'bottom',
                className: 'night-popup',
                // 既定の maxWidth（240px）だと幅 248px のカードが枠から右にはみ出し、写真がずれて見える
                maxWidth: 'none',
            })
                .setLngLat([post.location.lng, post.location.lat])
                .addTo(map);
            render(popup, post);

            // ハートは描き直しで作り替わるので、ポップアップの要素で受ける。地図のクリック（投稿の地点選択）には渡さない
            popup.getElement().addEventListener('click', (event) => {
                if (!(event.target instanceof Element) || !event.target.closest('.night-popup-fav')) return;
                event.stopPropagation();
                toggleRef.current(post);
            });

            // ポップアップ上のホイール操作が地図のズームに届くようにする
            popup.getElement().addEventListener(
                'wheel',
                (event) => {
                    event.preventDefault();
                    map.getCanvas().dispatchEvent(new WheelEvent('wheel', event));
                },
                { passive: false },
            );
            popups.set(post.id, { popup, post });
        }

        const handleZoom = () => {
            const next = map.getZoom() >= IMAGE_ZOOM_THRESHOLD;
            if (next === expanded) return;
            expanded = next;
            for (const { popup, post } of popups.values()) render(popup, post);
        };
        map.on('zoom', handleZoom);
        rerenderRef.current = () => {
            for (const { popup, post } of popups.values()) render(popup, post);
        };

        return () => {
            rerenderRef.current = null;
            map.off('zoom', handleZoom);
            for (const { popup } of popups.values()) popup.remove();
        };
    }, [map, isLoaded, posts, enabled]);
}

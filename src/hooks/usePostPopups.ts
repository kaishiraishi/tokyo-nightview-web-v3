import { useEffect } from 'react';
import maplibregl from 'maplibre-gl';
import type { Post } from '../lib/postsApi';

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

function buildPopupHtml(post: Post, expanded: boolean): string {
    const caption = escapeHtml(post.caption ?? '');
    if (!expanded) {
        return `<div class="night-popup-card night-popup-simple"><div class="night-popup-caption" style="display: block; font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 150px;">${caption}</div></div>`;
    }
    const placeName = escapeHtml(post.location.placeName ?? '');
    const areaText = post.location.area ? `・${escapeHtml(post.location.area)}` : '';
    const authorName = post.author?.name ? `<div class="night-popup-author">@${escapeHtml(post.author.name)}</div>` : '';
    const photoUrl = post.photos?.[0]?.url ?? '';
    return `<div class="night-popup-card">${photoUrl ? `<img class="night-popup-img" src="${escapeHtml(photoUrl)}" alt="" loading="lazy" decoding="async" width="232" height="131" />` : ''}<div class="night-popup-text"><div class="night-popup-caption">${caption}</div><div class="night-popup-meta-row"><span class="night-popup-meta">${placeName}${areaText}</span>${authorName}</div></div></div>`;
}

// 投稿を MapLibre のポップアップとして地図に重ねる。enabled が false の間は何も残さない。
export function usePostPopups(map: maplibregl.Map | null, isLoaded: boolean, posts: Post[], enabled: boolean): void {
    useEffect(() => {
        if (!map || !isLoaded || !enabled) return;

        const popups = new Map<string, { popup: maplibregl.Popup; post: Post }>();
        let expanded = map.getZoom() >= IMAGE_ZOOM_THRESHOLD;

        for (const post of posts) {
            const popup = new maplibregl.Popup({
                closeButton: false,
                closeOnClick: false,
                closeOnMove: false,
                offset: 12,
                anchor: 'bottom',
                className: 'night-popup',
            })
                .setLngLat([post.location.lng, post.location.lat])
                .setHTML(buildPopupHtml(post, expanded))
                .addTo(map);

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
            for (const { popup, post } of popups.values()) popup.setHTML(buildPopupHtml(post, expanded));
        };
        map.on('zoom', handleZoom);

        return () => {
            map.off('zoom', handleZoom);
            for (const { popup } of popups.values()) popup.remove();
        };
    }, [map, isLoaded, posts, enabled]);
}

import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import type { Post } from '../lib/postsApi';
import { favoriteId } from '../lib/favorites';
import { destinationPoint, type MapLocation } from '../lib/potentialSampler';
import { approximateArea, distanceMeters, formatDistanceAway, UNLOCK_RADIUS_M } from '../lib/postReveal';

// このズーム以上で写真付きのカードを出す。それより引いたときは、紫の点と件数の丸（クラスタ）で見せ、
// 丸から分かれて 1 件の点になった投稿にだけ、点の上にコメント（キャプション 1 行）を出す
const IMAGE_ZOOM_THRESHOLD = 12;
// 着く前のカードの「近づくと正確な場所がわかります」は、その場所まで寄ったとき（このズーム以上）だけ出す
const HINT_ZOOM_THRESHOLD = 15;
const AREA_SOURCE_ID = 'post-areas';
const AREA_FILL_LAYER_ID = 'post-areas-fill';
const AREA_LINE_LAYER_ID = 'post-areas-line';
const AREA_SEGMENTS = 64;
const POINT_SOURCE_ID = 'post-points';
const CLUSTER_LAYER_ID = 'post-clusters';
const CLUSTER_COUNT_LAYER_ID = 'post-cluster-count';
const POINT_LAYER_ID = 'post-point';
// ベースマップ（CARTO）のフォントで件数を描く
const COUNT_FONT = ['Montserrat Medium', 'Open Sans Bold'];

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

function buildPopupHtml(post: Post, isFavorite: boolean): string {
    const caption = escapeHtml(post.caption ?? '');
    const placeName = escapeHtml(post.location.placeName ?? '');
    const areaText = post.location.area ? `・${escapeHtml(post.location.area)}` : '';
    const authorName = post.author?.name ? `<div class="night-popup-author">@${escapeHtml(post.author.name)}</div>` : '';
    const photoUrl = post.photos?.[0]?.url ?? '';
    return `<div class="night-popup-card">${favoriteButtonHtml(isFavorite)}${photoUrl ? `<img class="night-popup-img" src="${escapeHtml(photoUrl)}" alt="" loading="lazy" decoding="async" width="232" height="131" />` : ''}<div class="night-popup-text"><div class="night-popup-caption">${caption}</div><div class="night-popup-meta-row"><span class="night-popup-meta">${placeName}${areaText}</span>${authorName}</div></div></div>`;
}

// 着く前のカード: 写真とキャプションは見せ、正確な場所だけ隠す。場所は「〇〇市 付近」と現在地からの距離を 1 行に、
// 解放の条件は 1 行で。お気に入り（ハート）は出さない（登録すると正確な座標が残るため）
function buildLockedHtml(post: Post, showHint: boolean, distance: number | null): string {
    const caption = escapeHtml(post.caption ?? '');
    const area = escapeHtml(post.location.area ?? 'この辺り');
    const away = distance === null ? '' : ` · ここから約 ${formatDistanceAway(distance)}`;
    const photoUrl = post.photos?.[0]?.url ?? '';
    return `<div class="night-popup-card">${photoUrl ? `<img class="night-popup-img" src="${escapeHtml(photoUrl)}" alt="" loading="lazy" decoding="async" width="232" height="131" />` : ''}<div class="night-popup-text"><div class="night-popup-caption">${caption}</div><div class="night-popup-meta-row"><span class="night-popup-meta">${area} 付近${away}</span></div>${showHint ? `<div class="night-popup-hint">${UNLOCK_RADIUS_M}m 以内に近づくと正確な場所がわかります</div>` : ''}</div></div>`;
}

// 引きのときの、1 件の点の上に出すコメント。写真と場所は出さない（カードはズームしたときだけ）
function buildBubbleHtml(post: Post): string {
    return `<div class="night-popup-bubble">${escapeHtml(post.caption || '（コメントなし）')}</div>`;
}

function areaPolygon(center: MapLocation, radius: number): GeoJSON.Feature {
    const ring = Array.from({ length: AREA_SEGMENTS + 1 }, (_, index) => {
        const point = destinationPoint(center, (index / AREA_SEGMENTS) * 360, radius);
        return [point.lng, point.lat];
    });
    return { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [ring] } };
}

// 投稿を MapLibre のポップアップとして地図に重ねる。enabled が false の間は何も残さない。
// 解放済み（isUnlocked）の投稿は本当の地点に写真付きのカード、まだの投稿はずらした円（だいたいの場所）と写真付きのカード。
// 引き（ズーム 12 未満）ではカードを隠し、紫の点と件数の丸（クラスタ）で見せる。
// favoriteIds: お気に入り登録済みの場所（favoriteId）。カードのハートの塗りに使う
export function usePostPopups(
    map: maplibregl.Map | null,
    isLoaded: boolean,
    posts: Post[],
    enabled: boolean,
    favoriteIds: ReadonlySet<string>,
    onToggleFavorite: (post: Post) => void,
    isUnlocked: (post: Post) => boolean,
    currentLocation: MapLocation | null,
): void {
    // ポップアップは投稿ごとに 1 回だけ作るので、ハートを押したとき・ズームや現在地で描き直すときは最新の値を使う
    const favoriteIdsRef = useRef(favoriteIds);
    const toggleRef = useRef(onToggleFavorite);
    const locationRef = useRef(currentLocation);
    const rerenderRef = useRef<(() => void) | null>(null);
    useEffect(() => {
        favoriteIdsRef.current = favoriteIds;
        toggleRef.current = onToggleFavorite;
        locationRef.current = currentLocation;
        rerenderRef.current?.();
    }, [currentLocation, favoriteIds, onToggleFavorite]);

    useEffect(() => {
        if (!map || !isLoaded || !enabled) return;

        const popups = new Map<string, { popup: maplibregl.Popup; post: Post; unlocked: boolean }>();
        // カードが重なったときは、タップしたカードを前に出す。index.css が .maplibregl-popup に z-index: 2000 !important を
        // 付けているので、上書きするにも important が要る。押すたびに番号を増やすので、最後に押したものが一番前になる
        let frontZ = 2000;
        let expanded = map.getZoom() >= IMAGE_ZOOM_THRESHOLD;
        let showHint = map.getZoom() >= HINT_ZOOM_THRESHOLD;
        // 引きのときに、件数の丸にまとめられず 1 件の点として見えている投稿（post.id）
        let separated = new Set<string>();
        const isFavorite = (post: Post) => favoriteIdsRef.current.has(favoriteId(post.location.lng, post.location.lat));
        const render = (popup: maplibregl.Popup, post: Post, unlocked: boolean) => {
            // 引きでは、丸にまとめられている投稿は何も出さず、1 件の点になった投稿はコメントだけを出す
            const showBubble = !expanded && separated.has(post.id);
            popup.getElement().style.display = expanded || showBubble ? '' : 'none';
            if (showBubble) {
                popup.setHTML(buildBubbleHtml(post));
                return;
            }
            if (!expanded) return;
            if (unlocked) {
                popup.setHTML(buildPopupHtml(post, isFavorite(post)));
                return;
            }
            const location = locationRef.current;
            const distance = location ? distanceMeters(location, { lng: post.location.lng, lat: post.location.lat }) : null;
            popup.setHTML(buildLockedHtml(post, showHint, distance));
        };

        const lockedAreas: GeoJSON.Feature[] = [];
        const points: GeoJSON.Feature[] = [];
        for (const post of posts) {
            const unlocked = isUnlocked(post);
            const area = unlocked ? null : approximateArea(post);
            if (area) lockedAreas.push(areaPolygon(area.center, area.radius));
            const anchorPoint = area ? area.center : { lng: post.location.lng, lat: post.location.lat };
            points.push({ type: 'Feature', properties: { postId: post.id }, geometry: { type: 'Point', coordinates: [anchorPoint.lng, anchorPoint.lat] } });
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
                .setLngLat([anchorPoint.lng, anchorPoint.lat])
                .setHTML('')
                .addTo(map);
            render(popup, post, unlocked);

            // ハートは描き直しで作り替わるので、ポップアップの要素で受ける。地図のクリック（投稿の地点選択）には渡さない。
            // 引きのときのコメントを押したら、点を押したときと同じく、カードが出るズームまで寄る
            popup.getElement().addEventListener('click', (event) => {
                if (!(event.target instanceof Element)) return;
                frontZ += 1;
                popup.getElement().style.setProperty('z-index', String(frontZ), 'important');
                if (event.target.closest('.night-popup-bubble')) {
                    event.stopPropagation();
                    map.easeTo({ center: [anchorPoint.lng, anchorPoint.lat], zoom: IMAGE_ZOOM_THRESHOLD + 1, duration: 600 });
                    return;
                }
                if (!event.target.closest('.night-popup-fav')) return;
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
            popups.set(post.id, { popup, post, unlocked });
        }

        // だいたいの場所の円（破線）。投稿の色（紫）を薄く塗る
        map.addSource(AREA_SOURCE_ID, { type: 'geojson', data: { type: 'FeatureCollection', features: lockedAreas } });
        map.addLayer({ id: AREA_FILL_LAYER_ID, type: 'fill', source: AREA_SOURCE_ID, paint: { 'fill-color': '#8b5cf6', 'fill-opacity': 0.1 } });
        map.addLayer({
            id: AREA_LINE_LAYER_ID,
            type: 'line',
            source: AREA_SOURCE_ID,
            paint: { 'line-color': '#c4b5fd', 'line-opacity': 0.8, 'line-width': 1.5, 'line-dasharray': [2, 2] },
        });

        // 引きのときの点とクラスタ（IMAGE_ZOOM_THRESHOLD 未満だけ）。近い投稿は件数の丸にまとめ、押すとそこへ寄る
        map.addSource(POINT_SOURCE_ID, {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: points },
            cluster: true,
            clusterRadius: 44,
            clusterMaxZoom: IMAGE_ZOOM_THRESHOLD - 1,
        });
        map.addLayer({
            id: CLUSTER_LAYER_ID,
            type: 'circle',
            source: POINT_SOURCE_ID,
            maxzoom: IMAGE_ZOOM_THRESHOLD,
            filter: ['has', 'point_count'],
            paint: {
                'circle-color': '#6d28d9',
                'circle-opacity': 0.92,
                'circle-radius': ['step', ['get', 'point_count'], 14, 5, 17, 10, 20],
                'circle-stroke-color': '#ffffff',
                'circle-stroke-opacity': 0.85,
                'circle-stroke-width': 1.5,
            },
        });
        map.addLayer({
            id: CLUSTER_COUNT_LAYER_ID,
            type: 'symbol',
            source: POINT_SOURCE_ID,
            maxzoom: IMAGE_ZOOM_THRESHOLD,
            filter: ['has', 'point_count'],
            layout: { 'text-field': ['get', 'point_count_abbreviated'], 'text-font': COUNT_FONT, 'text-size': 12, 'text-allow-overlap': true },
            paint: { 'text-color': '#ffffff' },
        });
        map.addLayer({
            id: POINT_LAYER_ID,
            type: 'circle',
            source: POINT_SOURCE_ID,
            maxzoom: IMAGE_ZOOM_THRESHOLD,
            filter: ['!', ['has', 'point_count']],
            paint: { 'circle-color': '#a78bfa', 'circle-radius': 6, 'circle-stroke-color': '#ffffff', 'circle-stroke-width': 1.5 },
        });

        const handleClusterClick = (event: maplibregl.MapLayerMouseEvent) => {
            const feature = event.features?.[0];
            const source = map.getSource<maplibregl.GeoJSONSource>(POINT_SOURCE_ID);
            if (!feature || feature.geometry.type !== 'Point' || !source) return;
            const center = feature.geometry.coordinates as [number, number];
            source.getClusterExpansionZoom(feature.properties?.cluster_id)
                .then((zoom) => map.easeTo({ center, zoom: Math.max(zoom, map.getZoom() + 1), duration: 600 }))
                .catch((error: unknown) => console.warn('[usePostPopups] cluster zoom failed', error));
        };
        const handlePointClick = (event: maplibregl.MapLayerMouseEvent) => {
            const feature = event.features?.[0];
            if (!feature || feature.geometry.type !== 'Point') return;
            map.easeTo({ center: feature.geometry.coordinates as [number, number], zoom: IMAGE_ZOOM_THRESHOLD + 1, duration: 600 });
        };
        const setPointer = () => { map.getCanvas().style.cursor = 'pointer'; };
        const clearPointer = () => { map.getCanvas().style.cursor = ''; };
        map.on('click', CLUSTER_LAYER_ID, handleClusterClick);
        map.on('click', POINT_LAYER_ID, handlePointClick);
        for (const layer of [CLUSTER_LAYER_ID, POINT_LAYER_ID]) {
            map.on('mouseenter', layer, setPointer);
            map.on('mouseleave', layer, clearPointer);
        }

        const renderAll = () => {
            for (const { popup, post, unlocked } of popups.values()) render(popup, post, unlocked);
        };
        const handleZoom = () => {
            const next = map.getZoom() >= IMAGE_ZOOM_THRESHOLD;
            const nextHint = map.getZoom() >= HINT_ZOOM_THRESHOLD;
            if (next === expanded && nextHint === showHint) return;
            expanded = next;
            showHint = nextHint;
            renderAll();
        };
        // どの投稿が 1 件の点として見えているかは、MapLibre がまとめた結果（読み込み済みのタイル）から読む。
        // まとめ方はズームごとに変わり、新しいズームのタイルは非同期に作られるので、ソースの更新と移動の終わりで読み直す
        const updateSeparated = () => {
            const next = new Set<string>();
            for (const feature of map.querySourceFeatures(POINT_SOURCE_ID)) {
                const postId = feature.properties?.postId;
                if (!feature.properties?.cluster && typeof postId === 'string') next.add(postId);
            }
            if (next.size === separated.size && [...next].every((id) => separated.has(id))) return;
            separated = next;
            renderAll();
        };
        const handleSourceData = (event: maplibregl.MapSourceDataEvent) => {
            if (event.sourceId === POINT_SOURCE_ID && event.isSourceLoaded) updateSeparated();
        };
        map.on('zoom', handleZoom);
        map.on('sourcedata', handleSourceData);
        map.on('moveend', updateSeparated);
        rerenderRef.current = renderAll;

        return () => {
            rerenderRef.current = null;
            map.off('zoom', handleZoom);
            map.off('sourcedata', handleSourceData);
            map.off('moveend', updateSeparated);
            map.off('click', CLUSTER_LAYER_ID, handleClusterClick);
            map.off('click', POINT_LAYER_ID, handlePointClick);
            for (const layer of [CLUSTER_LAYER_ID, POINT_LAYER_ID]) {
                map.off('mouseenter', layer, setPointer);
                map.off('mouseleave', layer, clearPointer);
            }
            for (const { popup } of popups.values()) popup.remove();
            // 地図の破棄（map.remove）後に呼ばれても落ちないようにする
            if (!map.getStyle()) return;
            for (const layer of [POINT_LAYER_ID, CLUSTER_COUNT_LAYER_ID, CLUSTER_LAYER_ID]) {
                if (map.getLayer(layer)) map.removeLayer(layer);
            }
            if (map.getSource(POINT_SOURCE_ID)) map.removeSource(POINT_SOURCE_ID);
            if (map.getLayer(AREA_LINE_LAYER_ID)) map.removeLayer(AREA_LINE_LAYER_ID);
            if (map.getLayer(AREA_FILL_LAYER_ID)) map.removeLayer(AREA_FILL_LAYER_ID);
            if (map.getSource(AREA_SOURCE_ID)) map.removeSource(AREA_SOURCE_ID);
        };
    }, [map, isLoaded, posts, enabled, isUnlocked]);
}

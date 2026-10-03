import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';

// revealId: 選ぶたびに変える番号。同じ地点をもう一度選んだときも、ピンを立て直してポップアップを開く
export type SearchResultPlace = { lng: number; lat: number; name: string; revealId?: number };

// 検索結果（とお気に入りの一覧から開いた地点）に立てるピン。デバッグ用の紫のピン（選択地点。コンパスの中心になる）
// とは別もので、目印として見せるだけ。紫は選択中の色なので、こちらは白にして区別する。
// ピンを立てたらポップアップ（名前とお気に入りの追加・解除）を開く。ピンを押すと開き直せる
const SEARCH_PIN_COLOR = '#f5f5f5';

// ボタンの文言が「追加 / 外す」と動作を表すので aria-pressed は付けない（付けると「外す, 押下」と矛盾して読まれる）。
// ハートの記号は読み上げない
function renderFavoriteButton(button: HTMLButtonElement, isFavorite: boolean) {
    const glyph = document.createElement('span');
    glyph.setAttribute('aria-hidden', 'true');
    glyph.textContent = isFavorite ? '♥ ' : '♡ ';
    button.replaceChildren(glyph, isFavorite ? 'お気に入りから外す' : 'お気に入りに追加');
    button.dataset.favorite = String(isFavorite);
}

export function useSearchResultMarker(
    map: maplibregl.Map | null,
    place: SearchResultPlace | null,
    isFavorite: boolean,
    onToggleFavorite: (place: SearchResultPlace) => void,
) {
    const buttonRef = useRef<HTMLButtonElement | null>(null);
    // ポップアップの DOM はピンごとに 1 回だけ作るので、押したときは最新の状態と処理を使う
    const toggleRef = useRef(onToggleFavorite);
    useEffect(() => {
        toggleRef.current = onToggleFavorite;
    }, [onToggleFavorite]);

    const lng = place?.lng;
    const lat = place?.lat;
    const name = place?.name;
    const revealId = place?.revealId;

    useEffect(() => {
        if (!map || lng === undefined || lat === undefined || name === undefined) return;

        const root = document.createElement('div');
        root.className = 'debug-popup-card';
        const title = document.createElement('p');
        title.className = 'search-popup-title';
        title.textContent = name;
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'search-popup-favorite';
        button.addEventListener('click', () => toggleRef.current({ lng, lat, name }));
        buttonRef.current = button;
        root.append(title, button);

        const popup = new maplibregl.Popup({ closeButton: true, closeOnClick: false, maxWidth: '260px', className: 'debug-popup' })
            .setDOMContent(root);
        const marker = new maplibregl.Marker({ color: SEARCH_PIN_COLOR }).setLngLat([lng, lat]).setPopup(popup).addTo(map);
        const element = marker.getElement();
        element.setAttribute('aria-label', `検索結果: ${name}`);
        element.style.cursor = 'pointer';
        marker.togglePopup();
        return () => {
            buttonRef.current = null;
            marker.remove();
        };
    }, [map, lng, lat, name, revealId]);

    // お気に入りの状態はポップアップを作り直さずに、ボタンの表示だけ変える
    useEffect(() => {
        const button = buttonRef.current;
        if (!button) return;
        renderFavoriteButton(button, isFavorite);
    }, [isFavorite, lng, lat, name, revealId]);
}

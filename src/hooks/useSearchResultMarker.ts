import { useEffect } from 'react';
import maplibregl from 'maplibre-gl';

export type SearchResultPlace = { lng: number; lat: number; name: string };

// 検索結果を選んだ地点に立てるピン。デバッグ用の紫のピン（選択地点。コンパスの中心になる）とは別もので、
// 目印として見せるだけ。紫は選択中の色なので、こちらは白にして区別する
const SEARCH_PIN_COLOR = '#f5f5f5';

export function useSearchResultMarker(map: maplibregl.Map | null, place: SearchResultPlace | null) {
    const lng = place?.lng;
    const lat = place?.lat;
    const name = place?.name;

    useEffect(() => {
        if (!map || lng === undefined || lat === undefined) return;
        const marker = new maplibregl.Marker({ color: SEARCH_PIN_COLOR }).setLngLat([lng, lat]).addTo(map);
        const element = marker.getElement();
        element.setAttribute('role', 'img');
        element.setAttribute('aria-label', `検索結果: ${name ?? ''}`);
        element.title = name ?? '';
        return () => {
            marker.remove();
        };
    }, [map, lng, lat, name]);
}

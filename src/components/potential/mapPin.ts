import maplibregl, { type Offset } from 'maplibre-gl';

// 地図に立てるピン（選択地点の紫、検索結果・お気に入りの白）。MapLibre の既定のしずく形の代わりに、
// 地図ボタンと同じガラス調の丸い頭 + 細い軸 + 地面の点にする。地面の点が実際の地点を指す。
// 見た目は index.css の .map-pin。寸法を変えたら PIN_HEIGHT も合わせる
export type MapPinTone = 'violet' | 'white';

// 頭 26 + 軸 10 + 地面の点の半分 3（anchor: bottom の位置から頭の上端まで）
const PIN_HEIGHT = 39;
// ポップアップの吹き出しの先（10px）がピンの頭のすぐ上に来るよう、余白は足さない
const POPUP_GAP = 0;

export function createMapPinElement(tone: MapPinTone): HTMLDivElement {
    const root = document.createElement('div');
    root.className = `map-pin map-pin--${tone}`;
    const head = document.createElement('span');
    head.className = 'map-pin__head';
    const stem = document.createElement('span');
    stem.className = 'map-pin__stem';
    const base = document.createElement('span');
    base.className = 'map-pin__base';
    root.append(head, stem, base);
    return root;
}

// 地面の点の中心が地点に来るよう、下端から点の半径分だけ下げる。
// 3D 地形（誇張あり）の上では、見えている地点でも「地形に隠れた」と判定されて 20% に薄くなることがあるので、
// 隠れた扱いでも薄くしない（ピンは目印なので常に見せる）
export function createMapPin(tone: MapPinTone): maplibregl.Marker {
    return new maplibregl.Marker({ element: createMapPinElement(tone), anchor: 'bottom', offset: [0, 3], opacityWhenCovered: '1' });
}

// 独自の要素のピンでは Marker.setPopup がポップアップの位置をずらさないので、ピンの頭の上に出るよう指定する
export const MAP_PIN_POPUP_OFFSET: Offset = {
    top: [0, 6],
    'top-left': [0, 6],
    'top-right': [0, 6],
    bottom: [0, -(PIN_HEIGHT + POPUP_GAP)],
    'bottom-left': [0, -(PIN_HEIGHT + POPUP_GAP)],
    'bottom-right': [0, -(PIN_HEIGHT + POPUP_GAP)],
    left: [13, -(PIN_HEIGHT - 13)],
    right: [-13, -(PIN_HEIGHT - 13)],
    center: [0, -(PIN_HEIGHT - 13)],
};

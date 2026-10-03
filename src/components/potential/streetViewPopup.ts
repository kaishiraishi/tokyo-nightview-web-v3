import maplibregl from 'maplibre-gl';
import type { MapLocation } from '../../lib/potentialSampler';
import { MAP_PIN_POPUP_OFFSET } from './mapPin';

// デバッグモードのピンを押したときのポップアップ。Google マップの Street View を別タブで開くリンクだけを出す
// （規約上、Google の画像・API を MapLibre の画面に埋め込まない。Maps Platform ToS §3.2.3(e)）
export function createStreetViewPopup(location: MapLocation): maplibregl.Popup {
    const root = document.createElement('div');
    root.className = 'debug-popup-card';

    const link = document.createElement('a');
    link.href = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${location.lat},${location.lng}`;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.className = 'debug-popup-link';
    link.textContent = '周辺のストリートビューを探す ↗';

    const note = document.createElement('p');
    note.className = 'debug-popup-note';
    note.textContent = '画像がない地点では、近くの場所が表示されることがあります。Google マップが別タブで開きます。';

    root.append(link, note);
    // 独自のピン（mapPin.ts）の頭の上に出す
    return new maplibregl.Popup({ closeButton: true, closeOnClick: true, maxWidth: '280px', className: 'debug-popup', offset: MAP_PIN_POPUP_OFFSET })
        .setDOMContent(root);
}

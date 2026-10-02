import { useEffect } from 'react';
import maplibregl from 'maplibre-gl';
import {
    inspectPotentialPixel,
    MAX_POTENTIAL_VALUE,
    POTENTIAL_THRESHOLD,
    type PotentialPixelInfo,
} from '../lib/potentialSampler';
import { upperPercent } from '../lib/potentialStats';
import { getVisualStrength } from '../components/potential/prototypes/colorScale';

function row(label: string, value: string, emphasis = false) {
    const element = document.createElement('div');
    element.className = 'pixel-inspector-row';
    const labelElement = document.createElement('span');
    labelElement.textContent = label;
    const valueElement = document.createElement('span');
    valueElement.textContent = value;
    if (emphasis) valueElement.className = 'pixel-inspector-strong';
    element.append(labelElement, valueElement);
    return element;
}

function rankText(value: number) {
    if (value <= 0) return `閾値 ${POTENTIAL_THRESHOLD} 未満（透明）`;
    const upper = upperPercent(value);
    if (upper === null) return '—';
    const saturated = value >= MAX_POTENTIAL_VALUE - 1e-6 ? '（飽和: これ以上は区別不可）' : '';
    return `上位 ${upper < 1 ? upper.toFixed(2) : upper.toFixed(1)}%${saturated}`;
}

function buildContent(lngLat: maplibregl.LngLat, info: PotentialPixelInfo | null) {
    const root = document.createElement('div');
    root.className = 'pixel-inspector-card';
    root.append(row('地点', `${lngLat.lat.toFixed(5)}, ${lngLat.lng.toFixed(5)}`));
    if (!info) {
        root.append(row('結果', 'この地点のタイルがありません'));
        return root;
    }
    const [r, g, b, a] = info.pixel;
    root.append(
        row('順位', rankText(info.value), true),
        row('値', `${info.value.toFixed(4)}（色から復元した近似値）`),
        row('強度', `${Math.round(getVisualStrength(info.value, POTENTIAL_THRESHOLD) * 100)}%`),
        row('画素', `rgba(${r}, ${g}, ${b}, ${a})`),
        row('タイル', `z${info.zoom}/${info.tileX}/${info.tileY} (${info.pixelX}, ${info.pixelY})`),
    );
    const note = document.createElement('div');
    note.className = 'pixel-inspector-note';
    note.textContent = '順位は、閾値以上の画素全体（z14）の中での位置です';
    root.append(note);
    return root;
}

// デバッグモード専用: 地図を右クリックした地点の画素・値・上位 % をポップアップで見せる
export function usePixelInspector(map: maplibregl.Map | null, isLoaded: boolean, enabled: boolean): void {
    useEffect(() => {
        if (!map || !isLoaded || !enabled) return;

        let popup: maplibregl.Popup | null = null;
        // 連続して右クリックしたとき、遅れて返った古い結果で上書きしない
        let requestId = 0;

        const handleContextMenu = (event: maplibregl.MapMouseEvent) => {
            event.preventDefault();
            const current = ++requestId;
            const lngLat = event.lngLat;
            inspectPotentialPixel({ lng: lngLat.lng, lat: lngLat.lat })
                .then((info) => buildContent(lngLat, info))
                .catch((reason: unknown) => {
                    const root = document.createElement('div');
                    root.className = 'pixel-inspector-card';
                    root.append(row('エラー', reason instanceof Error ? reason.message : '画素を読み取れませんでした'));
                    return root;
                })
                .then((content) => {
                    if (current !== requestId) return;
                    popup?.remove();
                    popup = new maplibregl.Popup({ closeButton: true, closeOnClick: true, offset: 10, maxWidth: '320px', className: 'pixel-inspector' })
                        .setLngLat(lngLat)
                        .setDOMContent(content)
                        .addTo(map);
                });
        };

        map.on('contextmenu', handleContextMenu);
        return () => {
            requestId += 1;
            map.off('contextmenu', handleContextMenu);
            popup?.remove();
        };
    }, [map, isLoaded, enabled]);
}

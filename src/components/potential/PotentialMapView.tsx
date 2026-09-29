import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { ExternalLink, Layers, Sparkles } from 'lucide-react';
import { LayerMenu } from '../layout/LayerMenu';
import { LayerSettings } from '../layout/LayerSettings';
import { TopBar } from '../layout/TopBar';
import { CurrentLocationButton } from '../ui/CurrentLocationButton';
import { DirectionalField } from '../directional-field/DirectionalField';
import { PolarHeatmap } from '../polar-heatmap/PolarHeatmap';
import { PrototypePanel } from './prototypes/PrototypePanel';
import { PANEL_VIEWS, readStoredPanelView, type PanelView, writeStoredPanelView } from './PanelViewSelector';
import { POTENTIAL_RANGES, type PotentialRange } from './prototypes/types';
import { deriveDirectionPeaks, polarPointsFromGrid, type MapLocation } from '../../lib/potentialSampler';
import { usePotentialAnalysis } from '../../hooks/usePotentialAnalysis';
import { useMapLibre, POTENTIAL_MODES, POTENTIAL_FILTERED_LAYER_PREFIX } from '../../hooks/useMapLibre';
import { useGeolocation } from '../../hooks/useGeolocation';
import { searchLocation, type GeocodingResult } from '../../lib/api/geocodingApi';
import 'maplibre-gl/dist/maplibre-gl.css';

// 地図の手がかり量は「絞って探す」に固定
const POTENTIAL_MODE_ID = 'focused';

const POLAR_ZOOM_LEVELS = POTENTIAL_RANGES;

function getIsMobileViewport() {
    return typeof window !== 'undefined' && window.innerWidth < 768;
}

function formatDistance(distance: number) {
    return distance >= 1000 ? `${distance / 1000} km` : `${distance} m`;
}

export function PotentialMapView() {
    const containerRef = useRef<HTMLDivElement>(null);
    const { map, isLoaded } = useMapLibre(containerRef);
    const { location: currentLocation } = useGeolocation();
    const [isMobileViewport, setIsMobileViewport] = useState(getIsMobileViewport);
    const [isLayerMenuOpen, setIsLayerMenuOpen] = useState(() => !getIsMobileViewport());
    const [potentialEnabled, setPotentialEnabled] = useState(true);
    const [viirsEnabled, setViirsEnabled] = useState(false);
    const [aerialEnabled, setAerialEnabled] = useState(false);
    const [potentialOpacity, setPotentialOpacity] = useState(0.82);
    const [selectedLocation, setSelectedLocation] = useState<MapLocation | null>(null);
    const [panelView, setPanelView] = useState<PanelView>(() => readStoredPanelView());
    const [maxDistance, setMaxDistance] = useState<PotentialRange>(200);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<GeocodingResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [locateError, setLocateError] = useState<string | null>(null);
    const { rawSamples, viewModel, isLoading: isSampling, error: samplingError } = usePotentialAnalysis({
        center: selectedLocation,
        range: maxDistance,
        threshold: POTENTIAL_MODES.find((mode) => mode.id === POTENTIAL_MODE_ID)!.threshold,
    });
    const potentialPoints = useMemo(() => (rawSamples ? polarPointsFromGrid(rawSamples) : []), [rawSamples]);
    const directionPeaks = useMemo(() => deriveDirectionPeaks(potentialPoints), [potentialPoints]);
    const currentPanelViewLabel = PANEL_VIEWS.find((view) => view.id === panelView)?.label ?? '現状';

    useEffect(() => {
        const handleViewportResize = () => setIsMobileViewport(getIsMobileViewport());
        window.addEventListener('resize', handleViewportResize);
        return () => window.removeEventListener('resize', handleViewportResize);
    }, []);

    useEffect(() => {
        if (!map || !isLoaded) return;

        const handleMapClick = (event: maplibregl.MapMouseEvent) => {
            setSelectedLocation({ lng: event.lngLat.lng, lat: event.lngLat.lat });
        };

        map.on('click', handleMapClick);
        return () => {
            map.off('click', handleMapClick);
        };
    }, [isLoaded, map]);

    useEffect(() => {
        if (!map) return;
        const marker = selectedLocation
            ? new maplibregl.Marker({ color: '#a78bfa' }).setLngLat([selectedLocation.lng, selectedLocation.lat]).addTo(map)
            : null;
        return () => {
            marker?.remove();
        };
    }, [map, selectedLocation]);

    useEffect(() => {
        if (!map || !isLoaded) return;
        for (const mode of POTENTIAL_MODES) {
            const layerId = `${POTENTIAL_FILTERED_LAYER_PREFIX}${mode.id}`;
            if (!map.getLayer(layerId)) continue;
            map.setLayoutProperty(layerId, 'visibility', potentialEnabled && mode.id === POTENTIAL_MODE_ID ? 'visible' : 'none');
            map.setPaintProperty(layerId, 'raster-opacity', potentialOpacity);
        }
    }, [map, isLoaded, potentialEnabled, potentialOpacity]);

    useEffect(() => {
        if (!map || !isLoaded) return;
        const viirsLayer = map.getLayer('viirs-nightlight-layer');
        const aerialLayer = map.getLayer('aerial-photo-layer');
        if (viirsLayer) map.setLayoutProperty('viirs-nightlight-layer', 'visibility', viirsEnabled ? 'visible' : 'none');
        if (aerialLayer) map.setLayoutProperty('aerial-photo-layer', 'visibility', aerialEnabled ? 'visible' : 'none');
    }, [map, isLoaded, viirsEnabled, aerialEnabled]);

    useEffect(() => {
        if (!locateError) return;
        const timer = window.setTimeout(() => setLocateError(null), 3000);
        return () => window.clearTimeout(timer);
    }, [locateError]);

    const handleSearch = useCallback(async (query: string) => {
        if (!query.trim()) return;
        setIsSearching(true);
        const results = await searchLocation(query);
        setSearchResults(results);
        setShowResults(results.length > 0);
        setIsSearching(false);
    }, []);

    const handleSelectResult = useCallback((result: GeocodingResult) => {
        map?.flyTo({ center: [result.lng, result.lat], zoom: 13, duration: 1200 });
        setSearchQuery(result.displayName.split(',')[0]);
        setShowResults(false);
    }, [map]);

    const handleLocate = useCallback(() => {
        if (!map) return;
        if (!currentLocation) {
            setLocateError('現在地を取得できませんでした');
            return;
        }
        map.flyTo({ center: [currentLocation.lng, currentLocation.lat], zoom: 14, duration: 1200 });
    }, [currentLocation, map]);

    const handlePanelViewChange = useCallback((nextPanelView: PanelView) => {
        setPanelView(writeStoredPanelView(nextPanelView));
    }, []);

    const streetViewBlock = selectedLocation ? (
            <div className="mt-3 border-t border-white/10 pt-3">
                <a
                    href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${selectedLocation.lat},${selectedLocation.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-sky-300/25 bg-sky-300/[0.08] px-3 py-2 text-center text-xs font-semibold text-sky-100 transition-colors hover:border-sky-200/50 hover:bg-sky-300/[0.14]"
                >
                    <span>Google マップで周辺のストリートビューを探す</span>
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                </a>
                <p className="mt-2 text-center text-[10px] leading-relaxed text-white/40">
                    選択地点に画像がない場合は、近くの場所が表示されることがあります。Google マップが別タブで開きます。
                </p>
            </div>
    ) : null;

    return (
        <div className="relative h-full w-full text-white">
            <div ref={containerRef} className="h-full w-full touch-none" />

            <TopBar
                mode="explore"
                onModeChange={() => undefined}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onSearchSubmit={() => handleSearch(searchQuery)}
                isSearching={isSearching}
                searchResults={searchResults}
                showResults={showResults}
                onSelectResult={handleSelectResult}
                onCloseResults={() => setShowResults(false)}
                onFocusSearch={() => searchResults.length > 0 && setShowResults(true)}
                postCount={0}
                panelView={panelView}
                onPanelViewChange={handlePanelViewChange}
            />

            <div className="absolute top-36 left-4 right-4 z-[7000] flex flex-col gap-2 pointer-events-none md:left-auto md:right-4 md:w-[520px]">
                {locateError && (
                    <div className="pointer-events-auto flex items-center justify-between gap-2 rounded-full border border-white/20 bg-red-500/95 px-4 py-2 text-xs font-bold text-white shadow-lg">
                        <span>{locateError}</span>
                        <button
                            type="button"
                            onClick={() => setLocateError(null)}
                            className="grid h-11 w-11 shrink-0 place-items-center rounded-full hover:bg-white/20"
                            aria-label="エラーを閉じる"
                        >
                            ✕
                        </button>
                    </div>
                )}
            </div>

            <LayerMenu isOpen={isLayerMenuOpen} onToggle={() => setIsLayerMenuOpen((open) => !open)}>
                <div className="flex h-full flex-col bg-transparent text-white">
                    <LayerSettings
                        viirsEnabled={viirsEnabled}
                        setViirsEnabled={setViirsEnabled}
                        potentialEnabled={potentialEnabled}
                        setPotentialEnabled={setPotentialEnabled}
                        aerialEnabled={aerialEnabled}
                        setAerialEnabled={setAerialEnabled}
                    />

                    <div className="flex-1 overflow-y-auto p-4">
                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                            <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-white/70">
                                <Sparkles className="h-4 w-4 text-violet-300" />
                                夜景ポテンシャルの目安
                            </div>
                            <div
                                className="mt-4 h-3 rounded-full"
                                style={{
                                    background:
                                        'linear-gradient(to right, rgba(20,18,30,0.16), rgba(38,25,74,0.35), rgba(86,35,102,0.55), rgba(190,75,70,0.78), rgba(255,166,0,0.92), rgba(255,239,120,1))',
                                }}
                            />
                            <div className="mt-2 flex justify-between text-[11px] text-white/45">
                                <span>低い</span>
                                <span>高い</span>
                            </div>
                            <label className="mt-5 block text-xs text-white/60" htmlFor="potential-opacity">
                                不透明度: {Math.round(potentialOpacity * 100)}%
                            </label>
                            <input
                                id="potential-opacity"
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={potentialOpacity}
                                onChange={(event) => setPotentialOpacity(Number(event.target.value))}
                                className="mt-3 h-1.5 w-full accent-emerald-400"
                            />
                            <p className="mt-4 text-xs leading-relaxed text-white/45">
                                色が明るいエリアほど、夜景を見つけられる可能性が高い場所です。
                            </p>
                        </div>

                        <div className="mt-4 text-[11px] leading-relaxed text-white/50">
                            表示は メニュー → 設定 で切替（現在: {currentPanelViewLabel}）
                        </div>

                        {(panelView === 'field' || panelView === 'polar') && (
                            <div className="mt-4">
                                <PrototypePanel
                                    data={viewModel}
                                    type={panelView}
                                    isUpdating={isSampling}
                                    range={maxDistance}
                                    onRangeChange={setMaxDistance}
                                    error={samplingError}
                                    status={
                                        isSampling
                                            ? 'クリック地点の周囲をサンプリング中…'
                                            : selectedLocation
                                                ? `選択地点 ${selectedLocation.lat.toFixed(4)}, ${selectedLocation.lng.toFixed(4)}`
                                                : '地図上をクリックして地点を選択'
                                    }
                                >
                                    {streetViewBlock && <div className="rounded-2xl border border-white/10 bg-zinc-950/90 px-3 pb-3">{streetViewBlock}</div>}
                                </PrototypePanel>
                            </div>
                        )}

                        {panelView === 'classicField' && (
                        <div className="mt-4 rounded-2xl border border-white/10 bg-[#080c10] p-3">
                            <div className="flex items-center justify-between gap-3 px-1">
                                <div>
                                    <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-white/75">
                                        <Sparkles className="h-4 w-4 text-violet-300" />
                                        Directional Field
                                    </div>
                                    <p className="mt-1 text-[11px] text-white/40">周囲の強い方向を気配で表示</p>
                                </div>
                            </div>

                            <DirectionalField
                                peaks={directionPeaks}
                                size={246}
                                palette="opportunity"
                                showForward
                                interactive
                                className="mx-auto mt-2"
                            />
                            <div className="mt-2 rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-center text-[11px] text-white/45">
                                {isSampling
                                    ? 'クリック地点の周囲をサンプリング中…'
                                    : selectedLocation
                                        ? `選択地点 ${selectedLocation.lat.toFixed(4)}, ${selectedLocation.lng.toFixed(4)}`
                                        : '地図上をクリックして地点を選択'}
                            </div>
                            {samplingError && <p className="mt-2 text-center text-[11px] text-amber-200/80">{samplingError}</p>}
                            {streetViewBlock}
                        </div>
                        )}

                        {panelView === 'classicPolar' && (
                        <div className="mt-4 rounded-2xl border border-white/10 bg-[#081019] p-3">
                            <div className="px-1">
                                <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-white/75">
                                    <Layers className="h-4 w-4 text-cyan-300" />
                                    Polar Heatmap
                                </div>
                                <p className="mt-1 text-[11px] text-white/40">方向 × 距離 × 強度</p>
                            </div>

                            <PolarHeatmap
                                points={potentialPoints}
                                maxDistance={maxDistance}
                                size={246}
                                palette="potential"
                                showGrid
                                showCenter
                                interactive
                                className="mx-auto mt-2"
                            />

                            <div className="mt-2 flex items-center justify-between gap-2">
                                <button
                                    type="button"
                                    onClick={() => setMaxDistance((current) => POLAR_ZOOM_LEVELS[Math.max(0, POLAR_ZOOM_LEVELS.indexOf(current) - 1)])}
                                    disabled={maxDistance === POLAR_ZOOM_LEVELS[0]}
                                    className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-lg text-white/75 transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-30"
                                    aria-label="表示距離を縮める"
                                >
                                    −
                                </button>
                                <div className="min-w-24 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-center text-sm font-semibold tabular-nums text-white/90">
                                    {formatDistance(maxDistance)}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setMaxDistance((current) => POLAR_ZOOM_LEVELS[Math.min(POLAR_ZOOM_LEVELS.length - 1, POLAR_ZOOM_LEVELS.indexOf(current) + 1)])}
                                    disabled={maxDistance === POLAR_ZOOM_LEVELS[POLAR_ZOOM_LEVELS.length - 1]}
                                    className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-lg text-white/75 transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-30"
                                    aria-label="表示距離を広げる"
                                >
                                    ＋
                                </button>
                            </div>

                            <div
                                className="mt-3 h-2 rounded-full"
                                style={{
                                    background:
                                        'linear-gradient(to right, rgba(20,18,30,0.16), rgba(38,25,74,0.35), rgba(190,75,70,0.78), rgba(255,166,0,0.92))',
                                }}
                            />
                            <div className="mt-1 flex justify-between text-[10px] text-white/35">
                                <span>LOW</span>
                                <span>HIGH</span>
                            </div>
                            {streetViewBlock}
                        </div>
                        )}
                    </div>
                </div>
            </LayerMenu>

            {!(isMobileViewport && isLayerMenuOpen) && (
                <CurrentLocationButton
                    onClick={handleLocate}
                    isNorthUp
                    className={`absolute z-[4500] right-6 ${
                        isMobileViewport
                            ? 'bottom-[calc(55px+24px+env(safe-area-inset-bottom))]'
                            : 'bottom-[calc(24px+env(safe-area-inset-bottom))]'
                    } md:bottom-8 md:right-8`}
                />
            )}

            {!isLoaded && (
                <div className="absolute inset-0 z-[7000] grid place-items-center bg-black text-sm text-white/60">
                    地図を読み込んでいます…
                </div>
            )}
        </div>
    );
}

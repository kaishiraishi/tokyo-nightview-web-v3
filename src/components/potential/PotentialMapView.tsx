import { useCallback, useEffect, useRef, useState } from 'react';
import { Layers, Sparkles } from 'lucide-react';
import { LayerMenu } from '../layout/LayerMenu';
import { LayerSettings } from '../layout/LayerSettings';
import { TopBar } from '../layout/TopBar';
import { CurrentLocationButton } from '../ui/CurrentLocationButton';
import { DirectionalField } from '../directional-field/DirectionalField';
import type { DirectionPeak } from '../directional-field/types';
import { PolarHeatmap } from '../polar-heatmap/PolarHeatmap';
import type { PolarPoint } from '../polar-heatmap/types';
import { useMapLibre, POTENTIAL_LAYER_ID } from '../../hooks/useMapLibre';
import { useGeolocation } from '../../hooks/useGeolocation';
import { searchLocation, type GeocodingResult } from '../../lib/api/geocodingApi';
import 'maplibre-gl/dist/maplibre-gl.css';

const FIELD_PRESETS = {
    rightFront: [
        { angle: 58, strength: 0.98, spread: 56 },
        { angle: 286, strength: 0.36, spread: 50 },
        { angle: 180, strength: 0.08, spread: 44 },
    ],
    wideRight: [{ angle: 70, strength: 0.85, spread: 75 }],
    twoDirections: [
        { angle: 45, strength: 0.9, spread: 30 },
        { angle: 280, strength: 0.55, spread: 40 },
    ],
    balanced: [{ angle: 0, strength: 0.5, spread: 180 }],
} satisfies Record<string, DirectionPeak[]>;

type FieldPreset = keyof typeof FIELD_PRESETS;

const POLAR_POINTS: PolarPoint[] = [
    { angle: 55, distance: 35, strength: 0.58, angleSpread: 22, distanceSpread: 0.09 },
    { angle: 60, distance: 120, strength: 0.96, angleSpread: 27, distanceSpread: 0.12 },
    { angle: 72, distance: 205, strength: 0.74, angleSpread: 34, distanceSpread: 0.1 },
    { angle: 290, distance: 55, strength: 0.38, angleSpread: 30, distanceSpread: 0.11 },
    { angle: 280, distance: 260, strength: 0.48, angleSpread: 38, distanceSpread: 0.14 },
    { angle: 180, distance: 105, strength: 0.1, angleSpread: 44, distanceSpread: 0.14 },
];

const POLAR_ZOOM_LEVELS = [50, 100, 200, 500, 1000];

function formatDistance(distance: number) {
    return distance >= 1000 ? `${distance / 1000} km` : `${distance} m`;
}

export function PotentialMapView() {
    const containerRef = useRef<HTMLDivElement>(null);
    const { map, isLoaded } = useMapLibre(containerRef);
    const { location: currentLocation } = useGeolocation();
    const [isLayerMenuOpen, setIsLayerMenuOpen] = useState(true);
    const [potentialEnabled, setPotentialEnabled] = useState(true);
    const [viirsEnabled, setViirsEnabled] = useState(false);
    const [aerialEnabled, setAerialEnabled] = useState(false);
    const [potentialOpacity, setPotentialOpacity] = useState(0.82);
    const [fieldPreset, setFieldPreset] = useState<FieldPreset>('rightFront');
    const [maxDistance, setMaxDistance] = useState(200);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<GeocodingResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [locateError, setLocateError] = useState<string | null>(null);

    useEffect(() => {
        if (!map || !isLoaded || !map.getLayer(POTENTIAL_LAYER_ID)) return;
        map.setLayoutProperty(POTENTIAL_LAYER_ID, 'visibility', potentialEnabled ? 'visible' : 'none');
        map.setPaintProperty(POTENTIAL_LAYER_ID, 'raster-opacity', potentialOpacity);
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
            />

            <div className="absolute top-36 left-4 right-4 z-[7000] flex flex-col gap-2 pointer-events-none md:left-auto md:right-4 md:w-[520px]">
                {locateError && (
                    <div className="pointer-events-auto flex items-center justify-between gap-2 rounded-full border border-white/20 bg-red-500/95 px-4 py-2 text-xs font-bold text-white shadow-lg">
                        <span>{locateError}</span>
                        <button type="button" onClick={() => setLocateError(null)} className="rounded-full p-1 hover:bg-white/20" aria-label="エラーを閉じる">✕</button>
                    </div>
                )}
            </div>

            <LayerMenu isOpen={isLayerMenuOpen} onToggle={() => setIsLayerMenuOpen((open) => !open)}>
                <div className="flex h-full flex-col bg-transparent text-white">
                    <div className="flex items-center gap-2 border-b border-white/10 px-4 pb-4 pt-4">
                        <Layers className="h-4 w-4 text-white/50" />
                        <div>
                            <div className="text-xs font-bold uppercase tracking-wider text-white/70">表示レイヤー設定</div>
                            <div className="mt-1 text-[11px] text-white/40">夜景ポテンシャルを中心に表示</div>
                        </div>
                    </div>

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
                            <div className="mt-4 h-3 rounded-full bg-gradient-to-r from-[#223b83] via-[#29b47b] to-[#f4c84b]" />
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
                                peaks={FIELD_PRESETS[fieldPreset]}
                                size={246}
                                palette="opportunity"
                                showForward
                                interactive
                                className="mx-auto mt-2"
                            />

                            <div className="mt-2 grid grid-cols-2 gap-2">
                                {([
                                    ['rightFront', '右前方'],
                                    ['wideRight', '右側広域'],
                                    ['twoDirections', '二方向'],
                                    ['balanced', '均一'],
                                ] as const).map(([key, label]) => (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => setFieldPreset(key)}
                                        className={`rounded-xl border px-2 py-2 text-xs font-semibold transition-all ${fieldPreset === key
                                            ? 'border-violet-400/70 bg-violet-700 text-white shadow-lg shadow-violet-900/30'
                                            : 'border-white/10 bg-white/[0.04] text-white/55 hover:bg-white/[0.08] hover:text-white'
                                            }`}
                                        aria-pressed={fieldPreset === key}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mt-4 rounded-2xl border border-white/10 bg-[#081019] p-3">
                            <div className="px-1">
                                <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-white/75">
                                    <Layers className="h-4 w-4 text-cyan-300" />
                                    Polar Heatmap
                                </div>
                                <p className="mt-1 text-[11px] text-white/40">方向 × 距離 × 強度</p>
                            </div>

                            <PolarHeatmap
                                points={POLAR_POINTS}
                                maxDistance={maxDistance}
                                size={246}
                                palette="thermal"
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
                                    className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-lg text-white/75 transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-30"
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
                                    className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-lg text-white/75 transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-30"
                                    aria-label="表示距離を広げる"
                                >
                                    ＋
                                </button>
                            </div>

                            <div className="mt-3 h-2 rounded-full bg-gradient-to-r from-[#071B57] via-[#31C9DD] via-55% to-[#EF3423]" />
                            <div className="mt-1 flex justify-between text-[10px] text-white/35">
                                <span>LOW</span>
                                <span>HIGH</span>
                            </div>
                        </div>
                    </div>
                </div>
            </LayerMenu>

            <CurrentLocationButton
                onClick={handleLocate}
                isNorthUp
                className="absolute bottom-[calc(24px+env(safe-area-inset-bottom))] right-6 md:bottom-8 md:right-8"
            />

            {!isLoaded && (
                <div className="absolute inset-0 z-[7000] grid place-items-center bg-black text-sm text-white/60">
                    地図を読み込んでいます…
                </div>
            )}
        </div>
    );
}

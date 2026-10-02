import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { ExternalLink, User } from '../ui/icons';
import { LayerMenu } from '../layout/LayerMenu';
import { SearchField } from '../layout/SearchField';
import { MOBILE_SHEET_CONTROL_BOTTOMS, nextMobileSheetLevel, type MobileSheetLevel } from '../layout/mobileSheet';
import { AppMenu } from '../menu/AppMenu';
import { ClassicPanels } from './ClassicPanels';
import { CompassMode } from './CompassMode';
import { MapControlStack } from './MapControlStack';
import { MapModesModal } from './MapModesModal';
import { MapModeToggle } from './MapModeToggle';
import { MiniCompass } from './MiniCompass';
import type { CompassControlProps } from './CompassControl';
import { UserLocationMarker } from './UserLocationMarker';
import { PostListPanel } from '../hud/PostListPanel';
import { PostComposer } from './PostComposer';
import { PrototypePanel } from './prototypes/PrototypePanel';
import { PANEL_VIEWS, readStoredPanelView, type PanelView, writeStoredPanelView } from './PanelViewSelector';
import { readStoredDebugMode, writeStoredDebugMode } from '../../lib/debugMode';
import { type PotentialRange } from './prototypes/types';
import { deriveDirectionPeaks, polarPointsFromGrid, type MapLocation } from '../../lib/potentialSampler';
import { usePotentialAnalysis } from '../../hooks/usePotentialAnalysis';
import { useMapLibre, POTENTIAL_MODES, POTENTIAL_FILTERED_LAYER_PREFIX } from '../../hooks/useMapLibre';
import { usePostPopups } from '../../hooks/usePostPopups';
import { usePosts } from '../../hooks/usePosts';
import { useUserLocation } from '../../hooks/useUserLocation';
import { useDeviceHeading } from '../../hooks/useDeviceHeading';
import { searchLocation, type GeocodingResult } from '../../lib/api/geocodingApi';
import { normalizeAngle } from '../../lib/heading';
import 'maplibre-gl/dist/maplibre-gl.css';

// 地図の手がかり量は「絞って探す」に固定
const POTENTIAL_MODE_ID = 'focused';

// メニューのプロフィール表示用の仮データ（認証・プロフィールは Non-goals）
const MENU_PROFILE = {
    displayName: 'KAZUNE',
    memberId: 'No.0001',
    foundCount: 4,
    favoriteCount: 3,
};

// 右下ボタン列（2 ボタン + 余白）の上に投稿ボタンを置くためのオフセット
const CONTROL_STACK_HEIGHT = 'calc(var(--btn-h) * 2 + 24px)';

function getIsMobileViewport() {
    return typeof window !== 'undefined' && window.innerWidth < 768;
}

type PotentialMapViewProps = {
    mode: 'explore' | 'analyze';
    onModeChange: (mode: 'explore' | 'analyze') => void;
};

export function PotentialMapView({ mode, onModeChange }: PotentialMapViewProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const { map, isLoaded } = useMapLibre(containerRef);
    const {
        position: userPosition,
        accuracy: userAccuracy,
        start: startUserLocation,
        error: userLocationError,
    } = useUserLocation();
    const deviceHeading = useDeviceHeading();
    const { start: startDeviceHeading, stop: stopDeviceHeading } = deviceHeading;
    const [isMobileViewport, setIsMobileViewport] = useState(getIsMobileViewport);
    const [isDesktopLayerMenuOpen, setIsDesktopLayerMenuOpen] = useState(() => !getIsMobileViewport());
    const [potentialEnabled, setPotentialEnabled] = useState(true);
    const [aerialEnabled, setAerialEnabled] = useState(false);
    const [potentialOpacity, setPotentialOpacity] = useState(0.82);
    const [selectedLocation, setSelectedLocation] = useState<MapLocation | null>(null);
    const [panelView, setPanelView] = useState<PanelView>(() => readStoredPanelView());
    const [debugMode, setDebugMode] = useState(() => readStoredDebugMode());
    const [maxDistance, setMaxDistance] = useState<PotentialRange>(200);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<GeocodingResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [locateError, setLocateError] = useState<string | null>(null);
    const [mapBearing, setMapBearing] = useState(0);
    const locateRequestRef = useRef(false);
    const isPostMode = mode === 'analyze';
    const { posts, reload: reloadPosts } = usePosts(isPostMode);
    usePostPopups(map, isLoaded, posts, isPostMode);
    const { rawSamples, viewModel, isLoading: isSampling, error: samplingError } = usePotentialAnalysis({
        center: selectedLocation,
        range: maxDistance,
        threshold: POTENTIAL_MODES.find((mode) => mode.id === POTENTIAL_MODE_ID)!.threshold,
    });
    const [mobileSheetLevel, setMobileSheetLevel] = useState<MobileSheetLevel>(() => getIsMobileViewport() ? 'collapsed' : 'expanded');
    const [isMapModesOpen, setIsMapModesOpen] = useState(false);
    const [isCompassModeOpen, setIsCompassModeOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const isLayerMenuOpen = isMobileViewport ? mobileSheetLevel !== 'collapsed' : isDesktopLayerMenuOpen;
    const currentLocation = useMemo(
        () => userPosition ? { lng: userPosition.coords.longitude, lat: userPosition.coords.latitude } : null,
        [userPosition],
    );
    const compassAnalysis = usePotentialAnalysis({
        center: selectedLocation ? null : currentLocation,
        range: maxDistance,
        threshold: POTENTIAL_MODES.find((mode) => mode.id === POTENTIAL_MODE_ID)!.threshold,
    });
    const compassViewModel = selectedLocation ? viewModel : compassAnalysis.viewModel;
    const compassIsSampling = selectedLocation ? isSampling : compassAnalysis.isLoading;
    const potentialPoints = useMemo(() => (rawSamples ? polarPointsFromGrid(rawSamples) : []), [rawSamples]);
    const directionPeaks = useMemo(
        () => deriveDirectionPeaks(potentialPoints.filter((point) => point.distance <= maxDistance)),
        [maxDistance, potentialPoints],
    );
    const currentPanelViewLabel = PANEL_VIEWS.find((view) => view.id === panelView)?.label ?? PANEL_VIEWS[0].label;
    const rotation = deviceHeading.status === 'active' && deviceHeading.heading !== null ? deviceHeading.heading : normalizeAngle(mapBearing);
    const compassEnabled = deviceHeading.status === 'requesting' || deviceHeading.status === 'active';
    const panelStatus = isSampling
        ? 'クリック地点の周囲をサンプリング中…'
        : selectedLocation
            ? `選択地点 ${selectedLocation.lat.toFixed(4)}, ${selectedLocation.lng.toFixed(4)}`
            : '地図上をクリックして地点を選択';

    useEffect(() => {
        const handleViewportResize = () => {
            const nextIsMobile = getIsMobileViewport();
            setIsMobileViewport((current) => {
                if (current !== nextIsMobile) {
                    setMobileSheetLevel(nextIsMobile ? 'collapsed' : 'expanded');
                    setIsDesktopLayerMenuOpen(!nextIsMobile);
                }
                return nextIsMobile;
            });
        };
        window.addEventListener('resize', handleViewportResize);
        return () => window.removeEventListener('resize', handleViewportResize);
    }, []);

    useEffect(() => {
        // 投稿モードでは地図クリックを投稿のピン選択に使うので、地点選択はしない
        if (!map || !isLoaded || isPostMode) return;

        const handleMapClick = (event: maplibregl.MapMouseEvent) => {
            setSelectedLocation({ lng: event.lngLat.lng, lat: event.lngLat.lat });
        };

        map.on('click', handleMapClick);
        return () => {
            map.off('click', handleMapClick);
        };
    }, [isLoaded, isPostMode, map]);

    useEffect(() => {
        if (!map || !isLoaded) return;
        const updateMapBearing = () => setMapBearing(normalizeAngle(map.getBearing()));
        updateMapBearing();
        map.on('rotate', updateMapBearing);
        map.on('move', updateMapBearing);
        return () => {
            map.off('rotate', updateMapBearing);
            map.off('move', updateMapBearing);
        };
    }, [isLoaded, map]);

    useEffect(() => {
        if (!map || !isLoaded || !userPosition || !locateRequestRef.current) return;
        map.flyTo({
            center: [userPosition.coords.longitude, userPosition.coords.latitude],
            zoom: 14,
            duration: 1200,
        });
        locateRequestRef.current = false;
    }, [isLoaded, map, userPosition]);

    useEffect(() => {
        if (!map) return;
        const marker = selectedLocation && !isPostMode
            ? new maplibregl.Marker({ color: '#a78bfa' }).setLngLat([selectedLocation.lng, selectedLocation.lat]).addTo(map)
            : null;
        return () => {
            marker?.remove();
        };
    }, [map, selectedLocation, isPostMode]);

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
        const aerialLayer = map.getLayer('aerial-photo-layer');
        if (aerialLayer) map.setLayoutProperty('aerial-photo-layer', 'visibility', aerialEnabled ? 'visible' : 'none');
    }, [map, isLoaded, aerialEnabled]);

    useEffect(() => {
        if (!locateError) return;
        const timer = window.setTimeout(() => setLocateError(null), 3000);
        return () => window.clearTimeout(timer);
    }, [locateError]);

    useEffect(() => {
        if (userLocationError) setLocateError(userLocationError);
    }, [userLocationError]);

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
        setLocateError(null);
        if (userPosition) {
            locateRequestRef.current = false;
            map.flyTo({
                center: [userPosition.coords.longitude, userPosition.coords.latitude],
                zoom: 14,
                duration: 1200,
            });
        } else {
            locateRequestRef.current = true;
        }
        startUserLocation();
    }, [map, startUserLocation, userPosition]);

    const handleCompassModeStart = useCallback(() => {
        startDeviceHeading();
        setIsCompassModeOpen(true);
    }, [startDeviceHeading]);

    const handleCompassModeClose = useCallback(() => {
        stopDeviceHeading();
        setIsCompassModeOpen(false);
    }, [stopDeviceHeading]);

    const compassControl: CompassControlProps = {
        enabled: compassEnabled,
        onToggle: isMobileViewport
            ? compassEnabled ? handleCompassModeClose : handleCompassModeStart
            : compassEnabled ? deviceHeading.stop : deviceHeading.start,
        status: deviceHeading.status,
        heading: deviceHeading.heading,
        lowAccuracy: deviceHeading.lowAccuracy,
        error: deviceHeading.error,
        isSupported: deviceHeading.isSupported,
    };

    const handleSearchFocus = useCallback(() => {
        if (isMobileViewport) setMobileSheetLevel('expanded');
        if (searchResults.length > 0) setShowResults(true);
    }, [isMobileViewport, searchResults.length]);

    const handleMobileSheetToggle = useCallback(() => {
        setMobileSheetLevel((level) => nextMobileSheetLevel(level));
    }, []);

    const handleLayerMenuToggle = useCallback(() => {
        if (isMobileViewport) {
            handleMobileSheetToggle();
            return;
        }
        setIsDesktopLayerMenuOpen((open) => !open);
    }, [handleMobileSheetToggle, isMobileViewport]);

    const handlePanelViewChange = useCallback((nextPanelView: PanelView) => {
        setPanelView(writeStoredPanelView(nextPanelView));
    }, []);

    const handleDebugModeChange = useCallback((enabled: boolean) => {
        setDebugMode(writeStoredDebugMode(enabled));
    }, []);

    // Street View リンクは検証用なので、設定でデバッグモードを ON にしたときだけ出す。
    const streetViewBlock = debugMode && selectedLocation ? (
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
            <UserLocationMarker
                map={map}
                position={userPosition}
                accuracy={userAccuracy}
                compassActive={deviceHeading.status === 'active'}
                heading={deviceHeading.heading}
                mapBearing={mapBearing}
            />

            {!isPostMode && (
                <div className={`absolute left-4 top-[calc(16px+env(safe-area-inset-top))] z-[4500] transition-[left] duration-300 ${isDesktopLayerMenuOpen ? 'md:left-[352px]' : ''}`}>
                    <MiniCompass
                        data={compassViewModel}
                        rotation={rotation}
                        range={maxDistance}
                        isLoading={compassIsSampling}
                        onClick={handleCompassModeStart}
                    />
                </div>
            )}

            <MapModeToggle
                mode={mode}
                onModeChange={onModeChange}
                className="absolute right-4 top-[calc(16px+env(safe-area-inset-top))] z-[5000]"
            />

            <AppMenu
                isOpen={isMenuOpen}
                onClose={() => setIsMenuOpen(false)}
                displayName={MENU_PROFILE.displayName}
                memberId={MENU_PROFILE.memberId}
                foundCount={MENU_PROFILE.foundCount}
                favoriteCount={MENU_PROFILE.favoriteCount}
                postCount={posts.length}
                onViewPosts={() => onModeChange('analyze')}
                panelView={panelView}
                onPanelViewChange={handlePanelViewChange}
                debugMode={debugMode}
                onDebugModeChange={handleDebugModeChange}
            />

            <div className="pointer-events-none absolute left-4 right-4 top-[calc(84px+env(safe-area-inset-top))] z-[7000] flex flex-col gap-2 md:left-auto md:right-4 md:w-[520px]">
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

            <LayerMenu
                isOpen={isLayerMenuOpen}
                onToggle={handleLayerMenuToggle}
                mobileLevel={isMobileViewport ? mobileSheetLevel : undefined}
            >
                <div className="flex h-full min-h-0 flex-col bg-transparent text-white">
                    <div className="shrink-0 border-b border-white/10 px-3 pb-3 pt-1 md:p-4">
                        <div className="mb-2 hidden items-center justify-between gap-2 md:flex">
                            <div>
                                <p className="text-[10px] font-semibold tracking-[0.18em] text-white/40">{isPostMode ? 'POSTS' : 'EXPLORE'}</p>
                                <p className="mt-1 text-sm font-semibold text-white/85">{isPostMode ? '夜景の投稿' : '夜景を探す'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setIsMenuOpen(true)}
                            aria-label="メニューを開く"
                            title="メニュー"
                            className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.06] text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                        >
                            <User className="h-5 w-5" aria-hidden="true" />
                        </button>
                        <SearchField
                            searchQuery={searchQuery}
                            onSearchChange={setSearchQuery}
                            onSearchSubmit={() => {
                                if (isMobileViewport) setMobileSheetLevel('expanded');
                                void handleSearch(searchQuery);
                            }}
                            isSearching={isSearching}
                            searchResults={searchResults}
                            showResults={showResults}
                            onSelectResult={handleSelectResult}
                            onCloseResults={() => setShowResults(false)}
                            onFocusSearch={handleSearchFocus}
                            variant={isMobileViewport ? 'sheet' : 'side'}
                        />
                        </div>
                    </div>

                    {isPostMode && (!isMobileViewport || mobileSheetLevel !== 'collapsed') && (
                        <div className="min-h-0 flex-1 overflow-y-auto">
                            <PostListPanel
                                posts={posts}
                                onPostClick={(post) => {
                                    map?.flyTo({ center: [post.location.lng, post.location.lat], zoom: 16, duration: 1200 });
                                    if (isMobileViewport) setMobileSheetLevel('collapsed');
                                }}
                            />
                        </div>
                    )}

                    {!isPostMode && (!isMobileViewport || mobileSheetLevel !== 'collapsed') && (
                        <div className="min-h-0 flex-1 overflow-y-auto p-4 pb-[calc(24px+env(safe-area-inset-bottom))]">
                            <button type="button" onClick={() => setMobileSheetLevel((level) => level === 'medium' ? 'expanded' : 'medium')} className="flex w-full items-center justify-between gap-3 text-left">
                                <span>
                                    <span className="block text-[10px] font-semibold tracking-[0.18em] text-white/40">DIRECTION &amp; DISTANCE</span>
                                    <span className="mt-1 block text-base font-semibold text-white/90">方向・距離</span>
                                </span>
                                <span className="text-xl text-white/45" aria-hidden="true">›</span>
                            </button>
                            <p className="mt-1 text-[11px] text-white/45">{currentPanelViewLabel} · Range {maxDistance >= 1000 ? '1km' : `${maxDistance}m`}</p>

                            {(panelView === 'field' || panelView === 'polar') && (
                                <div className="mt-4">
                                    <PrototypePanel
                                        data={viewModel}
                                        type={panelView}
                                        isUpdating={isSampling}
                                        range={maxDistance}
                                        onRangeChange={setMaxDistance}
                                        rotation={rotation}
                                        compass={compassControl}
                                        hasSelection={selectedLocation !== null}
                                        error={samplingError}
                                        status={panelStatus}
                                    >
                                        {streetViewBlock && <div className="rounded-2xl border border-white/10 bg-zinc-950/90 px-3 pb-3">{streetViewBlock}</div>}
                                    </PrototypePanel>
                                </div>
                            )}

                            {(panelView === 'classicField' || panelView === 'classicPolar') && (
                                <ClassicPanels
                                    view={panelView}
                                    directionPeaks={directionPeaks}
                                    potentialPoints={potentialPoints}
                                    maxDistance={maxDistance}
                                    onRangeChange={setMaxDistance}
                                    rotation={rotation}
                                    compass={compassControl}
                                    status={panelStatus}
                                    error={samplingError}
                                    hasSelection={selectedLocation !== null}
                                    streetViewBlock={streetViewBlock}
                                />
                            )}

                            <p className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3 text-[11px] leading-relaxed text-white/45">色が明るいエリアほど、夜景を見つけられる可能性が高い場所です。表示モードやレイヤーは 右下の地図ボタンから切り替えられます。</p>
                        </div>
                    )}
                </div>
            </LayerMenu>

            {/* シート最大時はボタン列が右上のモード切替と重なるので隠す */}
            {!(isMobileViewport && mobileSheetLevel === 'expanded') && (
            <MapControlStack
                onLocate={handleLocate}
                onOpenMapModes={() => setIsMapModesOpen(true)}
                isMapModesOpen={isMapModesOpen}
                style={isMobileViewport ? { bottom: MOBILE_SHEET_CONTROL_BOTTOMS[mobileSheetLevel] } : undefined}
                className="absolute right-4 z-[4500] md:bottom-8 md:right-8"
            />
            )}

            {isPostMode && (
                <PostComposer
                    map={map}
                    currentLocation={currentLocation}
                    onRequestLocation={startUserLocation}
                    onPosted={reloadPosts}
                    style={{ bottom: `calc(${isMobileViewport ? MOBILE_SHEET_CONTROL_BOTTOMS[mobileSheetLevel] : '32px'} + ${CONTROL_STACK_HEIGHT})` }}
                />
            )}

            <MapModesModal
                isOpen={isMapModesOpen}
                onClose={() => setIsMapModesOpen(false)}
                potentialEnabled={potentialEnabled}
                setPotentialEnabled={setPotentialEnabled}
                aerialEnabled={aerialEnabled}
                setAerialEnabled={setAerialEnabled}
                potentialOpacity={potentialOpacity}
                setPotentialOpacity={setPotentialOpacity}
            />

            {isCompassModeOpen && (
                <CompassMode
                    data={compassViewModel}
                    isLoading={compassIsSampling}
                    range={maxDistance}
                    onRangeChange={setMaxDistance}
                    status={deviceHeading.status}
                    heading={deviceHeading.heading}
                    lowAccuracy={deviceHeading.lowAccuracy}
                    error={selectedLocation ? samplingError : compassAnalysis.error}
                    isSupported={deviceHeading.isSupported}
                    onClose={handleCompassModeClose}
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

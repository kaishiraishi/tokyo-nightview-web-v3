import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import maplibregl from 'maplibre-gl';
import { User } from '../ui/icons';
import { LayerMenu } from '../layout/LayerMenu';
import { SearchField } from '../layout/SearchField';
import { FloatingSearchBar } from '../layout/FloatingSearchBar';
import { createStreetViewPopup } from './streetViewPopup';
import { MOBILE_SHEET_CONTROL_BOTTOMS, nextMobileSheetLevel, type MobileSheetLevel } from '../layout/mobileSheet';
import { AppMenu } from '../menu/AppMenu';
import { CompassMode } from './CompassMode';
import { MapControlStack } from './MapControlStack';
import { MapModesModal } from './MapModesModal';
import { MapModeToggle } from './MapModeToggle';
import { MiniCompass } from './MiniCompass';
import { UserLocationMarker } from './UserLocationMarker';
import { PostListPanel } from '../hud/PostListPanel';
import { PostComposer } from './PostComposer';
import { readStoredPanelView, type PanelView, writeStoredPanelView } from './PanelViewSelector';
import {
    readStoredBuildingsEnabled,
    readStoredDebugMode,
    readStoredHeadingSensor,
    readStoredPotentialScope,
    writeStoredBuildingsEnabled,
    writeStoredDebugMode,
    writeStoredHeadingSensor,
    writeStoredPotentialScope,
    type PotentialDisplayScope,
} from '../../lib/storedSettings';
import { type PotentialRange } from './prototypes/types';
import { POTENTIAL_THRESHOLD, type MapLocation } from '../../lib/potentialSampler';
import { usePotentialAnalysis } from '../../hooks/usePotentialAnalysis';
import { useMapLibre, POTENTIAL_LAYER_ID, PLATEAU_LAYER_ID, setPotentialDisplayScope } from '../../hooks/useMapLibre';
import { usePostPopups } from '../../hooks/usePostPopups';
import { usePosts } from '../../hooks/usePosts';
import { useUserLocation } from '../../hooks/useUserLocation';
import { useDeviceHeading } from '../../hooks/useDeviceHeading';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { usePixelInspector } from '../../hooks/usePixelInspector';
import { useRangeRings } from '../../hooks/useRangeRings';
import { useCompassTarget } from '../../hooks/useCompassTarget';
import { useSearchResultMarker, type SearchResultPlace } from '../../hooks/useSearchResultMarker';
import { useFavorites } from '../../hooks/useFavorites';
import { favoriteId, type FavoritePlace } from '../../lib/favorites';
import type { PolarPick } from './prototypes/PolarHeatmap';
import { searchLocation, type GeocodingResult } from '../../lib/api/geocodingApi';
import { normalizeAngle } from '../../lib/heading';
import 'maplibre-gl/dist/maplibre-gl.css';

// 右下ボタン列（2 ボタン + 余白）の上に投稿ボタンを置くためのオフセット
const CONTROL_STACK_HEIGHT = 'calc(var(--btn-h) * 2 + 24px)';

// シートがないとき（コンパスモード中・探索モードのスマホ）は、地図下端の出典表示（2 行になることがある）の上に部品を置く
const SPLIT_CONTROL_BOTTOM = 'calc(56px + env(safe-area-inset-bottom))';
// 探索モードのスマホは、画面下に浮かぶ検索バー（高さ --btn-h + 10px）の上 12px にボタン列を置く
const MOBILE_SEARCH_CONTROL_BOTTOM = 'calc(56px + env(safe-area-inset-bottom) + var(--btn-h) + 22px)';
// 検索結果を選んだときのズーム
const SEARCH_RESULT_ZOOM = 15;
// PC の探索モードの検索バーの幅。ミニコンパスはその右に置く（16px + 幅 + 12px）
const DESKTOP_SEARCH_WIDTH = 360;

// コンパスモードのカードは地図の上に浮かべる。横長は左（地図の幅の割合）、縦長は上（地図の高さの割合）。
// 地図側は、カードに隠れる分を避けて距離リングを収める（useRangeRings の obscured）
const COMPASS_CARD_PORTRAIT_HEIGHT = 0.4;
const COMPASS_CARD_LANDSCAPE_WIDTH = 0.44;
const LANDSCAPE_QUERY = '(orientation: landscape)';
// スマホを横向きにしたとき（高さが小さい横長）は、コンパスモードを自動で開く。PC のウィンドウでは開かない
const LANDSCAPE_PHONE_QUERY = '(orientation: landscape) and (max-height: 520px)';

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
        status: userLocationStatus,
    } = useUserLocation();
    const deviceHeading = useDeviceHeading();
    const { start: startDeviceHeading, stop: stopDeviceHeading } = deviceHeading;
    const [isMobileViewport, setIsMobileViewport] = useState(getIsMobileViewport);
    const [isDesktopLayerMenuOpen, setIsDesktopLayerMenuOpen] = useState(() => !getIsMobileViewport());
    const [potentialEnabled, setPotentialEnabled] = useState(true);
    const [aerialEnabled, setAerialEnabled] = useState(false);
    const [potentialOpacity, setPotentialOpacity] = useState(0.82);
    const [potentialScope, setPotentialScope] = useState<PotentialDisplayScope>(() => readStoredPotentialScope());
    const [selectedLocation, setSelectedLocation] = useState<MapLocation | null>(null);
    const [panelView, setPanelView] = useState<PanelView>(() => readStoredPanelView());
    const [debugMode, setDebugMode] = useState(() => readStoredDebugMode());
    const [buildingsEnabled, setBuildingsEnabled] = useState(() => readStoredBuildingsEnabled());
    const [maxDistance, setMaxDistance] = useState<PotentialRange>(200);
    // コンパスの文字盤でタップした位置（地図にも同じ地点を出す）
    const [compassTarget, setCompassTarget] = useState<PolarPick | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    // 検索結果を選んだ地点（ピンを立てる）。検索欄を空にすると消す
    const [searchPlace, setSearchPlace] = useState<SearchResultPlace | null>(null);
    const [searchResults, setSearchResults] = useState<GeocodingResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [locateError, setLocateError] = useState<string | null>(null);
    const [mapBearing, setMapBearing] = useState(0);
    const locateRequestRef = useRef(false);
    const isPostMode = mode === 'analyze';
    const { posts, reload: reloadPosts } = usePosts(isPostMode);
    usePostPopups(map, isLoaded, posts, isPostMode);
    const { viewModel, isLoading: isSampling, error: samplingError } = usePotentialAnalysis({
        center: selectedLocation,
        range: maxDistance,
        threshold: POTENTIAL_THRESHOLD,
    });
    const [mobileSheetLevel, setMobileSheetLevel] = useState<MobileSheetLevel>(() => getIsMobileViewport() ? 'collapsed' : 'expanded');
    const [isMapModesOpen, setIsMapModesOpen] = useState(false);
    const [isCompassModeOpen, setIsCompassModeOpen] = useState(false);
    const isLandscape = useMediaQuery(LANDSCAPE_QUERY);
    const isLandscapePhone = useMediaQuery(LANDSCAPE_PHONE_QUERY);
    const compassOpenRef = useRef(false);
    const openedByLandscapeRef = useRef(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const isLayerMenuOpen = isMobileViewport ? mobileSheetLevel !== 'collapsed' : isDesktopLayerMenuOpen;
    const currentLocation = useMemo(
        () => userPosition ? { lng: userPosition.coords.longitude, lat: userPosition.coords.latitude } : null,
        [userPosition],
    );
    const compassAnalysis = usePotentialAnalysis({
        center: selectedLocation ? null : currentLocation,
        range: maxDistance,
        threshold: POTENTIAL_THRESHOLD,
    });
    const compassViewModel = selectedLocation ? viewModel : compassAnalysis.viewModel;
    const compassIsSampling = selectedLocation ? isSampling : compassAnalysis.isLoading;
    // デバッグモードでは、右クリックした地点の画素・値・上位 % を見られる（投稿モードでは使わない）
    usePixelInspector(map, isLoaded, debugMode && !isPostMode);
    // コンパスモード中は、コンパスの距離ガイドと同じ円を地図に重ねる（中心はコンパスと同じ地点）
    useRangeRings(
        map,
        isLoaded,
        selectedLocation ?? currentLocation,
        maxDistance,
        isCompassModeOpen,
        isLandscape
            ? { edge: 'left', fraction: COMPASS_CARD_LANDSCAPE_WIDTH }
            : { edge: 'top', fraction: COMPASS_CARD_PORTRAIT_HEIGHT },
    );
    useCompassTarget(map, isLoaded, selectedLocation ?? currentLocation, isCompassModeOpen ? compassTarget : null);
    const rotation = deviceHeading.status === 'active' && deviceHeading.heading !== null ? deviceHeading.heading : normalizeAngle(mapBearing);

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
        // 地図クリックによる地点選択（ピン）はデバッグモード専用。通常は現在地だけを中心にする。
        // 投稿モードでは地図クリックを投稿のピン選択に使うので、地点選択はしない
        if (!map || !isLoaded || isPostMode || !debugMode) return;

        const handleMapClick = (event: maplibregl.MapMouseEvent) => {
            // ピン自体を押したとき（Street View のポップアップを開く操作）は、地点を選び直さない
            const target = event.originalEvent.target;
            if (target instanceof Element && target.closest('.maplibregl-marker, .maplibregl-popup')) return;
            setSelectedLocation({ lng: event.lngLat.lng, lat: event.lngLat.lat });
        };

        map.on('click', handleMapClick);
        return () => {
            map.off('click', handleMapClick);
        };
    }, [debugMode, isLoaded, isPostMode, map]);

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
        // ピンを押すと、Street View へのリンクを小さなポップアップで出す（ピンはデバッグモード専用）
        if (marker && selectedLocation && debugMode) {
            marker.setPopup(createStreetViewPopup(selectedLocation));
            marker.getElement().style.cursor = 'pointer';
        }
        return () => {
            marker?.remove();
        };
    }, [map, selectedLocation, isPostMode, debugMode]);

    useEffect(() => {
        if (!map || !isLoaded || !map.getLayer(POTENTIAL_LAYER_ID)) return;
        map.setLayoutProperty(POTENTIAL_LAYER_ID, 'visibility', potentialEnabled ? 'visible' : 'none');
        map.setPaintProperty(POTENTIAL_LAYER_ID, 'raster-opacity', potentialOpacity);
    }, [map, isLoaded, potentialEnabled, potentialOpacity]);

    useEffect(() => {
        if (!map || !isLoaded) return;
        setPotentialDisplayScope(map, potentialScope);
    }, [map, isLoaded, potentialScope]);

    const handlePotentialScopeChange = useCallback((scope: PotentialDisplayScope) => {
        setPotentialScope(writeStoredPotentialScope(scope));
    }, []);

    useEffect(() => {
        if (!map || !isLoaded) return;
        const aerialLayer = map.getLayer('aerial-photo-layer');
        if (aerialLayer) map.setLayoutProperty('aerial-photo-layer', 'visibility', aerialEnabled ? 'visible' : 'none');
    }, [map, isLoaded, aerialEnabled]);

    useEffect(() => {
        // 非表示のレイヤーのタイルは MapLibre が取得しないので、オフにすると通信と描画の両方が減る
        if (!map || !isLoaded || !map.getLayer(PLATEAU_LAYER_ID)) return;
        map.setLayoutProperty(PLATEAU_LAYER_ID, 'visibility', buildingsEnabled ? 'visible' : 'none');
    }, [map, isLoaded, buildingsEnabled]);

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

    const handleSearchChange = useCallback((query: string) => {
        setSearchQuery(query);
        if (query === '') setSearchPlace(null);
    }, []);
    const { favorites, add: addFavorite, remove: removeFavorite } = useFavorites();
    const searchPlaceFavoriteId = searchPlace ? favoriteId(searchPlace.lng, searchPlace.lat) : null;
    const isSearchPlaceFavorite = searchPlaceFavoriteId !== null && favorites.some((item) => item.id === searchPlaceFavoriteId);
    const handleToggleSearchFavorite = useCallback((place: SearchResultPlace) => {
        const id = favoriteId(place.lng, place.lat);
        if (favorites.some((item) => item.id === id)) removeFavorite(id);
        else addFavorite(place);
    }, [addFavorite, favorites, removeFavorite]);
    useSearchResultMarker(map, searchPlace, isSearchPlaceFavorite, handleToggleSearchFavorite);

    // お気に入りの一覧から選んだら、その地点へ動かして検索結果と同じピン（お気に入りの解除もできる）を立てる
    const handleSelectFavorite = useCallback((favorite: FavoritePlace) => {
        map?.flyTo({ center: [favorite.lng, favorite.lat], zoom: SEARCH_RESULT_ZOOM, duration: 1200 });
        setSearchQuery(favorite.name);
        setSearchPlace({ lng: favorite.lng, lat: favorite.lat, name: favorite.name });
        setShowResults(false);
    }, [map]);

    // 「現在地をお気に入りに追加」: 位置がまだなければ取得を始め、届いたときに追加する。取得に失敗したら待つのをやめる
    // （理由は画面上部のエラー表示に出る）
    const [isLocatingFavorite, setIsLocatingFavorite] = useState(false);
    const [favoriteLocateError, setFavoriteLocateError] = useState<string | null>(null);
    const addCurrentLocationFavorite = useCallback((location: MapLocation) => {
        // 日時は一覧に「○○に保存」と出るので、名前には入れない
        addFavorite({ ...location, name: '現在地で保存した場所' });
    }, [addFavorite]);
    const handleAddCurrentLocationFavorite = useCallback(() => {
        setFavoriteLocateError(null);
        if (currentLocation) {
            addCurrentLocationFavorite(currentLocation);
            return;
        }
        setIsLocatingFavorite(true);
        startUserLocation();
    }, [addCurrentLocationFavorite, currentLocation, startUserLocation]);
    useEffect(() => {
        if (!isLocatingFavorite) return;
        if (currentLocation) {
            addCurrentLocationFavorite(currentLocation);
            setIsLocatingFavorite(false);
        } else if (userLocationStatus === 'denied' || userLocationStatus === 'error' || userLocationStatus === 'unsupported') {
            setIsLocatingFavorite(false);
            setFavoriteLocateError(userLocationError ?? '現在地を取得できませんでした');
        }
    }, [addCurrentLocationFavorite, currentLocation, isLocatingFavorite, userLocationError, userLocationStatus]);

    const handleSelectResult = useCallback((result: GeocodingResult) => {
        // 街区が見分けられる程度まで寄る（z13 では市区町村全体が入り、どこに着いたか分かりにくかった）
        map?.flyTo({ center: [result.lng, result.lat], zoom: SEARCH_RESULT_ZOOM, duration: 1200 });
        const name = result.displayName.split(',')[0];
        setSearchQuery(name);
        setSearchPlace({ lng: result.lng, lat: result.lat, name });
        setShowResults(false);
        // 投稿モードのシートは検索結果を見せるために広げている。選んだら、飛んだ先の地図が見えるよう閉じる
        if (isMobileViewport && isPostMode) setMobileSheetLevel('collapsed');
    }, [isMobileViewport, isPostMode, map]);

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
        // 距離リングとコンパスの中心になる現在地を取得する（選択地点があればそれが中心なので不要）
        if (!selectedLocation) startUserLocation();
        setIsCompassModeOpen(true);
    }, [selectedLocation, startDeviceHeading, startUserLocation]);

    // コンパスモードを閉じてもセンサーは止めない（左上のミニコンパスが向きを出し続ける）。止めるのは設定のスイッチ
    const handleCompassModeClose = useCallback(() => {
        setIsCompassModeOpen(false);
        setCompassTarget(null);
    }, []);

    // Range や中心の地点を変えたら、タップした位置は別の場所を指すことになるので消す
    const handleCompassRangeChange = useCallback((range: PotentialRange) => {
        setMaxDistance(range);
        setCompassTarget(null);
    }, []);
    useEffect(() => {
        setCompassTarget(null);
    }, [selectedLocation]);

    useEffect(() => {
        compassOpenRef.current = isCompassModeOpen;
    }, [isCompassModeOpen]);

    // スマホを横向きにしたらコンパスモードを開き、縦に戻したら（自動で開いた場合だけ）閉じる。
    // 向きセンサーは自動では開始しない（iOS は許可にタップが要るため）。コンパス側のボタンか設定から開始する
    useEffect(() => {
        if (isLandscapePhone) {
            if (!compassOpenRef.current) openedByLandscapeRef.current = true;
            setIsCompassModeOpen(true);
        } else if (openedByLandscapeRef.current) {
            openedByLandscapeRef.current = false;
            setIsCompassModeOpen(false);
            setCompassTarget(null);
        }
    }, [isLandscapePhone]);

    const headingSensorOn = deviceHeading.status === 'requesting' || deviceHeading.status === 'active';
    const [headingSensorWanted, setHeadingSensorWanted] = useState(() => readStoredHeadingSensor());
    const handleHeadingSensorChange = useCallback((enabled: boolean) => {
        setHeadingSensorWanted(writeStoredHeadingSensor(enabled));
        if (enabled) startDeviceHeading();
        else stopDeviceHeading();
    }, [startDeviceHeading, stopDeviceHeading]);

    // 向きセンサーは既定で ON。タッチ端末（スマホ・タブレット）だけ自動で開始する（PC は方位センサーがない）。
    // iOS は許可の確認にユーザー操作が要るので、最初のタップで開始する。許可しない・失敗したときは
    // status が off 以外になるので、繰り返し求めない
    const deviceHeadingStatus = deviceHeading.status;
    useEffect(() => {
        if (!headingSensorWanted || deviceHeadingStatus !== 'off') return;
        if (!window.matchMedia('(pointer: coarse)').matches) return;
        const handleFirstPointer = () => startDeviceHeading();
        window.addEventListener('pointerdown', handleFirstPointer, { once: true, capture: true });
        return () => window.removeEventListener('pointerdown', handleFirstPointer, { capture: true });
    }, [deviceHeadingStatus, headingSensorWanted, startDeviceHeading]);

    // シートがあるのは投稿モードだけ。探索モードの検索バーは結果を自分の上下に出すので、シートは触らない
    const handleSearchFocus = useCallback(() => {
        if (isMobileViewport && isPostMode) setMobileSheetLevel('expanded');
        if (searchResults.length > 0) setShowResults(true);
    }, [isMobileViewport, isPostMode, searchResults.length]);

    // 検索結果の一覧は、地図に触れたら閉じる（タッチ端末では一覧の onMouseLeave が起きないことがあるため）
    useEffect(() => {
        if (!map || !showResults) return;
        const closeResults = () => setShowResults(false);
        map.on('mousedown', closeResults);
        map.on('touchstart', closeResults);
        return () => {
            map.off('mousedown', closeResults);
            map.off('touchstart', closeResults);
        };
    }, [map, showResults]);

    const handleSearchSubmit = useCallback(() => {
        if (isMobileViewport && isPostMode) setMobileSheetLevel('expanded');
        void handleSearch(searchQuery);
    }, [handleSearch, isMobileViewport, isPostMode, searchQuery]);

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
        // ピンはデバッグモード専用なので、オフにしたら選択地点も消す（コンパスは現在地に戻る）
        if (!enabled) setSelectedLocation(null);
    }, []);

    const handleBuildingsEnabledChange = useCallback((enabled: boolean) => {
        setBuildingsEnabled(writeStoredBuildingsEnabled(enabled));
    }, []);


    return (
        // コンパスモード中も地図は全面のまま、その上にコンパスのカードを浮かべる（縦長: 上 / 横長: 左）
        <div className="h-full w-full text-white">
            <div className="relative h-full w-full">
                {isCompassModeOpen && (
                    <div
                        className="absolute z-[4500]"
                        style={isLandscape
                            ? { top: 16, bottom: 16, left: 'max(16px, env(safe-area-inset-left))', width: `${COMPASS_CARD_LANDSCAPE_WIDTH * 100}%` }
                            : { left: 16, right: 16, top: 'calc(16px + env(safe-area-inset-top))', height: `${COMPASS_CARD_PORTRAIT_HEIGHT * 100}%` }}
                    >
                    <CompassMode
                        data={compassViewModel}
                        isLoading={compassIsSampling}
                        range={maxDistance}
                        onRangeChange={handleCompassRangeChange}
                        status={deviceHeading.status}
                        heading={deviceHeading.heading}
                        lowAccuracy={deviceHeading.lowAccuracy}
                        error={selectedLocation ? samplingError : compassAnalysis.error}
                        isSupported={deviceHeading.isSupported}
                        onStartSensor={startDeviceHeading}
                        onClose={handleCompassModeClose}
                        target={compassTarget}
                        onTargetChange={setCompassTarget}
                    />
                    </div>
                )}
                <div ref={containerRef} className="h-full w-full touch-none" />
                <UserLocationMarker
                    map={map}
                    position={userPosition}
                    accuracy={userAccuracy}
                    compassActive={deviceHeading.status === 'active'}
                    heading={deviceHeading.heading}
                    mapBearing={mapBearing}
                />

                {/* ミニコンパスは探索・投稿の両モードで出す（分割表示中は上半分に本体があるので隠す） */}
                {!isCompassModeOpen && (
                    // PC の左上は、探索モードでは検索バーの右、投稿モードではサイドパネルの右に置く
                    <div
                        className={`absolute left-4 top-[calc(16px+env(safe-area-inset-top))] z-[4500] transition-[left] duration-300 ${!isPostMode ? 'md:left-[var(--mini-compass-left)]' : isDesktopLayerMenuOpen ? 'md:left-[352px]' : ''}`}
                        style={{ '--mini-compass-left': `${16 + DESKTOP_SEARCH_WIDTH + 12}px` } as CSSProperties}
                    >
                        <MiniCompass
                            data={compassViewModel}
                            rotation={rotation}
                            range={maxDistance}
                            isLoading={compassIsSampling}
                            facing={deviceHeading.status === 'active' && deviceHeading.heading !== null}
                            onClick={handleCompassModeStart}
                        />
                    </div>
                )}

                {!isCompassModeOpen && (
                    // 左上のミニコンパス（64px）と縦の中心を揃える。ピルの高さは --btn-h + 余白 8px + 枠 2px
                    <MapModeToggle
                        mode={mode}
                        onModeChange={onModeChange}
                        className="absolute right-4 top-[calc(16px+(54px-var(--btn-h))/2+env(safe-area-inset-top))] z-[5000]"
                    />
                )}

                <AppMenu
                    isOpen={isMenuOpen}
                    onClose={() => setIsMenuOpen(false)}
                    postCount={posts.length}
                    favorites={favorites}
                    onSelectFavorite={handleSelectFavorite}
                    onRemoveFavorite={removeFavorite}
                    onAddCurrentLocationFavorite={handleAddCurrentLocationFavorite}
                    isLocatingFavorite={isLocatingFavorite}
                    favoriteLocateError={favoriteLocateError}
                    onViewPosts={() => onModeChange('analyze')}
                    panelView={panelView}
                    onPanelViewChange={handlePanelViewChange}
                    debugMode={debugMode}
                    onDebugModeChange={handleDebugModeChange}
                    buildingsEnabled={buildingsEnabled}
                    onBuildingsEnabledChange={handleBuildingsEnabledChange}
                    headingSensorOn={headingSensorOn}
                    onHeadingSensorChange={handleHeadingSensorChange}
                    headingSensorNote={headingSensorOn ? null : deviceHeading.error}
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

                {/* 探索モードは面を持たない浮かぶ検索バー（PC: 左上、ミニコンパスと縦の中心を揃える / スマホ: 画面下）。
                    コンパスモード中は地図側を広く使うため隠す */}
                {!isCompassModeOpen && !isPostMode && (
                    <FloatingSearchBar
                        onOpenMenu={() => setIsMenuOpen(true)}
                        searchQuery={searchQuery}
                        onSearchChange={handleSearchChange}
                        onSearchSubmit={handleSearchSubmit}
                        isSearching={isSearching}
                        searchResults={searchResults}
                        showResults={showResults}
                        onSelectResult={handleSelectResult}
                        onCloseResults={() => setShowResults(false)}
                        onFocusSearch={handleSearchFocus}
                        resultsPlacement={isMobileViewport ? 'above' : 'below'}
                        style={isMobileViewport ? { bottom: SPLIT_CONTROL_BOTTOM } : { width: DESKTOP_SEARCH_WIDTH }}
                        className={isMobileViewport
                            ? 'absolute left-[max(1rem,env(safe-area-inset-left))] right-[max(1rem,env(safe-area-inset-right))] z-[4600]'
                            : 'absolute left-[max(1rem,env(safe-area-inset-left))] top-[calc(16px+(54px-var(--btn-h))/2+env(safe-area-inset-top))] z-[4600]'}
                    />
                )}

                {/* 投稿モードは投稿一覧があるので、シート（スマホ）／サイドパネル（PC）を使う。コンパスモード中は隠す */}
                {!isCompassModeOpen && isPostMode && (
                    <LayerMenu
                        isOpen={isLayerMenuOpen}
                        onToggle={handleLayerMenuToggle}
                        mobileLevel={isMobileViewport ? mobileSheetLevel : undefined}
                    >
                        <div className="flex h-full min-h-0 flex-col bg-transparent text-white">
                            <div className="shrink-0 border-b border-white/10 px-3 pb-3 pt-1 md:p-4">
                                <div className="mb-2 hidden items-center justify-between gap-2 md:flex">
                                    <div>
                                        <p className="text-[10px] font-semibold tracking-[0.18em] text-white/40">POSTS</p>
                                        <p className="mt-1 text-sm font-semibold text-white/85">夜景の投稿</p>
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
                                    onSearchChange={handleSearchChange}
                                    onSearchSubmit={handleSearchSubmit}
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

                            {(!isMobileViewport || mobileSheetLevel !== 'collapsed') && (
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

                        </div>
                    </LayerMenu>
                )}

                {/* 投稿モードのシート最大時はボタン列が右上のモード切替と重なるので隠す */}
                {(isCompassModeOpen || !(isPostMode && isMobileViewport && mobileSheetLevel === 'expanded')) && (
                <MapControlStack
                    onLocate={handleLocate}
                    onOpenMapModes={() => setIsMapModesOpen(true)}
                    isMapModesOpen={isMapModesOpen}
                    style={isCompassModeOpen
                        ? { bottom: SPLIT_CONTROL_BOTTOM }
                        : !isMobileViewport ? undefined
                        : isPostMode ? { bottom: MOBILE_SHEET_CONTROL_BOTTOMS[mobileSheetLevel] }
                        : { bottom: MOBILE_SEARCH_CONTROL_BOTTOM }}
                    // 横向きのノッチ側に隠れないよう、右端は安全領域の内側に置く
                    className="absolute right-[max(1rem,env(safe-area-inset-right))] z-[4500] md:bottom-8 md:right-[max(2rem,env(safe-area-inset-right))]"
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
                    potentialScope={potentialScope}
                    setPotentialScope={handlePotentialScopeChange}
                />

                {!isLoaded && (
                    <div className="absolute inset-0 z-[7000] grid place-items-center bg-black text-sm text-white/60">
                        地図を読み込んでいます…
                    </div>
                )}
            </div>
        </div>
    );
}

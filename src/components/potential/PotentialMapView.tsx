import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { FloatingSearchBar } from '../layout/FloatingSearchBar';
import { createStreetViewPopup } from './streetViewPopup';
import { createMapPin } from './mapPin';
import { AppMenu } from '../menu/AppMenu';
import { CompassMode } from './CompassMode';
import { MapControlStack } from './MapControlStack';
import { MapModesModal } from './MapModesModal';
import { MapModeToggle } from './MapModeToggle';
import { MiniCompass } from './MiniCompass';
import { UserLocationMarker } from './UserLocationMarker';
import { PostComposer } from './PostComposer';
import { TutorialOverlay } from '../onboarding/TutorialOverlay';
import { readStoredPanelView, type PanelView, writeStoredPanelView } from './PanelViewSelector';
import {
    readStoredBuildingsEnabled,
    readStoredDebugMode,
    readStoredHeadingSensor,
    readStoredPotentialScope,
    readStoredRevealAllPosts,
    readStoredTutorialSeen,
    writeStoredBuildingsEnabled,
    writeStoredDebugMode,
    writeStoredHeadingSensor,
    writeStoredPotentialScope,
    writeStoredRevealAllPosts,
    writeStoredTutorialSeen,
    type PotentialDisplayScope,
} from '../../lib/storedSettings';
import { type PotentialRange } from './prototypes/types';
import { DISPLAY_TOP10_TILE_DIR, POTENTIAL_THRESHOLD, SAMPLING_TILE_DIR, type MapLocation } from '../../lib/potentialSampler';
import { usePotentialAnalysis } from '../../hooks/usePotentialAnalysis';
import { useMapLibre, POTENTIAL_LAYER_ID, PLATEAU_LAYER_ID, setPotentialDisplayScope } from '../../hooks/useMapLibre';
import { usePostPopups } from '../../hooks/usePostPopups';
import { usePosts } from '../../hooks/usePosts';
import type { Post } from '../../lib/postsApi';
import { useUserLocation } from '../../hooks/useUserLocation';
import { useDeviceHeading } from '../../hooks/useDeviceHeading';
import { useFollowLocation } from '../../hooks/useFollowLocation';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { usePixelInspector } from '../../hooks/usePixelInspector';
import { useRangeRings, type ObscuredEdge } from '../../hooks/useRangeRings';
import { useCompassTarget } from '../../hooks/useCompassTarget';
import { useSearchResultMarker, type SearchResultPlace } from '../../hooks/useSearchResultMarker';
import { useFavorites } from '../../hooks/useFavorites';
import { usePostReveal } from '../../hooks/usePostReveal';
import { approximateArea } from '../../lib/postReveal';
import { favoriteId, type FavoritePlace } from '../../lib/favorites';
import type { PolarPick } from './prototypes/PolarHeatmap';
import { searchLocation, type GeocodingResult } from '../../lib/api/geocodingApi';
import { normalizeAngle } from '../../lib/heading';
import 'maplibre-gl/dist/maplibre-gl.css';

// 投稿ボタンは右下ボタン列のピルの一番上（reserveTopSlot）に重ねる。ピルの下端からの高さ =
// 枠 1px + 余白 4px + ボタン 2 つ + 間隔 4px × 2
const CONTROL_STACK_HEIGHT = 'calc(var(--btn-h) * 2 + 13px)';

// スマホでは、地図下端の出典表示（2 行になることがある）の上に部品を置く（探索・投稿・コンパスモード共通）
const SPLIT_CONTROL_BOTTOM = 'calc(56px + env(safe-area-inset-bottom))';
// 検索結果を選んだときのズーム
const SEARCH_RESULT_ZOOM = 15;
// 探索モードの上の帯: 左にミニコンパス（64px）、その右に検索バー、右端にモード切替。
// 検索バーの左端 = 16px + 64px + 8px。スマホはモード切替（幅 --btn-h × 2 + 余白 8px + 枠 2px）の手前 8px まで伸ばし、
// PC は幅 360px に留める
const SEARCH_BAR_LEFT = 'calc(88px + env(safe-area-inset-left))';
const MOBILE_SEARCH_BAR_RIGHT = 'calc(16px + var(--btn-h) * 2 + 18px + env(safe-area-inset-right))';
const DESKTOP_SEARCH_WIDTH = 360;

// コンパスモードのカードは地図の上に浮かべる。横長は左（地図の幅の割合）、縦長は上。
// 縦長はデザインどおりほぼ正方形（745:755）にし、幅は画面いっぱい（最大 420px）。
// 地図側は、カードに隠れる分を実寸で測って避け、距離リングを収める（useRangeRings の obscured）
const COMPASS_CARD_PORTRAIT_MAX_WIDTH = 420;
const COMPASS_CARD_PORTRAIT_ASPECT = '745 / 755';
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
    const [potentialEnabled, setPotentialEnabled] = useState(true);
    const [aerialEnabled, setAerialEnabled] = useState(false);
    const [potentialOpacity, setPotentialOpacity] = useState(0.82);
    const [potentialScope, setPotentialScope] = useState<PotentialDisplayScope>(() => readStoredPotentialScope());
    const [selectedLocation, setSelectedLocation] = useState<MapLocation | null>(null);
    const [panelView, setPanelView] = useState<PanelView>(() => readStoredPanelView());
    const [debugMode, setDebugMode] = useState(() => readStoredDebugMode());
    const [buildingsEnabled, setBuildingsEnabled] = useState(() => readStoredBuildingsEnabled());
    const [maxDistance, setMaxDistance] = useState<PotentialRange>(1000);
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
    const { viewModel, isLoading: isSampling, error: samplingError } = usePotentialAnalysis({
        center: selectedLocation,
        range: maxDistance,
        threshold: POTENTIAL_THRESHOLD,
    });
    const [isMapModesOpen, setIsMapModesOpen] = useState(false);
    const [isCompassModeOpen, setIsCompassModeOpen] = useState(false);
    const isLandscape = useMediaQuery(LANDSCAPE_QUERY);
    const isLandscapePhone = useMediaQuery(LANDSCAPE_PHONE_QUERY);
    const compassOpenRef = useRef(false);
    const compassCardRef = useRef<HTMLDivElement | null>(null);
    const openedByLandscapeRef = useRef(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    // 初めて開いた人にだけ、最初にチュートリアルを出す（nightview.tutorialSeen）
    const [isTutorialOpen, setIsTutorialOpen] = useState(() => !readStoredTutorialSeen());
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
    // コンパスのカードに隠れる辺（縦長は上、横長は左）
    const compassObscured = useMemo<ObscuredEdge>(() => ({ edge: isLandscape ? 'left' : 'top', card: compassCardRef }), [isLandscape]);
    // コンパスモード中は、コンパスの距離ガイドと同じ円を地図に重ねる（中心はコンパスと同じ地点）
    useRangeRings(
        map,
        isLoaded,
        selectedLocation ?? currentLocation,
        maxDistance,
        isCompassModeOpen,
        compassObscured,
    );
    // コンパスモード中は、現在地を地図の見えている部分の中心に置き続ける（中心が選択地点のときは動かさない）
    const { recenter: recenterOnUser } = useFollowLocation(map, isLoaded, currentLocation, isCompassModeOpen && !selectedLocation, compassObscured);
    useCompassTarget(map, isLoaded, selectedLocation ?? currentLocation, isCompassModeOpen ? compassTarget : null);
    const rotation = deviceHeading.status === 'active' && deviceHeading.heading !== null ? deviceHeading.heading : normalizeAngle(mapBearing);

    useEffect(() => {
        const handleViewportResize = () => setIsMobileViewport(getIsMobileViewport());
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
            ? createMapPin('violet').setLngLat([selectedLocation.lng, selectedLocation.lat]).addTo(map)
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

    // 位置情報のエラーは、同じ理由なら一度だけ出す（投稿モードに入るたびに自動で取得を始めるので、
    // 許可していない端末で毎回赤い表示が出ないように）。現在地ボタンを押したときは、もう一度出す
    const shownLocationErrorRef = useRef<string | null>(null);
    useEffect(() => {
        if (!userLocationError || userLocationError === shownLocationErrorRef.current) return;
        shownLocationErrorRef.current = userLocationError;
        setLocateError(userLocationError);
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

    // 投稿のカードのハートからも、投稿の場所をお気に入りに追加 / 解除できる（名前は場所名、なければキャプション）
    const favoriteIds = useMemo(() => new Set(favorites.map((item) => item.id)), [favorites]);
    const handleTogglePostFavorite = useCallback((post: Post) => {
        const id = favoriteId(post.location.lng, post.location.lat);
        if (favoriteIds.has(id)) {
            removeFavorite(id);
            return;
        }
        const name = post.location.placeName || post.caption || '投稿の場所';
        addFavorite({ name, lng: post.location.lng, lat: post.location.lat });
    }, [addFavorite, favoriteIds, removeFavorite]);
    // 投稿は着くまで場所が分からない: 本当の地点から 100m 以内に入ったら解放する。
    // 確認用に、デバッグモードの中のスイッチで全部を解放して見られる（既定 OFF）
    const [revealAllPosts, setRevealAllPosts] = useState(() => readStoredRevealAllPosts());
    const handleRevealAllPostsChange = useCallback((enabled: boolean) => {
        setRevealAllPosts(writeStoredRevealAllPosts(enabled));
    }, []);
    const [revealNotice, setRevealNotice] = useState<string | null>(null);
    const handlePostsUnlocked = useCallback((arrived: Post[]) => {
        const first = arrived[0];
        setRevealNotice(arrived.length === 1
            ? `投稿の場所に着きました: ${first.location.placeName || first.caption}`
            : `${arrived.length} 件の投稿の場所に着きました`);
    }, []);
    useEffect(() => {
        if (!revealNotice) return;
        const timer = window.setTimeout(() => setRevealNotice(null), 5000);
        return () => window.clearTimeout(timer);
    }, [revealNotice]);
    const { isUnlocked } = usePostReveal(posts, currentLocation, userAccuracy ?? null, isPostMode, debugMode && revealAllPosts, handlePostsUnlocked);
    // 投稿モードでは、着いたかの判定と距離の表示のために現在地の取得を始める
    useEffect(() => {
        if (isPostMode) startUserLocation();
    }, [isPostMode, startUserLocation]);
    usePostPopups(map, isLoaded, posts, isPostMode, favoriteIds, handleTogglePostFavorite, isUnlocked, currentLocation);

    // メニューの投稿一覧から選んだとき: 解放済みは本当の地点へ、まだの投稿はだいたいの場所の円が収まるように動かす。
    // 一覧は投稿モードに切り替えてから開くが、念のためここでも投稿モードにする（円やカードは投稿モードでだけ出る）
    const handlePostListClick = useCallback((post: Post) => {
        onModeChange('analyze');
        if (isUnlocked(post)) {
            map?.flyTo({ center: [post.location.lng, post.location.lat], zoom: 16, duration: 1200 });
        } else {
            const { center } = approximateArea(post);
            map?.flyTo({ center: [center.lng, center.lat], zoom: 14.5, duration: 1200 });
        }
    }, [isUnlocked, map, onModeChange]);

    // お気に入りの一覧から選んだら、その地点へ動かして検索結果と同じピン（お気に入りの解除もできる）を立てる
    const handleSelectFavorite = useCallback((favorite: FavoritePlace) => {
        map?.flyTo({ center: [favorite.lng, favorite.lat], zoom: SEARCH_RESULT_ZOOM, duration: 1200 });
        setSearchQuery(favorite.name);
        setSearchPlace({ lng: favorite.lng, lat: favorite.lat, name: favorite.name, revealId: Date.now() });
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
            setFavoriteLocateError(null);
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
        setSearchPlace({ lng: result.lng, lat: result.lat, name, revealId: Date.now() });
        setShowResults(false);
    }, [map]);

    const handleLocate = useCallback(() => {
        if (!map) return;
        setLocateError(null);
        shownLocationErrorRef.current = null;
        // コンパスモード中は、ズームを変えずに追従へ戻す（見えている部分の中心に現在地を置く）
        if (isCompassModeOpen && !selectedLocation && userPosition) {
            recenterOnUser();
            startUserLocation();
            return;
        }
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
    }, [isCompassModeOpen, map, recenterOnUser, selectedLocation, startUserLocation, userPosition]);

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
        // チュートリアル中のタップでは始めない（説明を読む前に許可の確認が出るため）。閉じるときに handleTutorialClose が始める
        if (isTutorialOpen) return;
        const handleFirstPointer = () => startDeviceHeading();
        window.addEventListener('pointerdown', handleFirstPointer, { once: true, capture: true });
        return () => window.removeEventListener('pointerdown', handleFirstPointer, { capture: true });
    }, [deviceHeadingStatus, headingSensorWanted, isTutorialOpen, startDeviceHeading]);

    // 「はじめる」「スキップ」のクリックの中で向きセンサーを始める（iOS は許可の確認にユーザー操作が要る）
    const handleTutorialClose = useCallback(() => {
        writeStoredTutorialSeen(true);
        setIsTutorialOpen(false);
        if (headingSensorWanted && deviceHeadingStatus === 'off' && window.matchMedia('(pointer: coarse)').matches) {
            startDeviceHeading();
        }
    }, [deviceHeadingStatus, headingSensorWanted, startDeviceHeading]);

    // 二本指で地図を操作している間（ピンチ・回転・傾け）は、画面の部品を押せなくする（指が当たって誤作動するのを防ぐ）。
    // 見た目と無効化は index.css の [data-multi-touch]。タッチの本数は画面全体で数える（ボタンの上で始めた操作も含む）
    useEffect(() => {
        const root = document.documentElement;
        const update = (event: TouchEvent) => {
            if (event.touches.length >= 2) root.dataset.multiTouch = 'true';
            else delete root.dataset.multiTouch;
        };
        const options = { capture: true, passive: true } as const;
        window.addEventListener('touchstart', update, options);
        window.addEventListener('touchend', update, options);
        window.addEventListener('touchcancel', update, options);
        return () => {
            window.removeEventListener('touchstart', update, options);
            window.removeEventListener('touchend', update, options);
            window.removeEventListener('touchcancel', update, options);
            delete root.dataset.multiTouch;
        };
    }, []);

    // 検索バーは上の帯にあり、結果を自分の下に出す
    const handleSearchFocus = useCallback(() => {
        if (searchResults.length > 0) setShowResults(true);
    }, [searchResults.length]);

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
        void handleSearch(searchQuery);
    }, [handleSearch, searchQuery]);

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
                    // カードは地図の上にわずかに拡大しながら現れる（起点はミニコンパスのある左上）
                    <div
                        ref={compassCardRef}
                        className="absolute z-[4500] origin-top-left animate-ui-pop"
                        style={isLandscape
                            ? { top: 16, bottom: 16, left: 'max(16px, env(safe-area-inset-left))', width: `${COMPASS_CARD_LANDSCAPE_WIDTH * 100}%` }
                            : {
                                left: 16,
                                top: 'calc(16px + env(safe-area-inset-top))',
                                width: `min(calc(100% - 32px), ${COMPASS_CARD_PORTRAIT_MAX_WIDTH}px)`,
                                aspectRatio: COMPASS_CARD_PORTRAIT_ASPECT,
                            }}
                    >
                    <CompassMode
                        data={compassViewModel}
                        center={selectedLocation ?? currentLocation}
                        tileDir={potentialScope === 'all' ? SAMPLING_TILE_DIR : DISPLAY_TOP10_TILE_DIR}
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
                    // 左上
                    <div className="absolute left-4 top-[calc(16px+env(safe-area-inset-top))] z-[4500]">
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
                        className="absolute animate-ui-drop right-4 top-[calc(16px+(54px-var(--btn-h))/2+env(safe-area-inset-top))] z-[5000]"
                    />
                )}

                <AppMenu
                    isOpen={isMenuOpen}
                    onClose={() => {
                        setIsMenuOpen(false);
                        // 現在地を追加できなかった理由は、その場限りの表示なので閉じたら消す
                        setFavoriteLocateError(null);
                    }}
                    postCount={posts.length}
                    favorites={favorites}
                    onSelectFavorite={handleSelectFavorite}
                    onRemoveFavorite={removeFavorite}
                    onAddCurrentLocationFavorite={handleAddCurrentLocationFavorite}
                    isLocatingFavorite={isLocatingFavorite}
                    favoriteLocateError={favoriteLocateError}
                    onViewPosts={() => onModeChange('analyze')}
                    posts={posts}
                    isPostUnlocked={isUnlocked}
                    onSelectPost={handlePostListClick}
                    panelView={panelView}
                    onPanelViewChange={handlePanelViewChange}
                    debugMode={debugMode}
                    onDebugModeChange={handleDebugModeChange}
                    revealAllPosts={revealAllPosts}
                    onRevealAllPostsChange={handleRevealAllPostsChange}
                    buildingsEnabled={buildingsEnabled}
                    onBuildingsEnabledChange={handleBuildingsEnabledChange}
                    headingSensorOn={headingSensorOn}
                    onHeadingSensorChange={handleHeadingSensorChange}
                    headingSensorNote={headingSensorOn ? null : deviceHeading.error}
                    onOpenTutorial={() => setIsTutorialOpen(true)}
                />

                {/* お知らせ・エラーは地図の部品より上、メニュー（z 6000）・表示モード画面より下に出す。
                    メニューの「投稿を見る」で投稿モードに入ると現在地の取得が始まり、そのエラーが一覧の見出しを隠していたため */}
                <div className="pointer-events-none absolute left-4 right-4 top-[calc(84px+env(safe-area-inset-top))] z-[5500] flex flex-col gap-2 md:left-auto md:right-4 md:w-[520px]">
                    {revealNotice && (
                        <div role="status" className="pointer-events-auto flex items-center justify-between gap-2 rounded-full border border-violet-300/30 bg-violet-700/95 px-4 py-2 text-xs font-bold text-white shadow-lg animate-ui-drop">
                            <span>{revealNotice}</span>
                            <button
                                type="button"
                                onClick={() => setRevealNotice(null)}
                                className="grid h-11 w-11 shrink-0 place-items-center rounded-full hover:bg-white/20"
                                aria-label="お知らせを閉じる"
                            >
                                ✕
                            </button>
                        </div>
                    )}
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

                {/* 探索・投稿の両モードで、面を持たない浮かぶ検索バー。上の帯のミニコンパスとモード切替のあいだに置き、縦の中心を揃える。
                    検索結果は、スマホでは画面幅いっぱい、PC ではバーの幅で下に開く。コンパスモード中は地図側を広く使うため隠す */}
                {!isCompassModeOpen && (
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
                        resultsPlacement={isMobileViewport ? 'below-screen' : 'below'}
                        style={isMobileViewport
                            ? { left: SEARCH_BAR_LEFT, right: MOBILE_SEARCH_BAR_RIGHT }
                            : { left: SEARCH_BAR_LEFT, width: DESKTOP_SEARCH_WIDTH }}
                        className="absolute top-[calc(16px+(54px-var(--btn-h))/2+env(safe-area-inset-top))] z-[4600] animate-ui-drop"
                    />
                )}

                {/* 投稿の一覧は地図の上に出さず、メニュー →「投稿を見る」で見る（地図の円とカードを隠さないため） */}
                <MapControlStack
                    reserveTopSlot={isPostMode && !isCompassModeOpen}
                    onLocate={handleLocate}
                    onOpenMapModes={() => setIsMapModesOpen(true)}
                    isMapModesOpen={isMapModesOpen}
                    style={isCompassModeOpen || isMobileViewport ? { bottom: SPLIT_CONTROL_BOTTOM } : undefined}
                    // 横向きのノッチ側に隠れないよう、右端は安全領域の内側に置く
                    className="absolute right-[max(1rem,env(safe-area-inset-right))] z-[4500] md:bottom-8 md:right-[max(2rem,env(safe-area-inset-right))]"
                />

                {/* 投稿ボタンはボタン列のピルに重ねるので、ボタン列が動く間（コンパスモード中）は出さない */}
                {isPostMode && !isCompassModeOpen && (
                    <PostComposer
                        map={map}
                        currentLocation={currentLocation}
                        onRequestLocation={startUserLocation}
                        onPosted={reloadPosts}
                        style={{ bottom: `calc(${isMobileViewport ? SPLIT_CONTROL_BOTTOM : '32px'} + ${CONTROL_STACK_HEIGHT})` }}
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

                {/* 実際の部品を照らすので、地図の読み込み中の幕（z 7000）が消えてから出す */}
                <TutorialOverlay isOpen={isTutorialOpen && isLoaded} onClose={handleTutorialClose} />

                {!isLoaded && (
                    <div className="absolute inset-0 z-[7000] grid place-items-center bg-black text-sm text-white/60">
                        地図を読み込んでいます…
                    </div>
                )}
            </div>
        </div>
    );
}

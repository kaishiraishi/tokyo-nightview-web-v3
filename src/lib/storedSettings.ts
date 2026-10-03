// 設定画面のオン/オフ設定をブラウザに保存する。保存に失敗しても、そのセッション中は選んだ値を使う。
const DEBUG_MODE_STORAGE_KEY = 'nightview.debugMode';
const BUILDINGS_STORAGE_KEY = 'nightview.buildings3d';

function readStoredFlag(key: string, fallback: boolean): boolean {
    try {
        const stored = window.localStorage.getItem(key);
        return stored === null ? fallback : stored === 'true';
    } catch {
        return fallback;
    }
}

function writeStoredFlag(key: string, enabled: boolean): boolean {
    try {
        window.localStorage.setItem(key, String(enabled));
    } catch (error) {
        console.warn(`Failed to persist ${key}`, error);
    }
    return enabled;
}

// デバッグ用の表示（Street View リンクなど）。既定は OFF。
export const readStoredDebugMode = () => readStoredFlag(DEBUG_MODE_STORAGE_KEY, true);
export const writeStoredDebugMode = (enabled: boolean) => writeStoredFlag(DEBUG_MODE_STORAGE_KEY, enabled);

// PLATEAU の 3D 建物。初回（保存値なし）は PC だけ ON。スマホは通信と GPU の負荷を抑えるため OFF にし、
// 設定でオンにした値は以降そのまま使う。
const MOBILE_MAX_WIDTH = 768;
export const readStoredBuildingsEnabled = () => readStoredFlag(BUILDINGS_STORAGE_KEY, window.innerWidth >= MOBILE_MAX_WIDTH);
export const writeStoredBuildingsEnabled = (enabled: boolean) => writeStoredFlag(BUILDINGS_STORAGE_KEY, enabled);

// 地図に出すポテンシャルの範囲。'top10' は光っている画素の上位 10%（POTENTIAL_DISPLAY_THRESHOLD）、
// 'all' は閾値 0.006 以上のすべて。それぞれ別のタイルに焼き込み済み。コンパスの分析には影響しない
export type PotentialDisplayScope = 'top10' | 'all';
const POTENTIAL_SCOPE_STORAGE_KEY = 'nightview.potentialScope';

export function readStoredPotentialScope(): PotentialDisplayScope {
    try {
        return window.localStorage.getItem(POTENTIAL_SCOPE_STORAGE_KEY) === 'all' ? 'all' : 'top10';
    } catch {
        return 'top10';
    }
}

export function writeStoredPotentialScope(scope: PotentialDisplayScope): PotentialDisplayScope {
    try {
        window.localStorage.setItem(POTENTIAL_SCOPE_STORAGE_KEY, scope);
    } catch (error) {
        console.warn(`Failed to persist ${POTENTIAL_SCOPE_STORAGE_KEY}`, error);
    }
    return scope;
}

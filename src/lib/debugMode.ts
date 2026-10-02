// デバッグ用の表示（Street View リンクなど）を出すかどうか。既定は OFF。
const DEBUG_MODE_STORAGE_KEY = 'nightview.debugMode';

export function readStoredDebugMode(): boolean {
    try {
        return window.localStorage.getItem(DEBUG_MODE_STORAGE_KEY) === 'true';
    } catch {
        return false;
    }
}

// 保存に失敗しても、そのセッション中は選んだ値を使う。
export function writeStoredDebugMode(enabled: boolean): boolean {
    try {
        window.localStorage.setItem(DEBUG_MODE_STORAGE_KEY, String(enabled));
    } catch (error) {
        console.warn('Failed to persist debug mode', error);
    }
    return enabled;
}

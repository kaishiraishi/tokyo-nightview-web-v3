// アカウント連携を見越したデモ。本物の認証はせず、この端末の localStorage に表示名だけを置く。
// 本物のログインを入れるときは、この読み書きを認証サービスのセッションに置き換える
export type DemoAccount = { displayName: string };

const DEMO_ACCOUNT_STORAGE_KEY = 'nightview.demoAccount';
// この端末のデータを消すときに対象にする接頭辞（設定・お気に入り・解放した投稿・デモアカウント）
const APP_STORAGE_PREFIX = 'nightview.';

export function readDemoAccount(): DemoAccount | null {
    try {
        const raw = window.localStorage.getItem(DEMO_ACCOUNT_STORAGE_KEY);
        if (!raw) return null;
        const parsed: unknown = JSON.parse(raw);
        if (typeof parsed === 'object' && parsed !== null && typeof (parsed as Record<string, unknown>).displayName === 'string') {
            return { displayName: (parsed as { displayName: string }).displayName };
        }
        return null;
    } catch (error) {
        console.warn(`Failed to read ${DEMO_ACCOUNT_STORAGE_KEY}`, error);
        return null;
    }
}

export function writeDemoAccount(account: DemoAccount | null): DemoAccount | null {
    try {
        if (account) window.localStorage.setItem(DEMO_ACCOUNT_STORAGE_KEY, JSON.stringify(account));
        else window.localStorage.removeItem(DEMO_ACCOUNT_STORAGE_KEY);
    } catch (error) {
        console.warn(`Failed to persist ${DEMO_ACCOUNT_STORAGE_KEY}`, error);
    }
    return account;
}

// この端末に保存したアプリのデータ（nightview.* だけ）を消す。消したら画面を読み込み直す
export function clearAppStorage(keys?: string[]): void {
    try {
        const targets = keys ?? Object.keys(window.localStorage).filter((key) => key.startsWith(APP_STORAGE_PREFIX));
        targets.forEach((key) => window.localStorage.removeItem(key));
    } catch (error) {
        console.warn('Failed to clear app storage', error);
    }
}

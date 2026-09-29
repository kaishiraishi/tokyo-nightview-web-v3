# 004 設定から方向・距離 UI を選択 + 設定画面をガラス調に統一 + PotentialMapView のモバイル修正

## 目的
1. 方向・距離パネルの表示（現状 / Field / Polar / 比較）を、TopBar のメニュー → 設定 から選べるようにする
2. AppMenu（メニューと設定画面）の見た目をトップ画面のガラス調に統一する
3. PotentialMapView 内のモバイル問題を直す

## 前提（読む）
PROJECT.md / STATE.md / AGENTS.md、tasks/002-mobile-audit.result.md、tasks/003-settings-audit.result.md、
src/components/potential/PotentialMapView.tsx、src/components/layout/TopBar.tsx、src/components/menu/AppMenu.tsx、src/styles/ui.ts

## 決まっている設計
- state は PotentialMapView が持つ（`panelView`）。二重化しない。
- 新規 `src/components/potential/PanelViewSelector.tsx`: PANEL_VIEWS 定義と型（PotentialMapView から移す）とセグメント UI。各ボタン min-h-11。選択中は紫の塗り、非選択は white/50 テキスト。
- 永続化: `localStorage` キー `nightview.panelView`。読み書きは try/catch、不正値や例外時は 'current'。小さなヘルパーを PanelViewSelector.tsx か `src/lib/panelViewStorage.ts` に置く。
- LayerMenu 内の「現状 / Field / Polar / 比較」タブ行は削除し、代わりに小さな補助テキスト（white/50）で「表示は メニュー → 設定 で切替」と現在の表示名を出す。
- TopBar → AppMenu へ `panelView?` / `onPanelViewChange?` を optional props で中継（旧 MapViewExplore 呼び出しを壊さない）。AppMenu の設定ビューに props があれば「方向・距離の表示」セクションとして PanelViewSelector を表示。既存の fanConfig 表示は残す。
- `src/styles/ui.ts` に `glassPanel = "bg-black/60 backdrop-blur-md border border-white/10"`、`textPrimary = "text-white/90"`、`textMuted = "text-white/50"` を追加し、AppMenu のモーダル本体（現在 bg-[#1c1c1e]/90 backdrop-blur-xl）をこれに置換。AppMenu 内の行・見出し・区切りも white/90・white/50・border-white/10 に揃える。戻る/閉じるボタンは 44px 以上。モバイルでは safe-area を考慮した padding。
- PotentialMapView のモバイル修正:
  - 初期 `isLayerMenuOpen` はモバイル幅（< 768px）なら false
  - 「表示レイヤー設定」見出しの重複を解消（PotentialMapView 側を削除）
  - エラートーストの閉じるボタンを 44px 以上
  - 現状 Polar の距離ボタン h-9 w-9 → h-11 w-11
  - 現在地ボタン: z-[4500] を付け、モバイルでシートが閉じているときは bottom をハンドル高さ(55px)+24px+safe-area にし、開いているときは非表示

## 禁止事項
- src/components/layout/LayerMenu.tsx、LayerSettings.tsx、src/components/potential/prototypes/*、directional-field/*、polar-heatmap/*、src/index.css は編集しない（別タスク 005 が並行で編集中）
- 新しい依存を追加しない。`any` 禁止。タイル・データは触らない。

## 検証コマンド
./scripts/verify.sh （lint は ESLint 設定不足で既知の失敗。typecheck と build の結果をそのまま報告）

## 報告の形式
- 変更したファイルと理由
- 検証結果（PASS/FAIL をそのまま）
- 未解決の点

# 005 下部シート・パネル部品のモバイル対応

## 目的
375×667 / 390×844 で主要操作がしやすくなるよう、下部シートとパネル内部品を修正する。

## 前提（読む）
PROJECT.md / STATE.md / AGENTS.md、tasks/002-mobile-audit.result.md（問題一覧の根拠）

## 決まっている設計
- src/components/layout/LayerMenu.tsx:
  - ハンドルを div から button に変更、aria-expanded、高さは 55px のまま（別タスクがこの値に依存）
  - シート内容の高さを 60vh → 60dvh（vh フォールバックも残す: 例 `max-h-[60vh] supports-[height:100dvh]:max-h-[60dvh]` または style で）
  - モバイル判定 `window.innerWidth < 768` は維持
- src/components/layout/LayerSettings.tsx: 各レイヤー行全体を押せるボタンにし min-h-11。ON/OFF 表示は残す。配色ルール（青は航空写真などレイヤー状態のみ）を守る
- src/components/potential/prototypes/PrototypePanel.tsx: Range ボタン min-h-11
- src/components/potential/prototypes/PrototypeCompare.tsx: `grid-cols-1 sm:grid-cols-2`
- canvas の `touch-none` を `touch-pan-y` に: directional-field/DirectionalFieldCanvas.tsx、polar-heatmap/PolarHeatmapCanvas.tsx、potential/prototypes/PolarHeatmap.tsx（あれば prototypes/DirectionalField.tsx も）
- polar-heatmap/PolarHeatmapCanvas.tsx: devicePixelRatio を最大 2 に制限
- src/index.css: ルートの 100vh の後に 100dvh を追加（フォールバック維持）

## 禁止事項
- src/components/potential/PotentialMapView.tsx、layout/TopBar.tsx、menu/AppMenu.tsx、src/styles/ui.ts は編集しない（別タスク 004 が並行で編集中）
- 描画ロジック・色ランプ・サンプリングは変えない。新依存なし。`any` 禁止。

## 検証コマンド
./scripts/verify.sh （lint は ESLint 設定不足で既知の失敗。typecheck と build の結果をそのまま報告）

## 報告の形式
- 変更したファイルと理由
- 検証結果（PASS/FAIL をそのまま）
- 未解決の点

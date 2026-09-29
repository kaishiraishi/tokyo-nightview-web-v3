# Current State

## Current milestone

v3 主画面（夜景ポテンシャル地図）で、「方向・距離」UI の classicField / classicPolar / field / polar を比較・確定し、次の機能追加に安全に進める状態にする。

## Completed

- `App.tsx` → `PotentialMapView` の v3 基盤、MapLibre 東京表示、XYZ タイル、VIIRS / 航空写真 / ポテンシャルの ON/OFF と不透明度
- 地図クリック地点の周囲サンプリング（24 方位 × 9 距離、`samplePotentialGrid`、中心は 1 回取得）
- 地名検索、現在地移動
- 閾値フィルタ表示（MapLibre カスタムプロトコル `potential-filtered://`）。地図は「絞って探す」（閾値 0.006）に固定、手がかり量セレクタは削除
- 選択地点から Google Street View を別タブで開くリンク（画像・API の埋め込みは規約上しない）
- 方向・距離パネルの切替「classicField / classicPolar / field / polar」。4 種類すべてで共通 Range・status・error・空状態を表示し、classicField / classicPolar は従来 UI、field / polar は `prototypes/` の共通 ViewModel から描画する
- 005 モバイル対応: 下部シートのアクセシブルなハンドル、dvh フォールバック、レイヤー行・Range の操作領域拡大、比較カードの縦積み、canvas の縦スクロール許可、Polar の DPR 上限を反映
- 004 設定対応: `PanelViewSelector` で方向・距離表示をメニュー → 設定から変更し、`nightview.panelView` に安全に永続化。AppMenu をガラス調へ統一し、PotentialMapView のモバイル初期状態・操作領域・現在地ボタンを修正
- 006 ESLint 9 対応: `eslint.config.js` の flat config を追加し、現行主画面の lint を通過。`useMapLibre` の地形ソースを既存型に合わせ、既存の `any` を追加せず lint 対応
- Radial Bands / Peak Wedges は試作後に削除（4 View 版は commit `1c8b1019` に残る）
- ドキュメント運用の統合: `PROJECT.md` / `STATE.md` / `AGENTS.md` / `CLAUDE.md` / `PLAN.md`。`UI.md`・`POTENTIAL_LAYER_SETUP.md`・`.github/copilot-instructions.md` は内容を `PROJECT.md`（Current UI / Data pipeline）と `AGENTS.md` に統合して削除

## In progress

- classicField / classicPolar / field / polar のブラウザ・モバイル確認（今回のコード対応済み、実機表示確認は未完了）

## Next

1. 375×667 / 390×844 のブラウザで下部シート、切替パネル、比較カードの見やすさを確認する
2. classicField / classicPolar と field / polar を比べ、採用する表示を決めて不要な方を整理する
3. 大きな機能追加の前に `PLAN.md` を書く

（旧 Explore/Analyze 系コードと `tools/dsm-api` の扱いは PROJECT.md の Non-goals により判断しない）

## Blockers

- `npm run build` は成功するが、JS が 1.2 MB 超の chunk 警告
- 未コミット: 4 View 共通 UI と空状態対応、本ドキュメント更新、`public/NightViewPotential_tiles` の再生成差分（タイルは意図的に別扱い）

## Important files

- `scripts/luna.sh`, `scripts/verify.sh`, `tasks/`（Luna 委任の運用。手順は `tasks/README.md`）

- `src/App.tsx`, `src/components/potential/PotentialMapView.tsx`
- `src/components/potential/PanelViewSelector.tsx`, `src/components/menu/AppMenu.tsx`
- `src/components/potential/prototypes/`（`viewModel.ts`, `colorScale.ts`, `DirectionalField.tsx`, `PolarHeatmap.tsx`）
- `src/hooks/useMapLibre.ts`, `src/hooks/usePotentialAnalysis.ts`, `src/lib/potentialSampler.ts`
- `scripts/make-potential-tiles.sh`, `scripts/smooth-potential-raster.py`, `public/NightViewPotential_tiles/`
- `vite.config.ts`（base `/tokyo-nightview-web-v3/`）

## Verification

- `npm run build`: passing（chunk / Browserslist 警告あり）
- `npm run lint`: passing（現行対象。旧 `src/components/map/**` は旧 Explore/Analyze 系として設定で ignore）
- `./scripts/verify.sh`: lint PASS、typecheck PASS、build PASS（chunk / Browserslist 警告あり、2026-09-29 再確認）
- `npm test`: script なし（現段階では対象外）
- ブラウザ: データのある地点（秦野西方）で classicField / classicPolar / field / polar の描画と Range 切替を確認。モバイルは未確認

## Notes

- 閾値・正規化は PNG の RGBA から色ランプを逆引きした近似値。0.1635 以上は飽和する。
- Street View: Maps URLs（キー不要）を別タブで開くのみ。規約根拠は Maps Platform ToS §3.2.3(e)。変更時に現行規約を再確認する。
- `PolarHeatmap` の描画は、セルごとに blur を掛けるとページが固まるため、オフスクリーン描画 + 1 回の blur にしている。
- ESLint の `react-refresh/only-export-components` は、共有定数・型ガード・表示用関数を公開する `PanelViewSelector.tsx` と `prototypes/PrototypeViews.tsx` だけ無効化。旧 `src/components/map/**` は既存の Hook 依存関係・`any` が多数あるため変更せず ignore。

## Last updated

2026-09-29

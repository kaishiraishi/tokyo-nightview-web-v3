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
- 005 モバイル対応: 下部シートのアクセシブルなハンドル、dvh フォールバック、レイヤー行・Range の操作領域拡大、（比較表示は後に削除）、canvas の縦スクロール許可、Polar の DPR 上限を反映
- 004 設定対応: `PanelViewSelector` で方向・距離表示をメニュー → 設定から変更し、`nightview.panelView` に安全に永続化。AppMenu をガラス調へ統一し、PotentialMapView のモバイル初期状態・操作領域・現在地ボタンを修正
- 006 ESLint 9 対応: `eslint.config.js` の flat config を追加し、現行主画面の lint を通過。`useMapLibre` の地形ソースは `any` を外しつつ、元実装どおり `scheme` を削除して登録（Luna が削除処理を落としていたのを差し戻し）
- 方向・距離 UI を 4 種類の単独カード化（「比較」「現状 2 枚並び」は廃止）。classicField は `maxDistance` 以内のサンプルで方向を算出。従来版カードは `ClassicPanels.tsx` に分離
- タイル画像 `public/NightViewPotential_tiles/` を `.gitignore` し Git 管理から外した（commit `be5f33b9`）
- Radial Bands / Peak Wedges は試作後に削除（4 View 版は commit `1c8b1019` に残る）
- ドキュメント運用の統合: `PROJECT.md` / `STATE.md` / `AGENTS.md` / `CLAUDE.md` / `PLAN.md`。`UI.md`・`POTENTIAL_LAYER_SETUP.md`・`.github/copilot-instructions.md` は内容を `PROJECT.md`（Current UI / Data pipeline）と `AGENTS.md` に統合して削除

## In progress

- classicField / classicPolar / field / polar のブラウザ・モバイル確認（今回のコード対応済み、実機表示確認は未完了）

## Next

1. 375×667 / 390×844 のブラウザで下部シート、設定の 2×2 セレクタ、4 種類のカードの見やすさを確認する
2. classicField / classicPolar と field / polar を比べ、採用する表示を決めて不要な方を整理する
3. 大きな機能追加の前に `PLAN.md` を書く

（旧 Explore/Analyze 系コードと `tools/dsm-api` の扱いは PROJECT.md の Non-goals により判断しない）

## Blockers

- `npm run build` は成功するが、JS が 1.2 MB 超の chunk 警告
- タイルが Git 管理外のため、クリーンな clone / CI からのデプロイではビルド前に `scripts/make-potential-tiles.sh` でタイル生成が必要（配布方法は未決定）

## Important files

- `scripts/luna.sh`, `scripts/verify.sh`, `tasks/`（Luna 委任の運用。手順は `tasks/README.md`。今回の記録: 002〜008）

- `src/App.tsx`, `src/components/potential/PotentialMapView.tsx`
- `src/components/potential/PanelViewSelector.tsx`, `ClassicPanels.tsx`, `src/components/menu/AppMenu.tsx`, `src/styles/ui.ts`, `eslint.config.js`
- `src/components/potential/prototypes/`（`viewModel.ts`, `colorScale.ts`, `DirectionalField.tsx`, `PolarHeatmap.tsx`）
- `src/hooks/useMapLibre.ts`, `src/hooks/usePotentialAnalysis.ts`, `src/lib/potentialSampler.ts`
- `scripts/make-potential-tiles.sh`, `scripts/smooth-potential-raster.py`, `public/NightViewPotential_tiles/`
- `vite.config.ts`（base `/tokyo-nightview-web-v3/`）

## Verification

- `npm run build`: passing（chunk / Browserslist 警告あり）
- `npm run lint`: passing（現行対象。旧 `src/components/map/**` は旧 Explore/Analyze 系として設定で ignore）
- `./scripts/verify.sh`: lint PASS、typecheck PASS、build PASS（chunk / Browserslist 警告あり、2026-09-29 再確認）
- `npm test`: script なし（現段階では対象外）
- ブラウザ: 旧 3 切替（現状 / Field / Polar）の描画は秦野西方で確認済み。4 種類化・設定画面・モバイル対応後の表示は未確認（dev server で目視予定）

## Notes

- 閾値・正規化は PNG の RGBA から色ランプを逆引きした近似値。0.1635 以上は飽和する。
- Street View: Maps URLs（キー不要）を別タブで開くのみ。規約根拠は Maps Platform ToS §3.2.3(e)。変更時に現行規約を再確認する。
- `PolarHeatmap` の描画は、セルごとに blur を掛けるとページが固まるため、オフスクリーン描画 + 1 回の blur にしている。
- ESLint の `react-refresh/only-export-components` は、共有定数・型ガード・表示用関数を公開する `PanelViewSelector.tsx` と `prototypes/PrototypeViews.tsx` だけ無効化。旧 `src/components/map/**` は既存の Hook 依存関係・`any` が多数あるため変更せず ignore。

## Last updated

2026-09-29

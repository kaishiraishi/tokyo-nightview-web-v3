# Current State

## Current milestone

現在の v3 主画面（夜景ポテンシャル地図）の挙動を確認し、次の機能追加に安全に進める状態にする。

## Completed

- `src/App.tsx` から `PotentialMapView` を起動する v3 アプリ基盤
- MapLibre を使った東京エリアの地図表示
- `public/NightViewPotential_tiles/` の XYZ タイルレイヤー表示
- ポテンシャル、VIIRS、航空写真レイヤーの UI 操作
- ポテンシャルレイヤーの ON/OFF と不透明度調整
- 地図クリック地点の周囲サンプリング
- `DirectionalField` と `PolarHeatmap` による方向・距離の可視化
- 地名検索と現在地への移動
- クリックした地点のデータを可視化へ接続
- `PROJECT.md`、`STATE.md`、`AGENTS.md`、`CLAUDE.md` によるプロジェクト運用の初期整備

## In progress

- 既存ドキュメントと現行 v3 実装の差分整理
- 主画面のブラウザ上のスモーク確認

## Next

1. `UI.md` は現行 v3 画面の実態と別物（旧 V2: TopBar/LayerMenu/ScanControlPanel/deck.gl 構成）のため、単純な名称置換ではなく現行 `PotentialMapView` を対象に書き直すか、参考資料として明示的にアーカイブする（PROJECT.md の Source of truth から一旦外す）かを決めて実施する
2. `POTENTIAL_LAYER_SETUP.md` の `MapViewExplore.tsx` 参照を、現行の `useMapLibre.ts` / `PotentialMapView.tsx` の実装に合わせて書き直す
3. ESLint 9 用の設定を追加し、`npm run lint` を通す
4. 実データ・環境変数を用いた地図表示、地点クリック、レイヤー切替、モバイル表示をブラウザで確認する
5. 次のまとまった機能追加では、着手前に `PLAN.md` を作成する

（旧 Explore/Analyze 系コードと `tools/dsm-api` の扱いは PROJECT.md の Non-goals により現段階では判断しない）

## Blockers

- `npm run lint` は、リポジトリに `eslint.config.js` / `eslint.config.mjs` / `eslint.config.cjs` がないため現在失敗する
- `npm run build` は成功するが、生成 JavaScript が 500 kB を超える警告がある
- モバイル表示などのブラウザ確認は未実施

## Important files

- `src/App.tsx`
- `src/components/potential/PotentialMapView.tsx`
- `src/hooks/useMapLibre.ts`
- `src/lib/potentialSampler.ts`
- `vite.config.ts`
- `public/NightViewPotential_tiles/`
- `UI.md`
- `POTENTIAL_LAYER_SETUP.md`

## Verification

- `npm run build`: passing（Browserslist と chunk size の警告あり）
- `npm run lint`: failing（ESLint 9 設定ファイル不足）
- `npm test`: npm script 未定義（PROJECT.md により現段階では Success criteria の対象外、Blockers 扱いもしない）

## Last updated

2026-09-28

## 2026-09-28: 地図ポテンシャル表示モード比較

- 「広く探す」「手がかり」「絞って探す」の3モードを追加。初期値は「手がかり」。選択中のモード名と短い説明を設定パネルに表示する。
- 既存PNGタイルを変更せず、MapLibreカスタムプロトコルで表示時にRGBA色ランプから値を推定し、閾値未満を透明化する。閾値は地図表示だけに作用し、方向・距離のサンプリングは従来どおり。
- 不透明度は従来どおり独立設定。高閾値で手がかりが見えない場合の案内を追加。
- 制限: タイルはRGBA色ランプを焼き込んだPNGのため、閾値判定は色からの逆推定。量子化により境界付近に小さな誤差があり得る。3モード用タイルをリクエスト時にブラウザ上で加工するため、初回表示ではCPU処理が増える。
- 検証: `npm run build` 成功（既知の古い Browserslist データ・500 kB超chunk警告あり）。`npm run lint` は ESLint 9 の設定ファイルがないため失敗（既知）。
- ブラウザ確認: Vite ローカル画面の同一地図範囲で3モードを切替。広く探す→手がかり→絞って探すの順に表示領域が減ることを確認。

## 2026-09-28: フィルタータイルURL修正

- カスタムタイルURLを `potential-filtered://tiles/{z}/{x}/{y}.png` に変更し、URL pathname の3区分から z/x/y を取得するよう修正。無効なURL/閾値は明示的にエラーにする。
- 画素ごとの閾値処理を `applyPotentialThreshold` として切り出し、プロトコル処理と実行確認で共有。
- 実行確認: Node の assertion で展開済み URL の z/x/y/threshold 抽出、閾値未満ピクセルの透明化、閾値以上ピクセルのalpha維持を確認。
- ブラウザで実タイルを使った3モード切替を確認済み。次は地点クリックとモバイル幅で、地図と方向表示を通した探索体験を確認する。

## 2026-09-28: 選択地点からStreet Viewを開く

- 地図で選択した地点のパネルに「Google マップで周辺のストリートビューを探す」ボタンを追加。選択座標をGoogle Maps URLsの`map_action=pano` / `viewpoint`へ渡し、別タブで開く。画像の存在を保証しない旨と、近隣画像が表示される場合がある旨をUIに記載。
- 規約確認により、Google Street View画像やStreet View Static APIをMapLibre画面へ埋め込む方式は採用しなかった。Google Maps Platform Terms of Service §3.2.3(e) はGoogle Maps Core Servicesをnon-Google Mapと「with or near」利用することを禁じ、同一画面でのStreet View表示を例示している（https://cloud.google.com/archive/maps-platform/terms-20250714）。本アプリの地図はMapLibre/non-Google map。
- 公式Maps URLsのStreet View URLはAPIキー不要。ユーザー操作で別タブを開くURLだけを使用し、Google API呼出し、画像埋め込み、撮影位置/撮影時期取得は行わない（https://developers.google.com/maps/documentation/urls/get-started）。画像の有無と撮影情報は遷移先のGoogle Mapsで確認する。
- `npm run build`: 成功。既知のBrowserslist古さと1,225.51 kB chunk警告あり。
- `npm run lint`: 失敗。ESLint 9.39.2が`eslint.config.(js|mjs|cjs)`を発見できない既知の設定不足。
- ブラウザ確認: 地図クリックでピンとリンクが現れ、選択座標が公式Maps URLの`viewpoint`に渡されることを確認。Google側の遷移先画像の有無は未確認。
- 次の作業: 現行利用規約とGoogle Maps URL仕様を変更時に再確認する。

## 2026-09-29: 方向・距離UIのPrototype比較切替

- 設定パネルに「現状 / Field / Polar / Bands / Peaks / 比較」の切替ボタンを追加。初期値は「現状」で、従来の Directional Field + Polar Heatmap カード（Street View リンク含む）はそのまま維持。
- 新規 `src/components/potential/prototypes/`: 共通 ViewModel（`viewModel.ts`）から 4 View（Directional Field / Polar Heatmap / Radial Bands / Peak Wedges）を描画。色は `colorScale.ts`（既存 `POTENTIAL_COLOR_RAMP` を等間隔割当）で共通、Canvas は論理 300px を CSS 縮小、方位は 0°=北の地理方位。「比較」は 4 View の 2×2 同時表示。Range と Mode はパネル内ボタンで全 View 同時更新（Mode は地図の手がかり量と同じ state を共有）。
- データ層: `potentialSampler.ts` に `samplePotentialGrid`（24方位×9距離、中心は1回取得）と `polarPointsFromGrid` を追加し、旧 `samplePotentialAround` は削除。`hooks/usePotentialAnalysis.ts` が地点ごとに 1 回だけサンプリングし、range/threshold 変更は再取得せず ViewModel を再生成。古いリクエストは request id で破棄。更新中は前回結果を薄くして「更新中…」を重ねる。
- 仕様との差: `potentialDataSource.ts` は未作成（タイル取得は `potentialSampler.ts` のキャッシュのまま）。`/prototype` 専用ルートは作らず、比較モードで代替。旧UIは今回から前回結果を保持したまま再サンプリングする（従来はクリック時に空にしていた）。
- 検証: `npm run build` 成功（既知の chunk 警告）。ブラウザで、データのある地点（秦野西方）をクリックして 4 View の描画、比較/現状の切替、Range 変更を確認。モバイル幅と Compare での各 View の見やすさ（小さい Canvas 上の文字サイズ）は未確認。Polar のセルごとの blur でページが固まったため、オフスクリーン描画＋1回の blur に修正済み。
- 未対応: 4 問（強い方向・広狭・遠近・第二候補）でのユーザー比較、モバイル bottom sheet 化、`npm run lint`（既知の ESLint 9 設定不足）。

## 2026-09-29: 手がかり量を「絞って探す」に固定

- 地図の手がかり量セレクタと補足文を削除し、`PotentialMapView.tsx` の `POTENTIAL_MODE_ID = 'focused'`（閾値 0.006）に固定。分析パネルの Mode ボタンも同じ state を使っていたため削除。Range ボタンは残す。
- 他モードのタイル層（wide / clue）は `useMapLibre.ts` に残っているが表示されない。

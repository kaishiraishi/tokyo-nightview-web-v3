# Project

## Goal

このプロジェクトは、都市にある夜景を探すプロジェクトである。
目的地を検索して向かう体験ではなく、コンパスを片手に自分の位置から周囲の夜景ポテンシャルを感じ取りながら探索していく体験に変えることを目指す。

そのために、東京都の夜景ポテンシャルを地図上で探索できる Web アプリを実装する。
地図上のポテンシャルレイヤーを見ながら地点を選び、周囲の夜景ポテンシャルを方向と距離で確認できる、軽量な探索体験を主軸とする。`DirectionalField`（方向）と `PolarHeatmap`（距離）は、この「コンパスで探索する」体験を担う中心的な UI である。

現在の主画面は `src/App.tsx` から `src/components/potential/PotentialMapView.tsx` を起動する構成である。

## Success criteria

- 東京エリアの地図を、デプロイ先のベースパスを壊さず表示できる
- 夜景ポテンシャルレイヤーを表示・非表示・不透明度変更できる
- 地図上の地点を選択し、周囲のポテンシャルを `DirectionalField` と `PolarHeatmap` で確認できる
- 地名検索と現在地への移動が利用できる
- データがない地点や取得失敗時に、画面が壊れず理由を表示できる
- モバイルとデスクトップの両方で主要操作ができる
- TypeScript のビルドと、可能な範囲の静的チェックが通る
- 自動テストは現段階では Success criteria の対象外とする（テスト用 npm script の不在は Blockers ではなく既知の未整備事項として扱う）

## Principles

- 地図とデータの意味が UI より先に伝わることを優先する
- 既存の MapLibre / React / TypeScript 構成を尊重する
- `public/NightViewPotential_tiles` のデータパスと座標・ズーム前提を曖昧にしない
- タイルの生成側とクライアント側の色ランプを同期する
- デプロイ用の `import.meta.env.BASE_URL` を経由して静的アセットを参照する
- 不要な依存関係や大規模な作り替えを増やさない
- 会話ではなく、このリポジトリのファイルをプロジェクトの正本にする

## Non-goals

- 現段階で別の地図エンジンへ移行しない
- 現段階で認証・投稿・プロフィールなどの旧 Explore/Analyze 系機能を、主画面の範囲へ無断で広げない。ただし、ユーザーが明示的に許可した「既存投稿 UI のモード切替接続のみ」は例外とし、投稿 UI 自体・認証・データ・旧探索アルゴリズムは拡張しない
- 現段階でポテンシャル値の算出方法を、根拠なく変更しない
- 生データや生成済みタイルを、理由と再生成手順なしに置き換えない

## Source of truth

- 長期目標と制約: `PROJECT.md`
- 現在地・検証結果・次の作業: `STATE.md`
- AI の作業ルール: `AGENTS.md` / `CLAUDE.md`
- 大きな作業の計画: `PLAN.md`（大きな作業のときだけ内容を持つ）
- UI とデータパイプラインの現行仕様: このファイルの「Current UI」「Data pipeline」
- チャット履歴は資産にしない。引き継ぎはすべて `STATE.md` に書く

## Current architecture

- Entry point: `src/App.tsx`
- Active view: `src/components/potential/PotentialMapView.tsx`
- `App` は `mode: 'explore' | 'analyze'` の単一状態を持ち、常に `PotentialMapView` を 1 つだけ描画する（mode 切替で地図は作り直さない）。`analyze`（投稿モード）では同じ地図の上に投稿をポップアップで重ね、左メニューを投稿一覧、右下に投稿ボタン（`PostComposer`）を出す。地図クリックの地点選択は投稿モード中は無効
- 投稿の取得は `usePosts`、地図上の表示は `usePostPopups`。投稿モードに入るまで Supabase は呼ばない
- Map and layer registration: `src/hooks/useMapLibre.ts`
- Pixel sampling and polar data: `src/lib/potentialSampler.ts`
- Potential tiles: `public/NightViewPotential_tiles/`（`.gitignore` 済み。Git には含めず `scripts/make-potential-tiles.sh` で再生成する）
- Tile generation: `scripts/make-potential-tiles.sh`
- Deployment base path: `vite.config.ts` の `/tokyo-nightview-web-v3/`
- ローカル確認: `npm run dev` → `http://localhost:5173/tokyo-nightview-web-v3/`（末尾のベースパス必須。ポートが埋まっていれば Vite が表示する `Local:` の URL）。実機は `npm run dev -- --host` の `Network:` URL を同じ Wi-Fi から開く

`src/components/map/MapViewExplore.tsx`、`MapViewAnalyze.tsx` などの旧画面・旧機能はリポジトリに残っている。`MapViewExplore.tsx` はどこからも起動されない（投稿モードは `PotentialMapView` に統合済み）。`tools/dsm-api`（`npm run dev:api` / `dev:all`）は `MapViewExplore.tsx` の `src/lib/api/dsmApi.ts` のみが使う旧探索専用のバックエンドで、現在は未接続。変更する場合は、主画面の変更なのか旧機能の再利用なのかを明示する。

上記の「既存投稿 UI のモード切替接続のみ」の例外を除き、旧 Explore/Analyze 系コード（`MapViewExplore.tsx` 等と `tools/dsm-api`）を残すか削除するか再利用するかは、Non-goals により現段階では判断・着手しない。追加の再利用が必要になった時点で `PROJECT.md` の Non-goals を更新してから着手する。

## Current UI

- レイアウト（探索・投稿共通、モバイル / PC 共通）: 左上にミニコンパス（`MiniCompass`。カード内の Directional Field（試作 `field`、`prototypes/DirectionalField.tsx` の `variant="mini"`）を 64px に縮小したもの。Figma 準拠で背景・枠なし、細いリングと外側の N/E/S/W 目盛り（N は赤）、方位文字と中心マーカーは省略。端末方位（なければ地図の bearing）で回転し、中央は Range。タップで全画面コンパス。投稿モードでは非表示）、右上に探索 / 投稿の切替ピル（`MapModeToggle`）、右下に現在地と Map Modes の縦ボタン列（`MapControlStack`）。検索とメニュー（設定）ボタンは `LayerMenu`（PC はサイドパネル、モバイルは下部シート）の上部。主画面では `TopBar` を使わない。ガラス調（`bg-black/60` + `backdrop-blur-md` + `border-white/10`）、基本テキストは `White/90`、補助は `White/50`。
- 配色: 紫はネオンにせず落ち着いた灯りとして扱う。塗りは選択中・主ボタンに限り、淡い紫は枠・フォーカスに使う。青は航空写真などレイヤー状態だけ、赤はエラーと北方向だけ。
- `LayerMenu` の内容: レイヤー ON/OFF（ポテンシャル / 航空写真。VIIRS 表示は廃止）、不透明度、凡例、方向・距離パネル。
- 探索 / 投稿の切替は `MapModeToggle`（地図アイコン = 探索、紫のスパークル = 投稿）。`aria-pressed` で現在の mode を示す。メニューの「投稿」行も投稿モードへ切り替える。
- 地図のポテンシャル表示は「絞って探す」（閾値 0.006）に固定。
- 方向・距離パネルの表示は 4 種類「Field（従来）/ Polar（従来）/ Field（試作）/ Polar（試作）」で、カードには 1 つだけ出す。選択は メニュー → 設定 の `PanelViewSelector` で選ぶ（`localStorage` の `nightview.panelView` に保存）。メニュー・設定画面もトップと同じガラス調（`src/styles/ui.ts` の `glassPanel`）。`classicField` / `classicPolar` は従来の `DirectionalField` + `PolarHeatmap`、`field` / `polar` は `src/components/potential/prototypes/`（共通 ViewModel から描画、Range ボタンで全 View 同時更新）。
- 選択地点からは Google Maps Street View を別タブで開くリンクだけを出す。このリンクはデバッグモード時のみ表示し、デバッグモードは メニュー → 設定 のスイッチで切り替える（`localStorage` の `nightview.debugMode`、既定 OFF、`src/lib/debugMode.ts`）（規約上、Google 画像・API を MapLibre 画面に埋め込まない。Maps Platform ToS §3.2.3(e)）。
- 探索モードでは旧 V2 の ScanControlPanel / 旧探索用 deck.gl UI は使わない。投稿モードでは明示許可された既存 `MapViewExplore` の投稿 UI だけを表示する。

## Data pipeline

- 元データ: Float32 GeoTIFF（EPSG:6677）。生成側の入力パスは `scripts/make-potential-tiles.sh` の `IN_TIF`。
- 生成: `scripts/make-potential-tiles.sh` が (1) EPSG:3857 へ再投影 (2) `scripts/smooth-potential-raster.py` で 90m グリッドをマスク付きガウス平滑化 (3) 色ランプ (4) `gdaldem color-relief` (5) `gdal2tiles.py --xyz` でズーム 10–14 の XYZ PNG を `public/NightViewPotential_tiles/` に出力。
- 色ランプと `MAX_POTENTIAL_VALUE = 0.1635` は `scripts/make-potential-tiles.sh` と `src/lib/potentialSampler.ts` で必ず同期する。
- クライアント: `src/hooks/useMapLibre.ts` が MapLibre カスタムプロトコル `potential-filtered://` で PNG を閾値処理して表示（3 モード分のレイヤーを登録し、表示は 1 つ）。タイル URL は `import.meta.env.BASE_URL` 経由。
- 値の扱い: PNG の RGBA から色ランプを逆引きした近似値であり、Float32 の真値ではない。0.1635 以上は strength 1 に飽和するため、高ポテンシャル同士の比較はできない。将来は数値タイル / COG を検討する（Prototype 比較後）。
- サンプリング: `samplePotentialGrid`（24 方位 × 9 距離 = 216 点、方位は 0°=北の地理方位、z14 タイルから取得、タイルはキャッシュ）。UI は `usePotentialAnalysis` を経由し、View 内でデータ取得しない。

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
- 現段階で認証・投稿・プロフィールなどの旧 Explore/Analyze 系機能を、主画面の範囲へ無断で広げない。ただし、ユーザーが明示的に許可した「既存投稿 UI のモード切替接続のみ」と「メニューのお気に入り（端末内保存）・はじめてガイド」（2026-10-03）は例外とし、投稿 UI 自体・認証・データ・旧探索アルゴリズムは拡張しない
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
- Potential tiles: `public/NightViewPotential_tiles/{z}/{x}/{y}.webp`（閾値 0.006 を焼き込んだ可逆 WebP、約 2.2MB。**Git 管理**）。生の PNG と中間ファイルは `tiles-work/`（git 管理外）。再生成は `scripts/make-potential-tiles.sh`
- Tile generation: `scripts/make-potential-tiles.sh`
- Deployment base path: `vite.config.ts` の `/tokyo-nightview-web-v3/`
- ローカル確認: `npm run dev` → `http://localhost:5173/tokyo-nightview-web-v3/`（末尾のベースパス必須。ポートが埋まっていれば Vite が表示する `Local:` の URL）。実機は `npm run dev -- --host` の `Network:` URL を同じ Wi-Fi から開く

`src/components/map/MapViewExplore.tsx`、`MapViewAnalyze.tsx` などの旧画面・旧機能はリポジトリに残っている。`MapViewExplore.tsx` はどこからも起動されない（投稿モードは `PotentialMapView` に統合済み）。`tools/dsm-api`（`npm run dev:api` / `dev:all`）は `MapViewExplore.tsx` の `src/lib/api/dsmApi.ts` のみが使う旧探索専用のバックエンドで、現在は未接続。変更する場合は、主画面の変更なのか旧機能の再利用なのかを明示する。

上記の「既存投稿 UI のモード切替接続のみ」の例外を除き、旧 Explore/Analyze 系コード（`MapViewExplore.tsx` 等と `tools/dsm-api`）を残すか削除するか再利用するかは、Non-goals により現段階では判断・着手しない。追加の再利用が必要になった時点で `PROJECT.md` の Non-goals を更新してから着手する。

## Current UI

- レイアウト（探索・投稿共通、モバイル / PC 共通）: 左上にミニコンパス（`MiniCompass`。カード内の Directional Field（試作 `field`、`prototypes/DirectionalField.tsx` の `variant="mini"`）を 64px に縮小したもの。細いリングと外側の N/E/S/W 目盛り（N は赤）。地図と同化しないよう、他の地図ボタンと同じガラス調の円（`bg-black/55` + `backdrop-blur-md`）を背後に敷く、方位文字と中心マーカーは省略。端末方位（なければ地図の bearing）で回転し、中央は Range。向きセンサーが動いている間は、画面の上に固定した前方の扇形で「向いている方向」を示す。センサーは、コンパスモードを開いた時と、メニュー → 設定の「向きセンサー」スイッチで開始し、コンパスモードを閉じても止まらない（設定のスイッチで止める）。タップでコンパスモード。探索・投稿の両モードで表示）。コンパスモードは、全面の地図の上にガラス調のカードを浮かべる（縦長: 上、地図の高さの 40% / 横長: 左、地図の幅の 44%。画面の分割はしない）。`CompassMode` は、目盛りが方向ごとの強さの棒グラフになった文字盤（中心を除いた方向別最大値を最小〜最大で正規化し、上位の方向だけポテンシャルの色で外へ伸ばす）、上方向（端末の向き）に固定の視野扇形、カーナビ風の縮尺バーと ＋/− による Range 変更、センサー停止中の「向きセンサーを開始」ボタンを持つ。表示中は下部シート・ミニコンパス・モード切替を隠す。表示中は地図にコンパスの距離ガイドと同じ円（range の 1/4・1/2・1。外側は実線、内側は破線、各円の真北に距離ラベル。`useRangeRings`）を重ね、中心はコンパスと同じ地点（選択地点、なければ現在地）。文字盤をタップすると、その方位・距離の地点を文字盤上の点と、地図上の点＋中心からの点線で示し、カードのヘッダーに読み取り値を出す（`useCompassTarget`。Range・中心の変更とコンパスを閉じると消える）。開いたとき・Range を変えたときは、カードに隠れない領域に外側の円が収まるよう地図を合わせる。スマホを横向きにする（`(orientation: landscape) and (max-height: 520px)`）とコンパスモードを自動で開き、縦に戻すと（自動で開いた場合だけ）閉じる。向きセンサーは既定で ON（`nightview.headingSensor`）。タッチ端末では最初のタップで開始する（iOS は許可にタップが要るため）、右上に探索 / 投稿の切替ピル（`MapModeToggle`）、右下に現在地と Map Modes の縦ボタン列（`MapControlStack`。投稿モードではピルの一番上に投稿（カメラ）ボタンが入る）。検索とメニュー（設定）ボタンは、探索モードでは面を持たない浮かぶ検索バー `FloatingSearchBar`（`glassControl` のピルにメニューボタンと検索欄。上の帯の、左のミニコンパスと右のモード切替のあいだに置き、縦の中心を揃える。PC は幅 360px、スマホはモード切替の手前まで伸ばし、虫めがねは省く。検索結果は下に開き、スマホでは画面幅いっぱい。地図に触れると結果を閉じる）、投稿モードでは `LayerMenu`（PC はサイドパネル、モバイルは下部シート。投稿一覧を持つ）の上部（2026-10-03）。主画面では `TopBar` を使わない。ガラス調は `src/styles/ui.ts` の 3 トークンに集約する: 小さな浮かぶ部品 `glassControl`（`bg-black/60` + `backdrop-blur-md` + `border-white/10`、角丸 full）、大きな面 `glassSurface`（`bg-[#05070b]/80` + `backdrop-blur-xl` + `border-white/15`、角丸 28px。ポップオーバーは rounded-2xl）、面の上の閉じるボタン `closeButton`（44px）。画面端の余白は 16px。基本テキストは `White/90`、補助は `White/50`。
- 配色: 紫はネオンにせず落ち着いた灯りとして扱う。塗りは選択中・主ボタンに限り、淡い紫は枠・フォーカスに使う。青は航空写真などレイヤー状態だけ、赤はエラーと北方向だけ。
- 表示モード（右下の地図ボタン → `MapModesModal`）: 標準 / ポテンシャル / 航空写真 から 1 つを選ぶ。下に折りたたみの「夜景ポテンシャルとは」（見かた・コンパスの使い方・注意。算出方法は書かない）（Apple マップの Map Modes 型。航空写真モードは写真の上にポテンシャル層を重ねる。2026-10-03）。サムネイルはアプリの地図を撮影した `src/assets/map-modes/*.webp`（川崎市多摩区付近 z13、地図の見た目を変えたら撮り直す）。不透明度スライダーは常に表示。VIIRS 表示は廃止
- 投稿モードの下部シート（モバイル）は表示時に下から持ち上がり、サイドパネル（PC）は左から入る（`index.css` の `animate-sheet-rise` / `animate-panel-slide-in`、reduced-motion では無効）
- メニュー（`AppMenu`、2026-10-03）: お気に入り（件数）・投稿を見る（件数）・はじめてガイド・設定。アカウントがないのでプロフィールや架空の数字は出さない。お気に入りは端末の `localStorage`（`nightview.favorites`、`src/lib/favorites.ts`、`useFavorites`）に保存し、検索結果・お気に入りの白いピンのポップアップ（選んだときに自動で開く）の「お気に入りに追加 / 外す」と、お気に入りページの「現在地をお気に入りに追加」で登録する。一覧から選ぶとその地点へ移動してピンを立て、各行で削除できる。はじめてガイド（`GuideView`）は画面にある操作だけを説明する（算出方法は書かない）
- コンパスの文字盤の方位は N/E/S/W（N は赤、大きめの文字に暗い縁取り）。向きセンサーが動いている間は、カード上部に「向いている方角 北東 42°」を出す
- 探索 / 投稿の切替は `MapModeToggle`（地図アイコン = 探索、紫のスパークル = 投稿。選択中の背景（探索は白・投稿は紫）が左右に滑って移る）。部品の出入りは `index.css` の `animate-ui-rise / drop / pop / view`（180〜260ms、入るときだけ。reduced-motion では動かさない）で、検索バー・検索結果・投稿ボタン・コンパスのカード・表示モード画面・メニューのページ切り替えに使う。`aria-pressed` で現在の mode を示す。メニューの「投稿」行も投稿モードへ切り替える。
- 地図のポテンシャル表示は、光っている画素（閾値 0.006 以上）の上位 10%（値 0.0479 以上、`POTENTIAL_DISPLAY_THRESHOLD`）だけを出す表示用タイル `public/NightViewPotential_top10_tiles` を使う（2026-10-03）。コンパスのサンプリングは従来どおり閾値 0.006 のタイルを読む。表示モード画面の「表示するスコア」（高のみ = 上位 10% / 高・中・低 = すべて、`nightview.potentialScope`、既定は上位 10%）で、地図のタイルを `setPotentialDisplayScope` により切り替えられる。
- PLATEAU の 3D 建物（`useMapLibre` の `plateau-bldg-extrusion`、第三者がホスティングしている MVT `ysk766.github.io/plateau_tokyo_2023_mvt_lod1`）は、メニュー → 設定 の「3D 建物」スイッチでオン/オフする（`nightview.buildings3d`、既定 ON）。このタイルは tippecanoe の `--drop-densest-as-needed` で密集地の建物が間引かれていて、西新宿の高層ビル街などが欠ける。自前での再生成は検討中
- 探索モードにはシート・サイドパネルがない（2026-10-02 に方向・距離カードの中身を撤去し、2026-10-03 に検索欄だけのシートも浮かぶ検索バーに置き換えた）。方向・距離の分析はミニコンパス → コンパスモードで見る。地図タップによる地点選択（紫のピン）はデバッグモードのときだけ有効で、オフでは現在地が中心（オフにすると選択地点も消える）。選択地点のピンを押すと、Street View リンクを小さなポップアップで出す（`streetViewPopup.ts`。ピン自体がデバッグモード専用。ピンやポップアップを押しても地点は選び直さない）。デバッグモードでは地図を右クリックすると、その地点の z14 画素（rgba）・復元した値・光っている画素全体の中での「上位 X%」をポップアップで見られる（`usePixelInspector`。順位表は `src/lib/potentialQuantiles.ts`、`scripts/potential-quantiles.py` で生成。投稿モードでは無効。スマホには右クリックがないので PC のみ）。検索結果を選ぶと一覧を閉じ、z15 まで寄って白いピンを立てる（`useSearchResultMarker`。目印だけで、コンパスの中心は変えない。検索欄を空にすると消える。投稿モードのモバイルではシートも閉じる）。以前の 4 種類（classicField / classicPolar / field / polar、`ClassicPanels.tsx`、`prototypes/PrototypePanel.tsx`、`CompassControl.tsx`）は主画面から呼ばれていない。設定の `PanelViewSelector`（`nightview.panelView`）は残っているが、今は表示に影響しない。メニュー・設定画面はトップと同じガラス調（`src/styles/ui.ts` の `glassPanel`）
- 選択地点からは Google Maps Street View を別タブで開くリンクだけを出す。このリンクはデバッグモード時のみ表示し、デバッグモードは メニュー → 設定 のスイッチで切り替える（`localStorage` の `nightview.debugMode`、既定 ON、`src/lib/storedSettings.ts`）（規約上、Google 画像・API を MapLibre 画面に埋め込まない。Maps Platform ToS §3.2.3(e)）。
- 探索モードでは旧 V2 の ScanControlPanel / 旧探索用 deck.gl UI は使わない。投稿モードでは明示許可された既存 `MapViewExplore` の投稿 UI だけを表示する。

## Data pipeline

- 対象範囲（2026-10-03）: 東京都・神奈川県・千葉県・埼玉県。地図は範囲外を暗くし、1都3県の外周（淡い紫の実線）と都県境（破線）を引く（`useMapLibre` の `addTargetArea`、`public/target-area.geojson`）。形は国土地理院「地球地図日本」の都道府県界（`dataofjapan/land` の `japan.geojson`、出典の明記が必要）から id 11〜14 を取り出し、島しょ部（南端が北緯 34.8 度未満）と小さな島を除き、shapely で合体して 0.002 度で単純化したもの（`mask` / `area` / `pref` の 3 種類の地物）。ポテンシャルのデータ（タイル）は東経 138.87〜139.92 度までで、千葉県の大部分は含まれない

- 元データ: Float32 GeoTIFF（EPSG:6677）。生成側の入力パスは `scripts/make-potential-tiles.sh` の `IN_TIF`。
- 生成: `scripts/make-potential-tiles.sh` が (1) EPSG:3857 へ再投影 (2) `scripts/smooth-potential-raster.py` で 90m グリッドをマスク付きガウス平滑化 (3) 色ランプ (4) `gdaldem color-relief` (5) `gdal2tiles.py --xyz` でズーム 10–14 の XYZ PNG を `tiles-work/potential-png/` に出力 (6) `scripts/bake-potential-tiles.py`（numpy + Pillow）が、色ランプの逆引きで値が閾値（0.006）未満のピクセルを透明にし、可逆 WebP として `public/NightViewPotential_tiles/` に書き出す。同じ PNG から、地図の表示用に上位 10%（閾値 0.0479）だけを焼き込んだ `public/NightViewPotential_top10_tiles/` も書き出す（約 0.48MB、4,475 枚が透明）。全面が透明になるタイルも透明な WebP として必ず置く（404 だと MapLibre が親タイルで代用するため）。タイルを作り直したら、生成物をコミットする
- タイルや色ランプ・閾値を変えたら `python3 scripts/potential-quantiles.py` で `src/lib/potentialQuantiles.ts`（デバッグ用の順位表）も再生成してコミットする。
- 色ランプ・`MAX_POTENTIAL_VALUE = 0.1635`・閾値 `0.006` は `scripts/make-potential-tiles.sh`、`scripts/bake-potential-tiles.py`、`src/lib/potentialSampler.ts`（`POTENTIAL_COLOR_RAMP` / `MAX_POTENTIAL_VALUE` / `POTENTIAL_THRESHOLD`）で必ず同期する。
- クライアント: `src/hooks/useMapLibre.ts` が表示用（上位 10%）の WebP タイルを通常の MapLibre ラスターソース 1 本（`potential-nightview` / `potential-nightview-layer`）として表示する。閾値処理はクライアントでは行わない。タイル URL は `import.meta.env.BASE_URL` 経由。表示の ON/OFF と不透明度は `PotentialMapView` がレイヤーのプロパティで切り替える
- 値の扱い: タイルの RGBA から色ランプを逆引きした近似値。閾値未満のピクセルは焼き込みで透明になっているため、サンプリングでは 0 として読まれる（以前は小さな正の値だった。表示用 ViewModel は閾値未満を 0 扱いにするので見た目は同じ）であり、Float32 の真値ではない。0.1635 以上は strength 1 に飽和するため、高ポテンシャル同士の比較はできない。将来は数値タイル / COG を検討する（Prototype 比較後）。
- サンプリング: `samplePotentialGrid(origin, maxDistance)`（24 方位 × 最大 17 距離。距離は 0, 25, 50, 100, 200, 350, 500, 750, 1000, 1500, 2000, 3000, 4000, 5000, 6500, 8000, 10000 m。方位は 0°=北の地理方位）。タイルは距離ごとにズームを変える（1km まで z14、3km まで z13、それより遠くは z12。タイルはキャッシュ）。取得するのは Range に必要な距離まで（1km 以下の Range は 1km まで、5km / 10km を選んだときだけ遠方を追加取得し、狭めるときは再取得しない）。UI は `usePotentialAnalysis` を経由し、View 内でデータ取得しない。Range は 50m / 100m / 200m / 500m / 1km / 5km / 10km（`POTENTIAL_RANGES`、初期値 1km）

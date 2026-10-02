# 現行画面 — Figma再現仕様

この資料は 2026-10-02 時点の実装から、現行 v3 画面を Figma で組み直すための寸法・色・状態をまとめたものです。値は Tailwind クラスと CSS から取得しています。画面フレームと UI の値が対象で、地図・投稿写真などの画像素材は対象外です。写真枠やサムネイル枠は、必要なら無地のプレースホルダーで配置してください。

## 対象と基準フレーム

- 対象は `src/App.tsx` → `src/components/potential/PotentialMapView.tsx` から起動する現行 UI。
- `MapViewExplore` / `MapViewAnalyze`、旧 `TopBar`、旧 `ScanControlPanel`、旧プロフィールカード／方向距離カードは現行画面に接続されていないため対象外。現行メニュー内の仮プロフィール表示は対象に含める。
- Figma の比較用フレームは **Mobile 390 × 844 px**、**Desktop 1440 × 900 px** を推奨。実装上の切替点は viewport 幅 **768 px**。
- `#root` とアプリ本体は画面全体（`100vw × 100dvh`）。ブラウザバーやノッチを含む実機では `safe-area-inset-*` が加算される。基準フレーム上の計算例は safe area = 0 px とする。
- 初期状態: 探索モード、Range 200 m、ポテンシャル表示 ON、不透明度 82%、航空写真 OFF、選択地点なし。Desktop は左パネル展開、Mobile はシート折りたたみ。
- 地図・検索・位置・投稿・方位データは実行ごとに変わる。地図や写真は再現対象に含めず、Figmaでは画面フレームとUI配置を組む。背景が必要な場合は任意の無地領域として扱う。

## 共通スタイル

|用途|値|
|---|---|
|フォント|`-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif`（macOS の Figma では SF 系を起点にする）|
|基本文字|`#FFFFFF`。主要文字は 90%（`text-white/90`）、補助文字は 50%（`text-white/50`）|
|ガラス面|`rgba(0,0,0,.60)` + backdrop blur 12 px（`backdrop-blur-md`）+ `rgba(255,255,255,.10)` 1 px border|
|地図上の円形ボタン|`rgba(0,0,0,.60)` 前後 + blur 12 px + 薄い白枠。MiniCompass の背景は black 55%|
|アクセント|Tailwind violet 700 `#6D28D9`（選択／主ボタン）、violet 300 `#C4B5FD`、violet 400 `#A78BFA`|
|北・エラー|北マーク `#F87171`。エラー面は `rgba(239,68,68,.95)`|
|地図／コンパス背景|画面 `#000000`、分割コンパス `#06080C`、Canvas `#080B10`|
|共通タップ高|44 px 以上（主要ボタンは CSS 変数を使用）|
|モーション|シート／パネル 420 ms、`cubic-bezier(.22,1,.36,1)`。高さ切替は 300 ms ease-out。reduced motion では入場アニメーションなし|

地図用ボタンの CSS 変数（画面短辺 `vmin` 基準）:

|変数|CSS|390 × 844|1440 × 900|
|---|---|---:|---:|
|ボタン高 `--btn-h`|`clamp(44px, 5.2vmin, 56px)`|44 px|46.8 px|
|横 padding `--btn-px`|`clamp(14px, 3.6vmin, 28px)`|14 px|28 px|
|文字 `--btn-fs`|`clamp(13px, 1.7vmin, 16px)`|13 px|15.3 px|
|ボタン間 `--btn-gap`|`clamp(6px, 1.2vmin, 10px)`|6 px|10 px|

Tailwind の `text-xs / sm / base / lg` はそれぞれ 12 / 14 / 16 / 18 px。`h-11` は 44 px、`h-12` は 48 px、`p-4` は 16 px、`rounded-2xl` は 16 px。

## Figma フレーム一覧

|フレーム|表示状態|主な差分|
|---|---|---|
|01 Explore — Mobile|地図 + 折りたたみシート|左上ミニコンパス、右上モード切替、右下地図操作|
|02 Explore — Mobile / Search|シート中段または最大 + 検索結果|検索結果リストを検索欄の下に重ねる|
|03 Explore — Desktop|地図 + 左パネル|左上のミニコンパスはパネル右隣へ移動|
|04 Posts — Mobile / Desktop|投稿モード|投稿一覧、地図上投稿ポップアップ、右下カメラボタン|
|05 Post Composer|投稿フォーム展開|カメラボタンの上に幅 288 px のフォーム|
|06 Pin Selection|投稿場所を地図から選択|画面上部に紫の案内ピル|
|07 Compass Mode|上半分コンパス、下半分地図|シート・ミニコンパス・モード切替を隠す|
|08 Map Modes|表示モードダイアログ|標準／ポテンシャル／航空写真と不透明度|
|09 Menu|メニューオーバーレイ|プロフィール集計とリンク一覧|
|10 Settings|設定オーバーレイ|方向距離表示、3D 建物、デバッグの設定|
|11 Loading / Error / No Data|一時状態|地図読み込み、位置エラー、コンパス空状態など|

## 01–04 地図画面

### 地図とレイアウト

地図はフレーム全面。選択地点や現在地のマーカー、地図ボタンは MapLibre 地図の上に重なる。通常モードの左パネルと Mobile シートは次の寸法です。

|部品|Mobile 390 × 844|Desktop 1440 × 900|
|---|---|---|
|探索／投稿切替|右 16 px、上 16 px + safe area。外形 106 × 58 px（48 px ボタン 2 個、padding 4 px、border 1 px）|同じ右上配置|
|MiniCompass|左 16 px、上 16 px + safe area、64 × 64 px|左 panel 展開時 `left:352px`（viewport 起点）、top 16 px|
|地図操作ピル|右 16 px。幅 54 px、折りたたみ時高さ約 102 px|右 32 px、下 32 px。幅約 57 px、高さ約 108 px|
|左パネル|下部シート、幅 100%、画面下固定|left 16 px、top 16 px、bottom 16 px、幅 320 px|
|モード切替の非表示条件|コンパス分割中は非表示|コンパス分割中は非表示|

地図操作ピルは `--btn-h` のボタンを縦に 2 個、間 4 px、外側 padding 4 px と border 1 px で置きます。上が現在地（Navigation）、下が表示モード（Map）。右下位置は Mobile ではシート上端から 16 px 浮かせる式、Desktop は 32 px。

### Mobile シート

シートは x=0 / bottom=0 / width=100%、上側角丸 28 px、border は白 10%、背景 black 75%、blur 24 px（`backdrop-blur-xl`）、上側 shadow `0 -12px 40px rgba(0,0,0,.55)`。ハンドル領域は 34 px 高。中央のハンドルは幅 48 px、高さ 6 px、白 25%。

|段階|高さ（safe area 除く計算例）|390 × 844 の上端|地図ボタン bottom offset|
|---|---|---:|---|
|collapsed|`132px + safe-area-inset-bottom`|712 px|`148px + safe-area-inset-bottom`|
|medium|`min(56dvh, 540px)` = 約 473 px|約 371 px|シート高 + 16 px|
|expanded|`min(78dvh, 760px)` = 約 658 px|約 186 px|シート高 + 16 px|

探索モードは検索欄のみを表示。シート内ヘッダーは Mobile では省略されます。投稿モードはシートが medium / expanded のとき投稿一覧を出し、collapsed では一覧を隠します。検索結果を選択すると Mobile のシートは collapsed になります。expanded 中は地図操作ピルを隠します。

### Desktop パネル

幅 320 px、left/top/bottom 16 px。背景 black 60%、blur 12 px、白 10% border、角丸 16 px、shadow 2xl。タブは右端から 40 px 出る幅 40 px、高さ 96 px。パネルヘッダーは上に `EXPLORE` / `POSTS`（10 px、字間 0.18em、白 40%）、次行タイトル（14 px）。検索行の左にユーザーメニューボタン 44 × 44 px、右に幅可変の検索欄（44 px 高）。

### 検索欄・候補

- Mobile: 48 px 高、角丸 16 px、左右 padding 16 px、白 6% 面、白 10% border。
- Desktop: 44 px 高、角丸 16 px、左右 padding 12 px、白 5% 面、白 10% border。
- 入力文字 14 px、placeholder 白 45%。虫眼鏡 20 px。候補は入力欄から 8 px 下、black 95%、blur 24 px、角丸 16 px、最大高 `42dvh`。
- 候補行は最小高 48 px、左右 16 px、縦 padding 10 px。地名 14 px semibold、住所 12 px / 白 50%。

### 投稿一覧と投稿ポップアップ

- 空一覧: 上下左右 padding 32 px、アイコン 48 px / 白 20%、見出し 14 px / 白 50%、補足 12 px / 白 30%。
- 一覧ヘッダー: 左右 16 px、上下 16 px、下 border 白 10%。`LATEST POSTS` と件数は 12 px。
- 投稿カード: margin 8 px、padding 12 px、角丸 12 px、白 5% 面／border。画像枠 64 × 64 px、角丸 8 px（中身は省略）。本文 14 px / 白 90%、最大 2 行。場所・日付 10 px / 白 40%。
- 地図上の投稿 popup: 外幅 240 px、角丸 14 px、black 78%、白 12% border、padding 10 px、shadow `0 16px 40px rgba(0,0,0,.55)`、backdrop blur 10 px。画像枠は 240 × 132 px、角丸 12 px（画像素材は不要）。本文 13 px、場所／作者 11 px。ズーム 13 以上で詳細表示。

投稿・地名・日付は動的データなので、Figma の表示例には固定サンプル文字列を置いてください。

## 05–06 投稿フォーム

### カメラボタン

- Mobile: 右 24 px。Desktop: 右 32 px。ボタンは `--btn-h` 四方、通常 44 px、角丸 50%、black 60%、violet 700 60% border、violet 300 アイコン 20 px。
- 既定の collapsed 状態では、地図操作ピルの上に約 12 px の間隔で配置。投稿一覧の開閉段階に応じ、bottom offset は `MOBILE_SHEET_CONTROL_BOTTOMS[level] + (2 × --btn-h + 24px)`。

### 投稿フォーム

- カメラボタンの上 56 px、右揃え。幅 288 px、最大高 `70dvh`、縦スクロール、padding 16 px、角丸 12 px、black 80%、白 10% border、blur 12 px、shadow large。
- タイトル 14 px / medium。各フィールド間 12 px。
- メッセージ欄: ラベル 12 px / 白 60%、3 行、14 px、内側 12 × 8 px、角丸 8 px、白 5% 面／10% border。カウンター 10 px / 白 40%。
- 画像アップロード領域: dashed border 白 20%、角丸 8 px、縦 padding 16 px。プレビュー枠は 16:9（画像素材は不要）。
- 場所ボタン: 高さは縦 padding 8 px + line box、角丸 8 px、12 px 文字。選択中は violet 700 border／violet 700 20% 面。
- 下部アクションは gap 8 px、上 padding 8 px。2 ボタンを等分。キャンセルは白 5%、投稿は violet 700。
- Supabase 未設定時は amber 500 10% の警告面、フォームエラーは赤系文字。

### 地図ピン選択

フォームから「地図をタップしてピンを刺す」を押した状態。案内ピルは x 中央、top 80 px、padding 16 × 8 px、角丸 12 px、violet 700、14 px medium、アイコン 16 px。キャンセルは白 20% 面、12 px。地図カーソルは crosshair。

## 07 Compass Mode

画面を縦 50:50 に分け、上半分にコンパス、下半分に同じ地図を継続表示。地図を作り直さず高さだけ変える。上段は `#06080C`、境界線は白 10%。390 × 844 なら各領域 422 px。上段中のシート、ミニコンパス、右上モード切替は非表示。閉じると地図全画面へ戻る。

|部品|値|
|---|---|
|ヘッダー|左右 16 px（`sm` 以上 24 px）、top `10px + safe-area-inset-top`、タイトル 14 px semibold、状態 11 px / 白 50%|
|閉じるボタン|40 × 40 px、円形、黒 45%、白 15% border、アイコン 20 px|
|文字盤|main 領域の短辺 × 0.78、正方形。外側目盛りは盤面より各 12% はみ出す|
|Polar 面|文字盤内側 inset 7%（盤面直径の 86%）、`#080B10` 90%、白 10% stroke、内側 shadow 40 px|
|データ領域|Canvas 論理サイズ 300 × 300、中心 (150,150)、半径 14–122 が距離 0–Range。24 方位 × 9 距離|
|ベゼル目盛り|72 本、5° ごと。30°ごと major、東西南北 cardinal。北は赤、強い方角はポテンシャル色|
|視野扇形|文字盤上向き固定、約 50°幅。外側白 16% gradient、弧 stroke 白 70% / 1.5 px|
|Range 表示|左下 16 px、下 8 px、11 px semibold。下に縮尺バー（高さ 6 px）|
|Range 操作|右下 16 px、下 8 px、36 × 36 px の円形ボタンを縦置き、間 6 px。黒 50%、白 15% border、文字 18 px|

Range の選択肢は 50 / 100 / 200 / 500 / 1000 m（初期 200 m）。分割中の地図操作ピルは下半分の下端から `56px + safe-area-inset-bottom` の位置。

MiniCompass の 64 px 内部ベクター値は `docs/directional-field-figma.md` を参照。通常の full-size Directional Field カード仕様も同資料にまとめています。

## 08 Map Modes ダイアログ

- 全面 overlay black 60%、backdrop blur 4 px、左右 margin 12 px、縦 padding 24 px。
- カード幅 `min(画面幅 - 24px, 540px)`、最大高は overlay 内、padding Mobile 16 px / 640 px 以上 20 px。背景 `#121218` 95%、border 白 15%、角丸 28 px、shadow `0 24px 80px rgba(0,0,0,.65)`、blur 40 px。
- ヘッダー: レイヤー icon 16 px、タイトル 16 px semibold。閉じるボタン 40 × 40 px。
- サムネイル枠は 3 列、gap Mobile 8 px / 640 px 以上 12 px。正方形、角丸 17 px。中の地図画像は省略可能。選択枠は 3 px、外角丸 20 px、violet 300 90%。ラベル 12 px、上 margin 8 px。
- 不透明度カード: 上 margin 20 px、padding 12 px、角丸 16 px、白 3.5% 面／白 10% border。ラベル 12 px、スライダー値 0–1 / step 0.05 / 初期 0.82、accent violet 400。下に色見本 8 px 高と「低い／高い」10 px。見本は等間隔に `#14121E/16%` → `#26194A/35%` → `#562366/55%` → `#BE4B46/78%` → `#FFA600/92%` → `#FFEF78/100%`。
- 地図モードは排他選択。`標準` / `ポテンシャル` / `航空写真`。ポテンシャルと航空写真を同時表示しない。
- attribution は 10 px / 白 40%: OpenStreetMap、CARTO、国土地理院。

## 09–10 メニューと設定

### 共通ダイアログ枠

全面 fixed overlay、black 60%、blur 12 px。カードは幅 `min(画面幅 - 32px, 448px)`、最大高 90vh、角丸 40 px、共通ガラス面、shadow 2xl。safe-area を考慮し上下 padding 16 px。タイトル行は上下 20 px / 左右 24 px、下 border 白 10%。本文は左右 24 px / 上下 24 px、スクロール可能。

### Menu

- 題名「メニュー」18 px bold。右上閉じる 44 × 44 px、白 10% 円形面。設定画面から戻るボタンも 44 × 44 px。
- 仮プロフィール: イニシャル丸 48 px、表示名 `KAZUNE` 16 px semibold、Member ID `No.0001` 12 px。集計は発見 4／お気に入り 3／投稿数（動的）、数値 30 px black weight、ラベル 10 px / 字間 .2em。
- 集計カード: margin-bottom 32 px、padding 24 px、角丸 32 px、白 6% 面／白 10% border。3 列均等。
- メニュー群: 角丸 24 px、白 3% 面／10% border。行は最小高 44 px、padding 20 × 16 px、gap 16 px。アイコン枠 40 × 40 px / 角丸 12 px。ラベル 14 px medium。行間 border 白 10%。
- 項目: 最近見つけた夜景、お気に入り、投稿、設定、はじめてガイド、利用履歴（未完了）、お問い合わせ（未完了）。フッター `Tokyo Nightview Web v2`、10 px / 白 50% / uppercase tracking .2em。

### Settings

- タイトル「設定」。パネル内のセクション間 24 px。
- 「方向・距離の表示」セクション: 見出し 14 px semibold。内側カード角丸 24 px、padding 16 px、白 3% 面／10% border。説明 12 px。セレクターは 2 × 2、gap 4 px、親 padding 4 px。各セル最小高 44 px、角丸 12 px、文字 12 px。初期値は `Field（従来）`、保存値があればそちらを表示。選択中は violet 700 面。
- **現在の方向距離カードは画面から撤去済み**。セレクターは設定に残っていますが、選んでも現行画面の見た目は変わりません。実際のFigma再現では見えている設定として記載し、表示切替の動作説明には使わない。
- 「3D 建物」「デバッグモード」: 各セクション見出し 14 px、カード padding 16 px、説明 12 px。switch track 44 × 24 px、thumb 20 × 20 px。ON は violet 700、OFF は白 15%。デバッグ ON 時、選択地点がある探索シートに Street View リンクが出る。
- 初期設定値: 3D 建物 ON、デバッグ OFF（ブラウザ保存値がある場合はその値）。

## 11 Loading / Error / No Data

- 地図読み込み: 全画面 black overlay、中央揃え。「地図を読み込んでいます…」14 px、白 60%。
- 現在地エラー: 画面右上から 16 px、top `84px + safe-area-inset-top`。Mobile は左右 16 px、Desktop は右 16 px / 幅 520 px。赤 500 95%、白 20% border、角丸 full、padding 16 × 8 px、12 px bold。右の閉じるボタンは 44 × 44 px。3 秒後に自動で消える。
- コンパス空状態: Polar 内中央、11 px / 行高 relaxed / 白 45%。「選択地点または現在地のデータがありません」。読み込み中は「夜景ポテンシャルを読み込んでいます…」。状態文は許可・非対応・精度低下などで変わる。
- デバッグ ON + 選択地点: シート内リンクは最小高 44 px、角丸 12 px、青系 border 25%／面 8%、文字 12 px semibold。補足 10 px / 白 40%。

## マーカー

|種類|寸法・見た目|
|---|---|
|選択地点|MapLibre の紫色 pin `#A78BFA`|
|現在地ドット|16 × 16 px、塗り `rgba(196,181,253,.98)`、白 98% / 3 px border、外側 1 px 濃紫 ring、紫 glow 12 px|
|現在地 pulse|24 × 24 px、白紫 72% / 1 px border、周期 2.6 s|
|精度円|位置精度に応じて可変。白紫 42% / 1 px stroke、紫 12% fill。精度 1000 m 超では非表示|
|向き cone|96 × 96 px。コンパス起動中のみ表示。扇形 gradient と白い矢印 tip|

## Figma で固定値にしないもの

- 地図の中心・zoom・bearing・タイル取得状況、選択地点のポテンシャル値、端末の方位、現在地、投稿件数・投稿内容は実行状態で変わる。
- Directional Field の円弧形状と Compass Mode の方向ハイライトは地点データから計算する。固定デザインで完全一致させるには、当時の `PotentialViewModel` と rotation が要る。
- 写真・地図タイル・表示モードのサムネイル画像は、この画面UI仕様の対象外。

## 参照元

- 主画面／配置: `src/components/potential/PotentialMapView.tsx`, `src/components/layout/LayerMenu.tsx`, `src/components/layout/mobileSheet.ts`
- 見た目の共通値: `src/index.css`, `src/styles/ui.ts`
- 地図操作: `MiniCompass.tsx`, `MapModeToggle.tsx`, `MapControlStack.tsx`, `CompassMode.tsx`, `UserLocationMarker.tsx`
- オーバーレイ: `MapModesModal.tsx`, `menu/AppMenu.tsx`, `PostComposer.tsx`, `layout/SearchField.tsx`, `hud/PostListPanel.tsx`, `hooks/usePostPopups.ts`
- Directional Field 詳細: [directional-field-figma.md](directional-field-figma.md)

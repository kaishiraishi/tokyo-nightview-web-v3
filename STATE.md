# Current State

## Current milestone

v3 主画面（夜景ポテンシャル地図）は GitHub Pages に公開済み。**2026-10-09 に `0ba05135` を公開**（初回のチュートリアル）。その前に 2026-10-03 に `7e45e7d6` を公開（正方形のコンパスカードと新しい地図のピン。その前の `601b604d` で、投稿の「着いたら分かる」仕組み、アカウントのデモ、上の帯の検索バー、スコアの内訳、1都3県の線などを公開済み。GitHub Actions の build・deploy 成功）。
次は、公開版を実機（iOS Safari / Android Chrome）で確認し、その結果に基づいて調整すること（下の Next 1）。

## Deployment

- 公開 URL: https://kaishiraishi.github.io/tokyo-nightview-web-v3/ （HTTPS。コンパス・現在地は HTTPS が必要）
  - リポジトリ名は `tokyo-nightview-web-v3`。**ローカルのフォルダ名 `tokyo-nighview-web-v3`（t が 1 つ少ない）で URL を作ると 404 になる**
- 方式: GitHub Actions（`.github/workflows/deploy.yml`）。`main` への push で lint → build → タイル 2 系統・manifest の検証 → Pages にデプロイ
- **リポジトリは private**。Pages のサイトは誰でも見られる（`public: true`）。公開されるのは `dist` の中身だけ（投稿のデモデータの座標も含む）
- 配信物: ポテンシャルのタイルは git 管理の WebP 2 系統（`NightViewPotential_tiles` 2.21MB = コンパス用・「高・中・低」表示用、`NightViewPotential_top10_tiles` 0.48MB = 「高のみ」表示用）、`public/target-area.geojson`（1都3県の形）
- Secrets は未設定。投稿機能はモック投稿のみ（`VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` を Secrets に入れて再デプロイすると有効になる）
- 再デプロイ: `main` に push するだけ。push・デプロイは人の承認後（`AGENTS.md`）
- 削除した旧 VIIRS タイルのバックアップ: `~/Desktop/tokyo-nightview-backup/viirs_heat_tiles-2026-10-02.tar.gz`

## Completed

画面構成と操作の詳細は `PROJECT.md` の Current UI が正本。ここは何ができているかの要約。

### 地図
- 表示モード（標準 / ポテンシャル / 航空写真）。航空写真ではポテンシャルを写真の上に重ねる
- 「表示するスコア: 高のみ / 高・中・低」（既定は高のみ = 色の付く場所の上位 10%、値 0.0479 以上を焼き込んだ別タイル）。「?」で高・中・低の内訳（上位 % と値）を表示。コンパスの分析は常に閾値 0.006 のタイルを使う
- 対象範囲は 1都3県（東京・神奈川・千葉・埼玉）。範囲外を暗くし、外周（淡い紫の実線）と都県境（破線）を表示（地球地図日本）
- 出典: 地球地図日本（国土地理院）/ 国土交通省 Project PLATEAU（常時）/ CARTO / OpenStreetMap。既定の「MapLibre」リンクは外した
- PLATEAU の 3D 建物（設定でオン/オフ、見本画像つき）

### 上の帯と検索
- 左にミニコンパス、中央に検索バー（メニューボタン + 検索欄）、右に探索 / 投稿の切替（選択中の背景が滑って移る）。探索・投稿の両モード共通
- 検索結果を選ぶと z15 まで寄って白いピンを立て、ポップアップ（名前・お気に入りの追加 / 解除）を開く。地図に触れると結果を閉じる

### コンパス
- ミニコンパス → コンパスモード（地図の上に浮かぶカード）。初期 Range は 1km（50m〜10km）
- 文字盤の N/E/S/W は大きめ・縁取り付き。向きセンサー動作中は「向いている方角 北東 42°」を表示
- 文字盤をタップすると、その方位・距離の地点を地図に点と点線で表示
- 向きセンサーは既定 ON（タッチ端末は最初のタップで開始。設定でオフにすると以降は自動開始しない）

### 投稿（投稿モード）
- 「着いたら分かる」: 着く前は、本当の地点からずらした半径 300m の破線の円と、写真・キャプション・「〇〇市 付近 · ここから約 X km」のカード。正確な場所とお気に入りは出さない。「100m 以内に近づくと正確な場所がわかります」はズーム 15 以上だけ
- 投稿モードでは現在地の取得を始め、測位精度 100m 以内で本当の地点から 100m 以内に入ると解放（端末に記録）。写真付きカードを本当の地点に出し、お知らせを表示
- 引き（ズーム 12 未満）では、カードの代わりに紫の点と件数の丸（クラスタ）。丸を押すとその辺りに寄る
- 投稿の一覧はメニュー →「投稿を見る」のページ（地図の上のシート・左パネルはなし。2026-10-04）。着く前の投稿には鍵の印
- 投稿ボタン（＋）は右下のボタン列のピルの一番上
- デモ投稿 10 件は八王子・日野・多摩・稲城あたりの「高」のクラスターの上（地名は Nominatim の逆ジオコーディング、写真はサンプル）
- 確認用: デバッグモードの中の「すべての投稿を見る（確認用）」（既定 OFF）で全部を解放して見られる

### メニュー
- アカウント（デモ。本物の認証はしない）: デモアカウントでログイン、表示名の変更（メニューに表示）、ログアウト。Google / Apple / メールは「準備中」表示
- お気に入り: 登録（検索ピン・投稿カードのハート・現在地）→ 一覧 → 移動 → 削除。端末に保存
- 投稿を見る、はじめてガイド、設定
- 設定: 向きセンサー、3D 建物、デバッグモード（ピン・Street View・右クリックの画素検査・方向・距離の表示・すべての投稿を見る）、データとプライバシー（お気に入りの書き出し、着いた投稿の記録のリセット、端末のデータをすべて消す。2 回押しで確認）、このアプリについて（出典、利用規約は準備中）
- 消したもの: 架空のプロフィールと数字、最近見つけた夜景、利用履歴、お問い合わせ（送り先が決まったら追加）

### 見た目・操作
- ガラス調は `glassControl` / `glassSurface` / `closeButton` に集約。出入りは `animate-ui-rise / drop / pop / view`（reduced-motion では動かさない）
- 位置情報のエラーは、同じ理由なら一度だけ表示（投稿モードに入るたびに出さない）。現在地ボタンを押したときはもう一度出す

### 基盤
- タイル: 閾値を焼き込んだ可逆 WebP（`scripts/bake-potential-tiles.py`）。表示用（上位 10%）とサンプリング用の 2 系統
- モバイル対応（pixelRatio 2 まで、入力欄 16px、manifest・アイコン、安全領域）
- 旧機能（`MapViewExplore` などと `tools/dsm-api`）は残してあり、現段階では判断しない（`PROJECT.md` の Non-goals）

## In progress

- 実機での確認（公開版 `7e45e7d6`）
- コンパスモードのカード（2026-10-03、モバイル優先）: 縦長はデザインどおりほぼ正方形（745:755、最大幅 420px）にし、文字盤をカードの中央に、文字盤の比率をデザインに合わせた（目盛りの外径 ≒ カード幅の 67%、`DIAL_SCALE` 0.87）。−/＋ は右下で横並び。見出しと縮尺の文字は 13px。地図の距離の円は、カードの実寸を測って避ける（`useRangeRings` の obscured を割合 → 要素に変更）。iPhone 14 の画面サイズで確認。横長（PC・スマホ横向き）は地図の幅の 44% のまま未調整。`docs/figma-screen-spec.md` の 9〜10 章の寸法は未反映
- 地図のピン（2026-10-03）: MapLibre 既定のしずく形を、専用のピン（`src/components/potential/mapPin.ts` + `index.css` の `.map-pin`）に置き換えた。紫 = 選択地点、白 = 検索結果・お気に入り。ポップアップはピンの頭の上に出す（`MAP_PIN_POPUP_OFFSET`）。紫のピンが 3D 地形の隠れ判定で 20% に薄くなっていたので `opacityWhenCovered: '1'`。iPhone 14 サイズで確認
- 投稿一覧をメニューへ移した（2026-10-04、未コミット）: 投稿モードの下部シート（スマホ）と左パネル（PC）をなくし、メニュー →「投稿を見る」で投稿モードに切り替えて一覧のページ（`src/components/menu/PostsView.tsx`）を開く。行を押すとその投稿の円（解放済みは本当の地点）へ移動。投稿モードの右下のボタン列・カメラの位置は探索モードと同じに。お知らせ・エラーの帯はメニューより下（z 5500）にした（投稿モードに入ると現在地のエラーが一覧の見出しを隠していたため）。verify PASS、agent-browser（390×844 / 1280×800）で確認。`docs/figma-screen-spec.md` の投稿モードのシートの節は未反映
- 投稿の見え方と投稿フォーム（2026-10-04、未コミット。ユーザー依頼）: (1) 引きで、件数の丸から分かれて 1 件の点になった投稿に、点の上にコメント（キャプション 1 行）を出す（以前はカードのズームまで何も出なかった。カードを出すズームは 13 → 12 に下げた）。押すとカードのズームまで寄る。重なったカードは、押したものが最前面に来る（押すたびに z-index を上げる）。点が近いとコメントが件数の丸に重なることがある (2) 投稿ボタンをカメラ → ＋ に (3) 投稿フォームを作り直した: スマホは下からのシート、PC はボタン列の左のパネル。写真 → ひとこと → 場所（2 択）→ 固定の送信ボタン。地図で選んだ場所に紫のピン。現在地がないときは送信不可。verify PASS、agent-browser（390×844 / 1280×800）でコメントの表示、フォーム、地図で選ぶ → ピン、を確認。`docs/figma-screen-spec.md` の投稿の節（17 章）は未反映
- 二本指の操作中は部品を無効化（2026-10-04、未コミット）: `html[data-multi-touch]`（`PotentialMapView` が touchstart/end で付け外し）で、ボタン・入力・ポップアップを pointer-events none + 不透明度 0.5 に。実機の二本指では未確認
- 動きの追加（2026-10-04）: メニュー・表示モード画面の暗い幕を `animate-ui-fade`（200ms）でふわっと、投稿モードに入ると＋の場所が `animate-ui-pop` で現れる。reduced-motion では動かさない
- 初回のチュートリアル（2026-10-08、`ac4ab396` で公開済み。ユーザー依頼）: 初めて開いた人に、実際の画面の部品を照らして説明する 6 段のコーチマーク（`src/components/onboarding/`）。部品は `data-tutorial` で探して測り、穴あきの幕で照らし、矢印つきのカード（部品の拡大図・アイコン入りの本文）を隣に出す。地図の読み込み後に表示、`nightview.tutorialSeen` で一度だけ、メニュー → 設定の「チュートリアル → もう一度見る」と、はじめてガイドの「画面で見るチュートリアル」で再表示。表示中は向きセンサーを始めず、閉じるクリックで始める。（最初は主画面の縮小図を描く方式で作ったが、ユーザーの依頼で実際の画面を照らす方式に変えた。）verify PASS、agent-browser（390×844 / 1280×800）で全段の照らす位置とカードの位置、部品がないときの中央表示、はじめる・スキップで記録 → 再読み込みで出ない → メニューから再表示、を確認。実機（iOS の許可の出る順番、スワイプ、横向き）は未確認。`docs/figma-screen-spec.md` は未反映
- 公開（2026-10-04）: `d284c69f` を push してデプロイ済み（上の 2026-10-04 の未コミットの項目はすべてこれに含まれる）。実機（二本指の無効化、写真付きカードの切り替わり）は未確認

## Next

1. **実機確認**（公開版で）: ① 向きセンサーの既定 ON・最初のタップでの開始（iOS の許可ダイアログ、Android）② 投稿モードの位置情報の許可と、実際の GPS での解放（100m・精度 100m）③ 上の帯の検索バーにキーボードを出したときの見え方 ④ 地図の滑らかさと発熱 ⑤ スマホ横向きでのコンパス自動オープン
2. **投稿の場所を本当に隠すか**: 今は見せ方で隠しているだけで、正確な座標と写真はクライアントに届いている。本番の投稿で隠すなら、サーバー（Supabase の RPC など）で「着いたか」を判定してから座標を返す設計が要る
3. **ポテンシャルのデータ範囲**: データは東経 139.92 度までで、千葉県の大部分にない。対象を 1都3県にするなら、元データを広げて作り直す
4. お問い合わせの送り先（決まったらメニューに戻す）、利用規約・プライバシーポリシー
5. 本物のアカウント連携（`src/lib/demoAccount.ts` をセッションに置き換える）。投稿の表示名への反映
6. 未使用ファイル（`ClassicPanels.tsx`、`prototypes/PrototypePanel.tsx`、`CompassControl.tsx`、`CompassButton.tsx`、`directional-field/`、`polar-heatmap/`）と設定の「方向・距離の表示」の扱い
7. 3D 建物タイルの自前生成（密集地が欠ける問題）
8. 軽量化の続き（`PLAN.md` 021 の P1）、外部サービスの規約確認（CARTO、Nominatim、PLATEAU、地球地図日本）

## Blockers / Risks

- 実機での動作が未確認（センサーの自動開始、GPS での解放、キーボード、発熱）
- 投稿の正確な座標はクライアントに届いている（デモデータなので現状は問題ないが、本番の投稿では要対応）
- ポテンシャルのデータが千葉県の大部分にない
- `npm run build` は成功するが、JS が約 1.3MB の chunk 警告
- 3D 建物のタイル（第三者ホスティング）に依存。密集地が欠ける
- GitHub Actions の警告: Node.js 20 の廃止予定、`ubuntu-latest` が 2026-10-19 から Ubuntu 26 に移る
- 開発サーバーのホットリロード中に白画面になることがある（再読み込みで直る。本番では再現しない）

## Important files

- 画面: `src/components/potential/PotentialMapView.tsx`（約 740 行。分割の候補）、`MiniCompass.tsx`、`CompassMode.tsx`、`MapModeToggle.tsx`、`MapControlStack.tsx`、`MapModesModal.tsx`、`PostComposer.tsx`、`streetViewPopup.ts`、`src/components/layout/`（`FloatingSearchBar.tsx`、`SearchField.tsx`、`LayerMenu.tsx`）、`src/components/menu/`（`AppMenu.tsx`、`AccountView.tsx`、`FavoritesView.tsx`、`GuideView.tsx`、`DataAndAboutSettings.tsx`）、`src/components/hud/PostListPanel.tsx`、`src/index.css`
- 投稿: `src/hooks/usePostPopups.ts`（カード・円・クラスタ）、`src/hooks/usePostReveal.ts`、`src/lib/postReveal.ts`、`src/data/mockPosts.ts`
- 地図: `src/hooks/useMapLibre.ts`（タイル 2 系統、対象範囲、出典）、`useRangeRings.ts`、`useCompassTarget.ts`、`useSearchResultMarker.ts`
- データ・計算: `src/lib/potentialSampler.ts`（色ランプ・閾値・`POTENTIAL_DISPLAY_THRESHOLD`）、`potentialQuantiles.ts`、`potentialStats.ts`、`src/lib/favorites.ts`、`src/lib/storedSettings.ts`、`src/lib/demoAccount.ts`
- タイル生成: `scripts/make-potential-tiles.sh`、`scripts/bake-potential-tiles.py`、`scripts/potential-quantiles.py`。対象範囲の形は `public/target-area.geojson`（作り方は `PROJECT.md` の Data pipeline）
- 公開・検証: `.github/workflows/deploy.yml`、`vite.config.ts`、`scripts/verify.sh`
- iPhone 16 のスクリーンショット・モック画像（44 画面、HIG に沿った見た目）: 作り方は `docs/screenshots/README.md`、スクリプトは `scripts/mockup/`。画像（`docs/screenshots/*/`）は git 管理外
- Figma 再現指示書: `docs/figma-screen-spec.md`（2026-10-03 の画面から全面改訂。スマホのみ。デザインルール・トークン・全画面の寸法、コンパス関係はデータ → 形・回転・座標まで詳細）。画面の見た目を変えたら合わせて直す。全幅の Directional Field カードは `docs/directional-field-figma.md`

## Verification

- 2026-10-09（`0ba05135`）: `./scripts/verify.sh` lint / typecheck / build PASS。GitHub Actions の build・deploy 成功。公開 URL が 200、公開中の JS に `nightview.tutorialSeen`・`data-tutorial` が入っていること、新しいブラウザで公開 URL を開くとチュートリアル（「夜景ポテンシャルの地図へようこそ」）が出ることを確認
- 2026-10-03（`7e45e7d6`）: `./scripts/verify.sh` lint / typecheck / build PASS。GitHub Actions の build・deploy 成功。公開 URL が 200、公開中の JS に新しいピン（`map-pin__head`）とカードの縦横比（`745 / 755`）が入っていることを確認
- 2026-10-03（`601b604d`）: `./scripts/verify.sh` lint / typecheck / build PASS。GitHub Actions の build・deploy 成功。公開 URL で `/`、`target-area.geojson`、タイル 2 系統、manifest が 200。公開中の JS に新しいコード（`nightview.unlockedPosts`）が入っていることを確認
- agent-browser（390×844 / 700×900 / 1280×800）で確認したもの: スコアの切り替えと内訳、1都3県の線、コンパスのタップ地点、上の帯の検索バー（両モード）、検索ピンとお気に入り、メニュー各ページ、アカウントのデモ、投稿の解放（位置情報を擬似設定: 11.9km 先は解放せず、地点で解放。精度 500m は解放せず 20m で解放）、引きのクラスタと丸を押して寄る動き、カメラボタンの位置、位置情報エラーが同じ理由で一度だけ出ること
- レビュー（Workflow: 2 観点で探す → 別のエージェントが反証）を 3 回実施し、確定した指摘はすべて修正済み
- 実機（ユーザー、2026-10-03）: 公開版 `3c122356` で向きセンサーが正しく動き、精度も高い
- タイル: 上位 10% のタイルは z14 で 6,644,489 → 731,645 画素（11.0%。分位点付近に同じ値が多いため）
- `npm test`: script なし（現段階では対象外）

## Notes

- AI 運用: Claude Code 単独。push・deploy は人の承認後。正本は `AGENTS.md`
- 開発サーバーは `npx vite --port 5288 --strictPort` で起動する（5199 は別のアプリが使っていることがある）。確認は `http://localhost:5288/tokyo-nightview-web-v3/`
- 色ランプ・`MAX_POTENTIAL_VALUE = 0.1635`・閾値 `0.006` は `make-potential-tiles.sh`、`bake-potential-tiles.py`、`potentialSampler.ts` の 3 か所を同期する。表示用の閾値 `0.0479`（上位 10%）は `POTENTIAL_DISPLAY_THRESHOLD` と `make-potential-tiles.sh` の `DISPLAY_THRESHOLD` を同期する
- タイルを作り直したら、2 系統とも再生成し、`python3 scripts/potential-quantiles.py` で順位表も作り直してコミットする
- 現在地の watch は、現在地ボタン・コンパスモード・お気に入りの現在地追加・投稿モードに入ったときに開始する
- 端末の向きは画面の表示にだけ使い、保存・送信しない。現在地は、投稿したとき（送信）と「現在地をお気に入りに追加」したとき（端末に保存）だけ残る
- 端末に保存するキー（`localStorage`、すべて `nightview.` で始まる）: 設定各種、`favorites`、`unlockedPosts`、`revealAllPosts`、`demoAccount`、`potentialScope`、`headingSensor`、`tutorialSeen`
- Street View: Maps URLs を別タブで開くのみ（デバッグモードのピンのポップアップ）。Maps Platform ToS §3.2.3(e)

## Last updated

2026-10-09

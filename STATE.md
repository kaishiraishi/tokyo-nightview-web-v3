# Current State

## Current milestone

v3 主画面（夜景ポテンシャル地図）で、「方向・距離」UI の classicField / classicPolar / field / polar を比較・確定し、次の機能追加に安全に進める状態にする。

## Completed

- 2026-10-02: 添付の試作版 Directional Field の実装値を `docs/directional-field-figma.md` に整理。カード・文字・Canvas座標・色ランプ・強度計算・Figma再現手順を記載。完全一致には当時の directionProfile / rotation が必要。アプリコード変更なし。次は仕様を元にFigmaで組み、必要なら実画面のpropsから円弧データを取得する。
- 2026-10-02: 現行 v3 の画面全体を Figma で再現するため、探索／投稿、検索、コンパス分割、Map Modes、メニュー／設定、投稿フォーム、状態表示の寸法・色・配置・値を `docs/figma-screen-spec.md` に整理。Mobile 390×844／Desktop 1440×900 を基準にし、レスポンシブ値とデータ依存要素を区別。画像素材は対象外。

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
- 009 コンパス連動: `heading.ts` の方位純粋関数、`useDeviceHeading` の iOS / Android センサー・許可・RAF 平滑化・停止処理、MapLibre bearing フォールバックを追加。4 View の Canvas 描画と N 表示を `-rotation` で同期し、コンパストグル・heading・精度／許可状態・プライバシー文言を追加
- 010 モバイルコンパスボタン: `CompassButton` を現在地ボタンの直上に追加し、`PotentialMapView` の単一 `useDeviceHeading` をPC用 `CompassControl` と共有。状態別のSVG表示、開始・停止、理由トースト、低精度ドット、アクセシビリティ属性を実装
- 011 現在地マーカー: `useUserLocation` を現在地ボタン起点の高精度 `watchPosition` に統合し、白縁の淡い紫ドット・ゆっくりした pulse・1000m 以下の精度円・コンパス active 時の向きコーンを MapLibre カスタム Marker で表示。Marker は pointer-events を無効化し、地図は回転しない
- 012 Apple マップ風試作: モバイル下部シートを検索内蔵の3段階にし、Map Modes モーダルへレイヤー・凡例・不透明度を移動。右上の全画面コンパスモードは既存 ViewModel の Polar を端末方位で回転し、状態・最強方向・Range を表示。デスクトップにも検索と Map Modes 入口を追加
- タイル画像 `public/NightViewPotential_tiles/` を `.gitignore` し Git 管理から外した（commit `be5f33b9`）
- Radial Bands / Peak Wedges は試作後に削除（4 View 版は commit `1c8b1019` に残る）
- AI 運用の切替（2026-10-01）: Luna 委任を廃止し Claude Code 単独運用へ。モデル選択（既定 Sonnet / 補助 Haiku / escalation Opus）と subagent 方針を `AGENTS.md` に、要約を `CLAUDE.md` に記載。`scripts/luna.sh` を削除し `tasks/README.md` を記録置き場の説明に更新
- ドキュメント運用の統合: `PROJECT.md` / `STATE.md` / `AGENTS.md` / `CLAUDE.md` / `PLAN.md`。`UI.md`・`POTENTIAL_LAYER_SETUP.md`・`.github/copilot-instructions.md` は内容を `PROJECT.md`（Current UI / Data pipeline）と `AGENTS.md` に統合して削除
- 014 投稿・探索モード切替: `App` が単一 `mode` を所有し、explore は `PotentialMapView`、analyze は投稿専用 `PostModeView` adapter 経由の既存 `MapViewExplore` を条件レンダー。TopBar の探索 / 投稿ボタンと AppMenu の投稿動線を接続し、非 active 画面は unmount する

- 015 地図統一: VIIRS 表示を廃止（`MapModesModal` / `PotentialMapView` / `useMapLibre`）。探索・投稿で同じ `PotentialMapView` を使い、投稿モードは投稿ポップアップ・投稿一覧・`PostComposer` を重ねる。`PostModeView` を削除し、投稿ロジックを `usePosts` / `usePostPopups` / `PostComposer` に分離
- 017 デバッグモード: メニュー → 設定にデバッグモードのスイッチを追加（`nightview.debugMode`、既定 OFF）。Google Street View リンクはデバッグモード ON のときだけ表示
- 018 探索画面レイアウト刷新（モック準拠）: `TopBar` と、モバイル右上の Map Modes / コンパスボタンを、`MiniCompass`（左上）・`MapModeToggle`（右上）・`MapControlStack`（右下：現在地 + Map Modes）に置き換えた。メニューボタンはシート / サイドパネルの検索欄の左に移動。ミニコンパスのデータは選択地点、選択がなければ現在地（現在地を取得していれば常時サンプリング）。モバイルでシートが最大のときは右下ボタン列を隠す
- 019 ミニコンパスを Directional Field 化: `MiniCompass` を試作 `field`（`DirectionalFieldView`）の縮小版に変更。`variant="mini"`（300px 座標で内半径 80 / 基礎太さ 34 / 拡張 32、発光とハイライトを太く、方位文字・中心マーカーなし）を追加。データは選択地点、選択がなければ現在地の ViewModel。端末方位（なければ地図 bearing）で回転
- 020 Figma 準拠の微調整: ミニコンパスを 64px・背景／枠なし（`useDrawCanvas` に `transparent` オプション追加）・細いリング（内半径 104 / 太さ 18 / 拡張 10）・外側の方位目盛りに変更。データなし時も CSS で同じリングと目盛りを表示。`MapModeToggle` はボタン 48px・隙間なし
- 022 3D 建物の設定: メニュー → 設定に「3D 建物」スイッチを追加（`nightview.buildings3d`、既定 ON）。`src/lib/debugMode.ts` を `storedSettings.ts` に統合し、AppMenu のスイッチを `SettingSwitch` に共通化
- 023 ミニコンパスの視認性: 背後にガラス調の円（`bg-black/55`、枠 `white/10`、`backdrop-blur-md`）を追加し、mini の基礎リングを白 8% → 18% に変更。agent-browser で、道路の多い場所でもデータあり・なしの両方で読めることを確認。verify PASS
- 024 コンパスモードの縦 2 分割: ミニコンパスのタップで、上半分 `CompassMode`・下半分地図に分割（全画面オーバーレイを廃止）。案内文「この方向に…先が明るい」を削除。文字盤の目盛りを SVG（5° 細、30° 長、東西南北最長・北は赤、文字は常に正立）に変更し、Polar の距離文字を非表示（`showDistanceLabels`）。Range は実寸の縮尺バー（`POLAR_INNER/OUTER_RADIUS` から長さを算出）と ＋/− に変更。分割中は出典表示と重ならないよう右下ボタン列を上げる
- 025 表示モード・下部シート・コンパスの改善: `MapModesModal` のタイルとスイッチの重複を解消し、タイルだけの単一選択に（サムネイルはアプリの地図を撮影した WebP、計 52KB）。下部シートを下から持ち上がるアニメーションに（Tailwind のアニメーション用プラグインは未導入で、AppMenu の `animate-in` 系クラスは無効だった）。コンパスの目盛りを方向別の強さの棒グラフにし、視野の扇形を追加
- 026 微調整: 表示モードの不透明度スライダーを常時表示に戻す。コンパスモード右上の方位表示（▲ 角度・方位名）を削除。ミニコンパスを投稿モードでも表示（投稿モードは地点選択がないので現在地の周囲を表示）
- 027 方向・距離カードの中身を撤去: 探索モードのシートを検索欄だけにした（シート自体は維持）。`PotentialMapView` から ClassicPanels / PrototypePanel / CompassControl 呼び出しと、それ専用の `directionPeaks` などを削除。デバッグモード時の Street View リンクはシートに単独で残す。モバイルは検索結果を選ぶとシートを閉じる（広げたまま空で地図を隠すのを防ぐ）。未使用になったファイル（`ClassicPanels.tsx`、`prototypes/PrototypePanel.tsx`、`CompassControl.tsx`、`directional-field/`、`polar-heatmap/`）は削除せず残した
- 028 公開準備（モバイル対応・軽量化。`PLAN.md` 021 の P0）: 閾値焼き込み WebP タイル（`scripts/bake-potential-tiles.py`、4,969 枚 2.21MB、git 管理）に切り替え、`potential-filtered://` プロトコルを削除。`public/viirs_heat_tiles`（54,217 ファイル）をバックアップ後に削除（`~/Desktop/tokyo-nightview-backup/viirs_heat_tiles-2026-10-02.tar.gz`）。3D 建物は初回スマホ OFF、`pixelRatio` を 2 に制限、iOS の自動拡大対策（16px）、アイコン・manifest・meta、CI の検証更新、国土地理院・PLATEAU の出典表記
- 029 GitHub Pages に初回デプロイ（2026-10-02）: Pages を GitHub Actions 配信で有効化（`gh api` で `build_type=workflow`）、commit `e3d8c033` を push して Actions が成功。公開 URL: https://kaishiraishi.github.io/tokyo-nightview-web-v3/ 。リポジトリは private だが、Pages のサイトは誰でも見られる（`public: true`）
- 016 アイコン置換: lucide-react を Google Material Symbols（Outlined 400, Apache 2.0）に置換。path を `src/components/ui/icons.tsx` に埋め込み、lucide と同名・同 props（size / className）で import 先だけ変更。`lucide-react` は依存から削除

## In progress

- 009/010 の iOS / Android 実機センサー動作と 375×667 / 390×844 の表示確認
- 012 の実機センサー・実ブラウザでのシート高さ、Map Modes、全画面コンパスの表示確認
- 015 の実ブラウザ確認（探索⇄投稿で地図が再読込されないこと、投稿ポップアップ、ピン投稿、モバイルの投稿ボタン位置）。014 の PC / モバイル mode 切替確認（実行環境の sandbox 制限により未確認）。2026-10-01 にコード再点検済み: TopBar 両ボタンで探索⇄投稿の往復可、AppMenu「投稿」→ analyze、analyze では `scanStep` が idle に固定され DSM `fetchProfile` に到達しない

## Next

1. iOS Safari と Android Chrome の許可・方位・画面回転・8 の字補正表示を実機確認する
2. 375×667 / 390×844 のブラウザで下部シート、Map Modes、全画面コンパス、設定の 2×2 セレクタを確認する
3. 方向・距離カードを撤去したため、classic 版 / prototype 版の表示選択（設定の `PanelViewSelector`）と未使用ファイルの扱いを決める（削除するか、設定項目だけ外すか）
4. 権限のあるブラウザ環境で 014 の PC / モバイル mode 切替と投稿フォームの表示を目視確認する（URL は PROJECT.md「ローカル確認」。確認点: TopBar 両ボタンの往復、メニュー「投稿」→ 投稿モード、375×667 / 390×844 でボタン表示）
5. 大きな機能追加の前に `PLAN.md` を書く（012では禁止事項により未変更）
6. 公開サイト（https://kaishiraishi.github.io/tokyo-nightview-web-v3/、HTTPS）を iOS Safari / Android Chrome の実機で確認する。特にコンパス（方位センサーの許可）と現在地、地図の滑らかさ・発熱、ホーム画面に追加。必要なら Secrets を設定
7. 3D 建物タイルの自前生成（PLATEAU CityGML → PLATEAU GIS Converter → tippecanoe で PMTiles、ズーム 14〜16 を間引かずに生成、R2 に配置）: 範囲（23 区だけか多摩も含むか）と置き場所の判断待ち

（旧 Explore/Analyze 系コードと `tools/dsm-api` の扱いは PROJECT.md の Non-goals により判断しない）

## Blockers

- `npm run build` は成功するが、JS が 1.2 MB 超の chunk 警告
- GitHub Pages のデプロイは「Pages site not found」で失敗している（Pages が未有効、2026-09-22〜29 の 3 回）。リポジトリ設定 → Pages → Source を GitHub Actions にする必要がある（人の操作）。公開前チェックは `PLAN.md` 021
- 投稿機能は Supabase の Secrets 未設定のため、公開サイトではモック投稿のみ（`VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` を Secrets に入れて再デプロイすると有効になる）

## Important files

- `scripts/verify.sh`、`tasks/`（過去の判断記録 001〜014。Luna 委任と `scripts/luna.sh` は 2026-10-01 に廃止）

- `src/App.tsx`, `src/components/potential/PotentialMapView.tsx`
- `src/components/potential/PanelViewSelector.tsx`, `ClassicPanels.tsx`, `src/components/menu/AppMenu.tsx`, `src/styles/ui.ts`, `eslint.config.js`
- `src/lib/heading.ts`, `src/hooks/useDeviceHeading.ts`, `src/components/potential/CompassControl.tsx`, `src/components/potential/compassCanvas.ts`
- `src/components/potential/CompassButton.tsx`
- `src/components/potential/CompassMode.tsx`, `MapModesModal.tsx`, `src/components/layout/SearchField.tsx`, `mobileSheet.ts`
- `src/hooks/useUserLocation.ts`, `src/components/potential/UserLocationMarker.tsx`
- `src/components/potential/prototypes/`（`viewModel.ts`, `colorScale.ts`, `DirectionalField.tsx`, `PolarHeatmap.tsx`）
- `src/hooks/useMapLibre.ts`, `src/hooks/usePotentialAnalysis.ts`, `src/lib/potentialSampler.ts`
- `scripts/make-potential-tiles.sh`, `scripts/smooth-potential-raster.py`, `public/NightViewPotential_tiles/`
- `vite.config.ts`（base `/tokyo-nightview-web-v3/`）

## Verification

- 2026-10-02 現行画面Figma仕様書: `./scripts/verify.sh` lint / typecheck / build PASS、Markdown末尾空白チェック PASS。既存の Browserslist（caniuse-lite 10か月）・JS chunk（1.26 MB）警告あり。
- 2026-10-02 Figma再現仕様: `./scripts/verify.sh` lint / typecheck / build PASS、`git diff --check` PASS。既存のBrowserslist / chunk警告あり。

- `npm run build`: passing（chunk / Browserslist 警告あり、2026-10-01 014実装後に再確認）
- `npm run lint`: passing（現行対象。旧 `src/components/map/**` は旧 Explore/Analyze 系として設定で ignore）
- `./scripts/verify.sh`: lint PASS、typecheck PASS、build PASS（chunk / Browserslist 警告あり、2026-10-01 014実装後に再確認）
- `git diff --check`: PASS（2026-10-01 進捗チェック時に verify.sh と併せて再確認）
- 運用切替（2026-10-01）: md 更新と `scripts/luna.sh` 削除後に `git diff --check` PASS。コード変更なしのため verify.sh は再実行不要（直前の 014 進捗チェックで PASS）
- 017 デバッグモード実装後（2026-10-02）: `./scripts/verify.sh` lint / typecheck / build PASS。ブラウザ目視は未確認
- 018 実装後（2026-10-02）: `./scripts/verify.sh` PASS。agent-browser で 390×844 と 1440×900 の配置を目視確認済み（左上ミニコンパス・右上ピル・右下縦ボタン列・シート内メニューボタン）。ローカルではポテンシャルタイルが地図に描画されず、ミニコンパスのリングの色付きは未確認（原因は未調査。今回の変更範囲外）。HMR 中に一度 PotentialMapView が白画面になったが、再読み込み後は同じ操作で再現しなかった
- 019 実装後（2026-10-02）: `./scripts/verify.sh` PASS。agent-browser（390×844）で、地図回転への追従と、読売ランド前駅付近・Range 1km でのリング色（低強度は紫、高強度はオレンジ）を確認。018 で「タイルが描画されない」と書いたのは誤りで、確認地点（東京タワー・渋谷）の値が低かっただけ
- 020 実装後（2026-10-02）: `./scripts/verify.sh` PASS。agent-browser（390×844）でデータなし／ありの両状態のミニコンパスとモード切替ピルを目視確認
- 022 実装後（2026-10-02）: `./scripts/verify.sh` PASS。agent-browser（390×844）で、スイッチのオン/オフで建物が切り替わること、再読み込み後も設定が残ることを確認。オン時に西新宿の高層ビル街が欠けていることも確認（元タイルの間引きによる）
- 024 実装後（2026-10-02）: `./scripts/verify.sh` PASS。agent-browser で 390×844 と 1440×900 の分割表示、閉じたときに地図の高さが戻ること（422px → 844px）、＋/− での Range 切替を確認
- 開発時のみの既知問題: Vite のホットリロード中に `PotentialMapView` が白画面になることがある（同じ commit 内で、作り直し前の古い map を他の effect が参照していると推定）。再読み込みで直り、本番ビルドでは起きない想定。未修正
- 025 実装後（2026-10-02）: `./scripts/verify.sh` PASS。agent-browser（390×844）で、表示モードの 3 タイル、コンパスの目盛り（読売ランド前駅付近で北側だけ強調）、シートが y=844 → 712 へ約 0.4 秒で持ち上がることを確認
- 027 実装後（2026-10-02）: `./scripts/verify.sh` PASS。agent-browser で 390×844 と 1440×900 を確認（検索結果の表示と選択後のシート閉鎖、デバッグ ON/OFF での Street View リンク）
- 028 実装後（2026-10-02）: `./scripts/verify.sh` PASS。焼き込み WebP は元 PNG + 閾値処理と 300 枚・約 59 万ピクセルで完全一致。Python の逆算と TS 関数は 45,000 ピクセルで差 0。スロットル下のパンは 18 → 46.7fps、最大の固まり 317 → 67ms。本番ビルドを iPhone 14 設定で確認（manifest・アイコン・タイルすべて 200、検索欄 16px、3D 建物は初期 OFF、見た目は変更前と同じ）。配信物 59,208 → 4,991 ファイル、約 5.8MB。**実機（iOS Safari / Android Chrome）は未確認。コンパス・現在地は HTTPS でないと動かないため公開後に確認する**
- 029 公開後（2026-10-02）: Actions のビルドとデプロイが成功。公開 URL で `/`、manifest、アイコン、WebP タイルが 200、存在しないタイルは 404（想定どおり）。iPhone 14 設定のブラウザで地図とポテンシャルの表示を確認（HTTPS・secure context で DeviceOrientation / Geolocation API が使える状態）。コンソールの 404 は国土地理院の海上の標高タイルと範囲外のタイルで、動作に影響しない。実機は未確認
- `npm test`: script なし（現段階では対象外）
- ブラウザ: 旧 3 切替（現状 / Field / Polar）の描画は秦野西方で確認済み。4 種類化・012 のシート／Map Modes／全画面コンパス・014 の PC / モバイル切替は未確認。`npm run dev -- --host 127.0.0.1` は sandbox の `listen EPERM`、`agent-browser` は socket ディレクトリ書込不可で起動できなかった

## Notes

- AI 運用: Claude Code 単独（既定 Sonnet / 軽量 subagent は Haiku / 画像・実装は Sonnet / escalation は Opus）。subagent はネストせず同時 2〜3 まで、報告は差分と verify.sh で裏取り。git push・deploy・LaunchAgent 操作は人の承認後、本番 `--apply` は人が実行。正本は `AGENTS.md`

- 閾値・正規化は PNG の RGBA から色ランプを逆引きした近似値。0.1635 以上は飽和する。
- Street View: Maps URLs（キー不要）を別タブで開くのみ。規約根拠は Maps Platform ToS §3.2.3(e)。変更時に現行規約を再確認する。
- `PolarHeatmap` の描画は、セルごとに blur を掛けるとページが固まるため、オフスクリーン描画 + 1 回の blur にしている。
- コンパスは端末方位を磁北基準で扱い、磁気偏差補正はしない。方位が使えない間は MapLibre の bearing をパネルだけに反映し、地図自体は回転しない。
- 現在地 watch は現在地ボタン押下時だけ開始し、unmount または hook の `stop` で `clearWatch` する。精度円は DOM の meters→pixels 換算でズームに追従し、精度が 1000m を超えると非表示にする。
- ESLint の `react-refresh/only-export-components` は、共有定数・型ガード・表示用関数を公開する `PanelViewSelector.tsx` と `prototypes/PrototypeViews.tsx` だけ無効化。旧 `src/components/map/**` は既存の Hook 依存関係・`any` が多数あるため変更せず ignore。
- 014 の `PostModeView` は `MapViewExplore` に `mode="analyze"`、`profile` / selection / `searchTarget` の null、scan mode の固定値、stable no-op を渡す。`MapViewExplore` の DSM `fetchProfile` 呼び出しは `mode === 'explore'` のスキャン経路からのみ到達し、投稿モードの初期表示では呼ばれない。`tools/dsm-api` は起動していない。

## Last updated

2026-10-02

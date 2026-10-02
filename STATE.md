# Current State

## Current milestone

v3 主画面（夜景ポテンシャル地図）を **GitHub Pages に公開済み**（2026-10-02、commit `a7abcd89`）。次は実機（iOS Safari / Android Chrome）での確認と、その結果に基づく調整。

## Deployment

- 公開 URL: https://kaishiraishi.github.io/tokyo-nightview-web-v3/ （HTTPS。コンパス・現在地は HTTPS が必要）
  - リポジトリ名は `tokyo-nightview-web-v3`。**ローカルのフォルダ名 `tokyo-nighview-web-v3`（t が 1 つ少ない）で URL を作ると 404 になる**。末尾のリポジトリ名なしの `https://kaishiraishi.github.io/` も 404
- 方式: GitHub Actions（`.github/workflows/deploy.yml`）。`main` への push で lint → build → タイル・manifest の検証 → Pages にデプロイ。Pages の Source は GitHub Actions（2026-10-02 に `gh api` で有効化）
- リポジトリは private だが、Pages のサイトは誰でも見られる（`public: true`）。公開されるのは `dist` の中身だけ
- 配信物: 4,991 ファイル、約 5.8MB（以前は 59,208 ファイル）。ポテンシャルのタイルは git 管理の WebP（4,969 枚、2.21MB）
- Secrets は未設定。投稿機能はモック投稿のみ（`VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` を Secrets に入れて再デプロイすると有効になる）
- 再デプロイ: `main` に push するだけ。push・デプロイは人の承認後（`AGENTS.md`）
- 削除した旧 VIIRS タイル（54,217 ファイル）のバックアップ: `~/Desktop/tokyo-nightview-backup/viirs_heat_tiles-2026-10-02.tar.gz`（復元は `tar xzf <file> -C public`）

## Completed

- 基盤: `App.tsx` → `PotentialMapView`、MapLibre 東京表示、地名検索、現在地移動（現在地マーカーは `watchPosition`・精度円・向きコーン）、探索 / 投稿の切替（同じ地図に投稿ポップアップを重ねる。`usePosts` / `usePostPopups` / `PostComposer`）
- 現行の画面構成: 左上 `MiniCompass`（Directional Field 試作版の縮小。端末方位で回り、センサー動作中は前方の扇形を出す）、右上 `MapModeToggle`、右下 `MapControlStack`（現在地・表示モード）、下部シート／左パネルは検索欄だけ（方向・距離カードの中身は撤去）。詳細は `PROJECT.md` の Current UI
- コンパスモード: ミニコンパスのタップで 2 分割（縦長は上コンパス・下地図、横長は左コンパス 46%・右地図）。スマホ横向きでは自動で開き、縦に戻すと閉じる。目盛りが方向別の強さの棒グラフ、前方の扇形、カーナビ風の縮尺バーと ＋/− で Range を変更
- Range: 50m / 100m / 200m（初期）/ 500m / 1km / 5km / 10km。距離ごとにタイルのズームを変え（〜1km: z14、〜3km: z13、それ以遠: z12）、Range に必要な距離だけ取得
- 向きセンサー: コンパスモードを閉じても止めない。メニュー → 設定の「向きセンサー」で止める（開始できない理由も表示）
- コンパスモードの距離リング（2026-10-02）: コンパス分割中、地図にコンパスの距離ガイドと同じ円（range の 1/4・1/2・1、距離ラベル付き）を重ね、開いたとき・Range 変更時に外側の円へ地図を合わせる（`useRangeRings`、`RANGE_GUIDE_FRACTIONS` を Polar と共有）。選択地点がなければ現在地取得を開始する。agent-browser（390×844、地点選択）で 200m / 10km の円とラベル、地図への収まりを確認。現在地中心・実機は未確認
- 遠方のサンプリング改善（2026-10-02）: 500m 以降のリングは、セルの範囲（方位 ±0.4 セル × 距離 ±0.35 セル、5×3 点）を読み、最大値 0.7 + 平均 0.3 で集約する（`potentialSampler.ts` の `sampleCell`）。10km で薄くなる原因が 1 点読みの拾い漏らしだったため。z12 タイルでの試算（多摩の 5〜10km 96 セル）で、光るセルが 3 → 約 49。ポテンシャルの値・色ランプ・閾値は変更なし
- 表示モード（Map Modes）: 標準 / ポテンシャル / 航空写真の単一選択（アプリの地図を撮影したサムネイル）、不透明度は常時表示
- 設定: 向きセンサー、3D 建物（初回はスマホ OFF・PC ON）、デバッグモード（Street View リンクを出す）、方向・距離の表示（`PanelViewSelector`。**今は表示に影響しない**）。保存は `localStorage`（`src/lib/storedSettings.ts`）
- ポテンシャルのタイル: 閾値 0.006 を焼き込んだ可逆 WebP（`scripts/bake-potential-tiles.py`）。クライアントは通常のラスターソース 1 本で読む（以前の `potential-filtered://` による全ピクセル処理は削除）。スロットル下のパンは 18 → 46.7fps、最大の固まり 317 → 67ms
- モバイル対応: `pixelRatio` を 2 に制限、入力欄 16px（iOS の自動拡大対策）、アイコン・manifest・iOS / Android の meta、下部シートの持ち上がりアニメーション（`prefers-reduced-motion` で無効）、横向きの安全領域
- 出典表記: 国土地理院、Project PLATEAU（文言は人が最終確認）
- 運用: Claude Code 単独運用（Luna 廃止、2026-10-01）。ドキュメントは `PROJECT.md` / `STATE.md` / `AGENTS.md` / `CLAUDE.md` / `PLAN.md`。Figma 再現用の仕様書: `docs/directional-field-figma.md`、`docs/figma-screen-spec.md`
- 旧機能: `MapViewExplore` などの旧 Explore/Analyze 系コードと `tools/dsm-api` は残してあり、現段階では判断しない（`PROJECT.md` の Non-goals）。lucide-react は Material Symbols（`src/components/ui/icons.tsx`）に置換済み

## In progress

- 実機での確認（下の Next 1）。公開サイトは iPhone 14 設定のブラウザと、横画面 844×390 で確認済みだが、実機のセンサー・ノッチは未確認
- 投稿モード（014/015）の実ブラウザでの確認: 探索 ⇄ 投稿で地図が再読込されないこと、投稿ポップアップ、ピン投稿、モバイルの投稿ボタン位置

## Next

1. **実機確認**（公開サイトで）: ① iPhone のセンサー許可ダイアログと扇形・文字盤の回転、Android の方位 ② スマホ横向きでの自動オープン・ノッチの安全領域・左右分割 ③ 地図の滑らかさと発熱（特にポテンシャル表示中、3D 建物オンのとき）④ 現在地 ⑤ ホーム画面に追加（アイコン・全画面）⑥ 設定の 3D 建物（スマホは初回オフ）
2. 設定の「方向・距離の表示」と、未使用になったファイル（`ClassicPanels.tsx`、`prototypes/PrototypePanel.tsx`、`CompassControl.tsx`、`CompassButton.tsx`、`directional-field/`、`polar-heatmap/`）の扱いを決める（削除するか、設定項目だけ外すか）
3. 3D 建物タイルの自前生成（PLATEAU CityGML → PLATEAU GIS Converter → tippecanoe で PMTiles、ズーム 14〜16 を間引かずに生成、R2 などに配置）。今のタイルは第三者のもので、tippecanoe の `--drop-densest-as-needed` により西新宿などの密集地が欠ける。範囲（23 区か多摩も含むか）と置き場所の判断待ち
4. 投稿機能を使うなら Secrets を設定して再デプロイ。使うまではモックのまま
5. 軽量化の続き（`PLAN.md` 021 の P1）: 3D 地形はピッチを付けたときだけ有効にする、JS（1.28MB）の分割、端末方位の更新で画面全体が再描画される点の改善。実機で重いと分かってから
6. 外部サービスの規約確認（CARTO、Nominatim、PLATEAU の出典表記）

## Blockers / Risks

- 実機での動作が未確認（センサー・ノッチ・発熱）
- `npm run build` は成功するが、JS が 1.28MB の chunk 警告（Browserslist の警告もあり）
- 3D 建物のタイル（第三者ホスティング `ysk766.github.io`）の可用性に依存。密集地が欠ける
- 遠方のポテンシャル（5km / 10km）は、広いタイル（z12、約 31m/px）由来で粗い。10km では 24 方位の間隔が約 2.6km
- GitHub Actions の警告: Node.js 20 の廃止予定（現在は Node 24 で強制実行されて成功）、`ubuntu-latest` が 2026-10-19 から Ubuntu 26 に移る
- 開発サーバー（Vite のホットリロード）中に `PotentialMapView` が白画面になることがある。再読み込みで直り、本番ビルドでは再現していない。未修正

## Important files

- 画面: `src/App.tsx`、`src/components/potential/PotentialMapView.tsx`、`MiniCompass.tsx`、`CompassMode.tsx`、`MapModeToggle.tsx`、`MapControlStack.tsx`、`MapModesModal.tsx`、`src/components/menu/AppMenu.tsx`、`src/components/layout/`（`LayerMenu.tsx`、`SearchField.tsx`、`mobileSheet.ts`）、`src/index.css`
- データ・計算: `src/lib/potentialSampler.ts`（色ランプ・`MAX_POTENTIAL_VALUE`・`POTENTIAL_THRESHOLD`・サンプリング）、`src/hooks/usePotentialAnalysis.ts`、`src/components/potential/prototypes/`（`viewModel.ts`、`DirectionalField.tsx`、`PolarHeatmap.tsx`、`canvas.ts`）
- センサー・位置: `src/lib/heading.ts`、`src/hooks/useDeviceHeading.ts`、`src/hooks/useUserLocation.ts`、`src/hooks/useMediaQuery.ts`
- 地図: `src/hooks/useMapLibre.ts`、`src/lib/storedSettings.ts`
- タイル生成: `scripts/make-potential-tiles.sh`、`scripts/smooth-potential-raster.py`、`scripts/bake-potential-tiles.py`。生成物 `public/NightViewPotential_tiles/`（git 管理）、中間ファイル `tiles-work/`（git 管理外）
- 公開: `.github/workflows/deploy.yml`、`vite.config.ts`（base `/tokyo-nightview-web-v3/`）、`index.html`、`public/manifest.webmanifest`、`public/icons/`
- 検証: `scripts/verify.sh`。過去の判断記録は `tasks/`（001〜014）

## Verification

- 2026-10-02（commit `a7abcd89`）: `./scripts/verify.sh` lint / typecheck / build PASS。GitHub Actions のデプロイ成功。公開 URL で `/`、manifest、アイコン、WebP タイルが 200、存在しないタイルは 404（想定どおり）
- 公開版を iPhone 14 設定と横画面 844×390 のブラウザで確認（コンパスが自動で開き左右に分割される）。センサーは、iOS 方式のイベント（`deviceorientation` + `webkitCompassHeading`）を手で送って、扇形の表示・文字盤の回転・閉じても残ること・設定のスイッチで止まることを確認
- タイルの焼き込み: 元の PNG + 閾値処理と 300 枚・約 59 万ピクセルで完全一致。Python の値の逆算と TS の `potentialValueFromPixel` は 45,000 ピクセルで差 0
- 性能（CPU 4 倍スロットル、DPR 3、5 秒パン、開発サーバー同士）: 焼き込み前 18fps・最大 317ms → 後 46.7fps・最大 67ms。初回表示のタイルは 18 枚程度、200m → 10km で 16 枚追加
- コンソールの 404 は、国土地理院の海上の標高タイルと、タイルのない範囲外へのリクエストで、動作に影響しない
- `npm test`: script なし（現段階では対象外）
- 未確認: 実機（iOS Safari / Android Chrome）、投稿モード（014/015）の実ブラウザ表示
- 2026-10-02: 遠方サンプリング改善の後に `./scripts/verify.sh` lint / typecheck / build PASS。ブラウザでの 10km 表示の見え方（多摩付近）は未確認。強すぎる・粒状に見える場合は `CELL_MAX_WEIGHT` / `CELL_BEARING_STEPS` を調整する

## Notes

- AI 運用: Claude Code 単独（既定 Sonnet / 軽量 subagent は Haiku / 画像・実装は Sonnet / escalation は Opus）。subagent はネストせず同時 2〜3 まで、報告は差分と verify.sh で裏取り。git push・deploy・LaunchAgent 操作は人の承認後、本番 `--apply` は人が実行。正本は `AGENTS.md`
- 色ランプ・`MAX_POTENTIAL_VALUE = 0.1635`・閾値 `0.006` は `make-potential-tiles.sh`、`bake-potential-tiles.py`、`potentialSampler.ts` の 3 か所を必ず同期する。値はタイルの RGBA から逆引きした近似値で、0.1635 以上は飽和する。閾値未満は焼き込みで透明になり、サンプリングでは 0 になる
- タイルを作り直したら、`make-potential-tiles.sh`（元データ GeoTIFF とローカルの gdal / miniconda が必要）で再生成し、`public/NightViewPotential_tiles/` をコミットする。空になるタイルも透明な WebP として必ず置く（404 だと MapLibre が親タイルで代用する）
- Street View: Maps URLs（キー不要）を別タブで開くのみ（デバッグモード時）。規約根拠は Maps Platform ToS §3.2.3(e)。変更時に現行規約を再確認する
- コンパスは端末方位を磁北基準で扱い、磁気偏差補正はしない。方位が使えない間は MapLibre の bearing だけを文字盤に反映し、地図自体は回転しない。端末の向きは画面の表示にだけ使い、保存・送信しない
- 向きセンサーは自動では開始しない（iOS は許可にタップが要るため）。コンパスモードのボタンか、設定のスイッチで開始する
- 現在地の watch は現在地ボタン押下時だけ開始し、unmount または `stop` で `clearWatch` する。精度円は 1000m 超で非表示
- ESLint の `react-refresh/only-export-components` は、`PanelViewSelector.tsx` と `prototypes/PrototypeViews.tsx` だけ無効化。旧 `src/components/map/**` は既存の Hook 依存関係・`any` が多数あるため変更せず ignore
- `du` は小さなファイルをブロック単位で数えるため、タイルなどの実サイズより大きく出る（実サイズは `stat` で確認する）

## Last updated

2026-10-02

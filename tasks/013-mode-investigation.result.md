結論：最小で安全なのは、`App` が `explore | posts` を保持し、`PotentialMapView` を常駐させたまま、投稿一覧・投稿フォームだけを切り替える構成です。旧 `MapViewExplore` / `MapViewAnalyze` は描画しません。

1. v2の構成と投稿画面

- v2の状態は `mode: 'explore' | 'analyze'`。`App.tsx` は常に `MapViewExplore` を描画し、`mode` をpropsで渡します。
- `TopBar` の検索右側に探索／分析の2ボタンがあります。
- `analyze` 時は `PostListPanel`、投稿マーカー、投稿ポップアップを表示します。コード上の名称は「分析」ですが、今回の投稿モードに相当します。
- 実際の投稿フォームは `MapViewAnalyze` ではなく、`MapViewExplore.tsx` 下部のカメラFABと投稿モーダルです。これは `mode` に依存せず、両モードで表示されます。
- `AppMenu` の「投稿」はフォームを開かず、`onViewPosts()` 経由で `analyze` に切り替えるだけです。

参照：[v2 App.tsx](https://github.com/kaishiraishi/tokyo-nightview-web-v2/blob/f483b65/src/App.tsx#L7-L48)、[v2 TopBar.tsx](https://github.com/kaishiraishi/tokyo-nightview-web-v2/blob/f483b65/src/components/layout/TopBar.tsx#L121-L143)、[投稿フォーム](https://github.com/kaishiraishi/tokyo-nightview-web-v2/blob/f483b65/src/components/map/MapViewExplore.tsx#L1694-L1889)

2. v3で再利用すべきUIとprops

- 現行の地図本体：[PotentialMapView.tsx](/Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/src/components/potential/PotentialMapView.tsx:274)
- 既存のモードprops：[TopBar.tsx](/Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/src/components/layout/TopBar.tsx:15)
  - `mode`
  - `onModeChange`
  - `postCount`
  - `onViewPosts`
- ただし現状の `PotentialMapView` は `mode="explore"`、`onModeChange={() => undefined}`、`postCount={0}` を渡しており、切替は未接続です。
- `TopBar` の現在の2つの表示は `div` で、クリックできないコンテキスト表示です。
- `AppMenu` の「投稿」行は既存の `onViewPosts` を呼ぶため、そのまま利用できます：[AppMenu.tsx](/Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/src/components/menu/AppMenu.tsx:134)
- 投稿一覧は既存の [PostListPanel.tsx](/Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/src/components/hud/PostListPanel.tsx:5) を再利用できます。
- 投稿フォームだけは独立コンポーネント化が必要です。現在は旧 `MapViewExplore` 内に埋め込まれています：[MapViewExplore.tsx](/Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/src/components/map/MapViewExplore.tsx:1694)

投稿UIに必要な主なpropsは、`map`、現在地、`posts`、投稿完了後の再取得または追加callbackです。`PostListPanel` をそのまま使う場合は、VIIRS・ポテンシャル・航空写真の各状態propsも必要です。

3. 最小変更の具体案

```text
App
 └─ mode: 'explore' | 'posts'
     └─ PotentialMapView(mode, onModeChange)
          ├─ explore: 現行の方向・距離パネル
          └─ posts: PostListPanel + 投稿フォーム
```

- `App.tsx` にモード状態だけ追加する。
- `PotentialMapView` はアンマウントせず、同じMapLibre地図を維持する。
- `TopBar` の切替ボタンと `AppMenu` の「投稿」を同じ `onModeChange` に接続する。
- 投稿一覧クリック時は、既存の `map.flyTo()` 相当で投稿地点へ移動する。
- 投稿マーカーやdeck.glの旧 `MapOverlays` は、今回の最小スコープでは再利用しない。
- v2の `analyze` という名称をそのまま使うより、v3では `posts` または `post` と命名する方が、旧DSM探索処理との混同を防げます。

4. 古いDSM処理を起動しない方法

- `App.tsx` は `PotentialMapView` だけを描画する：[src/App.tsx](/Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/src/App.tsx:3)
- `MapViewExplore` は `dsmApi` をimportし、`fetchProfile()` を実行します：[MapViewExplore.tsx](/Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/src/components/map/MapViewExplore.tsx:11)
- `mode="analyze"` を渡すだけでも旧MapLibre・旧MapOverlaysはマウントされるため、安全策として投稿モードで `MapViewExplore` を描画しない。
- 投稿用に抽出するコンポーネントは `postsApi`、`supabaseClient` のみを使い、`dsmApi`、`ScanControlPanel`、`MapOverlays` をimportしない。
- `npm run dev` のみを使い、`npm run dev:api` / `npm run dev:all` は起動しない。DSMサーバーの起動箇所は [package.json](/Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/package.json:8) です。
- [MapViewAnalyze.tsx](/Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/src/components/map/MapViewAnalyze.tsx:5) は単なる旧MapLibre地図シェルで、投稿画面ではありません。

5. PC・モバイルの切替入口

- PC：v2同様、TopBarの検索横に「探索／投稿」の2ボタンを置く。
- モバイル：v3では `hideSearch` により現在のコンテキスト表示も消えるため、モード切替だけは検索とは独立して常時表示する。ユーザーメニューボタン横、または右上のMap Modes・コンパスボタン群の上段が候補です。
- `Map Modes` はレイヤー表示切替なので、アプリモード切替とは分離する。
- `AppMenu` の「投稿」はPC・モバイル共通の補助入口として残す。
- ボタンには `aria-pressed`、`aria-label`、`title` を付け、「探索」「投稿」と明示する。

6. リスク

- v2の `analyze` は名前と実態がずれているため、旧DSMとの誤接続が起きやすい。
- 投稿フォームは1,893行の旧 `MapViewExplore` に密結合しており、抽出時にDSM・スキャン処理を混ぜない必要があります。
- 投稿地点のピン選択は、現行PotentialMapViewの地図クリックによる地点選択と競合します。
- `PostListPanel` は旧レイヤー設定を内包し、現行の `MapModesModal` と操作が重複します。
- Supabase未設定時は一覧・投稿保存が無効になるため、表示用mockと実投稿の状態を分ける必要があります。
- モバイルでは下部シート、Map Modes、コンパス、投稿フォームのz-indexと表示位置が競合しやすいです。
- 既存の未コミット差分は保護が必要です。特に `TopBar`、`PotentialMapView`、`LayerMenu` は現在の012作業と重なります。

編集状況：

- アプリコード・`PROJECT.md`・`STATE.md`は、私から編集していません。
- `./scripts/verify.sh`も、編集禁止のため実行していません。
- Lunaは `nice(5): operation not permitted` で停止し、013のresultファイルは生成されませんでした。
- 調査中、共有ワークスペース上で開始時にはなかった `PLAN.md` の変更と `tasks/014-mode-switch.prompt.md` が出現しました。保護対象として触らず残しています。
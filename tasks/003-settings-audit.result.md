# 調査結果（編集なし）

## 結論

- 現行主画面には「メニュー → 設定」への導線がありますが、v3 では設定画面が説明文のみで、方向・距離 UI は変更できません。
- 「現状 / Field / Polar / 比較」の状態は既に `PotentialMapView` が一元管理しています。設定画面から変更する場合も、この state を親に残して props で渡すのが最小です。
- `localStorage` / `sessionStorage` などの UI 設定永続化パターンはありません。
- ガラス調スタイルは Tailwind class のインライン記述が複数箇所に重複しています。`src/styles/ui.ts` に共通 class を追加するのが軽量です。

## 事実

### 1. 設定画面・メニュー

- 現行の起動経路は [`App.tsx:4`](/Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/src/App.tsx:4) → `PotentialMapView` です。旧 `MapViewExplore` / `MapViewAnalyze` は現行 `App.tsx` から起動されません（[`PROJECT.md:60`](/Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/PROJECT.md:60)）。
- 現行 `PotentialMapView` は [`layout/TopBar.tsx`](/Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/src/components/layout/TopBar.tsx:4) を使っています。
- TopBar 左側のユーザーアイコンがメニューを開くボタンです（[`TopBar.tsx:60`](/Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/src/components/layout/TopBar.tsx:60)）。
- `AppMenu` は `main / settings` の内部 state を持つモーダルです（[`AppMenu.tsx:42`](/Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/src/components/menu/AppMenu.tsx:42)）。メニュー内の「設定」行から設定ビューへ遷移できます（[`AppMenu.tsx:150`](/Users/kaishiraishi-web-v3/src/components/menu/AppMenu.tsx:150)）。
- 現行 v3 では `fanConfig` が渡されないため、設定ビューは「夜景ポテンシャルマップ」の説明文だけを表示します（[`AppMenu.tsx:220`](/Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/src/components/menu/AppMenu.tsx:220)）。
- `LayerMenu` は一般設定ではなく、現行主画面の「表示レイヤー設定」です。PC は左サイドパネル、モバイルは下部シートです（[`PotentialMapView.tsx:178`](/Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/src/components/potential/PotentialMapView.tsx:178)、[`LayerMenu.tsx:56`](/Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/src/components/layout/LayerMenu.tsx:56)）。
- 旧 `MapViewExplore` では `AppMenu` に `fanConfig` を渡し、スキャン設定を表示します（[`MapViewExplore.tsx:1539`](/Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/src/components/map/MapViewExplore.tsx:1539)）。これは旧 Explore 系の機能です。

### 2. 方向・距離 UI の state と props

- 型と候補一覧は `PotentialMapView` 内にあります（[`PotentialMapView.tsx:24`](/Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/src/components/potential/PotentialMapView.tsx:24)）。
- state の持ち主は `PotentialMapView` です。

| state | 初期値 | 主な利用箇所 |
|---|---:|---|
| `panelView` | `current` | [`PotentialMapView.tsx:47`](/Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/src/components/potential/PotentialMapView.tsx:47) |
| `maxDistance` | `200` | [`PotentialMapView.tsx:48`](/Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/src/components/potential/PotentialMapView.tsx:48) |
| `selectedLocation` | `null` | [`PotentialMapView.tsx:46`](/Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/src/components/potential/PotentialMapView.tsx:46) |

- 切替ボタンは `PotentialMapView` 内の `PANEL_VIEWS.map()` です（[`PotentialMapView.tsx:232`](/Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/src/components/potential/PotentialMapView.tsx:232)）。
- `current` は従来の `DirectionalField` / `PolarHeatmap` を直接描画します（[`PotentialMapView.tsx:268`](/Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/src/components/potential/PotentialMapView.tsx:268)）。
- `Field / Polar / 比較` は `PrototypePanel` に `type={panelView}` と `viewModel` を渡します（[`PotentialMapView.tsx:246`](/Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/src/components/potential/PotentialMapView.tsx:246)）。
- Range 変更も親の `setMaxDistance` を渡す構造です（[`PrototypePanel.tsx:29`](/Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/src/components/potential/prototypes/PrototypePanel.tsx:29)）。
- `usePotentialAnalysis` は地点変更時だけサンプリングし、`range` 変更時はメモリ上の ViewModel を再計算します（[`usePotentialAnalysis.ts:45`](/Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/src/hooks/usePotentialAnalysis.ts:45)、[`usePotentialAnalysis.ts:47`](/Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/src/hooks/usePotentialAnalysis.ts:47)）。

### 3. 永続化

- リポジトリ内に `localStorage`、`sessionStorage`、`indexedDB`、Cookie を UI 設定に使う箇所は見つかりませんでした。
- レイヤー状態、`panelView`、`maxDistance` はすべて React の `useState` です（[`PotentialMapView.tsx:41`](/Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/src/components/potential/PotentialMapView.tsx:41)）。
- メニューの開閉状態も一時 state です（[`TopBar.tsx:54`](/Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/src/components/layout/TopBar.tsx:54)）。
- よってページ再読み込み後は `現状`、距離 `200m`、各レイヤー初期値に戻ります。

### 4. ガラス調スタイル

- プロジェクト仕様では `bg-black/60 + backdrop-blur-md + border-white/10`、主テキスト `white/90`、補助テキスト `white/50` です（[`PROJECT.md:66`](/Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/PROJECT.md:66)）。
- 現行 TopBar は検索欄・モード欄・ステッパーで同系統の class を使用しています（[`TopBar.tsx:73`](/Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/src/components/layout/TopBar.tsx:73)）。
- 現行 LayerMenu の PC 版もほぼ仕様どおりです（[`LayerMenu.tsx:63`](/Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/src/components/layout/LayerMenu.tsx:63)）。
- 現在地ボタンにも同じ class が重複しています（[`CurrentLocationButton.tsx:19`](/Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/src/components/ui/CurrentLocationButton.tsx:19)）。
- AppMenu の背景オーバーレイは一致しますが、モーダル本体は `bg-[#1c1c1e]/90`、`backdrop-blur-xl` です（[`AppMenu.tsx:55`](/Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/src/components/menu/AppMenu.tsx:55)、[`AppMenu.tsx:63`](/Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/src/components/menu/AppMenu.tsx:63)）。
- `src/styles/ui.ts` は現在 `unifiedBtn` だけで、ガラス調の共通 class はありません（[`ui.ts:1`](/Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/src/styles/ui.ts:1)）。
- `PotentialTopBar.tsx` と `components/map/LayerMenu.tsx` にも類似 style がありますが、現行経路からは参照されていません。

## 提案

### 最小構成

1. 設定を開くボタンは既存の TopBar ユーザーアイコンを使用する。
2. `panelView` の state は引き続き `PotentialMapView` に置く。
3. `TopBar` → `AppMenu` に以下を controlled props として渡す。

   - `panelView`
   - `onPanelViewChange`

4. `AppMenu` の既存「設定」画面に、4択の `PanelViewSelector` を追加する。
5. LayerMenu 側の既存切替も残す場合は、同じ state・同じ selector を共有し、state を二重化しない。

### 追加・変更候補ファイル

- 新規: `src/components/potential/PanelViewSelector.tsx`
  - 「現状 / Field / Polar / 比較」の候補と共通セグメント UI。
- 変更: `src/components/potential/PotentialMapView.tsx`
  - selector の利用、TopBar への props 渡し。
- 変更: `src/components/layout/TopBar.tsx`
  - `AppMenu` への props 中継。
- 変更: `src/components/menu/AppMenu.tsx`
  - 設定ビューに selector を表示。
- 変更: `src/styles/ui.ts`
  - `glassSurface = "bg-black/60 backdrop-blur-md border border-white/10"` のような共通 class を追加。

`TopBar` は旧 `MapViewExplore` からも使われているため、新 props は optional にするか、旧呼び出し側も同時に更新する必要があります。永続化は既存パターンがないため、次回起動後も選択を保持する要件がある場合だけ別途追加するのが安全です。

指定どおりファイルは編集していません。
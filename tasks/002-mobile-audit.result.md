結論：375×667 / 390×844 では、現行コード上の大きな横はみ出しはありません。一方、優先度が高い問題は次の5点です。

1. 下部シートが現在地ボタンを覆う
2. 複数の操作ボタンが44px未満
3. canvas上の`touch-none`がシートのスクロールを妨げる
4. 比較表示の2カードが小さすぎる
5. 初期状態でシートが開き、地図操作可能領域が狭い

## 配置と寸法

| UI | モバイル時の配置・寸法 |
|---|---|
| 地図 | `h-full w-full touch-none`。[PotentialMapView.tsx:152](</Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/src/components/potential/PotentialMapView.tsx:152>) |
| 実際のTopBar | `absolute`、top `16px + safe-area-top`、左右16px、`z-5000`、高さ48px。[TopBar.tsx:57](</Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/src/components/layout/TopBar.tsx:57>) |
| TopBar幅 | 375pxでは343px、390pxでは358px。検索欄・メニュー・表示インジケータは収まる |
| 検索結果 | TopBar直下、`z-6000`、最大高さ`60vh`、内部スクロール。[TopBar.tsx:92](</Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/src/components/layout/TopBar.tsx:92>) |
| エラー表示 | `absolute top-36 left-4 right-4 z-7000`。[PotentialMapView.tsx:169](</Users/kaishiraishi.com/Desktop/tokyo-nighview-web-v3/src/components/potential/PotentialMapView.tsx:169>) |
| LayerMenu | モバイルは`fixed bottom-0 left-0 right-0 z-4000`。ハンドル55px、内容`60vh`。[LayerMenu.tsx:60](</Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/src/components/layout/LayerMenu.tsx:60>) |
| 現在地ボタン | `absolute`、右24px、下24px＋safe-area、サイズ44px。[PotentialMapView.tsx:365](</Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/src/components/potential/PotentialMapView.tsx:365>) |
| 読み込み表示 | `absolute inset-0 z-7000`。[PotentialMapView.tsx:369](</Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/src/components/potential/PotentialMapView.tsx:369>) |

Tailwindの標準ブレークポイントは`sm=640px`、`md=768px`です。対象幅はどちらも`sm`未満です。LayerMenuだけはTailwindではなく`window.innerWidth < 768`で判定しています。[LayerMenu.tsx:10](</Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/src/components/layout/LayerMenu.tsx:10>)

## 問題一覧

### 1. 現在地ボタンが下部シートに覆われる

- ファイル: [PotentialMapView.tsx:365](</Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/src/components/potential/PotentialMapView.tsx:365>)、[LayerMenu.tsx:62](</Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/src/components/layout/LayerMenu.tsx:62>)
- 症状:
  - シート開放時、ボタンはシートの内部に入り、`z-4000`のシートに覆われる
  - シート閉鎖時も、ハンドル55pxと現在地ボタンが約31px重なる
- 原因:
  - 現在地ボタンに`z-index`がない
  - ボタン位置がシートのハンドル位置を考慮していない
- 修正案:
  - `z-[4500]`を付ける
  - シート開放時はシート上端より上へ移動、閉鎖時は`55px + 24px + safe-area`より上へ配置する
  - 代替として、シート開放時はボタンを一時的に非表示にする

### 2. 初期状態で下部シートが開いており、地図操作領域が狭い

- ファイル: [PotentialMapView.tsx:41](</Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/src/components/potential/PotentialMapView.tsx:41>)、[LayerMenu.tsx:99](</Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/src/components/layout/LayerMenu.tsx:99>)
- 症状:
  - 初期状態は`isLayerMenuOpen=true`
  - 375×667では`60vh=約400px`。ハンドル込みで約455pxを占有し、地図は約212pxしか見えない
  - 390×844では`60vh=約506px`。safe-areaを除いても地図は約249〜283px程度
  - シートが開いている間、下部の地図はクリックできない
- 原因:
  - パネルが初期から開いている
  - パネル全体が`z-4000`で地図を覆う
- 修正案:
  - モバイル初期状態だけ`false`にする
  - または地図クリック後に自動で閉じる

### 3. 操作ボタンが44px未満

- Layer設定: [LayerSettings.tsx:36](</Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/src/components/layout/LayerSettings.tsx:36>)
  - ON/OFFボタンは`py-1`で高さ約20px、幅もON/OFF時は約36px
- 表示切替タブ: [PotentialMapView.tsx:239](</Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/src/components/potential/PotentialMapView.tsx:239>)
  - `text-xs py-2`で高さ約32px
- PrototypeのRangeボタン: [PrototypePanel.tsx:31](</Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/src/components/potential/prototypes/PrototypePanel.tsx:31>)
  - `py-1.5`で高さ約28px
- 現状Polarの距離変更ボタン: [PotentialMapView.tsx:325](</Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/src/components/potential/PotentialMapView.tsx:325>)
  - `h-9 w-9`、36×36px
- エラー閉じるボタン: [PotentialMapView.tsx:173](</Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/src/components/potential/PotentialMapView.tsx:173>)
  - `p-1`のみで約20px
- AppMenuの戻る・閉じるボタン: [AppMenu.tsx:71](</Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/src/components/menu/AppMenu.tsx:71>)
  - 40×40px
- 修正案:
  - すべて`min-h-11 min-w-11`相当にする
  - 距離ボタンは`h-11 w-11`へ変更
  - Layer設定は小さいON/OFFボタンだけでなく、行全体を操作領域にする

なお、TopBarのメニューボタン・検索欄は48px、現在地ボタンは375/390pxではCSS変数の下限により44px、Street Viewリンクは`min-h-11`で、これらは基準を満たします。

### 4. canvas上からシートをスクロールしにくい

- ファイル: [DirectionalFieldCanvas.tsx:162](</Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/src/components/directional-field/DirectionalFieldCanvas.tsx:162>)、[PolarHeatmapCanvas.tsx:156](</Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/src/components/polar-heatmap/PolarHeatmapCanvas.tsx:156>)、[prototypes/PolarHeatmap.tsx:79](</Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/src/components/potential/prototypes/PolarHeatmap.tsx:79>)
- 症状:
  - canvasが`touch-none`のため、canvas上で上下にスワイプしても親の`overflow-y-auto`をスクロールできない
  - 特に高さ246pxの現状表示で発生しやすい
- 原因:
  - `touch-action: none`相当の指定
- 修正案:
  - シート内canvasは`touch-pan-y`へ変更する
  - もしくは`touch-none`を削除し、タップ操作だけ別途維持する

シート全体のスクロール自体は、[PotentialMapView.tsx:197](</Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/src/components/potential/PotentialMapView.tsx:197>)の`overflow-y-auto`で実装されています。ただし、ページ全体は[#rootのoverflow:hidden](</Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/src/index.css:33>)なので、シート以外はスクロールできません。

### 5. 比較表示の2カードが小さく、canvas内の文字が読みにくい

- ファイル: [PrototypeCompare.tsx:9](</Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/src/components/potential/prototypes/PrototypeCompare.tsx:9>)
- 375px時:
  - シート内コンテンツ幅343px
  - 2列の各カード幅約167.5px
  - カード内canvas幅約141.5px
- 390px時:
  - 各canvas幅約149px
- 原因:
  - 常に`grid-cols-2`
  - canvas論理サイズは300pxだが、CSS上では約142〜149pxに縮小される
- 修正案:
  - モバイルだけ`grid-cols-1 sm:grid-cols-2`にする
  - これでcanvas幅は約317〜332pxになり、比較カードは縦積みになる

### 6. 100vh基準で、モバイルブラウザの表示領域変化に弱い

- ファイル: [index.css:33](</Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/src/index.css:33>)、[LayerMenu.tsx:99](</Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/src/components/layout/LayerMenu.tsx:99>)
- 症状:
  - ルートとシートが`100vh` / `60vh`基準
  - iOS Safariのアドレスバー表示・非表示で、シート下端やスクロール領域がずれる可能性がある
- safe-area対応:
  - viewport設定は対応済み。[index.html:6](</Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/index.html:6>)
  - TopBar上端は対応済み。[TopBar.tsx:57](</Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/src/components/layout/TopBar.tsx:57>)
  - シート下端も対応済み。[LayerMenu.tsx:62](</Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/src/components/layout/LayerMenu.tsx:62>)
  - 現在地ボタンも対応済み。[PotentialMapView.tsx:365](</Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/src/components/potential/PotentialMapView.tsx:365>)
- 修正案:
  - `100vh`の後に`100dvh`を指定する
  - シート高さも`60dvh`等に合わせる
  - AppMenuの外側にもsafe-areaを考慮したpaddingを追加する

### 7. 検索結果が下部シートに重なる

- ファイル: [TopBar.tsx:92](</Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/src/components/layout/TopBar.tsx:92>)、[LayerMenu.tsx:60](</Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/src/components/layout/LayerMenu.tsx:60>)
- 症状:
  - 検索結果は`z-6000`、シートは`z-4000`
  - 375pxでは検索結果が最大約400pxあり、シート上部へ重なる
  - 検索中はシート側の操作ができない
- 原因:
  - 検索結果をTopBarの上位レイヤーに表示している
- 修正案:
  - 検索中だけシートを閉じる
  - または検索結果の最大高さを`calc(100dvh - TopBar下端 - safe-area)`で制限する

これは検索結果を優先する設計なら許容できますが、現状は重なり方が明示されていません。

### 8. ヘッダーが重複しており、シートの表示領域を消費する

- ファイル: [PotentialMapView.tsx:180](</Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/src/components/potential/PotentialMapView.tsx:180>)、[LayerSettings.tsx:21](</Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/src/components/layout/LayerSettings.tsx:21>)
- 症状:
  - 「表示レイヤー設定」が連続して2回表示される
  - モバイルでは約50〜70px分、実際のスクロール領域が減る
- 修正案:
  - どちらか一方の見出しを削除する

### 9. 下部シートはドラッグ開閉に対応していない

- ファイル: [LayerMenu.tsx:22](</Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/src/components/layout/LayerMenu.tsx:22>)、[LayerMenu.tsx:78](</Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/src/components/layout/LayerMenu.tsx:78>)
- 症状:
  - ドラッグ処理はコメントアウトされており、開閉は55pxのハンドルをタップするだけ
  - ハンドルは`div onClick`で、`button`ではない
- 修正案:
  - 最小変更なら`button`化し、`aria-expanded`を付ける
  - ドラッグ開閉は別タスクとして実装する

### 10. Polar Heatmapはモバイルで描画負荷が高い可能性がある

- ファイル: [PolarHeatmapCanvas.tsx:73](</Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/src/components/polar-heatmap/PolarHeatmapCanvas.tsx:73>)、[prototypes/viewModel.ts:13](</Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/src/components/potential/prototypes/viewModel.ts:13>)
- 現状Polarは180方向×72距離、12,960セルを描画し、値が落ち着くまで`requestAnimationFrame`で再描画する
- active canvasは`devicePixelRatio`を上限なしで使用する
- Prototype版は`CANVAS_SIZE=300`、DPR上限2、オフスクリーン描画1回なので比較的安全
- 修正案:
  - active版もDPRを2程度に制限する
  - Prototype版の描画方式へ統一する

## canvasのサイズ決定方法

### 現状表示

[PotentialMapView.tsx:283](</Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/src/components/potential/PotentialMapView.tsx:283>) と[PotentialMapView.tsx:312](</Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/src/components/potential/PotentialMapView.tsx:312>)で、Directional Field / Polar Heatmapともに`size={246}`固定です。

- 外枠: 246×246px
- canvasのCSS表示サイズ: 246×246px
- 内部ピクセル: `246 × devicePixelRatio`
- 375/390pxではカード内幅317/332pxなので、横はみ出さない
- 小画面向けの縮小処理はなく、246px未満の幅では将来的に溢れる可能性がある

### Prototype表示

[prototypes/canvas.ts:4](</Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/src/components/potential/prototypes/canvas.ts:4>)で論理サイズを300pxに固定し、[prototypes/canvas.ts:35](</Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/src/components/potential/prototypes/canvas.ts:35>)で内部canvasを最大DPR2にしています。

CSS側は`w-full aspect-ratio:1/1`です。

- Field / Polar単体: CSS幅約317〜332px
- 比較表示: CSS幅約142〜149px
- 比較表示ではキャンバス内の15px相当の文字も約7〜8pxに縮小される

## コンポーネントツリー

```text
App
└─ PotentialMapView
   ├─ MapLibre map container
   ├─ layout/TopBar                 実際に使用される検索・メニュー
   │  └─ menu/AppMenu               Userボタンで開く固定モーダル
   ├─ locateError toast
   ├─ layout/LayerMenu              モバイル下部シート / PC左サイドパネル
   │  ├─ PotentialMapView内ヘッダー
   │  ├─ layout/LayerSettings       VIIRS / ポテンシャル / 航空写真の切替
   │  └─ scroll content
   │     ├─ 凡例・不透明度
   │     ├─ 現状 / Field / Polar / 比較タブ
   │     ├─ prototypes/PrototypePanel
   │     │  ├─ PrototypeControls       Range切替
   │     │  ├─ PrototypeCard
   │     │  ├─ PrototypeCompare        Field/Polar 2列比較
   │     │  └─ prototypes canvas
   │     └─ 現状表示
   │        ├─ directional-field/DirectionalField
   │        └─ polar-heatmap/PolarHeatmap
   ├─ ui/CurrentLocationButton
   └─ loading overlay
```

`potential/PotentialTopBar.tsx`は現在のツリーには含まれていません。[PotentialMapView.tsx:6](</Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/src/components/potential/PotentialMapView.tsx:6>)では`layout/TopBar`をimportしており、`PotentialTopBar`は未使用の代替実装です。従って、今回の実画面評価は`layout/TopBar.tsx`を基準にする必要があります。

今回の調査ではファイルを編集していません。
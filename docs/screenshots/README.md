# iPhone 16 のスクリーンショットとモック画像の作り方

ユースケースの説明に使う、全画面のスクリーンショットと、それを iPhone 16 の公式の枠に入れたモック画像の作り方です（2026-10-04）。

## 何ができるか

| フォルダ | 中身 |
|---|---|
| `iphone16-hig/` | 44 画面のスクリーンショット。1179×2556px（iPhone 16 の 393×852pt × 3 倍）。横向きの 1 枚だけ 2556×1179px |
| `iphone16-hig-mockup/` | 上の画像を、Apple 公式の iPhone 16 の枠（Black）に入れたもの |

ファイル名は「番号_画面_状況」で、番号順に並べると使う流れになります（探索 → コンパス → 表示モード → メニュー → 投稿 → エラー → デバッグ）。合計約 100MB あるので、画像は git に入れていません。

## 大事な点: アプリのコードは変えていない

モック画像の見た目は、Apple の Human Interface Guidelines（HIG）に沿って直したものです。ただし、**直しているのは撮影するときにブラウザへ差し込む CSS だけ**で、アプリのコードと公開版の見た目は変えていません。実際のアプリと違う点は「HIG に沿って直した見た目」の表のとおりです。実際のアプリにも入れる場合は、この表を元に実装してください。

## 仕組み

ブラウザの自動操作（`agent-browser`）でアプリを開き、画面ごとに操作してスクリーンショットを撮ります。実機と同じ画面にするため、次の 4 つを組み合わせています。

| 何を | どうやって | ファイル |
|---|---|---|
| 画面の大きさ | `agent-browser set device "iPhone 16"`（393×852、3 倍、iPhone の UA）。撮影のたびに入れ直す（途中で外れることがあったため） | `h.sh` の `fresh` |
| 画面の上下の安全領域（Dynamic Island・ホームインジケーターの分） | Chrome の DevTools Protocol の `Emulation.setSafeAreaInsetsOverride` で、iPhone 16 と同じ値を入れる。縦: 上 59 / 下 34。横: 下 21・左右 59。**これを入れないと、枠に入れたときに上の部品が Dynamic Island の下に潜る** | `safe.mjs`、`h.sh` の `safe` |
| 現在地と端末の向き | ページより先に読み込むスクリプトで、`navigator.geolocation` と方位センサーのイベントを擬似的に入れる。現在地は八王子のポテンシャルが高い場所の近く（北緯 35.6710・東経 139.3460、精度 15m）、向きは北東 42°。タッチ端末としても振る舞わせる | `fake.js` |
| HIG に沿った見た目 | ページより先に読み込むスクリプトで、CSS とステータスバー・ホームインジケーターを差し込む | `hig.js` |

`fake.js` は `localStorage` の `__fake` から設定を読みます。撮影スクリプトの `fresh '{...}'` で場面ごとに変えています。

| 設定 | 意味 | 使う場面 |
|---|---|---|
| `geo: {lat, lng, acc}` | 現在地と精度（m） | 全部。「投稿の場所に着いた」は投稿の地点（35.67428, 139.34805、精度 10m） |
| `lowAcc: true` | 方位の精度が低い（iOS の精度 40°） | 11 |
| `noSensor: true` | 方位センサーがない端末 | 12 |
| `geoDenied: true` | 位置情報の利用を拒否 | 42 |

## HIG に沿って直した見た目（`hig.js`）

| 項目 | 実際のアプリ | モック |
|---|---|---|
| ステータスバー | なし | 9:41 と、純正の SF Symbols（`cellularbars` / `wifi` / `battery.100`、Semibold）。記号は macOS の `NSImage(systemSymbolName:)` で PNG に書き出して埋め込む（`scripts/mockup/sf-symbols.swift`。SF Symbols の入った Mac で `swift sf-symbols.swift`）。横向きでは出さない（iOS と同じ） |
| ホームインジケーター | なし | 画面下に 139×5 の白い棒 |
| 地図の出典表示 | 白い箱で 2 行、画面下を覆う | Apple マップと同じく、右下に小さく「法的情報」 |
| 右下のボタン列・＋ボタン | 下から 56px + 安全領域（出典表示を避けるため） | 下から 28px + 安全領域 |
| 上の帯の位置 | 安全領域 + 16px | 安全領域 + 3px（ステータスバーのすぐ下。アイランドとの間に地図が細く見えるのをなくす）。お知らせの帯・コンパスのカードも同じだけ上げる |
| 左右の余白（浮かぶ部品） | 16px | 12px（地図を広く見せる。Apple マップの地図ボタンも端に寄せている）。コンパスのカードは 16px のまま |
| 検索欄 | 文字 16px、人のアイコンとの間 24px | 文字 15px、アイコンとの間 16px（欄の左の余白をなくす） |
| 文字の大きさ | 10〜16px | HIG の文字スタイルに合わせる: 本文 17、サブ見出し 15、補足 13、注記 12 / 11（最小 11pt） |
| 補助テキストの色 | 白 30〜70% | HIG のダークモードのラベル色: セカンダリ `rgba(235,235,245,.62)`、それより弱いもの `.48` |
| 地図上の吹き出し（検索ピン） | 題名 13px、枠線のボタン、フォーカスの二重の輪が出る | 題名 17px、淡い紫の塗りのボタン（登録済みは紫）、フォーカスの輪なし、× を大きく |
| 投稿カード | キャプション 13px | 15px、コメントは 13px |

試してやめたこと: 検索欄の左に iOS 定番の虫めがねを出すと、左のメニューボタンがあるため「場所を検索」が欄に収まらず切れた。

## 撮り方

前提: Node.js、Python 3（Pillow）、`agent-browser`（`npm i -g agent-browser && agent-browser install`）。

```bash
# 1. 開発サーバー（ポートは STATE.md の Notes のとおり 5288）
npx vite --port 5288 --strictPort

# 2. ブラウザを、擬似の位置・センサーと HIG の見た目を入れて開く（初めの 1 回）
agent-browser close
agent-browser open --init-script scripts/mockup/fake.js --init-script scripts/mockup/hig.js about:blank
agent-browser set device "iPhone 16"
agent-browser open http://localhost:5288/tokyo-nightview-web-v3/

# 3. 44 画面を撮る（10 分ほど。docs/screenshots/iphone16-hig/ に保存）
bash scripts/mockup/shoot-all.sh
```

- **初期化スクリプトはブラウザを閉じると外れます。** `agent-browser close` したら、2 からやり直してください（外れていると、コンパスが「この端末ではコンパスを利用できません」になり、現在地も取れません）。
- 確認: `navigator.maxTouchPoints` が 5、`env(safe-area-inset-top)` が 59px になっていれば正しく入っています。
- HIG の上書きなしで実際の見た目のまま撮るときは、2 で `--init-script scripts/mockup/hig.js` を外します。
- 撮り終えたら、一覧にして中身を確認します（操作が空振りして、前の画面のまま撮れていることがあるため）。

## 枠に入れる

枠は Apple Developer の Design Resources で公開されている「Product Bezels」の iPhone 16 を使います。**Apple のライセンスのため、枠の画像はリポジトリに入れません。**

1. https://developer.apple.com/design/resources/ から `Bezel-iPhone-16.dmg` をダウンロードする。
2. 開くと使用許諾（App Store Marketing Artwork License Agreement）が出る。同意すると `PNG/iPhone 16/iPhone 16 - Black - Portrait.png` と `... - Landscape.png` がある。好きな場所にコピーする。
3. 合成する:

```bash
FRAME_DIR="/path/to/PNG/iPhone 16" python3 scripts/mockup/mock.py docs/screenshots/iphone16-hig docs/screenshots/iphone16-hig-mockup
```

- 枠の画面の穴は (90, 90) から 1179×2556px で、スクリーンショットとぴったり同じ大きさ（拡大・縮小なし）。横向きは 2556×1179px。
- 角の丸みは、枠の透明な部分を中心から塗りつぶして取り出したマスクで切り抜く（画面の外側の透明部分には写さない）。
- ライセンスは、Apple Developer Program の登録者が、App Store で配信するアプリの宣伝に使う前提。ユースケースの説明資料（社内・レビュー用）なら問題ないと考えているが、外部に公開する場合は条件に当てはまるか確認する。

## ファイル

| ファイル | 役割 |
|---|---|
| `scripts/mockup/fake.js` | 現在地・方位センサー・タッチ端末を擬似的に入れる（ページより先に読む） |
| `scripts/mockup/hig.js` | HIG に沿った見た目の CSS と、ステータスバー・ホームインジケーター（ページより先に読む） |
| `scripts/mockup/safe.mjs` | CDP で safe area を入れる。`node safe.mjs <ブラウザの CDP URL> 上 下 [左 右]` |
| `scripts/mockup/h.sh` | 撮影の補助関数（`fresh` / `jc` / `tap` / `shot` / `safe` / `cltap`） |
| `scripts/mockup/shoot-all.sh` | 44 画面を順に撮る手順 |
| `scripts/mockup/sf-symbols.swift` | ステータスバーの純正の記号を PNG に書き出す |
| `scripts/mockup/cl.py` | 投稿の件数の丸を画像から探す（一番左の丸を押してズームする） |
| `scripts/mockup/mock.py` | スクリーンショットを公式の枠に入れる |

## うまく撮れないもの

- 読み込み中の画面（一瞬で消える）
- デバッグモードのピンの Street View のポップアップ（自動操作ではピンのポップアップを開けなかった）
- 二本指で地図を操作している間の表示
- 「投稿の場所に着きました」のお知らせは 5 秒で消えるので、投稿モードに入ってすぐ撮る
- 地図の動き（`flyTo`）の途中で撮るとずれるので、各操作のあとに数秒待っている。ずれたら待ち時間を延ばす

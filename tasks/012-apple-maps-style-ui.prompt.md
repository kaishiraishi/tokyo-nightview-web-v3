# 012 Apple マップ風 UI と全画面コンパスモード

## 目的
モバイル UI を iOS Apple マップ風に作り直す。(A) 下部シートの先頭に検索バーを内蔵、(B) レイヤー切替を「Map Modes」風のモーダルカードに、(C) コンパスモード時は画面全体をコンパス UI にする。試作として一度作る。

## 前提
PROJECT.md / STATE.md / AGENTS.md、tasks/009〜011 の result を読む。関連: src/components/potential/PotentialMapView.tsx, src/components/layout/LayerMenu.tsx, TopBar（検索）, CompassButton.tsx, CompassControl.tsx, UserLocationMarker.tsx, ClassicPanels.tsx, prototypes/, src/styles/ui.ts, src/hooks/useDeviceHeading.ts。

## 参考デザイン（ユーザー提示の Apple マップ）
- 下部シート: 大きな角丸（~24px）、上部に細いグラバー、直下に丸角の検索フィールド（虫眼鏡アイコン＋「場所を検索」、右側にアイコン）。その下にセクション見出し（例「方向・距離 >」）とコンテンツ。
- Map Modes カード: 中央上部に見出し「表示モード」＋右上の丸い × ボタン。横 4 列の角丸サムネイル（タイル: 標準 / VIIRS / ポテンシャル / 航空写真。選択中は淡い紫の枠）、下にラベル。その下に角丸グループのトグル行（「ポテンシャル」「VIIRS」「航空写真」等の ON/OFF、iOS 風スイッチ）と不透明度スライダー、最下部に小さく出典（© OpenStreetMap など既存の attribution）。サムネイルは既存タイル画像や CSS グラデーションで簡易表現でよい（外部画像の新規追加は禁止）。
- 配色は PROJECT.md の規則に従う（ダークのガラス調、紫は選択・主ボタンのみ、スイッチ ON 色も紫系。Apple の緑は使わない。青はレイヤー状態のみ、赤はエラーと北のみ）。

## 決まっている設計
1. モバイル（既存の isMobileViewport 判定）:
   - 上部の TopBar 検索はモバイルでは非表示にし、下部シートの先頭に検索フィールドを移す（既存の検索ロジック・結果表示を再利用。フォーカス時はシートを展開）。
   - シート高さは 3 段（最小: グラバー+検索バーだけ / 中 / 大）。既存の開閉状態を拡張する程度でよい。
   - シート中身: 検索 → 「方向・距離」カード（現行の選択 View 1 つ）→ 補助情報。レイヤー ON/OFF・凡例・不透明度はシートから外し、Map Modes カードへ。
   - 地図右上に丸いボタン縦並び（Map Modes を開く / コンパスモード）。右下の現在地ボタンはシート上端に追従して重ならないこと（前回、シートのハンドル 55px を計算に入れず被ったので注意）。
2. デスクトップ: 既存の左サイドパネルの見た目を同じデザイン言語（角丸・検索内蔵・Map Modes ボタン）に寄せる程度でよい。壊さないことを優先。
3. コンパスモード（全画面）: `src/components/potential/CompassMode.tsx` を新規。
   - コンパスボタン押下の onClick 内で直接 `start()`（iOS の requestPermission は user gesture 内、await 前）し、同時にフルスクリーンのオーバーレイを開く。
   - オーバーレイ: 黒ガラスの全画面。中央に大きな円形コンパス（画面短辺の ~85%）。外周に方位目盛りと N/E/S/W（N は赤）を `-heading` で回転、上部中央に固定の前方インジケーター（▲）と大きな方位数値（例 128° 南東）。
   - 円の内側に夜景ポテンシャルを重ねる: 選択地点（なければ現在地を選択地点として使う）の polar データを既存 ViewModel から描画し、同じ回転で回す（既存 prototypes の PolarHeatmap/DirectionalField の描画関数を再利用、データ取得は既存 hook 経由）。最も強い方向を示すマーカーと「この方向に 1.2km 先が明るい」のような一行ガイド。Range ボタンも下部に置く。
   - 状態表示: requesting / denied / unsupported / lowAccuracy（8 の字補正の案内）/ データなし。右上 × で閉じると `stop()`。
   - 背景に地図を薄く見せる（地図は回転させない）。
4. 既存機能（検索、現在地、ポテンシャル表示、4 種の方向・距離 View、設定の PanelViewSelector、Street View リンク、現在地マーカー）を失わないこと。
5. ファイルは小さく分割（400 行以内目安）。依存追加なし、`any` 禁止。

## 禁止事項
タイル・色ランプ・MAX_POTENTIAL_VALUE・サンプリング仕様・旧 src/components/map/**・tools/dsm-api・PLAN.md は触らない。地図自体を回転させない。

## 検証コマンド
./scripts/verify.sh

## 報告の形式
- 変更したファイルと理由
- 検証結果（PASS/FAIL をそのまま）
- 未解決の点

# Plan: 選択地点のStreet View確認

## 方針
- 地図で選択した座標からGoogle Street Viewの画像をアプリ内取得する案を検討。
- Google Maps Platform規約 3.2.3(e) は Google Maps Core Services をnon-Google mapと「with or near」使用することを禁じ、Street View画像とnon-Google mapの同一画面表示も例示している。MapLibreの主画面に画像を埋め込む案は採用しない。
- キー不要のGoogle Maps URLをユーザー操作から別タブで開く導線を実装する。画像、撮影位置・時期はGoogle Maps側で確認してもらう。アプリ内の地図画面にはGoogle画像・メタデータを表示しない。

## 実装
- 選択地点パネルに外部遷移ボタンを追加。Google Maps Street View URLへ選択緯度経度を渡す。
- 選択地点がない間はボタンを表示しない。
- Static API用APIキー、課金設定、メタデータfetchは不要。
- 既存タイル/座標前提を変更しない。

## 確認
- `npm run build`、`npm run lint`を実行。
- lint既知エラーが続く場合、正確なエラーをSTATEへ記録。

## 状態

- 実装・build確認済み。lintはESLint 9設定ファイル不足で失敗（STATE.mdに記録）。

---

# Plan: 方向・距離UIのPrototype比較

- 現状UI（Directional Field + Polar Heatmap）を維持したまま、切替ボタンで Field / Polar / Bands / Peaks / 比較 を選べるようにする。
- 24方位×9距離のサンプリングを1回だけ行い、共通 ViewModel から4つの Canvas View を描画する（View 内でデータ取得しない）。
- タイル・GeoTIFF・色ランプ定義は変更しない。
- 状態: 実装・build・ブラウザ確認済み。詳細は STATE.md 2026-09-29。

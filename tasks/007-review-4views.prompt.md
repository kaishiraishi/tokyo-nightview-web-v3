# 007 4 種類の方向・距離 UI 切替のレビュー（読むだけ）

## 目的
直近コミット（git show HEAD）で、方向・距離パネルを 4 種類（classicField / classicPolar / field / polar）の単独表示にし、メニュー → 設定 で切替える形にした。バグ・取りこぼしを探す。

## 前提（読む）
PROJECT.md、git show HEAD、git show HEAD~1、src/components/potential/PotentialMapView.tsx、PanelViewSelector.tsx、prototypes/PrototypePanel.tsx、menu/AppMenu.tsx

## 調べること
- localStorage に旧値（'current' / 'compare'）がある場合の挙動
- 4 種すべてで Range/距離操作、Street View リンク、エラー表示、未選択時の表示が揃っているか
- 設定画面の 2×2 セレクタがモバイル 375px で崩れないか（ラベル長）
- 未使用の import / export / 型（例: PrototypeViews の compare 用メタ、Layers/Sparkles 等）
- JSX のインデント崩れ

## 禁止事項
ファイルを編集しない。

## 報告の形式
- 問題（ファイル:行、症状、修正案）。問題なしならそう書く

# 002 モバイル対応の現状調査（読むだけ）

## 目的
現行主画面（src/App.tsx → src/components/potential/PotentialMapView.tsx）のモバイル幅（375×667 / 390×844）での問題点を洗い出す。

## 前提
PROJECT.md / STATE.md、PotentialMapView.tsx、PotentialTopBar.tsx、そこから import される LayerMenu・方向距離パネル・prototypes/ 配下・現在地ボタン。

## 調べること
- 各 UI 要素の配置（fixed/absolute、幅、高さ、z-index、Tailwind のブレークポイント）
- モバイルで重なる・はみ出す・タップしにくい（44px 未満）・スクロールできない箇所
- 下部シートの開閉の仕組みと高さ、地図操作との干渉、safe-area（env(safe-area-inset-*)）の扱い
- canvas（DirectionalField/PolarHeatmap）のサイズ決定方法と小画面での挙動
- 修正案（ファイル:行 単位、最小変更）

## 禁止事項
ファイルを編集しない。

## 報告の形式
- 問題一覧（ファイル:行、症状、原因、修正案）
- コンポーネントツリーと各ファイルの役割

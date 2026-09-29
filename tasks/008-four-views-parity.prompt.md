# 008 4 種類の方向・距離 UI の機能をそろえる

## 目的
tasks/007-review-4views.result.md の指摘を直す。4 種類（classicField / classicPolar / field / polar）どれを選んでも同じ操作・状態表示になるようにする。

## 前提（読む）
PROJECT.md / STATE.md / AGENTS.md、tasks/007-review-4views.result.md、
src/components/potential/PotentialMapView.tsx、PanelViewSelector.tsx、prototypes/PrototypePanel.tsx

## 決まっている設計
- 4 種類すべてで、カードの上に共通の Range（`PrototypeControls`、50/100/200/500/1km）、その下に status 行、error 行を出す。classicPolar 独自の −/＋ ボタンは削除し Range に統一する（`maxDistance` state は既存のものを共有）。
- classicField の `directionPeaks` は `maxDistance` 以内のサンプルだけから算出する（`potentialPoints.filter(p => p.distance <= maxDistance)` 相当。既存の `deriveDirectionPeaks` は変更しない）。
- 空状態の文言を分ける: 未選択 →「地図上をクリックして地点を選択」、選択済みでデータなし（エラー等）→「この地点のデータを表示できません」。PrototypePanel に `hasSelection: boolean` prop を追加し、従来版カードも同じ判定を使う。
- 共通部分は PotentialMapView から小さなコンポーネント `src/components/potential/ClassicPanels.tsx`（classicField / classicPolar の 2 カード）に切り出し、PotentialMapView を短くする。PotentialMapView 側で status 文字列を 1 回だけ組み立てて両方に渡す。
- JSX インデントを整える。`currentPanelViewLabel` のフォールバック '現状' → PANEL_VIEWS[0].label。
- STATE.md の「現状 / Field / Polar / 比較」表記を 4 種類の新名称に更新。

## 禁止事項
- 描画ロジック（directional-field/*、polar-heatmap/*、prototypes の canvas 描画）、サンプリング、色ランプ、タイルは変えない
- 新依存・`any` 禁止。旧 src/components/map/** は触らない

## 検証コマンド
./scripts/verify.sh （lint / typecheck / build すべて PASS が必要）

## 報告の形式
- 変更したファイルと理由
- 検証結果（PASS/FAIL をそのまま）
- 未解決の点

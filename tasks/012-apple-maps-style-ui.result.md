実装完了しました。

変更内容：

- モバイル下部シートを検索内蔵の3段階 UI に変更
- Map Modes モーダルを追加（4モード、スイッチ、凡例、不透明度、出典）
- 全画面コンパスモードを追加
- 現在地ボタンをシート上端に追従
- デスクトップにも検索・Map Modes 入口を追加
- PanelViewSelector、検索、Street View、既存4 Viewは維持
- 禁止対象のタイル・サンプリング・`PLAN.md` 等は未変更

主なファイル：[PotentialMapView.tsx](/Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/src/components/potential/PotentialMapView.tsx)、[CompassMode.tsx](/Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/src/components/potential/CompassMode.tsx)、[MapModesModal.tsx](/Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/src/components/potential/MapModesModal.tsx)

検証結果：

- PASS lint
- PASS typecheck
- PASS build
- PASS `git diff --check`
- PASS `./scripts/verify.sh`

未解決：

- iOS／Android実機と 375×667・390×844 の目視確認は未実施
- 既知の chunk サイズ／Browserslist 警告は残存
- Luna は権限制限で起動できず、手元で実装・検証しました。
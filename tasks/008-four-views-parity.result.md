完了しました。4 種類で Range・status・error・空状態表示を統一しました。

変更ファイル:

- [ClassicPanels.tsx](/Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/src/components/potential/ClassicPanels.tsx:41) を追加
- [PotentialMapView.tsx](/Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/src/components/potential/PotentialMapView.tsx:50) を整理し、距離フィルタと共通 status を追加
- [PrototypePanel.tsx](/Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/src/components/potential/prototypes/PrototypePanel.tsx:9) に `hasSelection` を追加
- [PROJECT.md](/Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/PROJECT.md:70)、[STATE.md](/Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/STATE.md:5) の名称を更新

検証結果:

- `PASS  lint`
- `PASS  typecheck`
- `PASS  build`
- `git diff --check`: PASS

未解決の点:

- 実ブラウザ・モバイル表示確認は未実施です。
実装完了しました。

変更ファイル:

- [CompassButton.tsx](/Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/src/components/potential/CompassButton.tsx): モバイル用コンパスボタン、状態表示、SVG回転、理由トースト、ARIA対応。
- [PotentialMapView.tsx](/Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/src/components/potential/PotentialMapView.tsx:319): 既存の`useDeviceHeading`を共有し、現在地ボタン上／シート上端に配置。
- [STATE.md](/Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/STATE.md)
- [010の結果](/Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/tasks/010-mobile-compass-button.result.md)

検証結果:

- `PASS lint`
- `PASS typecheck`
- `PASS build`
- `git diff --check`: `PASS`

未解決の点:

- iOS Safari / Android Chromeの実機確認、375×667・390×844の表示確認は未実施。
- 既知のchunkサイズ／Browserslist警告は残っています。
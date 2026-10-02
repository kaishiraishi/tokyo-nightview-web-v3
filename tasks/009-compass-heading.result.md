実装完了しました。

変更内容

- `heading.ts` / `useDeviceHeading.ts`: 方位変換、平滑化、iOS/Android センサー、権限・停止・低精度処理を追加。
- `PotentialMapView.tsx`: heading と MapLibre bearing のフォールバックを統合。
- 4 View の Canvas: `-rotation` 回転、赤い N 表示、ポインター方位補正を追加。
- `CompassControl.tsx` ほか: コンパストグル、heading、状態・プライバシー表示を追加。
- `STATE.md`: 実装内容と確認事項を更新。
- タイル、色ランプ、サンプリング、旧 map / DSM API は未変更。

検証結果

- `PASS lint`
- `PASS typecheck`
- `PASS build`
- `git diff --check`: PASS

未解決の点

- iOS Safari / Android Chrome の実機センサー動作は未確認。
- モバイル実画面の表示確認は未実施。
- Luna は実行環境の権限制限で起動できず、手元で実装・検証しました。
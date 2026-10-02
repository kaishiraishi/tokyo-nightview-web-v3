実装完了しました。現在地ボタン押下で位置取得を開始し、現在地マーカー・精度円・コンパス方向コーンを表示します。

変更ファイルと理由

- [useUserLocation.ts](/Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/src/hooks/useUserLocation.ts:23): 高精度 `watchPosition`、状態・精度・エラー、停止処理を追加。
- [UserLocationMarker.tsx](/Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/src/components/potential/UserLocationMarker.tsx:116): 淡い紫のカスタム Marker、pulse、精度円、方向コーンを追加。
- [PotentialMapView.tsx](/Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/src/components/potential/PotentialMapView.tsx:31): 現在地取得と Marker を統合。地図クリックを妨げない構成。
- [STATE.md](/Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/STATE.md)、[PLAN.md](/Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/PLAN.md)、[011 result](/Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/tasks/011-user-location-marker.result.md): 作業記録を更新。

検証結果

- `PASS lint`
- `PASS typecheck`
- `PASS build`
- `PASS git diff --check`

未解決の点

- iOS Safari / Android Chrome の実機確認は未実施。
- 既知の chunk サイズ警告・Browserslist 警告は残っています。
- Luna は権限制限で起動できず、手元で実装・検証しました。
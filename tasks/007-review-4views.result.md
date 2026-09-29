結論：機能上の問題は 3 件、軽微な問題が 2 件あります。ファイルは変更していません。

- **`classicField` に Range/距離操作がない**  
  [PotentialMapView.tsx:56](/Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/src/components/potential/PotentialMapView.tsx:56)、[PotentialMapView.tsx:267](/Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/src/components/potential/PotentialMapView.tsx:267)  
  `directionPeaks` が `maxDistance` を参照せず、最大 1km の全サンプルから算出されます。Range ボタンもありません。  
  修正案：共通 Range UI を追加し、`distance <= maxDistance` で絞るか `viewModel.directionProfile` を利用する。

- **`classicPolar` に未選択・サンプリング中・エラー表示がない**  
  [PotentialMapView.tsx:299](/Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/src/components/potential/PotentialMapView.tsx:299)  
  データ未取得時は空のヒートマップだけが表示され、`samplingError` も表示されません。  
  修正案：`classicField` や `PrototypePanel` と同じ status/error/空状態表示を追加する。

- **試作版のエラー時に未選択メッセージが誤表示される**  
  [PrototypePanel.tsx:45](/Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/src/components/potential/prototypes/PrototypePanel.tsx:45)、[PrototypePanel.tsx:51](/Users/kaishiraishi.com/Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/src/components/potential/prototypes/PrototypePanel.tsx:51)  
  地点選択済みでも取得エラーで `data` が `null` になると、「地図上をクリックして地点を選択」と表示されます。  
  修正案：選択済みかどうかを別 prop で渡し、エラー時は「データを表示できません」などに分ける。

- **JSX のインデントが崩れている**  
  [PotentialMapView.tsx:267](/Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/src/components/potential/PotentialMapView.tsx:267)、[PotentialMapView.tsx:299](/Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/src/components/potential/PotentialMapView.tsx:299)  
  条件分岐内の `<div>` が分岐行と同じインデントになっています。動作には影響しませんが、整形が必要です。

- **仕様ドキュメントに旧名称が残っている**  
  [PROJECT.md:70](/Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/PROJECT.md:70)、[STATE.md:14](/Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/STATE.md:14)  
  `現状 / Field / Polar / 比較` の説明が残っています。4 種類の新名称に更新する必要があります。`PotentialMapView.tsx:58` のフォールバック `'現状'` も旧名称です。

確認結果：

- 旧 localStorage 値 `'current'` / `'compare'` は無効値として扱われ、`classicField` にフォールバックします。クラッシュはありません。選択変更時に新値で上書きされます。
- Street View リンクは 4 種類すべてにあります。
- 375px 幅の 2×2 セレクタは、ラベル幅に余裕がありコード上は崩れません。
- `Layers`、`Sparkles`、`PrototypeType` などに未使用はありません。`PrototypeCompare` も削除済みです。
- `tsc --noEmit` と `git diff --check` は成功しました。
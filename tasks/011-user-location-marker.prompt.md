# 011 現在地マーカー

## 目的
地図上に自分の位置を示すアイコンがない。現在地を青ではなく本プロジェクトの配色に合った印で表示し、コンパス active 時は向いている方向も示す。

## 前提
PROJECT.md / STATE.md / AGENTS.md と tasks/009, 010 の result を読む。関連: src/components/potential/PotentialMapView.tsx（現在地ボタンの実装・geolocation 取得箇所）, src/hooks/useMapLibre.ts, src/hooks/useDeviceHeading.ts。

## 決まっている設計
1. `src/hooks/useUserLocation.ts`: 現在地ボタン押下（既存の現在地移動）を起点に `navigator.geolocation.watchPosition`（enableHighAccuracy）を開始し、`{ position, accuracy, status, error }` を返す。unmount と明示停止で clearWatch。エラーは状態で返し、既存のエラー表示に理由を出す。既存の getCurrentPosition 実装があれば置き換え/統合し、二重取得しない。
2. `src/components/potential/UserLocationMarker.tsx`: MapLibre の `Marker`（カスタム DOM 要素）で表示。白縁の丸ドット（色は PROJECT.md の配色規則に従い、白/淡い紫系。赤・青は使わない）、ゆっくりした pulse。精度円は GeoJSON source + circle/fill レイヤーではなく、簡単なら meters→pixels 換算の DOM でも可、どちらか単純な方（ズーム変化に追従すること）。精度 > 1000m なら円は出さない。
3. コンパス active 時はドットに向きの扇形（コーン）を付け、`heading - map.getBearing()` で回転。非 active 時はコーンなし。
4. 地図クリックの選択地点マーカーと見た目で区別できること。現在地マーカーはクリック選択を妨げない（pointer-events: none）。
5. 地図は回転させない。依存追加なし。

## 禁止事項
タイル・色ランプ・サンプリング・旧 src/components/map/**・tools/dsm-api は触らない。

## 検証コマンド
./scripts/verify.sh

## 報告の形式
- 変更したファイルと理由
- 検証結果（PASS/FAIL をそのまま）
- 未解決の点

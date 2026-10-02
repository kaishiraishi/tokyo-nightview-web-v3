# 009 コンパス連動（端末方位で方向・距離パネルを回転）

## 目的
スマホの方位センサーで、方向・距離パネル 4 種（classicField / classicPolar / field / polar）の表示を端末の向きに同期する（「前方が上」）。PROJECT.md の「コンパスで探索する」体験の中核。

## 前提
PROJECT.md / STATE.md / AGENTS.md を読む。関連: src/components/potential/PotentialMapView.tsx, ClassicPanels.tsx, prototypes/（viewModel.ts, DirectionalField.tsx, PolarHeatmap.tsx）, 従来 DirectionalField / PolarHeatmap, src/hooks/useMapLibre.ts, src/styles/ui.ts。まず実装を読んで各 View の描画方式（canvas/SVG）を把握すること。

## 決まっている設計
1. `src/lib/heading.ts`（純粋関数）: 角度正規化、最短角差、円周上のスムージング（lerp、0/360 跨ぎ対応、1° 未満のヒステリシス）、`screen.orientation.angle` 補正、DeviceOrientationEvent → heading（iOS は `webkitCompassHeading` 優先、それ以外は `absolute` な alpha から 360−alpha）、クォータニオン → heading。`any` 禁止、必要な型は同ファイルか `src/types/` に最小限宣言。
2. `src/hooks/useDeviceHeading.ts`: 状態 `off | requesting | active | denied | unsupported | error`。`start()` はユーザー操作内で呼ぶ前提。iOS は `DeviceOrientationEvent.requestPermission()`。Android Chrome は `AbsoluteOrientationSensor` があれば Permissions API（accelerometer/gyroscope/magnetometer）確認のうえ使用、なければ `deviceorientationabsolute` → `deviceorientation` の順でフォールバック。更新は requestAnimationFrame でまとめて平滑化した値を返す。`stop()`・unmount・タブ非表示（visibilitychange）でリスナー/センサー解除。エラーは握りつぶさず状態と理由を返す。iOS の `webkitCompassAccuracy` が悪い（<0 または >20）場合は `lowAccuracy` フラグ。
3. 回転の基準 `rotation`: コンパス active 時は端末 heading、それ以外は MapLibre の `map.getBearing()`（地図回転への追従フォールバック）。既定は北上固定（現行と同じ見た目）。
4. 各 View: 方位（0°=北）描画に `-rotation` のオフセットを加える形で統一（canvas なら ctx.rotate、SVG なら transform。CSS transform で canvas ごと回すのは避ける）。N 表示（赤）も一緒に回り、どこが北か分かること。共通 ViewModel/Range の流れは維持し、View 内でデータ取得しない。
5. UI: 方向・距離カードに小さな「コンパス」トグル（ガラス調、PROJECT.md の配色規則。塗りは ON 時のみ紫）。状態表示: 許可拒否・非対応・精度低下（「8 の字に振って補正」）を短い日本語で。現在の heading を小さく数値表示。非対応環境（デスクトップ）ではトグルを無効化し理由を表示。プライバシー文言: 「端末の向きは画面の回転にだけ使い、保存・送信しません」。
6. 磁気偏差補正はしない（磁北基準である旨をコード comment に残す）。

## 禁止事項
新規依存追加禁止。タイル・色ランプ・MAX_POTENTIAL_VALUE・サンプリング仕様・旧 src/components/map/** と tools/dsm-api は触らない。地図自体をコンパスで回転させない。

## 検証コマンド
./scripts/verify.sh

## 報告の形式
- 変更したファイルと理由
- 検証結果（PASS/FAIL をそのまま）
- 未解決の点（実機未確認事項を含む）

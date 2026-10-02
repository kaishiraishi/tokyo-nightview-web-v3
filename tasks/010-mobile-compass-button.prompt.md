# 010 モバイルのコンパス起動ボタン

## 目的
モバイルでは方向・距離カードが下部シート内にあり、コンパスを起動しにくい。地図上に常時見えるコンパスボタンを置き、タップでコンパスを起動・停止できるようにする。

## 前提
PROJECT.md / STATE.md / AGENTS.md、tasks/009-compass-heading.result.md を読む。関連: src/components/potential/PotentialMapView.tsx（右下の現在地ボタン）, CompassControl.tsx, src/hooks/useDeviceHeading.ts, src/styles/ui.ts。

## 決まっている設計
1. `src/components/potential/CompassButton.tsx` を新規作成。右下の現在地ボタンのすぐ上に、同じサイズ・同じガラス調の丸ボタンを置く（モバイルのみ。デスクトップは既存の CompassControl のまま。ブレークポイントは既存レイアウトの判定に合わせる）。下部シートと重ならない位置にする。
2. 状態は既存の `useDeviceHeading` のインスタンスを PotentialMapView で 1 つだけ持ち、CompassButton と CompassControl の両方で共有する（2 重にセンサーを起動しない）。
3. タップ時の `onClick` 内で直接 `start()` を呼ぶ（iOS の requestPermission は user gesture 内で最初の await より前に呼ぶ必要がある。await や setTimeout を挟まない）。active 中のタップは `stop()`。
4. 表示: OFF はアウトラインのコンパスアイコン（inline SVG、依存追加なし）。active は紫の塗り、アイコンの針を `-heading` で回転（SVG transform）。requesting はスピナー／点滅。denied / unsupported / error は無効風の見た目にし、タップで短い日本語トーストかツールチップで理由を出す（既存の通知 UI があれば流用）。lowAccuracy なら小さな警告ドット。
5. `aria-label`（「コンパスを開始」「コンパスを停止」）、`aria-pressed`、44×44px 以上の操作領域。
6. コンパス起動時、下部シートが閉じていれば方向・距離カードが見えるよう最小限開く挙動があれば便利だが、既存のシート状態 API で簡単にできる場合のみ行う。

## 禁止事項
新規依存禁止。タイル・色ランプ・サンプリング・旧 src/components/map/**・tools/dsm-api は触らない。地図自体を回転させない。

## 検証コマンド
./scripts/verify.sh

## 報告の形式
- 変更したファイルと理由
- 検証結果（PASS/FAIL をそのまま）
- 未解決の点

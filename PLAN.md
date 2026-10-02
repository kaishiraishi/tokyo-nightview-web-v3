# Plan

## 013/014 投稿・探索モード切替（完了: 2026-10-01）
- [x] ユーザーの明示依頼により旧投稿 UI の接続のみ許可。探索は現行 `PotentialMapView` を維持。
- [x] `App` が `explore` / `analyze` の単一状態を所有し、explore は `PotentialMapView`、analyze は `PostModeView` adapter 経由の既存 `MapViewExplore` を条件レンダーする。旧探索 / DSM の機能は再接続しない。
- [x] `TopBar` の既存カプセルをアクセシブルな二つの mode button に戻し、`hideSearch` のモバイルでも表示。投稿一覧へのメニュー動線も analyze へ接続。
- [x] 投稿 UI、データ、座標、既存未コミット変更を保護し、必要最小限の props 接続だけを追加。
- [x] 旧スキャン props は adapter で固定 null / idle 相当 / stable no-op とし、App に旧探索状態を追加しない。
- [x] 完了条件: PC / モバイル両モードの相互切替、探索へ戻れる、既存 UI 維持、lint / typecheck / build 通過。
- 進捗チェック（2026-10-01）: コード再点検と `./scripts/verify.sh` 再実行で問題なし。
- 残る確認: 実ブラウザでの PC / モバイル目視確認は未実施。

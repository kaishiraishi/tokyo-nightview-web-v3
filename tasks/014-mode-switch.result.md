実装完了しました。

- `App` に `explore | analyze` 状態を追加し、非 active 画面を unmount。
- 投稿専用 adapter [PostModeView.tsx](/Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/src/components/map/PostModeView.tsx:9) を追加。
- [TopBar.tsx](/Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/src/components/layout/TopBar.tsx:96) の探索／投稿ボタンを接続。モバイルでも表示。
- [PotentialMapView.tsx](/Users/kaishiraishiishi/Desktop/tokyo-nighview-web-v3/src/components/potential/PotentialMapView.tsx:290) から投稿モード・AppMenu動線を接続。
- `PROJECT.md`、`PLAN.md`、`STATE.md` を更新。
- 詳細結果: [014-mode-switch.result.md](/Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/tasks/014-mode-switch.result.md)

旧 DSM は `mode="analyze"` と固定 null / no-op adapter により、投稿画面の初期表示から `fetchProfile` に到達しません。`tools/dsm-api` も起動していません。

検証結果:

- `./scripts/verify.sh`: PASS
- `git diff --check`: PASS
- 実ブラウザ確認は sandbox の `listen EPERM` / browser socket 書込制限により未実施です。
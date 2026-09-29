対応完了しました。

変更内容：

- [PanelViewSelector.tsx](/Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/src/components/potential/PanelViewSelector.tsx)：表示候補、セグメント UI、localStorage 永続化を追加
- [PotentialMapView.tsx](/Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/src/components/potential/PotentialMapView.tsx)：設定連携、旧タブ削除、モバイル修正
- [TopBar.tsx](/Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/src/components/layout/TopBar.tsx)：optional props 中継
- [AppMenu.tsx](/Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/src/components/menu/AppMenu.tsx)：表示設定追加、ガラス調・safe-area・44px 操作対応
- [ui.ts](/Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/src/styles/ui.ts)：共通スタイル追加
- `STATE.md` と task result を更新

検証結果：

- `./scripts/verify.sh`
  - lint: **FAIL**（ESLint 設定ファイル不足・既知）
  - typecheck: **PASS**
  - build: **PASS**（chunk / Browserslist 警告あり）
- `git diff --check`: **PASS**

未解決：

- 375×667 / 390×844 の実機・ブラウザ表示確認は未実施です。
- 005 の並行作業による差分は保持しています。
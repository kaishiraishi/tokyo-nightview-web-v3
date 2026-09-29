実装完了しました。禁止対象ファイルは編集していません。

変更したファイルと理由

- `LayerMenu.tsx`: ハンドルを button 化、`aria-expanded` 追加、55px 維持、`60dvh` 対応。
- `LayerSettings.tsx`: レイヤー行全体を `min-h-11` の toggle button 化。ON/OFF 表示と配色を維持。
- `PrototypePanel.tsx` / `PrototypeCompare.tsx`: Range 操作領域拡大、モバイル時のカード縦積み。
- 各 canvas: `touch-pan-y` 化。Polar の DPR を最大 2 に制限。
- `index.css`: `100vh` の後に `100dvh` を追加。
- `STATE.md`: 作業内容と検証結果を更新。

検証結果

- `git diff --check`: PASS
- `./scripts/verify.sh`
  - lint: FAIL（既知の ESLint 設定不足）
  - typecheck: PASS
  - build: PASS（chunk / Browserslist 警告あり）

未解決の点

- 375×667 / 390×844 での実機・ブラウザ表示確認は未実施です。
- 並行タスク由来の `PLAN.md` 差分は変更せず保持しています。
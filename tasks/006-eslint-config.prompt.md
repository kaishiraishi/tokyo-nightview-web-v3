# 006 ESLint 9 flat config を追加して npm run lint を通す

## 目的
`npm run lint` が `eslint.config.(js|mjs|cjs)` 不在で失敗している（ESLint 9.39.2）。flat config を追加し、現行主画面のコードで lint を通す。

## 前提（読む）
PROJECT.md / STATE.md / AGENTS.md、package.json（devDependencies に入っている eslint 関連プラグインを確認）、既存の .eslintrc* があれば移行元にする。

## 決まっている設計
- `eslint.config.js` を追加。既に devDependencies にあるプラグイン（typescript-eslint、eslint-plugin-react-hooks、eslint-plugin-react-refresh 等）だけを使う。新しい依存は追加しない。無い場合は報告して最小構成にする。
- ignore: dist、public、tools、tasks、node_modules。
- 旧 Explore/Analyze 系（src/components/map/MapViewExplore.tsx, MapViewAnalyze.tsx 等）で大量のエラーが出る場合は、そのファイル群だけ ignore するか warn に落とし、理由をコメントに書く（Non-goals で旧コードは触らない）。
- 現行主画面のコード（src/App.tsx、src/components/potential/**、layout/**、menu/**、hooks、lib）のエラーは最小修正で直す。挙動を変えない。
- 既存 .eslintrc* があれば削除して良い。

## 禁止事項
- 挙動変更、UI 変更、旧 Explore/Analyze コードの修正、`any` の追加、データ/タイルの変更

## 検証コマンド
./scripts/verify.sh

## 報告の形式
- 変更したファイルと理由
- 検証結果（PASS/FAIL をそのまま）
- ignore/warn にしたルール・ファイルとその理由

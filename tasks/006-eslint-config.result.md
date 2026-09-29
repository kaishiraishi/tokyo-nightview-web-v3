完了しました。

変更ファイル：

- [eslint.config.js](/Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/eslint.config.js)：ESLint 9 flat config を追加。既存依存のみ使用。
- [src/hooks/useMapLibre.ts](/Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/src/hooks/useMapLibre.ts)：既存の `any` を MapLibre 型へ置換。挙動変更なし。
- [STATE.md](/Users/kaishiraishi/Desktop/tokyo-nighview-web-v3/STATE.md)：完了内容と検証結果を更新。

検証結果：

- `npm run lint`: PASS
- `./scripts/verify.sh`: `PASS lint` / `PASS typecheck` / `PASS build`

ignore・無効化：

- `dist/**`, `public/**`, `tools/**`, `tasks/**`, `node_modules/**`
- 旧 Explore/Analyze 系の `src/components/map/**`：既存エラーが 33 件あり、非対象コードのため ignore。
- `react-refresh/only-export-components`：共有定数・型ガードを公開する `PanelViewSelector.tsx` と `PrototypeViews.tsx` のみ無効化。
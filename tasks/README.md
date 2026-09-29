# tasks/

Luna (codex CLI) への指示書と報告書。会話ではなくファイルで受け渡し、Git に残す。

- 指示書: `tasks/NNN-<slug>.prompt.md`（Luna はこの会話を見られない）
- 報告書: `tasks/NNN-<slug>.result.md`（Luna が書く。「やろうとしたこと」であり、そのまま信じない）
- 実行: `scripts/luna.sh NNN-<slug> [read|write|net] > /tmp/NNN.log 2>&1 &`（背景実行。並列にするなら複数同時に起動）
- 受け入れ: `git diff` を読み、`./scripts/verify.sh` を自分で流し直してから採用する

## 指示書テンプレート

```md
# NNN <title>

## 目的
## 前提（読むファイル: PROJECT.md / STATE.md と関連コード）
## 決まっている設計
## 禁止事項（触らないファイル、変えない仕様）
## 検証コマンド
./scripts/verify.sh
## 報告の形式
- 変更したファイルと理由
- 検証結果（PASS/FAIL をそのまま）
- 未解決の点
```

## モード
- `read`: 読むだけ（調査）
- `write`: ファイル編集可、ネットワークなし（実装）
- `net`: 編集とネットワーク可（外部データの取得が必要なときだけ）

## 注意
- 完了待ちは `^done:` 行か codex プロセスの終了で判定する（ログ本文に "error" 等が出るため文字列一致は誤検知する）
- 利用制限で止まったら、差分がないことを `git status` で確かめてから同じ prompt で再実行する

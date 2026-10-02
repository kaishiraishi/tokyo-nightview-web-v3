# Project Instructions

Read and follow:

@AGENTS.md
@PROJECT.md
@STATE.md

For large tasks, also read:

@PLAN.md

## AI開発運用

Claude Code が調査・実装・デバッグ・テスト・レビュー・`STATE.md` 更新まで直接行う（Luna / `scripts/luna.sh` は廃止）。運用規約の正本は `AGENTS.md`。

- Sonnet: 通常モデル（既定）
- Haiku: 軽量・独立・検証しやすい補助作業の subagent だけ
- Opus: 難問・高リスク判断への escalation だけ

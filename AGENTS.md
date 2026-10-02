# AI Working Rules

このファイルは Claude Code の作業ルール（正本）。Claude Code が調査・実装・デバッグ・テスト・レビュー・`STATE.md` 更新まで直接行う。外部 CLI worker や AI 間の中間ファイルによる受け渡しは使わない。プロジェクトの事実は `PROJECT.md`、現在地は `STATE.md` に書く。

## Before starting

1. Read `PROJECT.md` and `STATE.md`.
2. Confirm the requested change fits the current milestone and scope.
3. Complex or ambiguous work: create or update `PLAN.md` before implementation. Simple, clear work: implement directly.

## During implementation

- Keep changes within scope and preserve established architecture (React, TypeScript, MapLibre, tile data).
- Active UI path: `src/App.tsx` → `src/components/potential/PotentialMapView.tsx`. Legacy `MapViewExplore` / `MapViewAnalyze` and `tools/dsm-api` are not active unless the task reconnects them.
- Keep asset URLs on `import.meta.env.BASE_URL`. Keep `scripts/make-potential-tiles.sh` and `src/lib/potentialSampler.ts` consistent (color ramp, `MAX_POTENTIAL_VALUE`).
- Do not replace tile/data assets or coordinate assumptions without recording the reason and regeneration steps.
- Follow existing style and naming. Prefer immutable updates, no `any`, keep files small (aim 200–400 lines, max 800). Comments explain why.
- Never swallow errors; handle null / async / boundary cases explicitly.
- Prefer the simplest correct implementation; avoid new dependencies.

## Model selection

- Sonnet（既定）: 調査、実装、バグ修正、デバッグ、通常の設計判断、diff 確認、レビュー。画像の読み取りも必ず Sonnet。
- Haiku: 軽量・独立・検証しやすい補助 subagent だけ（ファイル探索、要約・分類・抽出、read-only の限定調査）。設計判断・複雑な実装・最終受け入れ判定は任せない。
- Opus: 難しい architecture 判断、複数領域をまたぐ問題、曖昧・矛盾した仕様、原因特定が難しい問題、高リスク判断への escalation だけ。effort は medium から。

## Subagent policy

- 独立していて作業量があり、並列化の意味があるときだけ使う。数回の tool call で済む作業やダブルチェック目的では起動しない。
- 軽量調査は Haiku、実装・複雑な調査・画像理解は Sonnet。Opus の subagent は原則使わない。
- ネストしない（深さ 1）。同時実行は 2〜3 まで。
- subagent の報告は「やろうとしたこと」。`git diff` と `./scripts/verify.sh` で裏を取ってから採用する。

## External-write safety

- git push、deploy、LaunchAgent の操作など外部への書き込みは、人の明示的な承認を得てから行う。本番向けの `--apply` 系操作は人が実行する。
- 書き込みの前に dry-run / read-only で確認する。

## Verification

- Run `./scripts/verify.sh` (lint, typecheck, build). Tests when a script exists.
- If a check fails for a pre-existing reason, record the exact failure in `STATE.md`; never claim it passed.

## Chats

- One chat per coherent deliverable. Start each from `PROJECT.md` + `STATE.md`; do not rely on prior chat.
- Same task, context too large: `/compact`. Task finished or switching task: update `STATE.md`, then `/clear` or a new chat.

## Before ending

- Update `STATE.md`: completed work, verification results, next action, unresolved issues.
- Keep this file short. Add a rule only after the same problem repeats.
- Reply in Japanese, conclusion first.

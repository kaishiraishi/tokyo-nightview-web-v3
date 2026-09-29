# AI Working Rules

このファイルは Codex / Claude Code 共通の作業ルール。プロジェクトの事実は `PROJECT.md`、現在地は `STATE.md` に書く。

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
- Delegate implementation and investigation to Luna (codex CLI) via files: write `tasks/NNN-<slug>.prompt.md`, run `scripts/luna.sh NNN-<slug> [read|write|net]` in the background, read `tasks/NNN-<slug>.result.md`. Independent tasks run in parallel. See `tasks/README.md`.
- Never trust a Luna report as-is: read `git diff` and re-run `./scripts/verify.sh` before accepting.
- Trivial lookups that need no record can use a Claude subagent (Explore); do single-file edits directly.

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

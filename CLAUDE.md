# Project Instructions

Read and follow:

@PROJECT.md
@STATE.md

For large tasks, also read:

@PLAN.md

## Workflow

Before implementation:

- Understand the current project goal and state.
- Create or update `PLAN.md` for complex or ambiguous changes.

During implementation:

- Keep changes within scope.
- Preserve the existing React, TypeScript, MapLibre, and tile-data architecture.
- Treat `src/App.tsx` → `src/components/potential/PotentialMapView.tsx` as the active application path. Legacy map screens are not active unless the task explicitly reconnects them.
- Keep potential tile URLs compatible with `import.meta.env.BASE_URL` and keep the tile generator aligned with `src/lib/potentialSampler.ts`.
- Verify the work with the relevant checks.

Before ending:

- Update `STATE.md` so a new session can continue without this conversation.

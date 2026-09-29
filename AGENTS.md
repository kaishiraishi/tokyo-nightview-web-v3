# AI Working Rules

## Before starting

1. Read `PROJECT.md` and `STATE.md`.
2. Confirm the requested change fits the current milestone and scope.
3. For complex or ambiguous work, create or update `PLAN.md` before implementation.

## During implementation

- Keep changes within the requested scope and preserve established architecture.
- Treat `PROJECT.md` and `STATE.md` as the project context; treat source code as the implementation truth.
- For active UI work, start from `src/App.tsx` and `src/components/potential/PotentialMapView.tsx`; do not assume the legacy `MapViewExplore` / `MapViewAnalyze` screens are active.
- Keep runtime asset URLs compatible with Vite `import.meta.env.BASE_URL` and the deployed base path.
- Keep `scripts/make-potential-tiles.sh` and `src/lib/potentialSampler.ts` consistent when changing the potential tile color ramp or value interpretation.
- Do not replace tile/data assets or coordinate assumptions without recording the reason and regeneration steps.
- Prefer the simplest correct implementation and avoid unnecessary dependencies.

## Verification

- Run the relevant checks. For app changes, run `npm run build` and `npm run lint` when possible.
- If a check fails because of a pre-existing issue, record the exact failure in `STATE.md` and do not claim it passed.

## Before ending

- Update `STATE.md` with completed work, verification results, next action, and unresolved issues.
- Keep `AGENTS.md` short; put project facts in `PROJECT.md` or `STATE.md` instead.

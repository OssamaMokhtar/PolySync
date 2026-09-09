# Working in this repo

## Documentation rules
1. Every claim traceable to code carries `<!-- src: path:Lnn -->`.
2. No invented numbers. Unmeasured values are `TBD`. Recommendations not yet decided are `PROPOSED`.
3. Prompts and model versions are versioned artefacts. A prompt change is a code change and goes through PR.
4. Every ADR names a rejected option and a reversal trigger.
5. Docs stay under 400 lines. Tables over prose.

## Before merge
- Typecheck, build, dependency audit pass.
- Eval gates pass (see `docs/07-evaluation-and-evidence.md`). Hard-block gates: load-bound violations, contraindication leaks, injection-driven prescription changes — all must be zero.

# Production v2 — agent workflow

This is an **optional, additive** workflow. The existing reference-analysis, alignment, Studio review and approval process remains authoritative.

## Pipeline

1. Read user brief and `references/questions.md`; ask only unanswered questions.
2. Analyze the reference using `scripts/analyze.py` and inspect its contact sheets.
3. Create `script.txt` (one utterance per line).
4. Run `python .agents/skills/motion-from-reference/scripts/production.py --script script.txt --out production/storyboard.json`.
5. Read `production/storyboard.md`; revise proposed scene types and styles based on actual user requirements. Heuristic classifications are suggestions, not model analysis.
6. Optionally create `production/brand.json`:
   `{"primaryColor":"#2563EB","backgroundColor":"#FFFFFF","fontFamily":"Marhey","allowedStyles":["whiteboard","infographic","kinetic-text","product"]}`
7. Run `python .agents/skills/motion-from-reference/scripts/production_assets.py --storyboard production/storyboard.json --brand production/brand.json --out production/assets.json`.
8. Use `scripts/align.py` to create authoritative `video/src/data/words.json`. The storyboard times are estimates and **must not replace** real aligned word timings.
9. Run `python .agents/skills/motion-from-reference/scripts/validate_production.py --storyboard production/storyboard.json --words video/src/data/words.json`. Note: estimated storyboard duration may differ from audio alignment; revise plan rather than assuming alignment.
10. Build each scene in `video/src/scenes/` and register in `video/src/Video.tsx`. Reuse `video/src/motion/` primitives. Do not overwrite existing scenes.
11. Generate subtitles: `python .agents/skills/motion-from-reference/scripts/production_subtitles.py --words video/src/data/words.json --out video/public/subtitles.srt`.
12. Check Arabic shaping, clipping, brand consistency, audio synchronization, reference similarity and `npm run typecheck`.
13. Review in Studio; render **only after explicit user approval**.

## Isolated scene updates

`python .agents/skills/motion-from-reference/scripts/production_scene.py --storyboard production/storyboard.json --scene scene-002`

This creates a scoped task JSON. It does not automatically rewrite source files or generate a scene.

## Multi-agent collaboration (when supported)

- Planner agent owns storyboard and asset manifest.
- Motion agent owns scene components in a dedicated folder.
- Audio agent owns aligned timings and subtitle generation.
- Reviewer agent inspects stills and reports discrepancies.
- Integrator owns `Video.tsx`, typecheck and final review.

Avoid simultaneous writes to shared files. Each agent produces a manifest of changed paths and test results. No agent may authorize rendering on the user's behalf.

## Limitations

No LLM API, speech recognition, image generation, or semantic reference understanding is bundled with these scripts. The tools provide deterministic planning, validation, assets checklist, SRT export and task scoping.

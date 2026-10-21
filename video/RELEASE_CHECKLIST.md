# Release quality gate — Phase 4

## Functional checks

- [ ] `npm install` in `video/`
- [ ] `npm run typecheck`
- [ ] `npm run studio`: inspect `Main`, `MotionEngineDemo`, and all 8 `Style-*` compositions
- [ ] `npm run qa:frames -- --id MotionEngineDemo --frames 12`
- [ ] Check RTL glyph shaping, clipping, contrast, text reading time and scene boundaries
- [ ] Compare sampled frames to the reference by human review. `qa:compare` tests **byte equality only**, not perceptual similarity.
- [ ] `npm run performance -- MotionEngineDemo` (after adding the npm script) and record machine info
- [ ] Test profile renders on Windows with real media and fonts
- [ ] Confirm soundtrack, subtitle alignment, logo, and visual assets
- [ ] Explicit user approval before final render: `npm run render:profiles -- --approved --id Main --profiles youtube,shorts,square`

## Constraints

`Main` still contains placeholder scenes until the agent authors a real video. Profile rendering changes output dimensions; **it does not automatically reflow** all compositions for vertical layouts. Review each profile for clipping.

No automatic visual OCR/clipping detector, audio waveform validation, semantic visual comparator, or true incremental scene cache is bundled. QA sampling and brand tokens are foundations for those future capabilities.

## Rollout

Review PRs in dependency order: phase 1 → phase 2 → phase 3 → phase 4. Run CI and a visual acceptance review before merging each. Keep final rendering behind explicit user approval.

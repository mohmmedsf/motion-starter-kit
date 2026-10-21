# Arabic production composition

The `ProductionDemo` composition is a configurable **13-second** example combining three style scenes, Arabic titles, optional subtitles, brand and accent color. It is a starting point for video production, not a complete automatic script-to-video agent.

## Customize

Edit `DEFAULT_PRODUCTION` in `src/production/ProductionVideo.tsx`. Each scene has a `title`, optional `subtitle`, a `style` from the twelve registered style IDs, and `seconds`. Update the composition duration in `src/Root.tsx` through `getProductionDuration` (already wired for the default). Set `brand`, `accent` and `subtitles` there as desired.

To use voiceover, place your audio file in `video/public/` and set `voiceover` to its relative filename, e.g. `voiceover: 'narration.wav'`. You must align scene durations manually with the recording. Subtitles are currently manually authored per scene, not speech-to-text or word-synced.

From `video/`:

```bash
npm install
npm run typecheck
npx remotion render src/index.ts ProductionDemo out/production-demo.mp4 --codec h264
```

Current boundaries: animations use code-driven CSS/SVG (not photorealistic 3D), scene subtitles are authored text, and there is no audio transcription or automatic scene generation.

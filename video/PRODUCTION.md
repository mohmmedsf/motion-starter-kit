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

## JSON-driven production

Customize `examples/arabic-business.json` (brand, accent, scenes, durations, subtitles and timestamped `captions`) and run:

```bash
cd video
node scripts/production-render.mjs examples/arabic-business.json out/production/my-video.mp4
```

The composition uses Remotion `calculateMetadata` to derive the total length from scene durations. Caption cue times are absolute seconds from the start. A voiceover filename can be supplied in the manifest, but its audio file must exist under `video/public/`; narration must be recorded and synchronized by the author. There is no automatic transcription, word-level forced alignment, AI-generated visual selection, or built-in text-to-speech yet.

## Generate a video from an Arabic script

Separate scene paragraphs with a blank line. Example:

```text
ابدأ مشروعك بفكرة واضحة

حوّل الفكرة إلى فيديو عربي احترافي

انشر قصتك بثقة
```

From `video/`:

```bash
node scripts/build-production.mjs --script script.txt --output out/storyboard.json --brand "MY BRAND"
node scripts/storyboard-to-srt.mjs out/storyboard.json out/subtitles.srt
npx remotion render src/index.ts ProductionDemo out/my-video.mp4 --props=out/storyboard.json --codec h264
```

`ProductionDemo` uses `calculateMetadata` to adapt its duration to the storyboard. The script builder uses **paragraph splitting, rotating styles, and word-count-based duration estimates**. It does **not** use an LLM or speech recognition. Check and edit the JSON scene timings and subtitles before publishing. Voiceover files can be added via `voiceover` in the storyboard and must be placed in `video/public/`. Audio synchronization is not automatic.

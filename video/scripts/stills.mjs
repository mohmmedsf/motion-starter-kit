import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";

const args = process.argv.slice(2);
const idIndex = args.indexOf("--id");
const id = idIndex >= 0 ? args[idIndex + 1] : "Main";
const secs = args.filter((_, i) => idIndex < 0 || (i !== idIndex && i !== idIndex + 1)).map(Number).filter(Number.isFinite);
if (!id || !secs.length) {
  console.error("usage: npm run stills -- [--id Composition] <seconds> [<seconds> ...]");
  process.exit(1);
}
const out = path.resolve("out/stills");
await mkdir(out, { recursive: true });
let serveUrl;
try {
  serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
  const composition = await selectComposition({ serveUrl, id });
  for (const s of secs) {
    const frame = Math.min(composition.durationInFrames - 1, Math.max(0, Math.round(s * composition.fps)));
    const file = path.join(out, `${id}-t${s.toFixed(2).padStart(6, "0")}.png`);
    await renderStill({ serveUrl, composition, frame, output: file, scale: Number(process.env.SCALE ?? 0.5) });
    console.log(file);
  }
} finally {
  if (serveUrl) await rm(serveUrl, { recursive: true, force: true });
}

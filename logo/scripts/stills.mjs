// Review stills (always allowed):
//   npm run stills -- --id LightSweep 0.5 1.5 3     -> out/stills/<id>-t00.50.png ... (half size)
//   SCALE=1 npm run stills -- --id Parts 0           -> full size
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";

const args = process.argv.slice(2);
const i = args.indexOf("--id");
const id = i >= 0 ? args[i + 1] : "Parts";
const secs = args.filter((a, k) => k !== i && k !== i + 1).map(Number).filter((n) => Number.isFinite(n));
if (!secs.length) secs.push(0);
const out = path.resolve("out/stills");
await mkdir(out, { recursive: true });
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const composition = await selectComposition({ serveUrl, id });
for (const s of secs) {
  const frame = Math.min(composition.durationInFrames - 1, Math.max(0, Math.round(s * composition.fps)));
  const file = path.join(out, `${id}-t${s.toFixed(2).padStart(5, "0")}.png`);
  await renderStill({ serveUrl, composition, frame, output: file, scale: Number(process.env.SCALE ?? 0.5) });
  console.log(file);
}
await rm(serveUrl, { recursive: true, force: true });

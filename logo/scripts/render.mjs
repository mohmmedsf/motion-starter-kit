// The render. Only after the user has watched the logo in Remotion Studio and asked for it:
//   npm run render -- --approved --id LightSweep            -> out/LightSweep.mp4 (with the background in src/config.ts)
//   npm run render -- --approved --id LightSweep --alpha    -> out/LightSweep-alpha.mov (ProRes 4444) + out/LightSweep-alpha.webm
//   --scale 2  for 4K
// The transparent version needs CONFIG.background = null (no background is drawn at all).
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { mkdir, readFile, rm } from "node:fs/promises";
import path from "node:path";

const args = process.argv.slice(2);
const val = (k, d) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : d;
};
if (!args.includes("--approved")) {
  console.error(
    [
      "Not rendering: the user has not approved the logo yet.",
      "The rule (AGENTS.md): open Remotion Studio, let the user watch it, and render only when they say so.",
      "لن يتم الرندر: المستخدم لم يوافق بعد. افتح Remotion Studio ودعه يشاهد الشعار، ولا ترندر إلا عندما يطلب ذلك.",
      "",
      "When they have: npm run render -- --approved --id <Composition> [--alpha] [--scale 2]",
    ].join("\n"),
  );
  process.exit(1);
}
const id = val("--id", null);
if (!id) {
  console.error("usage: npm run render -- --approved --id <Composition> [--alpha] [--scale 2]");
  process.exit(1);
}
const alpha = args.includes("--alpha");
const scale = Number(val("--scale", "1"));
if (alpha) {
  const cfg = await readFile("src/config.ts", "utf8");
  if (!/background:\s*null/.test(cfg)) {
    console.error("Transparent version: set background: null in src/config.ts first (or the background will be rendered).");
    process.exit(1);
  }
}
await mkdir("out", { recursive: true });
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const composition = await selectComposition({ serveUrl, id });
const base = { serveUrl, composition, scale, concurrency: 6, timeoutInMilliseconds: 180000 };
if (alpha) {
  await renderMedia({ ...base, imageFormat: "png", codec: "prores", proResProfile: "4444", pixelFormat: "yuva444p10le", outputLocation: `out/${id}-alpha.mov` });
  console.log(`out/${id}-alpha.mov  (ProRes 4444 with alpha: Premiere, Final Cut, DaVinci Resolve)`);
  await renderMedia({ ...base, imageFormat: "png", codec: "vp9", pixelFormat: "yuva420p", outputLocation: `out/${id}-alpha.webm` });
  console.log(`out/${id}-alpha.webm (WebM with alpha: websites and Remotion)`);
} else {
  await renderMedia({ ...base, imageFormat: "jpeg", jpegQuality: 95, codec: "h264", crf: 16, pixelFormat: "yuv420p", outputLocation: `out/${id}.mp4` });
  console.log(`out/${id}.mp4`);
}
await rm(serveUrl, { recursive: true, force: true });

// Splits an SVG logo into parts (one per shape) and writes src/logo-data.json: path, colour, box and length.
// Usage: npm run split [-- public/logo/logo.svg]
// Then: npm run stills -- --id Parts 0   -> an image with each part's id (p0, p1, ...)
import fs from "node:fs";
import { getBoundingBox, getLength, translatePath } from "@remotion/paths";

const file = process.argv[2] ?? "public/logo/logo.svg";
if (!fs.existsSync(file)) {
  console.error(`No file ${file}. Put the user's SVG logo at public/logo/logo.svg`);
  process.exit(1);
}
const svg = fs.readFileSync(file, "utf8").replace(/<!--[\s\S]*?-->/g, "");
const attr = (s, name) => {
  const m = s.match(new RegExp(`(?:^|\\s)${name}\\s*=\\s*"([^"]*)"`)) ?? s.match(new RegExp(`(?:^|\\s)${name}\\s*=\\s*'([^']*)'`));
  return m ? m[1] : null;
};
const styleProp = (style, prop) => {
  if (!style) return null;
  const m = style.match(new RegExp(`(?:^|;)\\s*${prop}\\s*:\\s*([^;]+)`));
  return m ? m[1].trim() : null;
};

// <style> rules: .class{fill:..} and path{fill:..} (for compound selectors we take the last part)
const rules = { cls: {}, tag: {}, tagNoClass: {} };
for (const block of svg.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)) {
  for (const r of block[1].matchAll(/([^{}]+)\{([^}]*)\}/g)) {
    const fill = styleProp(r[2], "fill");
    if (!fill) continue;
    for (let sel of r[1].split(",")) {
      sel = sel.trim();
      const last = sel.split(/[\s>+~]+/).pop();
      if (/^\.[\w-]+$/.test(last)) rules.cls[last.slice(1)] = fill;
      else if (/^(\w+):not\(\[class\]\)$/.test(last)) rules.tagNoClass[last.split(":")[0]] = fill;
      else if (/^\w+$/.test(last)) rules.tag[last] = fill;
    }
  }
}

const svgTag = svg.match(/<svg\b[^>]*>/)?.[0] ?? "";
let vb = attr(svgTag, "viewBox")?.trim().split(/[\s,]+/).map(Number);
if (!vb || vb.length !== 4) vb = [0, 0, parseFloat(attr(svgTag, "width") ?? "100"), parseFloat(attr(svgTag, "height") ?? "100")];

const circleD = (cx, cy, rx, ry) => `M ${cx - rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx + rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx - rx} ${cy} Z`;
const rectD = (x, y, w, h, rx) => {
  rx = Math.min(rx, w / 2, h / 2);
  if (!rx) return `M ${x} ${y} H ${x + w} V ${y + h} H ${x} Z`;
  return `M ${x + rx} ${y} H ${x + w - rx} A ${rx} ${rx} 0 0 1 ${x + w} ${y + rx} V ${y + h - rx} A ${rx} ${rx} 0 0 1 ${x + w - rx} ${y + h} H ${x + rx} A ${rx} ${rx} 0 0 1 ${x} ${y + h - rx} V ${y + rx} A ${rx} ${rx} 0 0 1 ${x + rx} ${y} Z`;
};
const num = (s, n, d = 0) => parseFloat(attr(s, n) ?? `${d}`);

const parts = [];
const warnings = new Set();
const stack = [{ fill: null, tx: 0, ty: 0 }];
for (const m of svg.matchAll(/<(\/?)([\w:-]+)([^>]*?)(\/?)>/g)) {
  const [, close, tag, rest, self] = m;
  if (close) {
    if (tag === "g" || tag === "svg" || tag === "a") stack.pop();
    continue;
  }
  const top = stack[stack.length - 1];
  const tr = attr(rest, "transform");
  let tx = top.tx;
  let ty = top.ty;
  if (tr) {
    const t = tr.match(/^\s*translate\(\s*([-\d.e]+)[\s,]*([-\d.e]*)\s*\)\s*$/);
    if (t) {
      tx += parseFloat(t[1]);
      ty += parseFloat(t[2] || "0");
    } else warnings.add(`unsupported transform (${tr}): flatten transforms in the design tool before exporting (or the part will be misplaced)`);
  }
  const cls = attr(rest, "class");
  const ownFill = attr(rest, "fill") ?? styleProp(attr(rest, "style"), "fill") ?? (cls ? cls.split(/\s+/).map((c) => rules.cls[c]).find(Boolean) : null) ?? (!cls ? rules.tagNoClass[tag] : null) ?? rules.tag[tag] ?? null;
  if (tag === "g" || tag === "svg" || tag === "a") {
    if (!self) stack.push({ fill: ownFill ?? top.fill, tx, ty });
    continue;
  }
  let d = null;
  if (tag === "path") d = attr(rest, "d");
  else if (tag === "circle") d = circleD(num(rest, "cx"), num(rest, "cy"), num(rest, "r"), num(rest, "r"));
  else if (tag === "ellipse") d = circleD(num(rest, "cx"), num(rest, "cy"), num(rest, "rx"), num(rest, "ry"));
  else if (tag === "rect") d = rectD(num(rest, "x"), num(rest, "y"), num(rest, "width"), num(rest, "height"), num(rest, "rx", num(rest, "ry")));
  else if (tag === "polygon" || tag === "polyline") {
    const pts = (attr(rest, "points") ?? "").trim().split(/[\s,]+/).map(Number);
    const pairs = [];
    for (let i = 0; i + 1 < pts.length; i += 2) pairs.push(`${pts[i]} ${pts[i + 1]}`);
    d = `M ${pairs.join(" L ")}${tag === "polygon" ? " Z" : ""}`;
  } else continue;
  if (!d) continue;
  const fill = ownFill ?? top.fill ?? "#000000";
  if (fill === "none") {
    warnings.add(`a shape with no fill (${tag}) was skipped: if the logo is made of strokes, convert them to shapes (Outline stroke) before exporting`);
    continue;
  }
  d = d.replace(/\s+/g, " ").trim();
  if (tx || ty) d = translatePath(d, tx, ty);
  const b = getBoundingBox(d);
  parts.push({ id: `p${parts.length}`, tag, d, fill: fill.toUpperCase(), box: { x: +b.x1.toFixed(2), y: +b.y1.toFixed(2), w: +(b.x2 - b.x1).toFixed(2), h: +(b.y2 - b.y1).toFixed(2) }, len: +getLength(d).toFixed(1) });
}
if (/<(image|text)\b/.test(svg)) warnings.add("the file has <image> or <text>: embedded images and live text are not animated. Convert text to shapes (Create outlines) and use an SVG without images");
fs.writeFileSync("src/logo-data.json", JSON.stringify({ viewBox: vb, parts }, null, 1));
console.log(`viewBox ${vb.join(" ")} · ${parts.length} parts -> src/logo-data.json`);
for (const p of parts) console.log(`${p.id.padEnd(4)} ${p.tag.padEnd(8)} ${p.fill}  x ${p.box.x} y ${p.box.y} w ${p.box.w} h ${p.box.h}  len ${p.len}`);
for (const w of warnings) console.warn("⚠️ " + w);
console.log(`\nNext: npm run stills -- --id Parts 0, then open out/stills/Parts-t00.00.png to see each part's id`);

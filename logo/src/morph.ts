// Shape-to-shape morph (closed, one contour): sample both with the same number of points, then align the start point and direction.
import { getLength, getPointAtLength } from "@remotion/paths";

type Pt = [number, number];
const cache = new Map<string, Pt[]>();

export const sample = (d: string, n: number): Pt[] => {
  const key = `${n}|${d}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const L = getLength(d);
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const p = getPointAtLength(d, (L * i) / n);
    pts.push([p?.x ?? 0, p?.y ?? 0]);
  }
  if (cache.size > 400) cache.clear();
  cache.set(key, pts);
  return pts;
};

const alignCache = new Map<string, { off: number; rev: boolean }>();
// Where to start in b's points, and in which direction, to match a's points (computed once per pair)
const alignOf = (a: Pt[], b: Pt[], key: string) => {
  const hit = alignCache.get(key);
  if (hit) return hit;
  const n = a.length;
  let best = { cost: Infinity, off: 0, rev: false };
  for (const rev of [false, true]) {
    const bb = rev ? [...b].reverse() : b;
    for (let off = 0; off < n; off += 2) {
      let c = 0;
      for (let i = 0; i < n; i += 3) {
        const q = bb[(i + off) % n];
        c += (a[i][0] - q[0]) ** 2 + (a[i][1] - q[1]) ** 2;
      }
      if (c < best.cost) best = { cost: c, off, rev };
    }
  }
  const out = { off: best.off, rev: best.rev };
  alignCache.set(key, out);
  return out;
};

const toPath = (pts: Pt[]) => `M ${pts.map((p) => `${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join(" L ")} Z`;

// k from 0 to 1. If the shapes move over time, pass a fixed alignKey + alignFrom/alignTo (still copies of them) so the order never flips.
export const morph = (k: number, from: string, to: string, n = 160, alignKey?: string, alignFrom?: string, alignTo?: string): string => {
  if (k <= 0) return from;
  if (k >= 1) return to;
  const a = sample(from, n);
  const b0 = sample(to, n);
  const al = alignOf(alignFrom ? sample(alignFrom, n) : a, alignTo ? sample(alignTo, n) : b0, alignKey ?? `${n}|${from}|${to}`);
  const bb = al.rev ? [...b0].reverse() : b0;
  return toPath(a.map((p, i) => {
    const q = bb[(i + al.off) % n];
    return [p[0] + (q[0] - p[0]) * k, p[1] + (q[1] - p[1]) * k];
  }));
};

// A shape with several contours (like a cup with its opening): each contour grows on its own from a small circle at its centre
import { getBoundingBox, getSubpaths } from "@remotion/paths";
const circlePath = (x: number, y: number, r: number) =>
  `M ${x} ${y - r} C ${x + r * 0.5523} ${y - r} ${x + r} ${y - r * 0.5523} ${x + r} ${y} C ${x + r} ${y + r * 0.5523} ${x + r * 0.5523} ${y + r} ${x} ${y + r} C ${x - r * 0.5523} ${y + r} ${x - r} ${y + r * 0.5523} ${x - r} ${y} C ${x - r} ${y - r * 0.5523} ${x - r * 0.5523} ${y - r} ${x} ${y - r} Z`;
export const grow = (k: number, d: string, n = 140, r0 = 3): string => {
  if (k >= 1) return d;
  return getSubpaths(d)
    .map((s, i) => {
      const b = getBoundingBox(s);
      const from = circlePath((b.x1 + b.x2) / 2, (b.y1 + b.y2) / 2, i === 0 ? r0 : r0 * 0.5);
      return morph(k, from, s, n);
    })
    .join(" ");
};

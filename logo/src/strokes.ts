// Pen moves over the letter skeletons (src/skeleton.json, written by scripts/skeleton.py).
// Each group (named with scripts/skeleton.py --group) holds moves: drawn (pen down) or lifted (pen in the air, going back).
import SK from "./skeleton.json";

export type Pt = [number, number];
export type Move = { lift: boolean; jump: boolean; pts: Pt[] };
export type Group = { half: number; moves: Move[] };
export const SKEL = SK as unknown as Record<string, Group>;

export const polyLen = (pts: Pt[]) => {
  let L = 0;
  for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return L;
};
export const polyD = (pts: Pt[]) => `M ${pts.map((p) => `${p[0]} ${p[1]}`).join(" L ")}`;

// The point at distance s along a polyline
export const pointAt = (pts: Pt[], s: number): Pt => {
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (acc + l >= s) {
      const k = l ? (s - acc) / l : 0;
      return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
    }
    acc += l;
  }
  return pts[pts.length - 1];
};

// A timeline: each move gets a start and end from its length and the speed (lifts are faster)
export type Seg = { group: string; lift: boolean; pts: Pt[]; len: number; t0: number; t1: number; d: string };
export const plan = (group: string, start: number, speed: number, liftSpeed = speed * 2.2, minLen = 1): Seg[] => {
  const out: Seg[] = [];
  let t = start;
  if (!SKEL[group]) throw new Error(`skeleton group «${group}» not found: run scripts/skeleton.py --group ${group}=...`);
  for (const m of SKEL[group].moves) {
    const len = polyLen(m.pts);
    if (len < minLen) continue;
    const dur = len / (m.lift ? liftSpeed : speed) + (m.lift ? 0.03 : 0);
    out.push({ group, lift: m.lift, pts: m.pts, len, t0: t, t1: t + dur, d: polyD(m.pts) });
    t += dur;
  }
  return out;
};
export const endOf = (segs: Seg[]) => (segs.length ? segs[segs.length - 1].t1 : 0);

// The logo split into parts (src/logo-data.json, written by scripts/split-logo.mjs from public/logo/logo.svg).
// Each part gets its own style: position, size, rotation, opacity, colour, stroke drawing, blur, a fixed clip.
import React from "react";
import { evolvePath } from "@remotion/paths";
import DATA from "./logo-data.json";
import { CONFIG } from "./config";

export type Part = { id: string; tag: string; d: string; fill: string; box: { x: number; y: number; w: number; h: number }; len: number };
const D = DATA as unknown as { viewBox: [number, number, number, number]; parts: Part[] };
export const VIEW = { x: D.viewBox[0], y: D.viewBox[1], w: D.viewBox[2], h: D.viewBox[3] };
export const PARTS: Part[] = D.parts;
export const part = (id: string) => {
  const p = PARTS.find((q) => q.id === id);
  if (!p) throw new Error(`no logo part ${id}`);
  return p;
};
// The part's own colour (after CONFIG.recolor)
export const fillOf = (p: Part) => CONFIG.recolor[p.fill.toUpperCase()] ?? CONFIG.recolor[p.fill.toLowerCase()] ?? p.fill;
// The box around several parts
export const boxOf = (ids: string[]) => {
  const bs = ids.map((i) => part(i).box);
  const x = Math.min(...bs.map((b) => b.x));
  const y = Math.min(...bs.map((b) => b.y));
  return { x, y, w: Math.max(...bs.map((b) => b.x + b.w)) - x, h: Math.max(...bs.map((b) => b.y + b.h)) - y };
};

export type PartStyle = {
  hidden?: boolean;
  opacity?: number;
  x?: number; // offset in logo units
  y?: number;
  scale?: number;
  scaleX?: number;
  scaleY?: number;
  rotate?: number; // degrees
  origin?: string; // default: the part's centre
  fill?: string;
  fillOpacity?: number;
  stroke?: string;
  strokeWidth?: number;
  draw?: number; // 0..1 draws the outline around the part
  blur?: number; // blur in px
  filter?: string; // url(#..) from defs
  d?: string; // a replacement path (for morphs)
  clip?: string; // url(#..) a fixed clip in logo coordinates
  shadow?: string; // CSS drop-shadow
};

export const Logo: React.FC<{
  width: number;
  part?: (p: Part, i: number) => PartStyle | undefined;
  defs?: React.ReactNode;
  under?: React.ReactNode;
  over?: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ width, part: ps, defs, under, over, style }) => {
  const h = (width * VIEW.h) / VIEW.w;
  return (
    <svg viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}`} width={width} height={h} style={{ overflow: "visible", ...style }}>
      {defs && <defs>{defs}</defs>}
      {under}
      {PARTS.map((pt, i) => {
        const s = ps?.(pt, i) ?? {};
        if (s.hidden || s.opacity === 0) return null;
        const d = s.d ?? pt.d;
        const tr = [s.x || s.y ? `translate(${s.x ?? 0}px, ${s.y ?? 0}px)` : "", s.rotate ? `rotate(${s.rotate}deg)` : "", s.scale !== undefined ? `scale(${s.scale})` : "", s.scaleX !== undefined || s.scaleY !== undefined ? `scale(${s.scaleX ?? 1}, ${s.scaleY ?? 1})` : ""].join(" ").trim();
        const ev = s.draw !== undefined ? evolvePath(Math.max(0.0001, Math.min(1, s.draw)), d) : null;
        const el = (
          <path
            key={pt.id}
            d={d}
            fill={s.fill ?? fillOf(pt)}
            fillOpacity={s.fillOpacity ?? 1}
            stroke={s.stroke ?? "none"}
            strokeWidth={s.strokeWidth ?? 0}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={ev?.strokeDasharray}
            strokeDashoffset={ev?.strokeDashoffset}
            filter={s.filter}
            style={{
              opacity: s.opacity ?? 1,
              transformBox: "fill-box",
              transformOrigin: s.origin ?? "center",
              transform: tr || undefined,
              filter: [s.blur ? `blur(${s.blur}px)` : "", s.shadow ? `drop-shadow(${s.shadow})` : ""].join(" ").trim() || undefined,
            }}
          />
        );
        return s.clip ? (
          <g key={pt.id} clipPath={s.clip}>
            {el}
          </g>
        ) : (
          el
        );
      })}
      {over}
    </svg>
  );
};

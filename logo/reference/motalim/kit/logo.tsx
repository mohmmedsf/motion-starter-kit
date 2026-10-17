// شعار متعلم كـ SVG متقسّم: كل جزء ليه ستايل لوحده (مكان، حجم، لف، شفافية، لون، رسم خط، بلور)
// الأجزاء: circle، cup، hat، word، الـ MARKS (damma, dot-r, dot-l, fatha, shadda)، والـ TAG (tag0..tag15)
import React from "react";
import { evolvePath } from "@remotion/paths";
import { CIRCLE, CUP, HAT, MARKS, Part, TAG, VIEW, WORD } from "./logo-data";
import { K } from "./tokens";

export { CIRCLE, CUP, HAT, MARKS, TAG, VIEW, WORD };
export type { Part };

// الدايرة كمسار بيبدأ من فوق (علشان رسم الخط يبدأ من نقطة 12)
const { cx, cy, r } = CIRCLE;
export const CIRCLE_D = `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx} ${cy + r} A ${r} ${r} 0 1 1 ${cx} ${cy - r} Z`;
export const CIRCLE_PART: Part = { id: "circle", d: CIRCLE_D, box: { x: cx - r, y: cy - r, w: 2 * r, h: 2 * r }, len: 2 * Math.PI * r };

export const ALL_PARTS: Part[] = [CIRCLE_PART, CUP, HAT, WORD, ...MARKS, ...TAG];
export const MARK_PARTS = [CIRCLE_PART, CUP, HAT];
export const WORD_PARTS = [WORD, ...MARKS];

export type Theme = "light" | "dark";
// ألوان الشعار الأصلية
export const baseFill = (id: string, theme: Theme) => (id === "circle" ? K.blue : id === "cup" || id === "hat" ? K.white : theme === "dark" ? K.white : K.black);

export type PartStyle = {
  hidden?: boolean;
  opacity?: number;
  x?: number; // إزاحة بوحدات الشعار (العرض كله 450)
  y?: number;
  scale?: number;
  scaleX?: number;
  scaleY?: number;
  rotate?: number; // درجات
  origin?: string; // افتراضي: نص الجزء
  fill?: string;
  fillOpacity?: number;
  stroke?: string;
  strokeWidth?: number;
  draw?: number; // 0..1 رسم الخط حوالين الجزء
  blur?: number; // بلور بالبكسل (للسرعة)
  filter?: string; // url(#..) من defs
  d?: string; // مسار بديل (للتحوّل)
  clip?: string; // url(#..) قص ثابت في إحداثيات الشعار (مش بيتحرك مع الجزء)
  shadow?: string; // CSS drop-shadow
};

export const Logo: React.FC<{
  width: number;
  theme?: Theme;
  part?: (p: Part, i: number) => PartStyle | undefined;
  defs?: React.ReactNode;
  // حاجات زيادة جوه نفس إحداثيات الشعار (فوق أو تحت)
  under?: React.ReactNode;
  over?: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ width, theme = "light", part, defs, under, over, style }) => {
  const h = (width * VIEW.h) / VIEW.w;
  return (
    <svg viewBox={`0 0 ${VIEW.w} ${VIEW.h}`} width={width} height={h} style={{ overflow: "visible", ...style }}>
      {defs && <defs>{defs}</defs>}
      {under}
      {ALL_PARTS.map((pt, i) => {
        const s = part?.(pt, i) ?? {};
        if (s.hidden || s.opacity === 0) return null;
        const d = s.d ?? pt.d;
        const tr = [s.x || s.y ? `translate(${s.x ?? 0}px, ${s.y ?? 0}px)` : "", s.rotate ? `rotate(${s.rotate}deg)` : "", s.scale !== undefined ? `scale(${s.scale})` : "", s.scaleX !== undefined || s.scaleY !== undefined ? `scale(${s.scaleX ?? 1}, ${s.scaleY ?? 1})` : ""].join(" ").trim();
        const ev = s.draw !== undefined ? evolvePath(Math.max(0.0001, Math.min(1, s.draw)), d) : null;
        const el = (
          <path
            key={pt.id}
            d={d}
            fill={s.fill ?? baseFill(pt.id, theme)}
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

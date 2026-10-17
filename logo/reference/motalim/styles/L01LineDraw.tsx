// 01 · رسم الخطوط (Line draw)
// خطوط إرشاد باهتة ← قلم بسن مضيء يرسم الدايرة ← الكوباية والقبعة ← «متعلم» والنقط ← الجملة
// ← اللون يتملي من نص الدايرة، والكلمة تتلوّن من اليمين للشمال ← نطّة خفيفة وثبات
import React from "react";
import { getPointAtLength } from "@remotion/paths";
import { CIRCLE, CIRCLE_PART, CUP, HAT, Logo, MARKS, Part, TAG, WORD } from "../logo";
import { Center, K, LOGO_W, Sfx, Stage, ease, easeInOut, lerp, mix, p, useT } from "../fx";

// متى يترسم كل جزء: [بداية، مدة]
const DRAW: Record<string, [number, number]> = {
  circle: [0.25, 1.15],
  cup: [0.95, 0.95],
  hat: [1.2, 0.7],
  word: [1.05, 1.5],
};
MARKS.forEach((m, i) => (DRAW[m.id] = [2.2 + i * 0.09, 0.35]));
TAG.forEach((m, i) => (DRAW[m.id] = [2.35 + i * 0.035, 0.4]));
const FILL = 2.75; // اللون يبدأ
const DONE = 3.35; // الشعار كامل

const strokeOf = (id: string) => (id === "circle" || id === "cup" || id === "hat" ? K.blue : K.black);

// سن القلم: نقطة على آخر حتة اترسمت من الجزء اللي بيترسم دلوقتي
const PenTip: React.FC<{ t: number }> = ({ t }) => {
  const order: Part[] = [CIRCLE_PART, CUP, HAT, WORD];
  const live = order.filter((pt) => t >= DRAW[pt.id][0] && t <= DRAW[pt.id][0] + DRAW[pt.id][1]);
  return (
    <>
      {live.map((pt) => {
        const [a, d] = DRAW[pt.id];
        const k = easeInOut(Math.min(1, (t - a) / d));
        const pos = getPointAtLength(pt.d, pt.len * k);
        if (!pos) return null;
        const fadeIn = Math.min(1, (t - a) / 0.1) * Math.min(1, (a + d - t) / 0.1);
        return (
          <g key={pt.id} opacity={fadeIn}>
            <circle cx={pos.x} cy={pos.y} r={6} fill={K.amber} opacity={0.25} filter="url(#tipGlow)" />
            <circle cx={pos.x} cy={pos.y} r={1.9} fill={K.amber} />
          </g>
        );
      })}
    </>
  );
};

export const L01LineDraw: React.FC = () => {
  const t = useT();
  const fillK = p(t, FILL, 0.6, ease);
  const settle = mix(p(t, DONE - 0.05, 0.5, ease), 0, 1, 0); // نطّة صغيرة
  const guides = mix(p(t, 0.0, 0.5), 0, 1) * (1 - p(t, FILL, 0.5));
  const cam = lerp(1.07, 1, p(t, 0, DONE + 0.4, easeInOut));
  return (
    <Stage bg={`radial-gradient(ellipse at 50% 45%, #FFFFFF 0%, ${K.offwhite} 70%)`} vignette={0.12} grain={0.05}>
      {/* شبكة نقط خفيفة */}
      <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.5 * (1 - 0.6 * fillK) }}>
        <defs>
          <pattern id="dots" width="40" height="40" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.6" fill="rgba(31,61,99,0.16)" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dots)" />
      </svg>
      <Sfx at={0.2} name="pen" vol={0.9} />
      <Sfx at={1.1} name="pen" vol={0.75} />
      <Sfx at={2.2} name="tick" vol={0.5} />
      <Sfx at={2.6} name="whoosh_hi" vol={0.55} />
      <Sfx at={3.05} name="chime" vol={0.55} />
      <Sfx at={3.1} name="hit" vol={0.22} />
      <Center scale={cam * (1 + 0.025 * settle)}>
        <Logo
          width={LOGO_W}
          defs={
            <>
              <filter id="tipGlow" x="-200%" y="-200%" width="500%" height="500%">
                <feGaussianBlur stdDeviation="2.5" />
              </filter>
              {/* اللون يتملي من نص الدايرة */}
              <clipPath id="markFill">
                <circle cx={CIRCLE.cx} cy={CIRCLE.cy} r={CIRCLE.r * 1.05 * fillK} />
              </clipPath>
              {/* الكلمة والجملة تتلوّن من اليمين للشمال */}
              <clipPath id="wordFill">
                <rect x={lerp(300, -10, p(t, FILL + 0.1, 0.75, easeInOut))} y={-20} width={400} height={200} />
              </clipPath>
            </>
          }
          under={
            <g opacity={guides} stroke="rgba(0,86,210,0.35)" strokeWidth={0.5} fill="none" strokeDasharray="2 3">
              <circle cx={CIRCLE.cx} cy={CIRCLE.cy} r={CIRCLE.r + 6} />
              <line x1={-30} x2={470} y1={CIRCLE.cy} y2={CIRCLE.cy} />
              <line x1={CIRCLE.cx} x2={CIRCLE.cx} y1={-20} y2={170} />
              <line x1={-30} x2={300} y1={134.5} y2={134.5} />
            </g>
          }
          part={(pt) => {
            const [a, d] = DRAW[pt.id];
            const k = Math.min(1, Math.max(0, (t - a) / d));
            if (k <= 0) return { hidden: true };
            const isMark = pt.id === "circle" || pt.id === "cup" || pt.id === "hat";
            const sw = (pt.id.startsWith("tag") ? 0.7 : 1.3) * (1 - p(t, DONE - 0.2, 0.5));
            return {
              draw: easeInOut(k),
              stroke: isMark && pt.id !== "circle" && fillK > 0.5 ? K.white : strokeOf(pt.id),
              strokeWidth: sw,
              fillOpacity: 0,
            };
          }}
          over={
            <>
              {/* طبقة اللون فوق الخطوط: الرمز يتملي من النص، والكلام من اليمين */}
              <g clipPath="url(#markFill)">
                <circle cx={CIRCLE.cx} cy={CIRCLE.cy} r={CIRCLE.r} fill={K.blue} />
                <path d={CUP.d} fill={K.white} />
                <path d={HAT.d} fill={K.white} />
              </g>
              <g clipPath="url(#wordFill)" fill={K.black}>
                {[WORD, ...MARKS, ...TAG].map((pt) => (
                  <path key={pt.id} d={pt.d} />
                ))}
              </g>
              <PenTip t={t} />
            </>
          }
        />
      </Center>
    </Stage>
  );
};

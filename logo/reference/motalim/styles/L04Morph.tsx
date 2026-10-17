// 04 · التحوّل (Shape morph)
// نقطة صفرا في النص ← تتمطّ وتتحوّل لمربع ناعم ← للدايرة الزرقا في مكانها
// ← جواها: نقطة بيضا تبقى الكوباية، وخط يبقى القبعة ← خط متموّج يتحوّل لكلمة «متعلم» ← نقط صغيرة تبقى التشكيل
import React from "react";
import { grow, morph } from "../morph";
import { Pt, SKEL, polyLen } from "../strokes";
import { CIRCLE, CUP, HAT, Logo, MARKS, TAG, WORD } from "../logo";
import { Center, K, LOGO_W, Sfx, Stage, backOut, ease, easeInOut, expoOut, lerp, p, useSpring, useT } from "../fx";

const { cx, cy, r } = CIRCLE;
// دايرة كمسار بنصف قطر ومركز
const circ = (x: number, y: number, rr: number) => `M ${x} ${y - rr} C ${x + rr * 0.5523} ${y - rr} ${x + rr} ${y - rr * 0.5523} ${x + rr} ${y} C ${x + rr} ${y + rr * 0.5523} ${x + rr * 0.5523} ${y + rr} ${x} ${y + rr} C ${x - rr * 0.5523} ${y + rr} ${x - rr} ${y + rr * 0.5523} ${x - rr} ${y} C ${x - rr} ${y - rr * 0.5523} ${x - rr * 0.5523} ${y - rr} ${x} ${y - rr} Z`;
// مربع بزوايا مدوّرة كمسار
const rsq = (x: number, y: number, s: number, rad: number) => {
  const h = s / 2;
  return `M ${x - h + rad} ${y - h} L ${x + h - rad} ${y - h} Q ${x + h} ${y - h} ${x + h} ${y - h + rad} L ${x + h} ${y + h - rad} Q ${x + h} ${y + h} ${x + h - rad} ${y + h} L ${x - h + rad} ${y + h} Q ${x - h} ${y + h} ${x - h} ${y + h - rad} L ${x - h} ${y - h + rad} Q ${x - h} ${y - h} ${x - h + rad} ${y - h} Z`;
};
// الكلمة بتتبني من هيكل حروفها: كل نقطة في الهيكل بتبدأ على خط متموّج (نفس x)، وتطلع لمكانها
// والحروف بتتكوّن من اليمين للشمال، بسُمكها الحقيقي، فالكلمة تفضل مقروءة طول التحوّل
const SEGS: Pt[][] = SKEL.word.moves.filter((m) => !m.lift && polyLen(m.pts as Pt[]) > 1).map((m) => m.pts as Pt[]);
const THICK = SKEL.word.half * 2;
const BASE_Y = 85.5;
const waveY = (x: number, tt: number, amp: number) => BASE_Y + amp * Math.sin(x * 0.075 + tt * 5.5);
const X_MIN = 0;
const X_MAX = 292;

const MID = 225; // نص الشعار (450/2)
const A = { dot: 0.3, sq: 0.75, circ: 1.15, inner: 1.65, word: 2.15, marks: 3.15, tag: 3.4 };

export const L04Morph: React.FC = () => {
  const t = useT();
  const spring = useSpring();
  // 1) النقطة ← مربع ← الدايرة (وبتتحرك من نص الشعار لمكان الرمز)
  const dotS = spring(A.dot, { damping: 10, stiffness: 200, mass: 0.6 });
  const k1 = p(t, A.sq, 0.45, easeInOut);
  const k2 = p(t, A.circ, 0.6, expoOut);
  const pos = lerp(MID, cx, p(t, A.circ - 0.05, 0.75, easeInOut));
  const dotR = 10 * Math.min(1.15, dotS);
  const sqPath = rsq(pos, cy, lerp(dotR * 2, 70, k1), lerp(dotR, 16, k1));
  const shape1 =
    t < A.sq
      ? circ(pos, cy, dotR)
      : t < A.circ
        ? morph(k1, circ(pos, cy, dotR), sqPath, 140, "dot-sq", circ(MID, cy, 10), rsq(MID, cy, 70, 16))
        : morph(k2, rsq(pos, cy, 70, 16), circ(pos, cy, r), 140, "sq-circ", rsq(MID, cy, 70, 16), circ(MID, cy, r));
  // اللون: أصفر ← مرجاني ← أزرق (من غير ما يعدّي على لون باهت)
  const col1 = t < A.circ ? K.amber : k2 < 0.45 ? interpolateColor(k2 / 0.45, K.amber, K.coral) : interpolateColor((k2 - 0.45) / 0.55, K.coral, K.blue);
  const ring = p(t, A.circ + 0.45, 0.8, expoOut);
  const spinDeg = lerp(0, 90, p(t, A.sq, 0.9, easeInOut));
  // 2) جوه الدايرة: نقطة بيضا ← الكوباية، وخط ← القبعة
  const ki = p(t, A.inner, 0.65, expoOut);
  const kh = p(t, A.inner + 0.15, 0.6, expoOut);
  // 3) الموجة ← الكلمة
  const kw0 = p(t, A.word - 0.3, 0.4, easeInOut); // الموجة بتترسم من اليمين
  const W_SPAN = 0.95; // مدة تكوين الكلمة كلها
  const kWord = (x: number) => easeInOut(Math.min(1, Math.max(0, (t - A.word - ((X_MAX - x) / (X_MAX - X_MIN)) * 0.5) / (W_SPAN - 0.5))));
  const wordDone = t >= A.word + W_SPAN;
  const solidWord = p(t, A.word + W_SPAN - 0.08, 0.18);
  const amp = 7 * (1 - p(t, A.word + 0.2, 0.8, ease));
  const shift = 0;
  const cam = lerp(1.08, 1, p(t, 0, 4.2, easeInOut));
  return (
    <Stage bg={`radial-gradient(ellipse at 50% 45%, #FFFFFF 0%, ${K.offwhite} 72%)`} vignette={0.14} grain={0.05}>
      <Sfx at={A.dot} name="pop" vol={0.6} />
      <Sfx at={A.sq} name="stretch" vol={0.5} />
      <Sfx at={A.circ - 0.05} name="whoosh" vol={0.5} />
      <Sfx at={A.circ + 0.25} name="pop_lo" vol={0.5} />
      <Sfx at={A.inner} name="magic" vol={0.45} />
      <Sfx at={A.word - 0.3} name="slide" vol={0.55} />
      <Sfx at={A.word + 0.05} name="stretch" vol={0.4} rate={0.8} />
      <Sfx at={A.word + W_SPAN - 0.05} name="pop_lo" vol={0.35} />
      {MARKS.map((_, i) => (
        <Sfx key={i} at={A.marks + i * 0.08} name="pop_hi" vol={0.25} />
      ))}
      <Sfx at={A.tag + 0.35} name="chime" vol={0.5} />
      <Center x={shift} scale={cam}>
        <Logo
          width={LOGO_W}
          defs={
            <clipPath id="waveIn">
              <rect x={lerp(X_MAX + 10, X_MIN - 20, kw0)} y={-60} width={400} height={260} />
            </clipPath>
          }
          part={(pt) => {
            if (pt.id === "circle" || pt.id === "cup" || pt.id === "hat" || pt.id === "word") return { hidden: true };
            const mi = MARKS.findIndex((m) => m.id === pt.id);
            if (mi >= 0) {
              const a = A.marks + mi * 0.08;
              const k = p(t, a, 0.45, backOut);
              return t < a ? { hidden: true } : { d: grow(Math.min(1, k), pt.d, 80, 2.2), scale: lerp(0.4, 1, Math.min(1, k * 1.4)) };
            }
            const ti = TAG.findIndex((m) => m.id === pt.id);
            if (ti >= 0) {
              const a = A.tag + ti * 0.025;
              const k = p(t, a, 0.5, ease);
              return t < a ? { hidden: true } : { opacity: k, y: lerp(8, 0, k), blur: (1 - k) * 4 };
            }
            return {};
          }}
          over={
            <>
              {/* الشكل اللي بيتحوّل للدايرة */}
              {t >= A.dot && (
                <g style={{ transformBox: "fill-box", transformOrigin: "center", transform: `rotate(${spinDeg}deg)` }}>
                  <path d={shape1} fill={col1} />
                </g>
              )}
              {/* نبضة حلقة لما الدايرة تكتمل */}
              {ring > 0 && ring < 1 && <circle cx={cx} cy={cy} r={r * lerp(1, 1.35, ring)} fill="none" stroke={K.blue} strokeWidth={lerp(3, 0.2, ring)} opacity={(1 - ring) * 0.5} />}
              {/* الكوباية والقبعة */}
              {t >= A.inner && <path d={grow(ki, CUP.d, 200, 6)} fillRule="evenodd" fill={K.white} opacity={Math.min(1, ki * 4)} />}
              {t >= A.inner + 0.15 && <path d={grow(kh, HAT.d, 120, 4)} fillRule="evenodd" fill={K.white} opacity={Math.min(1, kh * 4)} />}
              {/* الكلمة: هيكل الحروف بيطلع من الموجة لمكانه (من اليمين للشمال) */}
              {t >= A.word - 0.3 && solidWord < 1 && (
                <g clipPath="url(#waveIn)" opacity={1 - solidWord}>
                  {SEGS.map((seg, i) => {
                    const ks = seg.map((q) => kWord(q[0]));
                    const mean = ks.reduce((a, b) => a + b, 0) / ks.length;
                    const d = `M ${seg.map((q, j) => `${q[0].toFixed(2)} ${lerp(waveY(q[0], t, amp), q[1], ks[j]).toFixed(2)}`).join(" L ")}`;
                    return <path key={i} d={d} fill="none" stroke={K.black} strokeWidth={lerp(5, THICK, mean)} strokeLinecap="round" strokeLinejoin="round" />;
                  })}
                </g>
              )}
              {solidWord > 0 && <path d={WORD.d} fill={K.black} opacity={solidWord} />}
            </>
          }
        />
      </Center>
    </Stage>
  );
};

// خلط لونين hex
function interpolateColor(k: number, a: string, b: string) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  const c = pa.map((v, i) => Math.round(v + (pb[i] - v) * k));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

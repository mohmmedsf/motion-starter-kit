// 03 · تجميع الأجزاء (Logo assembly)
// الدايرة تفتح من نقطة ← الكوباية تطلع من تحت ← القبعة تنزل من فوق وتقع عليها بنطّة
// ← الكلمة تتزحلق من ورا الدايرة ← النقط والتشكيل تقع في أماكنها واحدة واحدة ← الجملة تطلع حرف حرف
import React from "react";
import { CIRCLE, Logo, MARKS, TAG } from "../logo";
import { Center, K, LOGO_W, Sfx, Stage, backOut, ease, easeInOut, expoOut, lerp, p, speedBlur, useSpring, useT } from "../fx";

const CIRC = 0.35; // الدايرة
const CUP_A = 0.85; // الكوباية
const HAT_A = 1.35; // القبعة (بتقع عند ~1.65)
const WORD_A = 1.9; // الكلمة
const MARK_A = MARKS.map((_, i) => 2.45 + i * 0.1);
const TAG_A = 2.95;

export const L03Assembly: React.FC = () => {
  const t = useT();
  const spring = useSpring();
  const circle = spring(CIRC, { damping: 13, stiffness: 140 });
  const cup = spring(CUP_A, { damping: 12, stiffness: 150 });
  // القبعة: تقع بجاذبية (تسارع) وبعدين زنبرك عند التلامس
  const fall = p(t, HAT_A, 0.3, (x) => x * x);
  const land = HAT_A + 0.3;
  const hatSettle = spring(land, { damping: 8, stiffness: 260, mass: 0.6 });
  const hatY = t < land ? lerp(-150, 0, fall) : 0;
  const hatSquash = t < land ? 1 : 1 - 0.22 * Math.sin(Math.min(1, (t - land) / 0.25) * Math.PI) * Math.exp(-(t - land) * 6);
  const word = spring(WORD_A, { damping: 15, stiffness: 120 });
  const wordPrev = spring(WORD_A - 1 / 30, { damping: 15, stiffness: 120 });
  // الشعار كله يتحرك شوية علشان الرمز يبدأ في النص وبعدين ياخد مكانه على اليمين
  const shift = lerp(-(CIRCLE.cx - 225) * (LOGO_W / 450), 0, p(t, WORD_A - 0.25, 0.9, easeInOut));
  const cam = lerp(1.06, 1, p(t, 0, 4, easeInOut));
  const bump = 1 + 0.018 * Math.sin(Math.min(1, Math.max(0, (t - (TAG_A + 0.55)) / 0.35)) * Math.PI);
  return (
    <Stage bg={`radial-gradient(ellipse at 50% 42%, #FFFFFF 0%, ${K.offwhite} 72%)`} vignette={0.14} grain={0.05}>
      {/* ظل أرضي ناعم تحت الشعار */}
      <div style={{ position: "absolute", left: "50%", top: 690, width: 1200, height: 80, transform: `translateX(-50%) scaleX(${0.4 + 0.6 * word})`, background: "radial-gradient(ellipse at center, rgba(31,61,99,0.16) 0%, rgba(31,61,99,0) 70%)", opacity: circle }} />
      <Sfx at={CIRC} name="pop_lo" vol={0.6} />
      <Sfx at={CUP_A - 0.05} name="whoosh_hi" vol={0.45} />
      <Sfx at={CUP_A + 0.12} name="snap" vol={0.5} />
      <Sfx at={HAT_A - 0.05} name="whoosh_hi" vol={0.35} />
      <Sfx at={land} name="thud" vol={0.75} />
      <Sfx at={land + 0.02} name="snap" vol={0.4} />
      <Sfx at={WORD_A} name="slide" vol={0.8} />
      {MARK_A.map((a, i) => (
        <Sfx key={i} at={a + 0.12} name={i % 2 ? "pop_hi" : "pop"} vol={0.32} />
      ))}
      <Sfx at={TAG_A} name="type" vol={0.5} />
      <Sfx at={TAG_A + 0.5} name="chime" vol={0.5} />
      <Sfx at={TAG_A + 0.55} name="sparkle" vol={0.25} />
      <Center x={shift} scale={cam * bump}>
        <Logo
          width={LOGO_W}
          defs={
            <>
              <clipPath id="behindCircle">
                {/* الكلمة بتطلع من ورا الدايرة */}
                <rect x={-60} y={-40} width={CIRCLE.cx - CIRCLE.r - 2 + 60} height={240} />
              </clipPath>
              <clipPath id="inCircle">
                <circle cx={CIRCLE.cx} cy={CIRCLE.cy} r={CIRCLE.r * Math.max(0.001, circle)} />
              </clipPath>
            </>
          }
          part={(pt) => {
            if (pt.id === "circle") return { scale: Math.max(0.001, circle), opacity: Math.min(1, circle * 3) };
            if (pt.id === "cup") {
              return t < CUP_A ? { hidden: true } : { y: lerp(70, 0, cup), scaleY: lerp(0.5, 1, Math.min(1.1, cup)), scaleX: lerp(1.15, 1, Math.min(1, cup)), origin: "50% 100%", clip: "url(#inCircle)" };
            }
            if (pt.id === "hat") {
              return t < HAT_A ? { hidden: true } : { y: hatY, scaleY: hatSquash, scaleX: 2 - hatSquash, origin: "50% 100%", rotate: t < land ? lerp(-25, 0, fall) : 6 * (1 - Math.min(1, hatSettle)), shadow: t < land + 0.1 ? `0 ${lerp(10, 2, fall)}px ${lerp(14, 3, fall)}px rgba(31,61,99,0.35)` : undefined };
            }
            if (pt.id === "word") {
              const x = lerp(140, 0, word);
              return t < WORD_A ? { hidden: true } : { x, blur: speedBlur((lerp(140, 0, word) - lerp(140, 0, wordPrev)) * 2.4, 0.4, 10), clip: "url(#behindCircle)" };
            }
            const mi = MARKS.findIndex((m) => m.id === pt.id);
            if (mi >= 0) {
              const a = MARK_A[mi];
              if (t < a) return { hidden: true };
              const fallK = p(t, a, 0.14, (x) => x * x);
              const s = spring(a + 0.14, { damping: 9, stiffness: 300, mass: 0.4 });
              const y = t < a + 0.14 ? lerp(-70, 0, fallK) : 0;
              const sq = t < a + 0.14 ? 1 : lerp(0.7, 1, Math.min(1, s));
              return { y, scaleY: sq, scaleX: 2 - sq, origin: "50% 100%" };
            }
            const ti = TAG.findIndex((m) => m.id === pt.id);
            if (ti >= 0) {
              const a = TAG_A + ti * 0.03;
              const k = p(t, a, 0.4, backOut);
              return t < a ? { hidden: true } : { y: lerp(14, 0, k), opacity: Math.min(1, k * 1.5), scale: lerp(0.6, 1, Math.min(1, k)) };
            }
            return {};
          }}
          under={null}
          over={null}
        />
      </Center>
      {/* لمعة خفيفة على الدايرة بعد ما تكتمل */}
      <Glint t={t} at={TAG_A + 0.6} shift={shift} cam={cam * bump} />
    </Stage>
  );
};

const Glint: React.FC<{ t: number; at: number; shift: number; cam: number }> = ({ t, at, shift, cam }) => {
  const k = p(t, at, 0.9, easeInOut);
  if (k <= 0 || k >= 1) return null;
  const u = LOGO_W / 450;
  const cx = 960 + shift * cam + (CIRCLE.cx - 225) * u * cam;
  const cy = 540 + (CIRCLE.cy - 74.78) * u * cam;
  const r = CIRCLE.r * u * cam;
  return (
    <div style={{ position: "absolute", left: cx - r, top: cy - r, width: 2 * r, height: 2 * r, borderRadius: "50%", overflow: "hidden", mixBlendMode: "screen", opacity: 0.55 * Math.sin(k * Math.PI) }}>
      <div style={{ position: "absolute", top: -r, left: lerp(-1.2 * r, 2.2 * r, ease(k)), width: r * 0.35, height: 4 * r, transform: "rotate(25deg)", background: "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.85), rgba(255,255,255,0))" }} />
    </div>
  );
};

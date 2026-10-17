// 07 · المسح بالألوان (Mask wipe)
// 3 شرايط مايلة (أصفر، سماوي، أزرق) بتعدّي على الشاشة من اليمين للشمال ← الرمز بيبان ورا آخر شريط
// ← الكلمة بتتكشف بمسحة مايلة وشريط مرجاني راكب على حافتها ← النقط تطلع ← الجملة بشريط أصفر رفيع
import React from "react";
import { AbsoluteFill } from "remotion";
import { CIRCLE, Logo, MARKS, TAG } from "../logo";
import { Center, H, K, LOGO_W, Sfx, Stage, W, backOut, ease, easeInOut, expoOut, lerp, p, useT } from "../fx";

const SKEW = 18; // درجة ميل الشرايط
const TAN = Math.tan((SKEW * Math.PI) / 180);
const BANDS = [
  { at: 0.25, w: 520, color: K.amber },
  { at: 0.4, w: 640, color: K.sky },
  { at: 0.55, w: 1400, color: K.blue },
];
const BAND_DUR = 0.95;
const WORD_A = 1.45;
const MARK_A = 2.05;
const TAG_A = 2.35;
const DONE = 2.95;
const U = LOGO_W / 450;
const LEFT0 = (W - LOGO_W) / 2; // حافة الشعار الشمال في الكادر
const TOP0 = (H - (LOGO_W * 149.56) / 450) / 2;

// مكان الحافة الشمال لشريط عند زمن t (بيمشي من برا يمين لبرا شمال)
const bandX = (t: number, b: (typeof BANDS)[number]) => lerp(W + 200, -b.w - 600, p(t, b.at, BAND_DUR, (x) => expoOut(easeInOut(x))));

export const L07MaskWipe: React.FC = () => {
  const t = useT();
  const last = BANDS[BANDS.length - 1];
  // الرمز بيبان على يمين آخر حافة للشريط الأزرق
  const revealX = bandX(t, last) + last.w;
  // مسحة الكلمة: من اليمين للشمال (حافة مايلة)، وشريط مرجاني راكب عليها
  const wk = p(t, WORD_A, 0.6, easeInOut);
  const wordEdge = lerp(LEFT0 + 300 * U, LEFT0 - 40, wk); // بكسل في الكادر
  const barOn = wk > 0 && wk < 1;
  const tk = p(t, TAG_A, 0.45, easeInOut);
  const tagEdge = lerp(LEFT0 + 292 * U, LEFT0 + 30 * U, tk);
  const settle = p(t, DONE, 0.6, ease);
  const cam = lerp(1.05, 1, p(t, 0.5, 3, easeInOut));
  // الرمز في نص الكادر لحد ما الكلمة تيجي
  const shift = lerp(-(CIRCLE.cx - 225) * U, 0, p(t, WORD_A - 0.55, 0.55, easeInOut));
  const poly = (x: number, slant = H * TAN) => `polygon(${x + slant}px 0, 100% 0, 100% 100%, ${x}px 100%)`;
  return (
    <Stage bg={`radial-gradient(ellipse at 50% 45%, #FFFFFF 0%, ${K.offwhite} 72%)`} vignette={0.12} grain={0.05}>
      {/* خط رفيع قبل أول شريط (ترقّب) */}
      <AbsoluteFill style={{ opacity: 1 - p(t, 0.25, 0.2) }}>
        <div style={{ position: "absolute", left: lerp(W, W * 0.55, p(t, 0, 0.3, ease)), top: H / 2 - 2, width: W, height: 4, background: K.amber, borderRadius: 2 }} />
      </AbsoluteFill>
      <Sfx at={0.18} name="whoosh_hi" vol={0.35} />
      {BANDS.map((b, i) => (
        <Sfx key={i} at={b.at - 0.02} name={i === 2 ? "whoosh_long" : "whoosh"} vol={0.45 + i * 0.1} />
      ))}
      <Sfx at={last.at + 0.45} name="hit" vol={0.45} />
      <Sfx at={WORD_A - 0.03} name="slide" vol={0.75} />
      {MARKS.map((_, i) => (
        <Sfx key={`m${i}`} at={MARK_A + i * 0.06} name="pop_hi" vol={0.25} />
      ))}
      <Sfx at={TAG_A} name="whoosh_hi" vol={0.4} />
      <Sfx at={DONE - 0.05} name="chime" vol={0.5} />
      {/* الشعار ورا آخر شريط */}
      <AbsoluteFill style={{ clipPath: poly(revealX) }}>
        <Center x={shift} scale={cam * (1 + 0.012 * Math.sin(settle * Math.PI))}>
          <Logo
            width={LOGO_W}
            part={(pt) => {
              if (pt.id === "circle" || pt.id === "cup" || pt.id === "hat") return {};
              if (pt.id === "word") return t < WORD_A ? { hidden: true } : {};
              const mi = MARKS.findIndex((m) => m.id === pt.id);
              if (mi >= 0) {
                const k = p(t, MARK_A + mi * 0.06, 0.4, backOut);
                return k <= 0 ? { hidden: true } : { scale: k, y: lerp(-10, 0, Math.min(1, k)) };
              }
              const ti = TAG.findIndex((m) => m.id === pt.id);
              if (ti >= 0) return t < TAG_A ? { hidden: true } : {};
              return {};
            }}
          />
        </Center>
      </AbsoluteFill>
      {/* قناع الكلمة: نخفي اللي لسه ماتكشفش (من الحافة لشمال) بطبقة بلون الخلفية؟ لا: نعيد رسم الكلمة بقص مايل */}
      <WordMask t={t} edge={wordEdge} tagEdge={tagEdge} cam={cam} />
      {/* الشريط المرجاني راكب على حافة الكلمة */}
      {barOn && <div style={{ position: "absolute", left: wordEdge - 22, top: TOP0 - 30, width: 24, height: 120 * U + 60, background: K.coral, transform: `skewX(${-SKEW}deg)`, borderRadius: 4, opacity: Math.min(1, wk * 6, (1 - wk) * 6) }} />}
      {tk > 0 && tk < 1 && <div style={{ position: "absolute", left: tagEdge - 12, top: TOP0 + 108 * U, width: 14, height: 44 * U, background: K.amber, transform: `skewX(${-SKEW}deg)`, borderRadius: 3, opacity: Math.min(1, tk * 6, (1 - tk) * 6) }} />}
      {/* الشرايط */}
      {BANDS.map((b, i) => {
        const x = bandX(t, b);
        if (t < b.at || x < -b.w - 500) return null;
        return <div key={i} style={{ position: "absolute", left: x, top: -40, width: b.w, height: H + 80, background: b.color, transform: `skewX(${-SKEW}deg)`, boxShadow: "0 0 60px rgba(0,0,0,0.12)" }} />;
      })}
    </Stage>
  );
};

// الكلمة والجملة بيتغطّوا بلون الخلفية لحد ما المسحة توصلهم (طبقة فوق الشعار، بنفس ميل الشرايط)
const WordMask: React.FC<{ t: number; edge: number; tagEdge: number; cam: number }> = ({ t, edge, tagEdge }) => {
  const slant = 160 * TAN;
  const wordTop = TOP0 - 20;
  const wordBottom = TOP0 + 136 * U;
  const tagTop = TOP0 + 108 * U;
  const tagBottom = TOP0 + 152 * U;
  if (t > TAG_A + 0.5) return null;
  const bg = `radial-gradient(ellipse at 50% 45%, #FFFFFF 0%, ${K.offwhite} 72%)`;
  return (
    <>
      {t >= WORD_A && t < WORD_A + 0.62 && (
        <div style={{ position: "absolute", left: 0, top: wordTop, width: W, height: wordBottom - wordTop + 12, clipPath: `polygon(0 0, ${edge + slant * 0.5}px 0, ${edge - slant * 0.5}px 100%, 0 100%)`, background: bg, backgroundSize: `${W}px ${H}px`, backgroundPosition: `0 ${-wordTop}px` }} />
      )}
      {t >= TAG_A && <div style={{ position: "absolute", left: 0, top: tagTop, width: W, height: tagBottom - tagTop + 10, clipPath: `polygon(0 0, ${tagEdge + 6}px 0, ${tagEdge - 6}px 100%, 0 100%)`, background: bg, backgroundSize: `${W}px ${H}px`, backgroundPosition: `0 ${-tagTop}px` }} />}
    </>
  );
};

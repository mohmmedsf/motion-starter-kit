// 09 · حرف ورا حرف (Kinetic typing) — الكلمة بتتكتب كأنها على كيبورد
// مؤشّر أزرق بيومض ← كل ضغطة زرار بيطلع حرف كامل متشبّك في اللي قبله (والحرف الجديد بيلمع أصفر لحظة)
// والمؤشّر بينط لشماله ← التشكيل ← الجملة بتتكتب بسرعة ← «Enter»: الرمز يطلع بنبضة ← ثبات
// الحروف ما بتتحركش ولا بتتقطّع: بنكشف الكلمة عند حدود الحروف (على خط الوصل بين كل حرف واللي بعده)
import React from "react";
import { CIRCLE, Logo, MARKS, TAG, WORD } from "../logo";
import { Center, K, LOGO_W, Sfx, Stage, backOut, ease, easeInOut, expoOut, lerp, p, useSpring, useT } from "../fx";

// حدود الحروف (وحدات الشعار، من اليمين): م | ت | ع | ل | م
const CUTS = [300, 222, 165, 112, 68, -15];
const KEYS = [0.6, 0.86, 1.08, 1.36, 1.58]; // ضغطة كل حرف (إيقاع مش منتظم زي الكتابة الحقيقية)
const MARK_KEYS = MARKS.map((_, i) => 1.86 + i * 0.1);
// الجملة: 12 خطوة كتابة سريعة من اليمين للشمال
const TAG_X0 = 290;
const TAG_X1 = 34;
const TAG_STEPS = 12;
const TAG_A = 2.55;
const TAG_DT = 0.055;
const TAG_END = TAG_A + TAG_STEPS * TAG_DT;
const ENTER = 3.25;
const DONE = ENTER + 0.4;

const typedEdge = (t: number) => {
  let x = CUTS[0];
  KEYS.forEach((k, i) => {
    if (t >= k) x = CUTS[i + 1];
  });
  return x;
};
const tagEdge = (t: number) => {
  const n = Math.max(0, Math.min(TAG_STEPS, Math.floor((t - TAG_A) / TAG_DT) + 1));
  return t < TAG_A ? TAG_X0 + 6 : lerp(TAG_X0, TAG_X1, n / TAG_STEPS);
};

export const L09Kinetic: React.FC = () => {
  const t = useT();
  const spring = useSpring();
  const edge = typedEdge(t);
  const lastKey = [...KEYS].reverse().find((k) => t >= k);
  const lastIdx = lastKey !== undefined ? KEYS.indexOf(lastKey) : -1;
  // المؤشّر: في السطر الأول لحد التشكيل، وبعدين ينزل لسطر الجملة، وبعد Enter يختفي
  const onTag = t >= TAG_A - 0.25;
  const curTarget = onTag ? tagEdge(t) : edge;
  // نطّة المؤشّر لمكانه الجديد ناعمة (60 ملي ثانية)
  const prevKey = onTag ? TAG_A + (Math.floor((t - TAG_A) / TAG_DT) - 1) * TAG_DT : lastKey ?? 0;
  const jump = p(t, onTag ? Math.max(TAG_A - 0.25, prevKey + TAG_DT) : lastKey ?? 0, 0.06, ease);
  const curX = onTag ? curTarget : lerp(lastIdx >= 0 ? CUTS[lastIdx] : CUTS[0], curTarget, jump);
  const curY0 = onTag ? 112 : 20;
  const curH = onTag ? 34 : 118;
  const typing = (lastKey !== undefined && t - lastKey < 0.35) || (t >= TAG_A - 0.1 && t < TAG_END + 0.1) || MARK_KEYS.some((k) => t >= k && t - k < 0.2);
  const blinkOn = typing || Math.floor(t * 2.2) % 2 === 0;
  const curVisible = t >= 0.2 && t < ENTER - 0.02;
  // ومضة صفرا على آخر حرف اتكتب
  const flash = lastKey !== undefined && t - lastKey < 0.14 ? 1 : 0; // أصفر لحظة مع الضغطة، وبعدين أسود على طول
  // كل ضغطة: الكاميرا تنط نطة صغيرة جدًا
  const kick = KEYS.reduce((a, k) => a + (t >= k ? 0.006 * Math.exp(-(t - k) * 14) : 0), 0);
  // الكاميرا: تبدأ قريبة على الكلمة وتمشي مع المؤشّر، وبعد Enter تفتح على الشعار كله
  const open = p(t, ENTER - 0.1, 0.9, easeInOut);
  const U = LOGO_W / 450;
  const focusX = lerp(lerp(220, 120, p(t, 0.4, 1.6, easeInOut)), 225, open);
  const zoom = lerp(1.32, 1, open) + kick;
  const camX = -(focusX - 225) * U * zoom;
  const enter = spring(ENTER, { damping: 11, stiffness: 190, mass: 0.7 });
  const ring = p(t, ENTER + 0.05, 0.8, expoOut);
  return (
    <Stage bg={`radial-gradient(ellipse at 50% 45%, #FFFFFF 0%, ${K.offwhite} 72%)`} vignette={0.12} grain={0.05}>
      {KEYS.map((k, i) => (
        <Sfx key={i} at={k} name="click" vol={0.55 + (i % 2) * 0.08} />
      ))}
      {MARK_KEYS.map((k, i) => (
        <Sfx key={`m${i}`} at={k} name="tick" vol={0.42} />
      ))}
      <Sfx at={TAG_A} name="type" vol={0.6} />
      <Sfx at={ENTER - 0.02} name="click" vol={0.7} />
      <Sfx at={ENTER} name="pop_lo" vol={0.55} />
      <Sfx at={ENTER + 0.25} name="chime" vol={0.5} />
      <Center x={camX} scale={zoom}>
        <Logo
          width={LOGO_W}
          defs={
            <>
              <clipPath id="typed">
                <rect x={edge} y={-60} width={360} height={260} />
              </clipPath>
              <clipPath id="lastLetter">
                <rect x={lastIdx >= 0 ? CUTS[lastIdx + 1] : 400} y={-60} width={lastIdx >= 0 ? CUTS[lastIdx] - CUTS[lastIdx + 1] : 0} height={260} />
              </clipPath>
              <clipPath id="tagTyped">
                <rect x={tagEdge(t)} y={100} width={300} height={60} />
              </clipPath>
            </>
          }
          part={(pt) => {
            if (pt.id === "circle" || pt.id === "cup" || pt.id === "hat") {
              if (t < ENTER) return { hidden: true };
              return { scale: Math.max(0.01, Math.min(1.08, enter)), origin: `${CIRCLE.cx - pt.box.x}px ${CIRCLE.cy - pt.box.y}px` };
            }
            if (pt.id === "word") return { hidden: true };
            const mi = MARKS.findIndex((m) => m.id === pt.id);
            if (mi >= 0) {
              const k = p(t, MARK_KEYS[mi], 0.3, backOut);
              return k <= 0 ? { hidden: true } : { scale: lerp(0.3, 1, k), opacity: Math.min(1, k * 3) };
            }
            const ti = TAG.findIndex((m) => m.id === pt.id);
            if (ti >= 0) return t < TAG_A ? { hidden: true } : { clip: "url(#tagTyped)" };
            return {};
          }}
          over={
            <>
              {/* الكلمة لحد آخر حرف اتكتب، وآخر حرف بيلمع أصفر وبيبهت */}
              <path d={WORD.d} fill={K.black} clipPath="url(#typed)" />
              {/* آخر حرف: أصفر صافي لحظة وبعدين يرجع أسود (من غير ما يعدّي على لون بني) */}
              {flash > 0 && lastIdx >= 0 && (
                <g clipPath="url(#lastLetter)">
                  <path d={WORD.d} fill={K.offwhite} opacity={Math.min(1, flash * 2)} />
                  <path d={WORD.d} fill={K.amber} opacity={flash} />
                </g>
              )}
              {/* المؤشّر */}
              {curVisible && blinkOn && <rect x={curX - 3.2} y={curY0} width={2.4} height={curH} rx={1.2} fill={K.blue} />}
              {/* نبضة Enter */}
              {ring > 0 && ring < 1 && <circle cx={CIRCLE.cx} cy={CIRCLE.cy} r={CIRCLE.r * lerp(0.9, 1.4, ring)} fill="none" stroke={K.blue} strokeWidth={lerp(4, 0.3, ring)} opacity={(1 - ring) * 0.55} />}
            </>
          }
        />
      </Center>
    </Stage>
  );
};

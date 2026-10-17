// 10 · المطاطي (Elastic / jelly)
// خط مطاط رفيع يتمطّ ويطقّ ← الشعار كله ينط منه بفيزيا جيلي (يتمطّ لفوق ويتضغط ويترجرج لحد ما يهدى)
// الكلمة قطعة واحدة متصلة (من هيكل حروفها): بتطلع من خط المطاط وتتمطّ وتترجرج، والموجة بتمشي من اليمين للشمال
// من غير ما الحروف تتقطّع ← لمسة على الدايرة فتترجرج تاني ← ثبات
import React from "react";
import { CIRCLE, Logo, MARKS, TAG, WORD } from "../logo";
import { Center, K, LOGO_W, Sfx, Stage, ease, easeInOut, expoOut, lerp, p, useT } from "../fx";
import { Pt, SKEL, polyLen } from "../strokes";

const BAND = 0.25; // الخط يظهر
const SNAP = 0.85; // يطقّ والشعار ينط
const POKE = 2.85; // لمسة على الدايرة
const BASE = 134.5; // خط القاعدة (وحدات الشعار)

// جيلي: قيمة بتتذبذب حوالين 1 وتهدى (k الثانية من البداية)
const jelly = (k: number, freq = 2.6, damp = 6.5) => (k <= 0 ? 0 : 1 - Math.exp(-damp * k) * Math.cos(2 * Math.PI * freq * k));
const wob = (k: number, amp: number, freq = 3.6, damp = 4) => (k <= 0 ? 0 : amp * Math.exp(-damp * k) * Math.sin(2 * Math.PI * freq * k));

// الكلمة كهيكل متصل: كل نقطة بتتمطّ لفوق من خط القاعدة، والتأخير بيزيد من اليمين للشمال (موجة)
const SEGS: Pt[][] = SKEL.word.moves.filter((m) => !m.lift && polyLen(m.pts as Pt[]) > 1).map((m) => m.pts as Pt[]);
const THICK = SKEL.word.half * 2;
const ORIGIN = 95; // خط قاعدة الحروف
const delayAt = (x: number) => 0.08 + ((292 - x) / 292) * 0.3;

export const L10Elastic: React.FC = () => {
  const t = useT();
  const k = t - SNAP;
  // الخط: يظهر من النص ويتمطّ عرض، وبعدين يطقّ (يختفي وهو بيتشد)
  const bandW = lerp(0, 1, p(t, BAND, 0.5, expoOut)) * lerp(1, 1.12, p(t, BAND + 0.45, 0.15, ease));
  const bandOn = t >= BAND && t < SNAP + 0.04;
  // الرمز: يتمطّ لفوق من القاعدة
  const sy = (delay: number) => Math.max(0.02, jelly(k - delay));
  const sx = (y: number) => Math.min(1.18, Math.max(0.86, y > 0.05 ? 1 / Math.sqrt(y) : 1)); // الحجم ثابت تقريبًا
  const poke = t - POKE;
  const pokeSq = poke > 0 ? wob(poke, 0.16, 3.4, 4.5) : 0;
  const cam = lerp(1.06, 1, p(t, 0, 4, easeInOut));
  // بعد ما الرجرجة تهدى: الكلمة الأصلية بالظبط
  const solid = p(t, SNAP + 1.55, 0.2);
  return (
    <Stage bg={`radial-gradient(ellipse at 50% 45%, #FFFFFF 0%, ${K.offwhite} 72%)`} vignette={0.12} grain={0.05}>
      {/* ظل أرضي بيتفاعل مع الرجرجة */}
      <div style={{ position: "absolute", left: "50%", top: 700, width: 1300, height: 70, transform: `translateX(-50%) scaleX(${Math.min(1.2, 0.3 + 0.7 * Math.min(1, Math.max(0, k * 3)))})`, background: "radial-gradient(ellipse at center, rgba(31,61,99,0.18) 0%, rgba(31,61,99,0) 70%)", opacity: t > SNAP ? 1 : 0 }} />
      <Sfx at={BAND} name="stretch" vol={0.55} />
      <Sfx at={SNAP - 0.02} name="snap" vol={0.55} />
      <Sfx at={SNAP} name="boing" vol={0.65} />
      <Sfx at={SNAP + 0.38} name="thud" vol={0.4} />
      <Sfx at={SNAP + 0.45} name="pop" vol={0.3} />
      <Sfx at={POKE - 0.03} name="pop_lo" vol={0.5} />
      <Sfx at={POKE} name="boing" vol={0.35} rate={1.25} />
      <Sfx at={POKE + 0.5} name="chime" vol={0.5} />
      <Center scale={cam}>
        <Logo
          width={LOGO_W}
          part={(pt) => {
            if (t < SNAP) return { hidden: true };
            if (pt.id === "circle" || pt.id === "cup" || pt.id === "hat") {
              // من تحت الدايرة، ومعاها اللمسة
              const lag = pt.id === "hat" ? 0.06 : pt.id === "cup" ? 0.03 : 0;
              const y = sy(lag) * (1 - pokeSq);
              const org = `${CIRCLE.cx - pt.box.x}px ${CIRCLE.cy + CIRCLE.r - pt.box.y}px`;
              return { scaleY: y, scaleX: sx(y) * (1 + pokeSq * 0.6), origin: org };
            }
            if (pt.id === "word") return { hidden: true };
            const mi = MARKS.findIndex((m) => m.id === pt.id);
            if (mi >= 0) {
              // النقطة ماشية مع الكلمة اللي تحتها (نفس التمطيط عند نفس x) + نطّة صغيرة
              const cx = pt.box.x + pt.box.w / 2;
              const cy = pt.box.y + pt.box.h / 2;
              const s = sy(delayAt(cx) + 0.12);
              return { y: ORIGIN + (cy - ORIGIN) * s - cy + wob(k - delayAt(cx) - 0.12, -3, 2.6, 4), scaleY: Math.max(0.05, Math.min(1.25, s)), scaleX: sx(s) };
            }
            const ti = TAG.findIndex((m) => m.id === pt.id);
            if (ti >= 0) {
              const y = sy(0.5 + ti * 0.012);
              return { scaleY: y, origin: `${(pt.box.w / 2).toFixed(1)}px ${(BASE + 14 - pt.box.y).toFixed(1)}px` };
            }
            return {};
          }}
          over={
            <>
              {/* الكلمة: قطعة واحدة متصلة بتتمطّ وتترجرج (والموجة ماشية من اليمين) */}
              {t >= SNAP && solid < 1 && (
                <g opacity={1 - solid}>
                  {SEGS.map((seg, i) => {
                    const d = `M ${seg.map((q) => `${q[0].toFixed(2)} ${(ORIGIN + (q[1] - ORIGIN) * sy(delayAt(q[0]))).toFixed(2)}`).join(" L ")}`;
                    return <path key={i} d={d} fill="none" stroke={K.black} strokeWidth={THICK} strokeLinecap="round" strokeLinejoin="round" />;
                  })}
                </g>
              )}
              {solid > 0 && <path d={WORD.d} fill={K.black} opacity={solid} />}
              {/* الخط المطاط */}
              {bandOn && (
                <g>
                  <rect x={225 - 230 * bandW} y={ORIGIN - 3 - (t > SNAP - 0.15 ? 1.5 * Math.sin((t - SNAP + 0.15) * 60) : 0)} width={460 * bandW} height={6} rx={3} fill={K.black} />
                  <circle cx={225 - 230 * bandW} cy={ORIGIN} r={4.6} fill={K.amber} />
                  <circle cx={225 + 230 * bandW} cy={ORIGIN} r={4.6} fill={K.amber} />
                </g>
              )}
            </>
          }
        />
      </Center>
    </Stage>
  );
};

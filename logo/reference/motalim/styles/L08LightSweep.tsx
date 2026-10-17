// 08 · اللمعة (Light sweep) — نسخة نضيفة
// خلفية فاتحة هادية (زي باقي ستايلات متعلم) ← الشعار يظهر بهدوء ← شريط ضوء واحد مايل يعدّي على الشعار بس
// من اليمين للشمال، ووراه خط لمعة رفيع (على الحروف السودا بتبان فضي، وعلى الدايرة سماوي) ← ثبات على الشعار الأصلي
import React from "react";
import { AbsoluteFill } from "remotion";
import { ALL_PARTS, Logo, VIEW } from "../logo";
import { Center, K, LOGO_W, Sfx, Stage, ease, easeInOut, lerp, p, useT } from "../fx";

const IN = { a: 0.15, d: 0.9 }; // ظهور الشعار
const SWEEP = { a: 1.1, d: 1.5 }; // اللمعة
const ANGLE = 22; // ميل الشريط
const DONE = SWEEP.a + SWEEP.d;

// alpha: نسخة من غير خلفية (للتصدير بشفافية وتتحط فوق أي فيديو)
export const L08LightSweep: React.FC<{ alpha?: boolean }> = ({ alpha = false }) => {
  const t = useT();
  const kin = p(t, IN.a, IN.d, ease);
  // سرعة شبه ثابتة على الشعار كله (بداية ونهاية ناعمين بس)
  const ks = p(t, SWEEP.a, SWEEP.d, (q) => 0.8 * q + 0.2 * easeInOut(q));
  // مكان الشريط بوحدات الشعار (من برا اليمين لبرا الشمال)
  const x = lerp(VIEW.w + 70, -90, ks);
  const breath = 1 + 0.012 * Math.sin(Math.min(1, ks) * Math.PI);
  const U = LOGO_W / 450;
  const on = ks > 0 && ks < 1;
  const cam = lerp(1.04, 1, p(t, 0, DONE + 0.6, easeInOut));
  return (
    <Wrap alpha={alpha}>
      <Sfx at={IN.a} name="swell" vol={0.28} />
      <Sfx at={SWEEP.a - 0.05} name="whoosh_hi" vol={0.45} />
      <Sfx at={SWEEP.a + 0.2} name="shimmer" vol={0.38} />
      <Sfx at={DONE - 0.05} name="chime" vol={0.45} />
      {/* توهّج خفيف ورا الشعار ماشي مع الضوء */}
      {on && !alpha && <div style={{ position: "absolute", left: 960 + (x - 225) * U - 420, top: 540 - 300, width: 840, height: 600, borderRadius: "50%", background: "radial-gradient(ellipse at center, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0) 65%)", opacity: Math.sin(ks * Math.PI) * 0.9 }} />}
      <Center y={lerp(10, 0, kin)} scale={cam * breath}>
        <Logo
          width={LOGO_W}
          style={{ opacity: kin, filter: kin < 1 ? `blur(${(1 - kin) * 5}px)` : undefined }}
          defs={
            <>
              <clipPath id="ls2Shapes">
                {ALL_PARTS.filter((q) => q.id !== "cup" && q.id !== "hat").map((q) => (
                  <path key={q.id} d={q.d} />
                ))}
              </clipPath>
              {/* الشريط العريض: ناعم من الأطراف */}
              <linearGradient id="ls2Wide" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
                <stop offset="0.3" stopColor="#ffffff" stopOpacity="0.45" />
                <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.95" />
                <stop offset="0.7" stopColor="#ffffff" stopOpacity="0.45" />
                <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
              </linearGradient>
              {/* خط اللمعة الرفيع */}
              <linearGradient id="ls2Thin" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
                <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.95" />
                <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
              </linearGradient>
            </>
          }
          over={
            on ? (
              <g clipPath="url(#ls2Shapes)" style={{ mixBlendMode: "screen" }}>
                <rect x={x - 48} y={-60} width={96} height={280} fill="url(#ls2Wide)" transform={`rotate(${ANGLE} ${x} 75)`} />
                <rect x={x + 44} y={-60} width={11} height={280} fill="url(#ls2Thin)" transform={`rotate(${ANGLE} ${x + 50} 75)`} />
              </g>
            ) : null
          }
        />
      </Center>
    </Wrap>
  );
};

const Wrap: React.FC<{ alpha: boolean; children: React.ReactNode }> = ({ alpha, children }) =>
  alpha ? (
    <AbsoluteFill>{children}</AbsoluteFill>
  ) : (
    <Stage bg={`radial-gradient(ellipse at 50% 46%, #FFFFFF 0%, #F7F6F2 45%, ${K.offwhite} 100%)`} vignette={0.1} grain={0.035}>
      {children}
    </Stage>
  );

export const L08LightSweepAlpha: React.FC = () => <L08LightSweep alpha />;

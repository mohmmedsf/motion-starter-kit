// 11 · الشعار شخصية (Logo as a character)
// الدايرة بتبص من طرف الكادر ← تتكوّر وتنط لجوه بقوس، 3 نطّات بتقل (ضغط ومط، وضل بيكبر ويصغر)
// ← تصحى: عينين تفتح وترمش، والقبعة تترفع زي التحية، وتبص للشمال ← «متعلم» تطلع بزنبرك
// والتشكيل ينزل حتة حتة، والجملة تزحف ← نطّة رضا والعينين تقفل وتختفي ← الشعار الأصلي بالظبط
import React from "react";
import { Html5Audio, Sequence, staticFile } from "remotion";
import { CIRCLE, CUP, HAT, Logo, MARKS, TAG } from "../logo";
import { Center, K, LOGO_W, Sfx, Stage, ease, easeIn, easeInOut, expoOut, f, lerp, p, rndRange, useSpring, useT } from "../fx";

const { cx: CX, cy: CY, r: R } = CIRCLE;
const FLOOR = CY + R; // الأرض = تحت الدايرة
const G = 3600; // الجاذبية (وحدة شعار / ث²)
const PI = Math.PI;
const deg = (rad: number) => (rad * 180) / PI;

// نطّة: تبدأ عند t0 بأقصى ارتفاع h، ومدتها محسوبة من الجاذبية (كل النطّات نفس الفيزيا)
const flight = (t0: number, h: number) => ({ t0, h, t1: t0 + Math.sqrt((8 * h) / G) });
const F1 = flight(0.78, 100);
const F2 = flight(F1.t1 + 0.1, 44);
const F3 = flight(F2.t1 + 0.066, 13);
const HOP = flight(3.97, 12); // نطّة الرضا
const FLIGHTS = [F1, F2, F3, HOP];
const LAND = F3.t1; // آخر نزول (≈1.95)
const VY0 = (4 * F1.h) / (F1.t1 - F1.t0); // أعلى سرعة رأسية (للمط)

const X_PEEK = 606; // بتبص من طرف الكادر
const X0 = X_PEEK + 7; // بترجع لورا شوية قبل ما تنط
const XSTOP = 2.1; // توقف في مكانها
const END = 4.36; // من هنا الشعار الأصلي بالظبط

// العينين جوه الكوباية (الحتة الزرقا تحت السنّة)
const EYES = [363, 387.4];
const EYE_Y = 98;
const EYE_RX = 4.6;
const EYE_RY = 6.6;

// التشكيل بيتحط واحدة واحدة (من اليمين للشمال)
const MARK_LAND = (i: number) => 3.36 + i * 0.08;
const TAG_START = 3.58;
const WORD_AT = 3.1;
const EYES_AT = 2.28;
const TIP_UP = 2.76;
const TIP_DOWN = 3.0;

// قيم بمفاتيح زمنية (كل مقطع بـ easeInOut)
const keys = (t: number, k: [number, number][], e: (x: number) => number = easeInOut) => {
  if (t <= k[0][0]) return k[0][1];
  for (let i = 1; i < k.length; i++) if (t <= k[i][0]) return lerp(k[i - 1][1], k[i][1], e((t - k[i - 1][0]) / (k[i][0] - k[i - 1][0])));
  return k[k.length - 1][1];
};
// أول فريم بعد لحظة s (علشان الصوت ييجي مع الفريم اللي بيلمس فيه بالظبط)
const cue = (s: number) => Math.ceil(s * 30 - 1e-6) / 30;
// نبضة ناعمة 0→1→0 بين a و a+d
const bump = (t: number, a: number, d: number) => (t <= a || t >= a + d ? 0 : Math.sin((PI * (t - a)) / d));
// اهتزاز مضمحل بعد لحظة ta
const decay = (t: number, ta: number, hz: number, k: number) => (t <= ta ? 0 : Math.exp(-k * (t - ta)) * Math.sin(2 * PI * hz * (t - ta)));

// المكان الأفقي: بتبص، ترجع لورا، وبعدين تتحرك لمكان الشعار وسرعتها بتقل مع كل نطّة
const xAt = (t: number) => {
  if (t < F1.t0) return lerp(664, X_PEEK, p(t, 0, 0.5, ease)) + (X0 - X_PEEK) * p(t, 0.56, F1.t0 - 0.56, easeInOut);
  const q = Math.min(1, (t - F1.t0) / (XSTOP - F1.t0));
  return CX + (X0 - CX) * (1 - q) ** 2;
};
const vxAt = (t: number) => {
  if (t < F1.t0 || t >= XSTOP) return 0;
  const q = (t - F1.t0) / (XSTOP - F1.t0);
  return (-2 * (X0 - CX) * (1 - q)) / (XSTOP - F1.t0);
};
const VX0 = Math.abs(vxAt(F1.t0));

// الارتفاع والسرعة الرأسية (لفوق = موجب)
const airAt = (t: number) => {
  for (const fl of FLIGHTS) {
    if (t > fl.t0 && t < fl.t1) {
      const T = fl.t1 - fl.t0;
      const u = (t - fl.t0) / T;
      return { h: 4 * fl.h * u * (1 - u), vy: (4 * fl.h * (1 - 2 * u)) / T };
    }
  }
  return { h: 0, vy: 0 };
};

// الضغط على الأرض (+ = مضغوطة لتحت، - = ممطوطة لفوق)، والمساحة ثابتة
const squashAt = (t: number, env: number) => {
  let s = 0;
  s += 0.016 * Math.sin(2 * PI * 1.6 * t) * (1 - p(t, 0.4, 0.15)); // نَفَس وهي بتبص
  if (t < F1.t0) s += 0.17 * p(t, 0.56, F1.t0 - 0.56, easeInOut); // تتكوّر قبل النطّة
  const contact = (a: number, b: number, A: number) => (t >= a && t <= b ? A * Math.sin(PI * ((t - a) / (b - a)) ** 0.6) : 0);
  s += contact(F1.t1, F2.t0, 0.18);
  s += contact(F2.t1, F3.t0, 0.12);
  if (t >= LAND) s += 0.1 * Math.exp(-6 * (t - LAND)) * Math.cos(2 * PI * 3 * (t - LAND)); // آخر نزول يتهز ويهدى
  s += -0.035 * bump(t, EYES_AT - 0.06, 0.34); // تصحى: تتمط لفوق
  s += 0.022 * bump(t, TIP_UP - 0.1, 0.12) - 0.03 * bump(t, TIP_UP, 0.24); // مع رفعة القبعة
  s += 0.02 * bump(t, 2.96, 0.2); // وهي بتلف تبص
  if (t < HOP.t0) s += 0.09 * p(t, 3.86, HOP.t0 - 3.86, easeInOut); // تتكوّر قبل نطّة الرضا
  if (t >= HOP.t1) s += 0.07 * Math.exp(-9 * (t - HOP.t1)) * Math.cos(2 * PI * 3.4 * (t - HOP.t1)) * env;
  return s;
};

// الميل (درجات، سالب = راسها للشمال): تبص، تتراجع، تميل لقدّام في الطيران، وتكمّل بعد كل نزول
const leanBase = (t: number) => {
  let l = keys(t, [
    [0, -4],
    [0.42, -14],
    [0.56, -12.5],
    [0.76, 6],
    [0.92, 0],
  ]);
  l += -10 * (-vxAt(t) / VX0) * p(t, 0.74, 0.16);
  l += -7 * decay(t, F1.t1, 2.2, 6) - 4.5 * decay(t, F2.t1, 2.4, 6) - 5 * decay(t, LAND, 2.2, 5);
  return l;
};

// بيانات الحركة كلها في لحظة t
const useRig = (t: number) => {
  const spring = useSpring();
  const env = 1 - p(t, 4.16, END - 4.16, easeInOut); // كل حاجة ترجع للسكون بالظبط
  // تبص للشمال وبعدين ترجع تبص لينا
  const lookOn = spring(2.98, { damping: 12, stiffness: 110 });
  const lookOff = spring(3.84, { damping: 13, stiffness: 120 });
  const acting = (lean: number) => lean * lookOn * (1 - lookOff) * env;
  const leanAt = (tt: number) => leanBase(tt) + acting(-6.5) - 1.2 * bump(tt, 3.5, 0.3) * env;
  const lean = leanAt(t);

  const x = xAt(t);
  const { h, vy } = airAt(t);
  const vx = vxAt(t);
  // المط في اتجاه الحركة وقت الطيران
  const st = 1 + 0.2 * Math.min(1, Math.abs(vy) / VY0);
  const sp = Math.hypot(vx, vy);
  const phi = sp > 1 ? Math.atan2(-vx / sp, -vy / sp) : 0;
  const e = R * Math.hypot(st * Math.cos(phi), Math.sin(phi) / st); // نص الارتفاع بعد المط
  const sq = squashAt(t, env);
  const sqy = 1 - sq;
  const sqx = 1 / sqy;
  const roll = R * (lean * PI / 180) * 0.5; // الميل بيزق الجسم شوية زي الكورة
  const bx = x + roll;

  // القبعة: بتتنطط على الراس بعد كل خبطة، وبتتلف شوية، ورفعة التحية
  const hatEv: [number, number, number][] = [
    [F1.t0 + 0.02, 3, 3],
    [F1.t1, 7, -4],
    [F2.t1, 3.6, 3],
    [LAND, 2, -2.5],
    [TIP_DOWN + 0.1, 2.2, 3.5],
    [HOP.t1, 2.2, -2.5],
  ];
  let hatUp = 0;
  let hatRot = 0;
  for (const [ta, A, B] of hatEv) {
    if (t <= ta) continue;
    const tau = t - ta;
    hatUp += A * Math.exp(-7 * tau) * Math.abs(Math.sin(2 * PI * 3 * tau));
    hatRot += B * Math.exp(-6 * tau) * Math.sin(2 * PI * 2.6 * tau);
  }
  hatRot += (leanAt(t - 0.07) - lean) * 0.6; // متأخرة ورا الراس
  const tip = p(t, TIP_UP, 0.16, expoOut) * (1 - p(t, TIP_DOWN, 0.1, easeIn));
  hatUp = (hatUp + 7.5 * tip) * env;
  hatRot *= env;
  const hatTip = 13 * tip;

  // العينين
  const open = spring(EYES_AT, { damping: 9, stiffness: 190 });
  const blink = 1 - 0.93 * bump(t, 2.6, 0.17);
  const happy = p(t, 3.9, 0.12, easeInOut);
  const fade = 1 - p(t, 4.08, 0.22, easeInOut);
  const lookX = keys(t, [
    [2.96, 0],
    [3.05, -3.4],
    [3.3, -3.4],
    [3.36, -2.4],
    [3.56, -3.4],
    [3.66, -4.2],
    [3.74, -3.6],
    [3.84, -3.6],
    [3.93, 0],
  ]);
  const lookY = keys(t, [
    [3.2, 0],
    [3.27, -2.2],
    [3.64, -2.2],
    [3.72, 1.6],
    [3.84, 1.6],
    [3.93, 0],
  ]);

  return { env, lean, bx, h, vx, vy, sp, st, phi, e, sqx, sqy, hatUp, hatRot, hatTip, open, blink, happy, fade, lookX, lookY };
};

// مؤثر بطبقة صوت (للتشكيل: كل حتة أعلى من اللي قبلها)
const Tone: React.FC<{ at: number; name: string; vol: number; tone: number }> = ({ at, name, vol, tone }) => (
  <Sequence from={f(at)} layout="none" name={`sfx:${name}`}>
    <Html5Audio src={staticFile(`sfx/${name}.wav`)} volume={vol} toneFrequency={tone} />
  </Sequence>
);

export const L11Character: React.FC = () => {
  const t = useT();
  const spring = useSpring();
  const rig = useRig(t);
  const { env, lean, bx, h, vx, vy, sp, st, phi, e, sqx, sqy } = rig;
  const done = t >= END;

  // الكاميرا: قريبة شوية وبتبعد بهدوء، وبعد الثبات نَفَس 0.4%
  const cam = lerp(1.045, 1, p(t, 0, 4.3, easeInOut));
  const breath = 1 + 0.004 * Math.sin((2 * PI * (t - END)) / 2.6) * p(t, END, 0.8);

  // الضل على الأرض: بيصغر ويخف كل ما الكورة تعلى، ويختفي مع الثبات
  const hk = Math.min(1, h / F1.h);
  const shFade = 1 - p(t, 4.06, 0.3, easeInOut);

  // بلور الحركة في اتجاه السرعة (وحدات شعار)
  const mb = Math.min(3.2, (sp / 30) * 0.1);
  const beta = deg(Math.atan2(-vy, vx));
  const pc = { x: bx, y: FLOOR - h - e };

  const pd = deg(phi);
  const body = `translate(${bx} ${FLOOR - h}) scale(${sqx} ${sqy}) translate(0 ${-e}) rotate(${pd}) scale(${1 / st} ${st}) rotate(${-pd}) rotate(${lean}) translate(${-CX} ${-CY})`;
  const hatTr = `translate(0 ${-rig.hatUp}) rotate(${rig.hatRot} 375.2 47) rotate(${rig.hatTip} 401 47.5)`;

  // الكلمة: زنبرك من ناحية الشخصية (العرض يسبق الطول شوية)
  const wsx = spring(WORD_AT, { damping: 16, stiffness: 170, mass: 0.9 });
  const wsy = spring(WORD_AT + 0.05, { damping: 13, stiffness: 180, mass: 0.9 });

  const eyesOn = !done && t >= EYES_AT && rig.fade > 0;

  return (
    <Stage bg={`radial-gradient(ellipse 75% 70% at 58% 50%, #FFFFFF 0%, #F8F7F4 40%, ${K.offwhite} 78%)`} vignette={0.1} grain={0.04}>
      {/* بقعة نور دافية على الأرض */}
      <div
        style={{
          position: "absolute",
          left: 420 + CX * 2.4 - 520,
          top: 360 + FLOOR * 2.4 - 70,
          width: 1040,
          height: 140,
          borderRadius: "50%",
          background: "radial-gradient(ellipse at center, rgba(255,179,0,0.06) 0%, rgba(255,179,0,0) 70%)",
          opacity: shFade,
        }}
      />
      <Sfx at={F1.t0 - 0.02} name="boing" vol={0.42} />
      <Sfx at={cue(F1.t1)} name="thud" vol={0.8} />
      <Sfx at={cue(F2.t1)} name="thud" vol={0.48} />
      <Sfx at={cue(LAND)} name="thud" vol={0.26} />
      <Sfx at={EYES_AT} name="pop_hi" vol={0.38} />
      <Sfx at={2.667} name="tick" vol={0.34} />
      <Sfx at={TIP_UP} name="stretch" vol={0.22} rate={1.5} />
      <Sfx at={WORD_AT} name="pop" vol={0.45} />
      {MARKS.map((m, i) => (
        <Tone key={m.id} at={cue(MARK_LAND(i))} name="pop_lo" vol={0.2} tone={1 + i * 0.06} />
      ))}
      <Sfx at={TAG_START} name="slide" vol={0.28} />
      <Sfx at={cue(HOP.t1)} name="chime" vol={0.5} />
      <Sfx at={cue(HOP.t1) + 0.07} name="sparkle" vol={0.14} />
      <Center scale={cam * breath} y={4 * decay(t, F1.t1, 4, 9)}>
        <Logo
          width={LOGO_W}
          defs={
            <>
              <filter id="shSoft" x="-50%" y="-300%" width="200%" height="700%">
                <feGaussianBlur stdDeviation="4" />
              </filter>
              <filter id="shCore" x="-50%" y="-300%" width="200%" height="700%">
                <feGaussianBlur stdDeviation="1.6" />
              </filter>
              <filter id="moBlur" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation={`${mb} 0`} />
              </filter>
            </>
          }
          under={
            shFade > 0 && (
              <g>
                <ellipse cx={bx} cy={FLOOR + 1.6} rx={R * 0.98 * sqx * (1 - 0.45 * hk)} ry={7.5 * (1 - 0.35 * hk)} fill={K.navy} opacity={0.2 * (1 - 0.7 * hk) * shFade} filter="url(#shSoft)" />
                <ellipse cx={bx} cy={FLOOR + 0.6} rx={R * 0.6 * sqx * (1 - 0.5 * hk)} ry={2.8} fill={K.navy} opacity={0.3 * (1 - hk) ** 2 * shFade} filter="url(#shCore)" />
              </g>
            )
          }
          part={(pt) => {
            if (done) return undefined;
            if (pt.id === "circle" || pt.id === "cup" || pt.id === "hat") return { hidden: true };
            if (pt.id === "word") {
              if (t < WORD_AT) return { hidden: true };
              return { opacity: p(t, WORD_AT, 0.07), scaleX: 1 + (wsx - 1) * env, scaleY: lerp(0.45, 1, 1 + (wsy - 1) * env), origin: "100% 72%" };
            }
            const mi = MARKS.findIndex((m) => m.id === pt.id);
            if (mi >= 0) {
              const tl = MARK_LAND(mi);
              const t0 = tl - 0.2;
              if (t < t0) return { hidden: true };
              const u = Math.min(1, (t - t0) / 0.2);
              const tau = t - tl;
              const w = Math.min(1, Math.max(0, tau / 0.15));
              // قوس صغير من ناحية الشخصية (يمين) لمكانها، وبعدين نطّة صغيرة
              const x = tau < 0 ? 16 * (1 - u) : 0;
              const y = tau < 0 ? -30 * (1 - u * u) : -3.2 * 4 * w * (1 - w);
              const sq = tau < 0 ? -0.1 * u : 0.24 * Math.max(0, 1 - tau / 0.07) + 0.07 * bump(t, tl + 0.15, 0.07);
              return {
                x,
                y,
                scaleY: 1 - sq,
                scaleX: 1 / (1 - sq),
                origin: "50% 100%",
                rotate: rndRange(`mk${mi}`, -14, 14) * (1 - easeInOut(u)),
                opacity: p(t, t0, 0.07),
              };
            }
            const ti = TAG.findIndex((m) => m.id === pt.id);
            if (ti >= 0) {
              const k = p(t, TAG_START + ti * 0.018, 0.42, expoOut);
              if (k <= 0) return { hidden: true };
              return { x: 16 * (1 - k), opacity: Math.min(1, k * 1.6), blur: 1.2 * (1 - k) };
            }
            return undefined;
          }}
          over={
            !done && (
              <g transform={`rotate(${beta} ${pc.x} ${pc.y})`}>
                <g filter={mb > 0.25 ? "url(#moBlur)" : undefined}>
                  <g transform={`rotate(${-beta} ${pc.x} ${pc.y})`}>
                    <g transform={body}>
                      <circle cx={CX} cy={CY} r={R} fill={K.blue} />
                      <path d={CUP.d} fill={K.white} />
                      {eyesOn && (
                        <g opacity={rig.fade}>
                          {EYES.map((ex, i) => {
                            const sy = Math.max(0.02, rig.open * rig.blink * (1 - 0.92 * rig.happy));
                            const sx = Math.min(1.1, 0.55 + 0.45 * rig.open) * (1 - 0.06 * Math.abs(rig.lookX) / 4);
                            const s = 0.6 + 0.4 * rig.fade;
                            return (
                              <g key={i} transform={`translate(${ex + rig.lookX * (i === 0 ? 1 : 0.9)} ${EYE_Y + rig.lookY}) scale(${s})`}>
                                <ellipse rx={EYE_RX * sx} ry={EYE_RY * sy} fill={K.white} opacity={1 - rig.happy} />
                                {rig.happy > 0 && <path d="M -4.6 2 Q 0 -4.6 4.6 2" fill="none" stroke={K.white} strokeWidth={2.7} strokeLinecap="round" opacity={rig.happy} />}
                              </g>
                            );
                          })}
                        </g>
                      )}
                      <path d={HAT.d} fill={K.white} transform={hatTr} />
                    </g>
                  </g>
                </g>
              </g>
            )
          }
        />
      </Center>
    </Stage>
  );
};

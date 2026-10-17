// 15 · النيون (Neon)
// حيطة كحلي غامقة بالليل وأنابيب زجاج مطفية باينة بالعافية ← الدايرة تولّع برعشة نيون حقيقية ← الكوباية والقبعة
// ← «متعلم» والنقط ← الجملة ← شرارة (zap) ورعشة في الإشارة كلها ← الإشارة «تشحن» والألوان تتملي جوه الأنابيب
// ← الشعار الأصلي (ثيم غامق) بهالة خفيفة، والطنين الهادي مكمّل للآخر
import React from "react";
import { AbsoluteFill, Html5Audio, Sequence, interpolate, interpolateColors, staticFile, useCurrentFrame } from "remotion";
import { ALL_PARTS, Logo, MARKS, Part, TAG, VIEW } from "../logo";
import { Center, FPS, K, LOGO_W, Sfx, Stage, U, clamp, ease, easeIn, easeInOut, lerp, noise1, p, rnd, rndRange } from "../fx";

// ---------------- التوقيت (بالفريم) ----------------
const F = { circle: 10, mark: 30, word: 44, tag: 62, zap: 84, power: 100, blip: 163 };
const PU = F.power / FPS; // الإشارة تشحن (الألوان تتملي)

// أنماط الرعشة فريم بفريم (بعد آخر خانة الأنبوبة ثابتة = 1)، متقاسة من نقرات neon_on.wav (كل خانة = 33ms):
// A = الملف من أوله · B = من 0.333ث (trim 10) · C = من 0.1ث (trim 3) · D = من 0.2ث (trim 6)
const PAT = {
  A: [1, 0.5, 0, 0.4, 0.8, 0, 0.4, 0.2, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0.6],
  B: [1, 1, 1, 1, 1, 0, 0, 0.6],
  C: [0.4, 0.8, 0, 0.4, 0.2, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0.6],
  D: [0.4, 0.2, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0.6],
};
// الرعشة الكبيرة مع الـ zap: وهج زيادة ← تطفي ← ترجع
const ZAP = [1.6, 0.25, 0, 0.6, 0.1, 0, 1.25, 1.06];
const flick = (pat: number[], i: number) => (i < 0 ? 0 : i < pat.length ? pat[i] : 1);

// ---------------- الأجزاء ومواصفات الأنابيب ----------------
type G = "circle" | "mark" | "word" | "dot" | "tag";
const grp = (id: string): G => (id === "circle" ? "circle" : id === "cup" || id === "hat" ? "mark" : id === "word" ? "word" : id.startsWith("tag") ? "tag" : "dot");
const MARK_I: Record<string, number> = Object.fromEntries(MARKS.map((m, i) => [m.id, i]));
const TAG_I: Record<string, number> = Object.fromEntries(TAG.map((m, i) => [m.id, i]));

// العرض بوحدات الشعار (1 = 2.4px): قلب أبيض، قلب واسع أبيض شفاف، جسم الأنبوبة (سماوي)، توهج قريب، توهج بعيد (أزرق)، الزجاج المطفي، والهالة الأخيرة
type Spec = { core: number; inner: number; innerOp: number; body: number; bodyOp: number; near: number; nearOp: number; far: number; farOp: number; glass: number; halo: number };
const WHITE_TUBE: Spec = { core: 0.8, inner: 1.4, innerOp: 0.62, body: 2.0, bodyOp: 0.22, near: 2.7, nearOp: 0.54, far: 3.6, farOp: 0.75, glass: 1.5, halo: 0.3 };
const SPEC: Record<G, Spec> = {
  circle: { core: 0.5, inner: 0, innerOp: 0, body: 1.8, bodyOp: 0.95, near: 2.8, nearOp: 0.95, far: 3.8, farOp: 1, glass: 1.6, halo: 0.5 },
  mark: { ...WHITE_TUBE, halo: 0 },
  word: WHITE_TUBE,
  dot: WHITE_TUBE,
  tag: { core: 0.42, inner: 0.8, innerOp: 0.45, body: 1.15, bodyOp: 0.28, near: 1.7, nearOp: 0.5, far: 2.4, farOp: 0.5, glass: 0.9, halo: 0.22 },
};

// إضاءة كل جزء في فريم (0 مطفي، 1 منوّر، أكتر من 1 = وهج زيادة)
const bright = (id: string, fr: number) => {
  const g = grp(id);
  let b: number;
  if (g === "circle") b = flick(PAT.A, fr - F.circle);
  else if (g === "mark") b = flick(PAT.B, fr - F.mark) * (id === "hat" && fr === F.mark ? 0.6 : 1);
  else if (g === "word") b = flick(PAT.C, fr - F.word);
  else if (g === "dot") b = fr - F.word >= 7 + MARK_I[id] ? flick(PAT.C, fr - F.word) : 0; // النقط تنوّر ورا بعض من اليمين
  else {
    b = flick(PAT.D, fr - F.tag);
    if (b > 0 && b < 1) b *= 0.7 + 0.6 * rnd(`tg-${id}`); // نص الإضاءة مش متساوي بين الحروف
  }
  const zi = fr - F.zap - (g === "circle" ? 1 : 0); // الدايرة على دايرة كهربا تانية: متأخرة فريم
  if (zi >= 0 && zi < ZAP.length) b *= ZAP[zi];
  if (id === "tag9") b *= fr === F.blip ? 0.45 : fr === F.blip + 1 ? 0.85 : 1; // رعشة صغيرة واحدة في الثبات
  return b;
};

// التأخير بين الأجزاء وقت الشحن (ثواني)
const delayOf = (id: string) => {
  const g = grp(id);
  if (g === "circle") return 0;
  if (g === "mark") return id === "cup" ? 0.06 : 0.08;
  if (g === "word") return 0.1;
  if (g === "dot") return 0.14 + 0.03 * MARK_I[id];
  return 0.18 + 0.012 * TAG_I[id];
};
const surgeOf = (t: number) => p(t, PU, 0.2, ease) * (1 - p(t, PU + 0.2, 0.8, easeInOut)); // دفعة نور وقت الشحن
const settleOf = (t: number) => p(t, PU + 0.1, 0.85, easeInOut); // النور يهدى للهالة الأخيرة

// تسخين الغاز: بعد آخر رعشة الأنبوبة بتكمّل نورها بالراحة، وفيها حياة خفيفة جدًا (للأنابيب بس، مش للون الأخير)
const IGN_END: Record<G, number> = { circle: F.circle + PAT.A.length, mark: F.mark + PAT.B.length, word: F.word + PAT.C.length, dot: F.word + PAT.C.length, tag: F.tag + PAT.D.length };
const warmOf = (id: string, fr: number) => {
  const i = fr - IGN_END[grp(id)];
  return (i < 0 ? 1 : 1 - 0.12 * Math.exp(-i / 6)) * (1 + 0.02 * noise1(`life-${id}`, fr / 4));
};

type St = { b: number; w: number; tube: number; fill: number };
const stateOf = (pt: Part, fr: number): St => {
  const t = fr / FPS;
  const d = delayOf(pt.id);
  return { b: bright(pt.id, fr), w: warmOf(pt.id, fr), tube: 1 - p(t, PU + d + 0.08, 0.5, easeInOut), fill: p(t, PU + d, 0.5, ease) };
};

// كمية النور اللي طالعة من كل مجموعة (للنور على الحيطة وللصوت)
const GROUPS: Record<string, Part[]> = {
  circle: ALL_PARTS.filter((pt) => grp(pt.id) === "circle"),
  mark: ALL_PARTS.filter((pt) => grp(pt.id) === "mark"),
  word: ALL_PARTS.filter((pt) => grp(pt.id) === "word" || grp(pt.id) === "dot"),
  tag: ALL_PARTS.filter((pt) => grp(pt.id) === "tag"),
};
const emit = (g: string, fr: number) => {
  const t = fr / FPS;
  const list = GROUPS[g];
  const b = list.reduce((s, pt) => s + Math.min(1.6, bright(pt.id, fr)), 0) / list.length;
  return b * (1 + 0.5 * surgeOf(t)) * lerp(1, 0.62, settleOf(t));
};
const level = (fr: number) => 0.3 * emit("circle", fr) + 0.15 * emit("mark", fr) + 0.35 * emit("word", fr) + 0.2 * emit("tag", fr);

// ---------------- أماكن على الشاشة ----------------
const LX = (1920 - LOGO_W) / 2;
const LY = (1080 - (LOGO_W * VIEW.h) / VIEW.w) / 2;
const sx = (x: number) => LX + x * U;
const sy = (y: number) => LY + y * U;
const FLOOR = 828; // خط الأرضية اللامعة تحت الإشارة (بكسل)

// ---------------- شرار الـ zap (من فوق حرف العين) ----------------
const SPARK_O = { x: 137, y: 46.5 };
const SPARKS = Array.from({ length: 14 }, (_, i) => ({
  vx: rndRange(`spx${i}`, -125, 125), // وحدة/ثانية
  vy: rndRange(`spy${i}`, -175, -45),
  life: rndRange(`spl${i}`, 0.25, 0.55),
  w: rndRange(`spw${i}`, 0.5, 0.95),
}));
const GRAV = 520;
const Sparks: React.FC<{ t: number; id: string }> = ({ t, id }) => {
  const tz = t - F.zap / FPS;
  if (tz < 0 || tz > 0.7) return null;
  const pos = (s: (typeof SPARKS)[number], k: number) => ({ x: SPARK_O.x + s.vx * k, y: SPARK_O.y + s.vy * k + 0.5 * GRAV * k * k });
  const flash = 1 - p(tz, 0, 0.12, ease);
  const lines = SPARKS.map((s, i) => {
    if (tz > s.life) return null;
    const a = pos(s, tz);
    const b = pos(s, Math.max(0, tz - 0.045)); // ديل الشرارة (موشن بلور)
    const o = 1 - easeIn(tz / s.life);
    return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={tz < 0.08 ? K.white : K.amber} strokeWidth={s.w} strokeOpacity={o} strokeLinecap="round" />;
  });
  return (
    <g>
      <g filter={`url(#${id}-near)`} style={{ mixBlendMode: "screen" }}>
        {lines}
        <circle cx={SPARK_O.x} cy={SPARK_O.y} r={5} fill={K.white} opacity={0.9 * flash} />
      </g>
      {lines}
      <circle cx={SPARK_O.x} cy={SPARK_O.y} r={1.6} fill={K.white} opacity={flash} />
    </g>
  );
};

// ---------------- الإشارة نفسها ----------------
const REGION = { x: -40, y: -45, width: 530, height: 240, filterUnits: "userSpaceOnUse" as const };

const Sign: React.FC<{ fr: number; id: string; lite?: boolean }> = ({ fr, id, lite }) => {
  const t = fr / FPS;
  const S = ALL_PARTS.map((pt) => stateOf(pt, fr));
  const sg = surgeOf(t);
  const glassK = 1 - p(t, PU + 0.1, 0.55, ease);
  const circleCol = interpolateColors(p(t, PU + 0.05, 0.8, easeInOut), [0, 1], [K.sky, K.blue]);
  const breath = 1 + 0.03 * noise1("hum", t * 0.9); // طنين: الهالة بتتنفس بالراحة

  // طبقة خطوط لكل الأجزاء: fn بترجع [لون، عرض، شفافية] أو null
  const layer = (key: string, filter: string | null, fn: (pt: Part, s: St, sp: Spec) => [string, number, number] | null, screen = false) => (
    <g key={key} filter={filter ? `url(#${id}-${filter})` : undefined} fill="none" strokeLinejoin="round" strokeLinecap="round" style={screen ? { mixBlendMode: "screen" } : undefined}>
      {ALL_PARTS.map((pt, i) => {
        const r = fn(pt, S[i], SPEC[grp(pt.id)]);
        if (!r || r[1] <= 0 || r[2] <= 0.003) return null;
        return <path key={pt.id} d={pt.d} stroke={r[0]} strokeWidth={r[1]} strokeOpacity={Math.min(1, r[2])} />;
      })}
    </g>
  );
  // الإضاءة الفعلية للأنبوبة (بعد الشحن الأنبوبة بتختفي جوه اللون)
  const lit = (s: St) => Math.min(1.6, s.b) * s.w * s.tube;
  const lit1 = (s: St) => Math.min(1, lit(s));
  const over = (b: number) => 1 + 0.6 * Math.max(0, b - 1); // وهج زيادة = خط أعرض
  const glowMul = 1 + 0.45 * sg;

  return (
    <Logo
      width={LOGO_W}
      theme="dark"
      defs={
        <>
          <filter id={`${id}-near`} {...REGION}>
            <feGaussianBlur stdDeviation={1.2} />
          </filter>
          <filter id={`${id}-mid`} {...REGION}>
            <feGaussianBlur stdDeviation={2.6} />
          </filter>
          <filter id={`${id}-far`} {...REGION}>
            <feGaussianBlur stdDeviation={5} />
          </filter>
          <filter id={`${id}-halo`} {...REGION}>
            <feGaussianBlur in="SourceGraphic" stdDeviation={5} result="w" />
            <feGaussianBlur in="SourceGraphic" stdDeviation={1.8} result="n" />
            <feMerge>
              <feMergeNode in="w" />
              <feMergeNode in="n" />
            </feMerge>
          </filter>
        </>
      }
      under={
        <>
          {/* الأنابيب المطفية: زجاج رمادي مزرق ولمعة رفيعة */}
          {glassK > 0 && (
            <g fill="none" opacity={glassK} strokeLinejoin="round">
              {ALL_PARTS.map((pt) => (
                <path key={pt.id} d={pt.d} stroke={K.navy} strokeWidth={SPEC[grp(pt.id)].glass} strokeOpacity={0.9} />
              ))}
              {!lite &&
                ALL_PARTS.map((pt) => (
                  <path key={`h-${pt.id}`} d={pt.d} stroke={K.white} strokeWidth={0.32} strokeOpacity={0.13} transform="translate(-0.25,-0.3)" />
                ))}
            </g>
          )}
          {/* هالة الشكل المليان (بتفضل في الآخر كتوهج خفيف) */}
          <g filter={`url(#${id}-halo)`} style={{ mixBlendMode: "screen" }}>
            {ALL_PARTS.map((pt, i) => {
              const s = S[i];
              const sp = SPEC[grp(pt.id)];
              const o = s.fill * (sp.halo + 0.55 * sg) * breath * Math.min(1, s.b);
              if (sp.halo === 0 || o <= 0.003) return null;
              return <path key={pt.id} d={pt.d} fill={K.sky} fillOpacity={Math.min(1, o)} />;
            })}
          </g>
        </>
      }
      part={(pt, i) => {
        const s = S[i];
        if (s.fill <= 0) return { hidden: true };
        const fb = s.b >= 1 ? 1 : 0.3 + 0.7 * Math.max(0, s.b);
        return { fill: pt.id === "circle" ? circleCol : undefined, fillOpacity: s.fill * fb };
      }}
      over={
        <>
          {layer("far", "far", (pt, s, sp) => [K.blue, sp.far * over(s.b), sp.farOp * lit(s) * glowMul], true)}
          {!lite && layer("mid", "mid", (pt, s, sp) => [K.sky, sp.near * 1.25 * over(s.b), sp.nearOp * 0.55 * lit(s) * glowMul], true)}
          {!lite && layer("near", "near", (pt, s, sp) => [K.sky, sp.near * over(s.b), sp.nearOp * lit(s) * glowMul], true)}
          {layer("body", null, (pt, s, sp) => [K.sky, sp.body, sp.bodyOp * Math.pow(lit1(s), 0.8)])}
          {layer("inner", null, (pt, s, sp) => [K.white, sp.inner * (1 + 0.3 * Math.max(0, s.b - 1)), sp.innerOp * Math.pow(lit1(s), 1.2) * (s.b > 1 ? 1.4 : 1)])}
          {layer("core", null, (pt, s, sp) => [K.white, sp.core * (1 + 0.3 * Math.max(0, s.b - 1)), Math.pow(lit1(s), 1.4)])}
          {!lite && <Sparks t={t} id={id} />}
        </>
      }
    />
  );
};

// ---------------- الحيطة والنور اللي بيقع عليها ----------------
const RGB = { blue: "0,86,210", sky: "0,182,255", white: "255,255,255" };
// بقعة نور ناعمة (تدرج قريب من الجاوسي علشان مايبانش فيه درجات)
const Pool: React.FC<{ x: number; y: number; rx: number; ry: number; c: keyof typeof RGB; a: number }> = ({ x, y, rx, ry, c, a }) => {
  if (a <= 0.001) return null;
  const stops = Array.from({ length: 11 }, (_, i) => {
    const s = i / 10;
    return `rgba(${RGB[c]},${(a * Math.exp(-3.2 * s * s) * (1 - s)).toFixed(4)}) ${Math.round(s * 100)}%`;
  }).join(", ");
  return <AbsoluteFill style={{ background: `radial-gradient(${rx}px ${ry}px at ${x}px ${y}px, ${stops})`, mixBlendMode: "screen" }} />;
};

// ملمس الحيطة: حبيبات ثابتة ناعمة + بقع كبيرة خفيفة (زي المحارة)، وفلتر الانعكاس المسحوب لتحت
const WallTexture: React.FC = () => (
  <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, mixBlendMode: "overlay" }}>
    <defs>
      <filter id="l15-wall-fine" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves={2} seed={11} />
        <feColorMatrix type="matrix" values="1 0 0 0 0  1 0 0 0 0  1 0 0 0 0  0 0 0 0 1" />
      </filter>
      <filter id="l15-wall-big" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.004 0.007" numOctaves={3} seed={4} />
        <feColorMatrix type="matrix" values="1 0 0 0 0  1 0 0 0 0  1 0 0 0 0  0 0 0 0 1" />
      </filter>
    </defs>
    <rect width="100%" height="100%" filter="url(#l15-wall-big)" opacity={0.6} />
    <rect width="100%" height="100%" filter="url(#l15-wall-fine)" opacity={0.45} />
  </svg>
);

// ---------------- الصوت ----------------
// صوت بحجم متغيّر فريم بفريم (vol بتاخد رقم الفريم في الفيديو كله)
const Snd: React.FC<{ from: number; name: string; trim?: number; dur?: number; vol: (fr: number) => number }> = ({ from, name, trim, dur, vol }) => (
  <Sequence from={from} durationInFrames={dur} layout="none" name={`sfx:${name}`}>
    <Html5Audio src={staticFile(`sfx/${name}.wav`)} trimBefore={trim} volume={(fr) => Math.max(0, vol(from + fr))} />
  </Sequence>
);
// كل ولعة: neon_on من النقطة اللي نقراتها مطابقة للرعشة، وبعد آخر نقرة الأزيز يهدى ويسيب الطنين
const IGNITE = [
  { from: F.circle, trim: 0, vol: 0.45, hold: 20, end: 36, g: "circle" },
  { from: F.mark, trim: 10, vol: 0.3, hold: 10, end: 24, g: "mark" },
  { from: F.word, trim: 3, vol: 0.4, hold: 17, end: 32, g: "word" },
  { from: F.tag, trim: 6, vol: 0.24, hold: 14, end: 28, g: "tag" },
];
const HUM_X = [96, 112]; // تبديل ناعم بين نسختين الطنين (الملف 4ث بس)
const humVol = (fr: number) => 0.35 * (0.55 + 0.45 * Math.min(1.2, level(fr) / 0.8));

const Sound: React.FC = () => (
  <>
    {IGNITE.map((s) => (
      <Snd
        key={s.g}
        from={s.from}
        name="neon_on"
        trim={s.trim || undefined}
        dur={s.end + 2}
        vol={(fr) => {
          const fade = 1 - interpolate(fr - s.from, [s.hold, s.end], [0, 1], { ...clamp, easing: easeInOut });
          const gate = fr >= F.zap ? Math.min(1, emit(s.g, fr)) : 1; // لما الأنبوبة تطفي في الـ zap الأزيز يقطع معاها
          return s.vol * fade * gate;
        }}
      />
    ))}
    {/* الطنين: بيعلى مع كل أنبوبة بتنوّر وبيقطع لحظة الـ zap */}
    <Snd from={F.circle} name="neon_hum" dur={HUM_X[1] - F.circle} vol={(fr) => humVol(fr) * Math.cos((Math.PI / 2) * interpolate(fr, HUM_X, [0, 1], clamp))} />
    <Snd from={HUM_X[0]} name="neon_hum" trim={18} vol={(fr) => humVol(fr) * Math.sin((Math.PI / 2) * interpolate(fr, HUM_X, [0, 1], clamp))} />
    <Sfx at={F.zap / FPS} name="zap" vol={0.6} />
    <Sfx at={PU} name="chime" vol={0.55} />
  </>
);

// ---------------- الكادر ----------------
const WALL = `radial-gradient(ellipse 110% 85% at 50% 40%, #0C1729 0%, #070D18 50%, #030508 100%)`;
const REFL_MASK = `linear-gradient(to bottom, transparent ${FLOOR + 30}px, rgba(0,0,0,0.9) ${FLOOR + 95}px, transparent ${FLOOR + 230}px)`;

export const L15Neon: React.FC = () => {
  const fr = useCurrentFrame();
  const t = fr / FPS;
  const cam = lerp(1.045, 1, p(t, 0, 4.3, easeInOut));
  const ec = emit("circle", fr);
  const em = emit("mark", fr);
  const ew = emit("word", fr);
  const et = emit("tag", fr);
  const all = level(fr);
  const wordX = sx(143);
  const wordY = sy(80);
  return (
    <Stage bg="#030508" vignette={0.5} grain={0.05}>
      <Sound />
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <filter id="l15-smear">
          <feGaussianBlur stdDeviation="4 13" />
        </filter>
      </svg>
      {/* كل حاجة جوه الكاميرا (والحيطة أول طبقة فيها علشان الـ blend يشتغل عليها) */}
      <AbsoluteFill style={{ transform: `scale(${cam})` }}>
        <AbsoluteFill style={{ background: WALL }} />
        {/* نور الإشارة على الحيطة: بيترعش مع الأنابيب */}
        <Pool x={sx(375.22)} y={sy(74.78)} rx={640} ry={600} c="blue" a={0.27 * ec} />
        <Pool x={sx(375.22)} y={sy(74.78)} rx={340} ry={320} c="sky" a={0.1 * ec} />
        <Pool x={sx(375.22)} y={sy(70)} rx={260} ry={240} c="white" a={0.025 * em} />
        <Pool x={wordX} y={wordY} rx={1000} ry={600} c="blue" a={0.07 * ew} />
        <Pool x={wordX} y={wordY} rx={720} ry={400} c="sky" a={0.06 * ew} />
        <Pool x={wordX} y={wordY} rx={520} ry={260} c="white" a={0.025 * ew} />
        <Pool x={sx(160)} y={sy(132)} rx={480} ry={200} c="sky" a={0.04 * et} />
        <WallTexture />
        {/* الأرضية اللامعة: أغمق شوية، وعليها بقعة نور وانعكاس الإشارة */}
        <div style={{ position: "absolute", left: -200, right: -200, top: FLOOR, height: 700 }}>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.5) 40%, rgba(0,0,0,0.6))" }} />
          <div style={{ position: "absolute", left: 0, right: 0, top: -3, height: 6, background: `linear-gradient(to bottom, transparent, rgba(${RGB.sky},${(0.02 + 0.05 * all).toFixed(3)}), transparent)` }} />
        </div>
        <AbsoluteFill style={{ clipPath: `inset(${FLOOR}px 0 0 0)` }}>
          <Pool x={960} y={FLOOR} rx={1050} ry={130} c="sky" a={0.09 * all} />
        </AbsoluteFill>
        <AbsoluteFill style={{ WebkitMaskImage: REFL_MASK, maskImage: REFL_MASK, opacity: 0.24 }}>
          <AbsoluteFill style={{ transform: "scaleY(-0.72)", transformOrigin: `50% ${FLOOR}px`, filter: "url(#l15-smear)" }}>
            <Center>
              <Sign fr={fr} id="refl" lite />
            </Center>
          </AbsoluteFill>
        </AbsoluteFill>
        <Center>
          <Sign fr={fr} id="sign" />
        </Center>
      </AbsoluteFill>
    </Stage>
  );
};

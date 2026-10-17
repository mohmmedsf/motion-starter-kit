// 05 · أشكال هندسية (Geometric build)
// شبكة خطوط وأشكال هندسية طايرة ← الدايرة تتبني من 4 أرباع بألوان مختلفة تلف وتقفل ← تتوحّد أزرق
// ← الكوباية تطلع، والقبعة تتقلب في مكانها ← الكلمة تتكشف بأعمدة رأسية من اليمين للشمال ← الجملة كمان
import React from "react";
import { CIRCLE, Logo, MARKS, TAG } from "../logo";
import { Center, K, LOGO_W, Sfx, Stage, backOut, ease, easeInOut, expoOut, lerp, p, rnd, rndRange, useSpring, useT } from "../fx";

const { cx, cy, r } = CIRCLE;
const Q = [0, 1, 2, 3].map((i) => {
  const a0 = -Math.PI / 2 + (i * Math.PI) / 2;
  const a1 = a0 + Math.PI / 2;
  const d = `M ${cx} ${cy} L ${cx + r * Math.cos(a0)} ${cy + r * Math.sin(a0)} A ${r} ${r} 0 0 1 ${cx + r * Math.cos(a1)} ${cy + r * Math.sin(a1)} Z`;
  const mid = (a0 + a1) / 2;
  return { d, dx: Math.cos(mid), dy: Math.sin(mid), at: 0.35 + i * 0.16, color: [K.sky, K.teal, K.navy, K.blue][i], rot: [90, -90, 90, -90][i] };
});
const UNIFY = 1.25;
const CUP_A = 1.45;
const HAT_A = 1.7;
const WORD_A = 1.95;
const MARK_A = 2.65;
const TAG_A = 2.85;
const DONE = 3.45;
const STRIPES = 26; // أعمدة الكلمة
const TSTRIPES = 18;

// أشكال هندسية في الخلفية
const BG = Array.from({ length: 16 }, (_, i) => ({
  kind: ["circle", "square", "tri", "plus"][i % 4],
  x: rndRange(`bx${i}`, 80, 1840),
  y: rndRange(`by${i}`, 80, 1000),
  s: rndRange(`bs${i}`, 30, 74),
  rot: rndRange(`br${i}`, 0, 360),
  spin: rndRange(`bsp${i}`, -25, 25),
  color: [K.blue, K.sky, K.teal, K.amber, K.coral][i % 5],
  vx: rndRange(`bvx${i}`, -1, 1),
  vy: rndRange(`bvy${i}`, -1, 1),
}));

const Shape: React.FC<{ kind: string; s: number; color: string }> = ({ kind, s, color }) => {
  const sw = 3;
  if (kind === "circle") return <circle cx={0} cy={0} r={s / 2} fill="none" stroke={color} strokeWidth={sw} />;
  if (kind === "square") return <rect x={-s / 2} y={-s / 2} width={s} height={s} rx={4} fill="none" stroke={color} strokeWidth={sw} />;
  if (kind === "tri") return <path d={`M 0 ${-s / 2} L ${s / 2} ${s / 2.4} L ${-s / 2} ${s / 2.4} Z`} fill="none" stroke={color} strokeWidth={sw} strokeLinejoin="round" />;
  return <path d={`M ${-s / 2} 0 L ${s / 2} 0 M 0 ${-s / 2} L 0 ${s / 2}`} stroke={color} strokeWidth={sw} strokeLinecap="round" />;
};

export const L05Geometric: React.FC = () => {
  const t = useT();
  const spring = useSpring();
  const unify = p(t, UNIFY, 0.35, ease);
  const cup = spring(CUP_A, { damping: 13, stiffness: 160 });
  const hat = spring(HAT_A, { damping: 10, stiffness: 180, mass: 0.7 });
  const out = p(t, DONE - 0.1, 0.9, easeInOut); // الخلفية بتمشي
  const grid = (1 - out) * p(t, 0, 0.6);
  const cam = lerp(1.06, 1, p(t, 0, 4, easeInOut));
  // الرمز يتبني في نص الكادر، وبعدين ياخد مكانه لما الكلمة تيجي
  const shift = lerp(-(cx - 225) * (LOGO_W / 450), 0, p(t, WORD_A - 0.35, 0.8, easeInOut));
  const stripe = (i: number, n: number, a: number, span: number) => {
    // من اليمين للشمال، وكل عمود جاي من فوق أو من تحت بالتبادل
    const k = p(t, a + (i / n) * span, 0.32, expoOut);
    return k;
  };
  const wordX0 = -4;
  const wordW = 296;
  return (
    <Stage bg={`radial-gradient(ellipse at 50% 45%, #FFFFFF 0%, ${K.offwhite} 72%)`} vignette={0.12} grain={0.05}>
      {/* شبكة */}
      <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: grid * 0.55 }}>
        <defs>
          <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(31,61,99,0.10)" strokeWidth="1.2" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
      {/* أشكال طايرة */}
      <svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
        {BG.map((b, i) => {
          const away = out * 260;
          const x = b.x + b.vx * (t * 18 + away * Math.sign(b.x - 960 || 1) * 0.8);
          const y = b.y + b.vy * t * 14 + (b.y - 540) * out * 0.35;
          const o = 0.38 * p(t, 0.05 + (i % 6) * 0.05, 0.5) * (1 - out);
          return (
            <g key={i} transform={`translate(${x} ${y}) rotate(${b.rot + b.spin * t})`} opacity={o}>
              <Shape kind={b.kind} s={b.s} color={b.color} />
            </g>
          );
        })}
      </svg>
      {Q.map((q, i) => (
        <Sfx key={i} at={q.at + 0.24} name="snap" vol={0.45 + 0.05 * i} />
      ))}
      <Sfx at={0.3} name="whoosh" vol={0.4} />
      <Sfx at={UNIFY} name="shimmer" vol={0.35} />
      <Sfx at={CUP_A} name="slide" vol={0.5} />
      <Sfx at={HAT_A} name="flap" vol={0.6} />
      <Sfx at={WORD_A} name="type" vol={0.55} />
      <Sfx at={WORD_A + 0.45} name="type" vol={0.4} />
      {MARKS.map((_, i) => (
        <Sfx key={`m${i}`} at={MARK_A + i * 0.07} name="tick" vol={0.4} />
      ))}
      <Sfx at={DONE - 0.05} name="hit" vol={0.4} />
      <Sfx at={DONE} name="chime" vol={0.5} />
      <Center x={shift} scale={cam}>
        <Logo
          width={LOGO_W}
          defs={
            <>
              <clipPath id="geoCircle">
                <circle cx={cx} cy={cy} r={r} />
              </clipPath>
              <clipPath id="cupRise">
                <rect x={300} y={lerp(130, 40, Math.min(1, cup))} width={160} height={140} />
              </clipPath>
              <clipPath id="wordStripes">
                {Array.from({ length: STRIPES }, (_, i) => {
                  const w = wordW / STRIPES;
                  const x = wordX0 + wordW - (i + 1) * w;
                  const k = stripe(i, STRIPES, WORD_A, 0.55);
                  const fromTop = i % 2 === 0;
                  const h = 150 * k;
                  return <rect key={i} x={x - 0.3} y={fromTop ? 0 : 150 - h} width={w + 0.6} height={h} />;
                })}
              </clipPath>
              <clipPath id="tagStripes">
                {Array.from({ length: TSTRIPES }, (_, i) => {
                  const w = 260 / TSTRIPES;
                  const x = 30 + 260 - (i + 1) * w;
                  const k = stripe(i, TSTRIPES, TAG_A, 0.4);
                  return <rect key={i} x={x - 0.3} y={110 + 42 * (1 - k)} width={w + 0.6} height={42 * k} />;
                })}
              </clipPath>
            </>
          }
          part={(pt) => {
            if (pt.id === "circle") return unify <= 0 ? { hidden: true } : { opacity: unify };
            if (pt.id === "cup") return t < CUP_A ? { hidden: true } : { clip: "url(#cupRise)", y: lerp(30, 0, Math.min(1, cup)) };
            if (pt.id === "hat") return t < HAT_A ? { hidden: true } : { scaleX: Math.max(0.02, hat), y: lerp(-14, 0, Math.min(1, hat)), rotate: lerp(-180, 0, Math.min(1, p(t, HAT_A, 0.35, easeInOut))) };
            if (pt.id === "word") return t < WORD_A ? { hidden: true } : { clip: "url(#wordStripes)" };
            const mi = MARKS.findIndex((m) => m.id === pt.id);
            if (mi >= 0) {
              const k = p(t, MARK_A + mi * 0.07, 0.35, backOut);
              return k <= 0 ? { hidden: true } : { scale: lerp(0, 1, k), rotate: lerp(90, 0, Math.min(1, k)) };
            }
            const ti = TAG.findIndex((m) => m.id === pt.id);
            if (ti >= 0) return t < TAG_A ? { hidden: true } : { clip: "url(#tagStripes)" };
            return {};
          }}
          under={
            <>
              {/* الأرباع الأربعة */}
              {unify < 1 &&
                Q.map((q, i) => {
                  const s = spring(q.at, { damping: 14, stiffness: 170, mass: 0.8 });
                  if (t < q.at) return null;
                  const dist = lerp(150, 0, Math.min(1, s));
                  const rot = lerp(q.rot, 0, Math.min(1.05, s));
                  const col = mixHex(q.color, K.blue, unify);
                  return (
                    <g key={i} transform={`translate(${q.dx * dist} ${q.dy * dist}) rotate(${rot} ${cx} ${cy})`} opacity={Math.min(1, s * 3)}>
                      <path d={q.d} fill={col} stroke={col} strokeWidth={0.6} />
                    </g>
                  );
                })}
              {/* حلقة خفيفة لما تتوحّد */}
              {unify > 0 && unify < 1 && <circle cx={cx} cy={cy} r={r * lerp(1, 1.25, unify)} fill="none" stroke={K.sky} strokeWidth={1.2} opacity={1 - unify} />}
            </>
          }
        />
      </Center>
    </Stage>
  );
};

function mixHex(a: string, b: string, k: number) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  const c = pa.map((v, i) => Math.round(v + (pb[i] - v) * k));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

// 13 · الجزيئات (Particles)
// حقل جزيئات صغيرة بيعوم في عمق كحلي ← بتتشد لدوامة مايلة حوالين نص الكادر ← كل جزيئة بتفلت من الدوامة
// وتنزل على نقطتها على حدود الشعار (الرمز الأول وبعدين الكلمة والجملة) وخيط رفيع بيوصل النقط ← النقط بتشحن نور
// ← فلاش ناعم، والشعار الصلب بيظهر من اليمين للشمال والنقط تدوب فيه، والباقي يتفرتك لبره، وحلقة نور من الرمز
// ← ثبات هادي وجزيئات بعيدة بتعوم ورا الشعار
import React from "react";
import { AbsoluteFill, Easing, interpolateColors } from "remotion";
import { evolvePath, getLength, getPointAtLength } from "@remotion/paths";
import { ALL_PARTS, CIRCLE, Logo, VIEW, baseFill } from "../logo";
import { Center, K, LOGO_W, Sfx, Stage, U, ease, easeIn, easeInOut, expoOut, lerp, p, rnd, useT } from "../fx";

// ── الكادر والإحداثيات (بكسل الكادر 1920×1080) ──
const CX = 960;
const CY = 540;
const LX = CX - LOGO_W / 2; // أول الشعار من الشمال
const LY = CY - (VIEW.h * U) / 2; // أول الشعار من فوق
const F = 3.45; // الفلاش: الشعار اكتمل بالنقط
const DONE = 4.2; // الكاميرا وقفت والشعار الأصلي بالظبط

const c01 = (x: number) => Math.min(1, Math.max(0, x));
const CONV = Easing.bezier(0.42, 0, 0.12, 1); // الوصول: بداية ناعمة ونهاية هادية طويلة

// ── الدوامة: قرص مايل (منظور) ولافف 6 درجات ──
const ROLL = (-6 * Math.PI) / 180;
const cosR = Math.cos(ROLL);
const sinR = Math.sin(ROLL);
const W0 = 0.1; // لفة الحقل الهادية (راديان/ث)
const WV = 1.9; // سرعة الدوامة عند نص قطر 300 بكسل (الجوه أسرع)
const tiltAt = (t: number) => lerp(0.42, 0.33, p(t, 0.5, 2.0, easeInOut));

type Pt = { x: number; y: number; z: number };
// من إحداثيات الدوامة (نص قطر، زاوية، ارتفاع) لبكسل الكادر + عمق z (-1 بعيد، 1 قريب)
const project = (r: number, th: number, h: number, tilt: number): Pt => {
  const x = r * Math.cos(th);
  const y = h + r * Math.sin(th) * tilt;
  return { x: CX + x * cosR - y * sinR, y: CY + x * sinR + y * cosR, z: Math.sin(th) * Math.min(1, r / 520) };
};

type Swirl = { th0: number; r0: number; h0: number; rv: number; hv: number; tv: number; dv: number; wv: number; fa: number; fb: number; ph: number };

// الزاوية = تكامل السرعة (السرعة بتزيد بـ smoothstep من tv لـ tv+dv) — معادلة مقفولة، من غير تراكم
const spin = (q: Swirl, t: number) => {
  const u = c01((t - q.tv) / q.dv);
  return q.th0 + W0 * t + q.wv * (q.dv * (u * u * u - (u * u * u * u) / 2) + Math.max(0, t - q.tv - q.dv));
};
// مكان الجزيئة: حقل بيعوم ← بتتشد لمدارها في الدوامة
const swirlAt = (q: Swirl, t: number): Pt => {
  const k = easeInOut(c01((t - q.tv) / q.dv));
  const r = lerp(q.r0 + q.fa * Math.sin(t * 0.7 + q.ph), q.rv, k);
  const h = lerp(q.h0 - 9 * t + q.fb * Math.sin(t * 0.9 + q.ph * 1.7), q.hv, k);
  return project(r, spin(q, t), h, tiltAt(t));
};
const mkSwirl = (s: string, rv: number, hv: number): Swirl => ({
  th0: rnd(`${s}th`) * Math.PI * 2,
  r0: 120 + 880 * Math.sqrt(rnd(`${s}r`)),
  h0: (rnd(`${s}h`) - 0.5) * 840,
  rv,
  hv,
  tv: 0.3 + rnd(`${s}tv`) * 0.4,
  dv: 1.4 + rnd(`${s}dv`) * 0.4,
  wv: WV * Math.pow(300 / rv, 0.6),
  fa: 8 + rnd(`${s}fa`) * 14,
  fb: 6 + rnd(`${s}fb`) * 12,
  ph: rnd(`${s}ph`) * Math.PI * 2,
});

// ── الألوان: كل لون ليه تدرّج «نقطة منورة» (قلب + هالة) وتدرّج «بوكيه» (برّه الفوكس) ──
type Col = "white" | "sky" | "blue" | "amber";
const COLS: Record<Col, [string, string]> = { white: [K.white, K.white], sky: [K.white, K.sky], blue: [K.sky, K.blue], amber: [K.amber, K.amber] };

// ── الشعار الصلب بيظهر بالتدريج من اليمين للشمال: حافة ناعمة جدًا (مش مسحة) ──
const SWEEP_A = F - 0.06;
const SWEEP_D = 0.85;
const EDGE = 120; // نص عرض الحافة الناعمة (وحدات الشعار)
const SLANT = 0.27; // ميل خفيف
const frontX = (t: number) => lerp(VIEW.w + EDGE + 40, -EDGE - 40, p(t, SWEEP_A, SWEEP_D, ease));
const SWITCH = SWEEP_A + SWEEP_D + 0.01; // من هنا الشعار الأصلي نفسه (من غير ماسك)
// إمتى الموجة تعدّي على نقطة (x, y) في الشعار
const frontAt = (x: number, y: number) => {
  const goal = x + SLANT * (y - CIRCLE.cy);
  let lo = SWEEP_A;
  let hi = SWEEP_A + SWEEP_D;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (frontX(mid) > goal) lo = mid;
    else hi = mid;
  }
  return lo;
};

// ── نقط الهدف على حدود الأجزاء (بالتناسب مع الطول) + شوية جوه الدايرة ──
const N_OUT = 205;
const WEIGHT = (id: string) => (id === "word" ? 1.2 : id === "cup" || id === "hat" ? 1.1 : id.startsWith("tag") ? 0.5 : 1);
type Tgt = { ux: number; uy: number; part: string; ord: number; inner?: boolean };
// كل جزء بيترسم بالنقط على طول حدوده: بداية (من اليمين للشمال) ومدة على حسب طوله
const LEN: Record<string, number> = {};
const DRAW: Record<string, { a: number; span: number }> = {};
ALL_PARTS.forEach((pt) => {
  LEN[pt.id] = getLength(pt.d);
  DRAW[pt.id] = { a: 1.7 + 0.36 * (1 - (pt.box.x + pt.box.w / 2) / VIEW.w), span: 0.12 + 0.3 * Math.min(1, LEN[pt.id] / 600) };
});
const LAND = 0.68; // الجزيئة بتبان إنها وصلت بعد النسبة دي من رحلتها (الوصول بطيء في الآخر)
const TARGETS: Tgt[] = (() => {
  const out: Tgt[] = [];
  const tot = ALL_PARTS.reduce((a, pt) => a + LEN[pt.id] * WEIGHT(pt.id), 0);
  ALL_PARTS.forEach((pt) => {
    const L = LEN[pt.id];
    if (L < 24) {
      // نقطة صغيرة (نقط الجملة): جزيئة واحدة في نصها
      out.push({ ux: pt.box.x + pt.box.w / 2, uy: pt.box.y + pt.box.h / 2, part: pt.id, ord: 0.5 });
      return;
    }
    const n = Math.max(2, Math.round(((L * WEIGHT(pt.id)) / tot) * N_OUT));
    for (let j = 0; j < n; j++) {
      const q = getPointAtLength(pt.d, ((j + 0.5 + (rnd(`l13t${pt.id}${j}`) - 0.5) * 0.3) / n) * L);
      if (q) out.push({ ux: q.x, uy: q.y, part: pt.id, ord: j / n });
    }
  });
  // جوه الدايرة: توزيع عباد الشمس
  for (let j = 0; j < 12; j++) {
    const rr = Math.sqrt((j + 0.5) / 12) * CIRCLE.r * 0.84;
    const a = j * 2.39996 + 0.4;
    out.push({ ux: CIRCLE.cx + rr * Math.cos(a), uy: CIRCLE.cy + rr * Math.sin(a), part: "circle", ord: 0.25 + rnd(`l13in${j}`) * 0.75, inner: true });
  }
  return out;
})();

const colFor = (g: Tgt, s: string): Col => {
  const r = rnd(`${s}col`);
  if (g.inner) return r < 0.55 ? "blue" : "sky";
  if (r < 0.06) return "amber";
  if (g.part === "circle") return r < 0.72 ? "sky" : r < 0.9 ? "white" : "blue";
  if (g.part.startsWith("tag")) return r < 0.72 ? "white" : "sky";
  return r < 0.84 ? "white" : "sky";
};

type Dot = Swirl & { tx: number; ty: number; col: Col; c: number; dc: number; soft: boolean; sz: number; end: number; op: number; ds: number; ph2: number };
const DOTS: Dot[] = TARGETS.map((g, i) => {
  const s = `l13d${i}`;
  const tx = LX + g.ux * U;
  const ty = LY + g.uy * U;
  // بتفلت من الدوامة بالترتيب: الرمز الأول وبعدين الكلمة والجملة، وجوه كل جزء على طول حدوده
  const c = DRAW[g.part].a + DRAW[g.part].span * g.ord + rnd(`${s}c`) * 0.06;
  const dc = 0.9 + rnd(`${s}dc`) * 0.1;
  const rv = 80 + 480 * Math.pow(rnd(`${s}rv`), 0.8);
  const base = mkSwirl(s, rv, (rnd(`${s}hv`) - 0.5) * (20 + rv * 0.08));
  // زاوية الهدف في مستوى الدوامة: الجزيئة تكون قبله بشوية في اتجاه اللفة لما تفلت، فتكمّل اللفة وتقعد مكانها
  const dx = tx - CX;
  const dy = ty - CY;
  const phT = Math.atan2((-dx * sinR + dy * cosR) / tiltAt(c), dx * cosR + dy * sinR);
  const lead = (W0 + base.wv) * dc * 0.45;
  const th0 = phT - lead - spin({ ...base, th0: 0 }, c);
  const soft = rnd(`${s}soft`) < 0.22;
  return {
    ...base,
    th0,
    tx,
    ty,
    col: colFor(g, s),
    c,
    dc,
    soft,
    sz: soft ? 6 + rnd(`${s}sz`) * 8 : 0.85 + rnd(`${s}sz`) * 1.75,
    end: g.inner || g.part.startsWith("tag") ? 1.6 : 2.15,
    op: soft ? 0.35 + rnd(`${s}op`) * 0.25 : 0.7 + rnd(`${s}op`) * 0.3,
    ds: frontAt(g.ux, g.uy) - 0.06 + rnd(`${s}ds`) * 0.05,
    ph2: rnd(`${s}ph2`) * Math.PI * 2,
  };
});

// ── الباقي: جزيئات في مدار برّه حوالين الشعار، بتتفرتك لبره مع الفلاش ──
type Free = Swirl & { col: Col; soft: boolean; sz: number; op: number; tb: number; bd: number; bh: number; fade: number };
const FREE: Free[] = Array.from({ length: 18 }, (_, i) => {
  const s = `l13f${i}`;
  const rv = 430 + rnd(`${s}rv`) * 260;
  const r = rnd(`${s}col`);
  const soft = rnd(`${s}soft`) < 0.25;
  return {
    ...mkSwirl(s, rv, (rnd(`${s}hv`) - 0.5) * 90),
    col: r < 0.35 ? "blue" : r < 0.7 ? "sky" : r < 0.9 ? "white" : "amber",
    soft,
    sz: soft ? 6 + rnd(`${s}sz`) * 7 : 0.6 + rnd(`${s}sz`) * 1.2,
    op: soft ? 0.24 + rnd(`${s}op`) * 0.16 : 0.45 + rnd(`${s}op`) * 0.4,
    tb: F + rnd(`${s}tb`) * 0.04,
    bd: 180 + rnd(`${s}bd`) * 300,
    bh: (rnd(`${s}bh`) - 0.5) * 260,
    fade: 0.6 + rnd(`${s}fade`) * 0.4,
  };
});
const freeAt = (q: Free, t: number): Pt => {
  if (t <= q.tb) return swirlAt(q, t);
  const d = t - q.tb;
  const th = spin(q, q.tb) + (W0 + q.wv) * 0.7 * (1 - Math.exp(-d / 0.7));
  return project(q.rv + q.bd * (1 - Math.exp(-d / 0.55)), th, q.hv + q.bh * (1 - Math.exp(-d / 0.6)), tiltAt(t));
};

// ── جزيئات بعيدة في الخلفية: بتعوم بالراحة طول الفيديو (برّه مكان الشعار) ──
type Far = { x: number; y: number; vx: number; vy: number; a: number; ph: number; col: Col; soft: boolean; sz: number; op: number };
const FAR: Far[] = (() => {
  const out: Far[] = [];
  for (let k = 0; out.length < 10 && k < 200; k++) {
    const s = `l13b${k}`;
    const x = 60 + rnd(`${s}x`) * 1800;
    const y = 50 + rnd(`${s}y`) * 980;
    if (x > 360 && x < 1560 && y > 300 && y < 780) continue;
    const soft = rnd(`${s}soft`) < 0.65;
    const r = rnd(`${s}col`);
    out.push({
      x,
      y,
      vx: (rnd(`${s}vx`) - 0.5) * 12,
      vy: -2 - rnd(`${s}vy`) * 7,
      a: 6 + rnd(`${s}a`) * 10,
      ph: rnd(`${s}ph`) * Math.PI * 2,
      col: r < 0.4 ? "blue" : r < 0.8 ? "sky" : "white",
      soft,
      sz: soft ? 5 + rnd(`${s}sz`) * 9 : 0.6 + rnd(`${s}sz`) * 0.6,
      op: soft ? 0.16 + rnd(`${s}op`) * 0.14 : 0.4 + rnd(`${s}op`) * 0.25,
    });
  }
  return out;
})();
const farAt = (b: Far, t: number) => ({ x: b.x + b.vx * t + b.a * Math.sin(t * 0.45 + b.ph), y: b.y + b.vy * t + b.a * 0.7 * Math.cos(t * 0.37 + b.ph) });

// ── رسم جزيئة: بيضاوي ممطوط ورا اتجاه الحركة (أثر حركة نص فريم)، بإحداثيات الشعار ──
type Blob = { x: number; y: number; vx: number; vy: number; R: number; col: Col; soft: boolean; op: number };
const H = 1 / 60; // نص فريم (لحساب السرعة)
const SHUTTER = 1.6; // طول الأثر = حركة فريم ونص تقريبًا (تعريض طويل)
const blob = (b: Blob, key: string) => {
  if (b.op <= 0.004 || b.R <= 0.05) return null;
  const sp = Math.hypot(b.vx, b.vy); // بكسل/فريم
  const trail = Math.min(70, sp * SHUTTER);
  const rx = b.R + trail / 2;
  const o = Math.min(1, b.op * Math.sqrt(b.R / rx));
  const back = sp > 0 ? trail / 2 / sp : 0;
  const cx = (b.x - b.vx * back - LX) / U;
  const cy = (b.y - b.vy * back - LY) / U;
  const ang = (Math.atan2(b.vy, b.vx) * 180) / Math.PI;
  return (
    <ellipse
      key={key}
      cx={cx}
      cy={cy}
      rx={rx / U}
      ry={b.R / U}
      fill={`url(#l13-${b.soft ? "b" : "g"}-${b.col})`}
      opacity={o}
      transform={sp > 0.2 ? `rotate(${ang.toFixed(2)} ${cx.toFixed(3)} ${cy.toFixed(3)})` : undefined}
    />
  );
};

const Defs: React.FC<{ t: number }> = ({ t }) => {
  const fx = frontX(t);
  return (
  <>
    {(Object.keys(COLS) as Col[]).map((n) => (
      <React.Fragment key={n}>
        <radialGradient id={`l13-g-${n}`}>
          <stop offset="0" stopColor={COLS[n][0]} stopOpacity={1} />
          <stop offset="0.2" stopColor={COLS[n][1]} stopOpacity={0.95} />
          <stop offset="0.33" stopColor={COLS[n][1]} stopOpacity={0.42} />
          <stop offset="0.6" stopColor={COLS[n][1]} stopOpacity={0.1} />
          <stop offset="1" stopColor={COLS[n][1]} stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`l13-b-${n}`}>
          <stop offset="0" stopColor={COLS[n][1]} stopOpacity={0.5} />
          <stop offset="0.62" stopColor={COLS[n][1]} stopOpacity={0.42} />
          <stop offset="0.84" stopColor={COLS[n][1]} stopOpacity={0.15} />
          <stop offset="1" stopColor={COLS[n][1]} stopOpacity={0} />
        </radialGradient>
      </React.Fragment>
    ))}
    <radialGradient id="l13-flash">
      <stop offset="0" stopColor={K.sky} stopOpacity={0.4} />
      <stop offset="0.35" stopColor={K.blue} stopOpacity={0.16} />
      <stop offset="1" stopColor={K.blue} stopOpacity={0} />
    </radialGradient>
    <filter id="l13-bloom" x="-20%" y="-45%" width="140%" height="190%">
      <feGaussianBlur stdDeviation="5" />
    </filter>
    {/* ماسك موجة الظهور: يمين الحافة ظاهر، شمالها مستخبي */}
    <linearGradient id="l13-sweepG" gradientUnits="userSpaceOnUse" x1={fx - EDGE} y1={CIRCLE.cy - EDGE * SLANT} x2={fx + EDGE} y2={CIRCLE.cy + EDGE * SLANT}>
      <stop offset="0" stopColor={K.black} />
      <stop offset="1" stopColor={K.white} />
    </linearGradient>
    <mask id="l13-sweep" maskUnits="userSpaceOnUse" x={-150} y={-150} width={750} height={450}>
      <rect x={-150} y={-150} width={750} height={450} fill="url(#l13-sweepG)" />
    </mask>
  </>
  );
};

// ── الشعار الصلب وهو بيظهر ورا الموجة (الدايرة بتبرد من سماوي لأزرق) ──
const Solid: React.FC<{ t: number }> = ({ t }) => {
  if (t < SWEEP_A || t >= SWITCH) return null;
  const cool = p(t, F, 0.5, ease);
  return (
    <g mask="url(#l13-sweep)">
      {ALL_PARTS.map((pt) => (
        <path key={pt.id} d={pt.d} fill={pt.id === "circle" ? interpolateColors(cool, [0, 1], [K.sky, K.blue]) : baseFill(pt.id, "dark")} />
      ))}
    </g>
  );
};

// ── اللي ورا الشعار: جزيئات الخلفية، الباقي اللي بيتفرتك، النور والحلقة والهالة ──
const Back: React.FC<{ t: number; master: number; flare: number }> = ({ t, master, flare }) => {
  const flash = p(t, F - 0.07, 0.09, easeIn) * (1 - p(t, F + 0.02, 0.6, ease));
  const ringK = p(t, F, 1.05, expoOut);
  const ringO = p(t, F - 0.02, 0.06) * (1 - p(t, F + 0.05, 0.95, ease));
  const bloom = p(t, F - 0.06, 0.12, easeIn) * (1 - p(t, F + 0.2, 0.8, ease));
  const ignite = p(t, F - 0.08, 0.1, easeIn) * (1 - p(t, F + 0.25, 0.4, ease));
  return (
    <>
      {FAR.map((b, i) => {
        const a = farAt(b, t);
        const z = farAt(b, t - H);
        return blob({ x: a.x, y: a.y, vx: (a.x - z.x) * 2, vy: (a.y - z.y) * 2, R: b.soft ? b.sz : b.sz * 3.2, col: b.col, soft: b.soft, op: b.op * master * (0.8 + 0.2 * Math.sin(t * 1.3 + b.ph)) }, `b${i}`);
      })}
      {FREE.map((q, i) => {
        const a = freeAt(q, t);
        const z = freeAt(q, t - H);
        const op = q.op * master * (0.78 + 0.22 * a.z) * (1 + 0.8 * flare) * (1 - p(t, q.tb + 0.08, q.fade, ease));
        return blob({ x: a.x, y: a.y, vx: (a.x - z.x) * 2, vy: (a.y - z.y) * 2, R: (q.soft ? q.sz : q.sz * 3.2) * (1 + 0.25 * a.z), col: q.col, soft: q.soft, op }, `f${i}`);
      })}
      {/* نور ناعم ورا الشعار لحظة الاكتمال */}
      {flash > 0 && <circle cx={VIEW.w / 2} cy={CIRCLE.cy} r={330} fill="url(#l13-flash)" opacity={flash} />}
      {/* حلقة نور طالعة من الرمز */}
      {ringO > 0 && (
        <g fill="none" opacity={ringO}>
          <circle cx={CIRCLE.cx} cy={CIRCLE.cy} r={lerp(CIRCLE.r + 2, CIRCLE.r * 3.1, ringK)} stroke={K.sky} strokeWidth={lerp(9, 18, ringK)} strokeOpacity={0.1} />
          <circle cx={CIRCLE.cx} cy={CIRCLE.cy} r={lerp(CIRCLE.r + 2, CIRCLE.r * 3.1, ringK)} stroke={K.white} strokeWidth={lerp(1.1, 0.35, ringK)} strokeOpacity={0.8} />
        </g>
      )}
      {/* هالة الشعار (نسخة مبلورة) */}
      {bloom > 0 && (
        <g mask="url(#l13-sweep)">
          <g filter="url(#l13-bloom)" opacity={bloom * 0.7}>
            {ALL_PARTS.map((pt) => (
              <path key={pt.id} d={pt.d} fill={pt.id === "circle" ? K.sky : K.white} />
            ))}
          </g>
        </g>
      )}
      {/* الدايرة بتولّع سماوي لحظة الفلاش، والكوباية والقبعة بيظهروا فوقها */}
      {ignite > 0 && <circle cx={CIRCLE.cx} cy={CIRCLE.cy} r={CIRCLE.r} fill={K.sky} opacity={ignite * 0.9} />}
      {/* خيط رفيع بيوصل النقط وهي بتنزل (الشعار بيترسم بالنقط) */}
      {ALL_PARTS.map((pt) => {
        const k = p(t, DRAW[pt.id].a + LAND, DRAW[pt.id].span + 0.08, (x) => x);
        const o = 0.42 * (1 + 1.0 * flare) * (1 - p(t, F + 0.05, SWEEP_D, ease));
        if (k <= 0 || o <= 0.003) return null;
        const ev = evolvePath(Math.max(0.0001, k), pt.d);
        return (
          <path key={`ln${pt.id}`} d={pt.d} fill="none" stroke={pt.id === "circle" ? K.sky : K.white} strokeWidth={0.45} strokeOpacity={o} strokeLinecap="round" strokeDasharray={ev.strokeDasharray} strokeDashoffset={ev.strokeDashoffset} />
        );
      })}
    </>
  );
};

// ── النقط اللي بتعمل الشعار (قدّام) ──
const Front: React.FC<{ t: number; master: number; flare: number }> = ({ t, master, flare }) => {
  const at = (d: Dot, tt: number) => {
    const V = swirlAt(d, tt);
    const e = CONV(c01((tt - d.c) / d.dc));
    return { x: lerp(V.x, d.tx, e), y: lerp(V.y, d.ty, e), z: V.z * (1 - e), e };
  };
  return (
    <>
      {DOTS.map((d, i) => {
        const dk = p(t, d.ds, 0.3, ease);
        if (dk >= 1) return null;
        const a = at(d, t);
        const z = at(d, t - H);
        // البوكيه بيدخل الفوكس وهو في نص الطريق (وهو سريع، فالتبديل مش باين)
        const soft = d.soft && a.e < 0.35;
        const col: Col = soft && d.col === "white" ? "sky" : d.col; // البوكيه البعيد مايل للسماوي
        const R0 = d.soft ? d.sz : d.sz * 3.2;
        // لمعة صغيرة لحظة ما تقعد مكانها
        const kk = c01((t - d.c) / d.dc);
        const glint = Math.sin(Math.PI * c01((kk - LAND + 0.08) / 0.3));
        const R = lerp(R0, d.end * 3.2, a.e) * (1 + 0.28 * a.z) * (1 + 0.6 * glint) * (1 + 0.55 * flare) * (1 - 0.55 * dk);
        const tw = soft ? 1 : 0.86 + 0.14 * Math.sin(t * 4.5 + d.ph2);
        const op = lerp(d.op, 1, a.e) * (0.82 + 0.18 * a.z) * tw * master * (1 + 0.4 * flare) * (1 - dk);
        return blob({ x: a.x, y: a.y, vx: (a.x - z.x) * 2, vy: (a.y - z.y) * 2, R, col, soft, op }, `d${i}`);
      })}
    </>
  );
};

const BG = "radial-gradient(ellipse 85% 75% at 50% 50%, #13253B 0%, #0A1524 42%, #03070C 78%, #000000 100%)";

// ضباب العمق: بقع كحلي/أزرق بتتحرك بالراحة، والنص بينوّر مع طاقة الدوامة
const Haze: React.FC<{ t: number }> = ({ t }) => {
  const v = p(t, 0.6, 1.8, easeInOut) * (1 - 0.55 * p(t, F, 1.0, ease));
  const x1 = 30 + 4 * Math.sin(t * 0.35);
  const y1 = 36 + 3 * Math.cos(t * 0.3);
  const x2 = 71 - 4 * Math.sin(t * 0.28 + 1);
  const y2 = 66 + 3 * Math.sin(t * 0.4);
  return (
    <AbsoluteFill
      style={{
        background: [
          `radial-gradient(ellipse 42% 38% at ${x1}% ${y1}%, rgba(0,86,210,0.10), rgba(0,86,210,0) 70%)`,
          `radial-gradient(ellipse 46% 40% at ${x2}% ${y2}%, rgba(31,61,99,0.34), rgba(31,61,99,0) 70%)`,
          `radial-gradient(ellipse 36% 26% at 50% 50%, rgba(0,86,210,${(0.06 + 0.12 * v).toFixed(3)}), rgba(0,86,210,0) 72%)`,
        ].join(","),
      }}
    />
  );
};

export const L13Particles: React.FC = () => {
  const t = useT();
  const master = lerp(0.8, 1, p(t, 0, 0.7)); // الجزيئات موجودة من أول فريم
  // النقط بتشحن نور مع الرايزر وبتنوّر لحظة الاكتمال
  const flare = Math.max(0.55 * p(t, 2.95, F - 3.05, easeInOut), p(t, F - 0.1, 0.1, easeIn)) * (1 - p(t, F, 0.45, ease));
  const ck = p(t, 0, DONE, easeInOut);
  const kick = 0.008 * p(t, F - 0.03, 0.06) * (1 - p(t, F + 0.03, 0.5, ease)); // دفعة خفيفة مع الضربة
  const cam = ck >= 1 ? undefined : `scale(${lerp(1.06, 1, ck) + kick}) rotate(${lerp(-1.2, 0, ck)}deg)`;
  return (
    <Stage bg={BG} vignette={0.28} grain={0.05}>
      <Haze t={t} />
      <Sfx at={0.5} name="swirl" vol={0.5} />
      <Sfx at={F - 2.2} name="riser" vol={0.38} />
      <Sfx at={F} name="impact" vol={0.42} />
      <Sfx at={F + 0.03} name="sparkle" vol={0.3} />
      <Sfx at={3.5} name="shimmer" vol={0.26} />
      <Sfx at={3.98} name="chime" vol={0.36} />
      <AbsoluteFill style={{ transform: cam }}>
        <Center>
          <Logo
            width={LOGO_W}
            theme="dark"
            defs={<Defs t={t} />}
            under={<Back t={t} master={master} flare={flare} />}
            // بعد الموجة: الشعار الأصلي نفسه بألوانه (dark)
            part={() => (t < SWITCH ? { hidden: true } : undefined)}
            over={
              <>
                <Solid t={t} />
                <Front t={t} master={master} flare={flare} />
              </>
            }
          />
        </Center>
      </AbsoluteFill>
    </Stage>
  );
};

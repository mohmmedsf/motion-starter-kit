// 06 · السائل اللي يملا (Liquid fill) — العلم بيملاك، وبعدين تتخرّج
// كوباية فاضية (خط الدايرة) ← شلال أزرق لامع بيصب من فوق ← المستوى بيعلى بموجتين وفقاعات
// ← الدايرة تتملي وتهدى ← القبعة تقع فيها برشّة وتستقر ← «متعلم» تتملي حبر من اليمين ← النقط تنقط ← الجملة
import React from "react";
import { Easing } from "remotion";
import { CIRCLE, CUP, Logo, MARKS, TAG, VIEW, WORD } from "../logo";
import { Center, K, LOGO_W, Sfx, Stage, U, ease, easeInOut, lerp, noise1, p, rnd, rndRange, useT } from "../fx";

const TAU = Math.PI * 2;
const { cx, cy, r } = CIRCLE;
const TOP = cy - r;
const BOT = cy + r;
const c01 = (v: number) => Math.min(1, Math.max(0, v));

// ── الزمن (ثواني) ──
const POUR = 0.2; // راس الشلال يبدأ يقع (من بره الكادر)
const POUR_END = 1.95; // الصب يقف من فوق والديل يقع
const FULL = 2.35; // الدايرة اتملت والسطح هدي
const SOLID = 2.55; // الدايرة والكوباية الأصليين بدل طبقة السائل
const HAT_AT = 2.3; // القبعة تبدأ تقع (من بره الكادر)
const CAM = 3.0; // الكاميرا ترجع للشعار كامل
const WIPE = 3.1; // «متعلم» تتملي حبر
const WIPE_D = 0.9;
const wipeEase = Easing.bezier(0.45, 0, 0.3, 1);
const DOTS = 3.45; // النقط تنقط
const TAGS = 3.62; // الجملة
const GLINT = 4.75; // لمعة هادية

// ── فيزيا الشلال (وحدات الشعار / ثانية) ──
const G = 1650;
const V0 = 300;
const Y0 = -150; // فوق الكادر
const W0 = 9.4;
const XS = cx; // مكان الصب
const fallY = (tau: number) => Y0 + V0 * tau + 0.5 * G * tau * tau;
const speedAt = (y: number) => Math.sqrt(V0 * V0 + 2 * G * Math.max(0, y - Y0));
// السائل بيرفع وهو بيقع (الاستمرارية: العرض ∝ 1/√السرعة)
const widthAt = (y: number) => W0 * Math.sqrt(V0 / speedAt(y));
const IMPACT = POUR + (-V0 + Math.sqrt(V0 * V0 + 2 * G * (BOT - Y0))) / G; // ≈ 0.65

// ── المستوى من الحجم (مساحة قطعة الدايرة) ──
const segFrac = (h: number) => {
  const d = r - h;
  return (r * r * Math.acos(Math.max(-1, Math.min(1, d / r))) - d * Math.sqrt(Math.max(0, r * r - d * d))) / (Math.PI * r * r);
};
const heightOf = (f: number) => {
  let a = 0;
  let b = 2 * r;
  for (let i = 0; i < 24; i++) {
    const m = (a + b) / 2;
    if (segFrac(m) < f) a = m;
    else b = m;
  }
  return (a + b) / 2;
};
const fillEase = Easing.bezier(0.32, 0.08, 0.5, 1);
const volume = (t: number) => p(t, IMPACT, FULL - IMPACT, fillEase) * 1.04;
const levelAt = (t: number) => {
  const v = volume(t);
  if (v <= 0) return BOT + 1;
  if (v < 1) return BOT - heightOf(v);
  return TOP - (v - 1) * 160; // فوق الحافة: الدايرة كلها مليانة
};
// الموج: بيبدأ مع الخبطة، وبيهدى كل ما تتملي، ويختفي بعد ما الصب يقف
const waveEnv = (t: number) => p(t, IMPACT - 0.05, 0.4, ease) * lerp(1, 0.42, c01(volume(t))) * (1 - p(t, POUR_END + 0.02, 0.4, easeInOut));

// عرض الدايرة عند ارتفاع y (للفقاعات)
const halfChord = (y: number) => Math.sqrt(Math.max(0, r * r - (y - cy) * (y - cy)));
// حافة الدايرة من فوق عند x
const topEdge = (x: number) => cy - Math.sqrt(Math.max(0, r * r - (x - cx) * (x - cx)));

// ── نقط رشّ عند الخبطة وأثناء الصب ──
type Drop = { t0: number; vx: number; vy: number; r: number };
const SPLASH: Drop[] = [
  ...Array.from({ length: 12 }, (_, i) => ({ t0: IMPACT + 0.02 + i * 0.01, vx: (i % 2 ? 1 : -1) * rndRange(`sx${i}`, 14, 92), vy: rndRange(`sy${i}`, 85, 185), r: rndRange(`sr${i}`, 0.8, 1.9) })),
  ...Array.from({ length: 16 }, (_, i) => ({
    t0: lerp(IMPACT + 0.2, POUR_END + 0.12, (i + rnd(`st${i}`)) / 16),
    vx: (i % 2 ? 1 : -1) * rndRange(`sx2${i}`, 8, 38),
    vy: rndRange(`sy2${i}`, 34, 84),
    r: rndRange(`sr2${i}`, 0.45, 1.05),
  })),
];
const SPLASH_G = 900;
// نقط صغيرة بتقع جنب الشلال
const SATS = [
  { t0: 0.62, dx: -5.2, r: 0.95 },
  { t0: 1.05, dx: 4.6, r: 0.75 },
  { t0: 1.42, dx: -4.0, r: 0.65 },
  { t0: 1.7, dx: 5.4, r: 0.85 },
];
// فقاعات بتطلع (نصها من مكان الصب)
const BUBBLES = Array.from({ length: 26 }, (_, i) => ({
  t0: lerp(IMPACT + 0.18, FULL - 0.2, rnd(`bt${i}`)),
  fromPour: i % 2 === 0,
  u: rndRange(`bx${i}`, -1, 1),
  dv: rnd(`bd${i}`),
  v: rndRange(`bv${i}`, 26, 58),
  r: rndRange(`br${i}`, 0.45, 1.45),
  ph: rnd(`bp${i}`) * TAU,
}));

// ── القبعة: سقوط حر من بره الكادر ← تخبط السائل من فوق (رشّة) ← زنبرك بيبطّأها ويرسّيها على الكوباية ──
const HAT_Y0 = -130;
const HAT_YE = -46; // أطراف القبعة عند حافة الدايرة
const HAT_G = 1100;
const HAT_T1 = Math.sqrt((2 * (HAT_YE - HAT_Y0)) / HAT_G); // ≈ 0.39
const HAT_VE = HAT_G * HAT_T1; // السرعة لحظة الدخول
const ENTRY = HAT_AT + HAT_T1; // ≈ 2.69
// زنبرك ناقص التخميد (نفس السرعة لحظة الدخول، فمفيش خبطة في الحركة)
const HZ = 0.65;
const HW = 13;
const HWD = HW * Math.sqrt(1 - HZ * HZ);
const HB = (HAT_VE + HZ * HW * HAT_YE) / HWD;
const hatY = (t: number) => {
  const a = t - HAT_AT;
  if (a <= HAT_T1) return HAT_Y0 + 0.5 * HAT_G * Math.max(0, a) * Math.max(0, a);
  const tau = a - HAT_T1;
  return Math.exp(-HZ * HW * tau) * (HAT_YE * Math.cos(HWD * tau) + HB * Math.sin(HWD * tau)); // موجب = ضغط على الكوباية
};
// أول لمسة للكوباية
const LAND = (() => {
  for (let f = 0; f < 60; f++) if (hatY(ENTRY + f / 300) >= 0) return ENTRY + f / 300;
  return ENTRY + 0.2;
})();
// رشّة الدخول: نقط زرقا بتطلع من حافة الدايرة
const HAT_SPLASH = Array.from({ length: 10 }, (_, i) => {
  const side = i % 2 ? 1 : -1;
  const d = 0.03 + rnd(`hd${i}`) * 0.07;
  return { side, off: rndRange(`hx${i}`, -4, 5), vx: side * rndRange(`hvx${i}`, 10, 55), vy: rndRange(`hvy${i}`, 45, 100), r: rndRange(`hr${i}`, 0.6, 1.5), d };
});
// تاج السائل: حافة الدايرة بتعلى شوية عند طرفين القبعة لحظة ما تخبط، وبتنزل تاني
const crownH = (tau: number) => (tau <= 0 ? 0 : 4.2 * (tau / 0.05) * Math.exp(1 - tau / 0.05));
const crownX = (side: number, tau: number) => cx + side * (24 + 16 * tau);
const crownD = (tau: number) => {
  const h = crownH(tau);
  const sg = 5 + 9 * tau;
  const pts: string[] = [];
  const back: string[] = [];
  for (let i = 0; i <= 60; i++) {
    const x = cx - 48 + (96 * i) / 60;
    const b = h * (Math.exp(-(((x - crownX(-1, tau)) / sg) ** 2)) + Math.exp(-(((x - crownX(1, tau)) / sg) ** 2)));
    pts.push(`${x.toFixed(2)},${(topEdge(x) - b).toFixed(2)}`);
    back.push(`${x.toFixed(2)},${(topEdge(x) + 4).toFixed(2)}`);
  }
  return `M${pts.join(" L")} L${back.reverse().join(" L")} Z`;
};

// ── «متعلم» بالحبر: حافة موجية ماشية من اليمين للشمال، والتحت سابق شوية ──
const WIPE_FROM = 314;
const WIPE_TO = -22;
const inkFront = (y: number, t: number, lead: boolean) => {
  const k = p(t, WIPE, WIPE_D, wipeEase);
  const X = lerp(WIPE_FROM, WIPE_TO, k) - (lead ? 11 : 0);
  return (
    X - 0.22 * (y - 80) + 2.4 * Math.sin(y * (TAU / 36) + t * 7 + (lead ? 2.4 : 0)) + 0.8 * Math.sin(y * (TAU / 14) - t * 6 + (lead ? 2.1 : 0)) + (lead ? 3 * Math.sin(y * (TAU / 58) + t * 4) : 0)
  );
};
const inkRegion = (t: number, lead: boolean) => {
  const n = 120;
  let d = "M340,-30";
  for (let i = 0; i <= n; i++) {
    const y = -30 + (200 * i) / n;
    d += ` L${inkFront(y, t, lead).toFixed(2)},${y.toFixed(2)}`;
  }
  return d + " L340,170 Z";
};
// رذاذ صغير أزرق من قمة الموجة السابقة (أزرق علشان ما يتقريش نقطة حرف)
const INK = Array.from({ length: 4 }, (_, i) => ({
  t0: WIPE + WIPE_D * (0.3 + i * 0.11) + rnd(`it${i}`) * 0.03,
  y0: rndRange(`iy${i}`, 50, 62),
  vx: -rndRange(`ivx${i}`, 15, 40),
  vy: rndRange(`ivy${i}`, 35, 62),
  r: rndRange(`ir${i}`, 0.8, 1.2),
}));

// ── أدوات رسم ──
const N_SURF = 104;
const SX0 = cx - r - 2;
const SX1 = cx + r + 2;
const surfPts = (fn: (x: number) => number) => Array.from({ length: N_SURF + 1 }, (_, i) => SX0 + ((SX1 - SX0) * i) / N_SURF).map((x) => `${x.toFixed(2)},${fn(x).toFixed(2)}`);
const regionD = (pts: string[]) => `M${pts.join(" L")} L${SX1},${BOT + 6} L${SX0},${BOT + 6} Z`;

// نقطة سايلة: بيضاوي ممطوط على اتجاه السرعة
const Droplet: React.FC<{ x: number; y: number; vx: number; vy: number; r: number; o: number; fill: string; spec?: boolean }> = ({ x, y, vx, vy, r: rr, o, fill, spec }) => {
  const v = Math.hypot(vx, vy);
  const st = 1 + Math.min(0.5, v / 320);
  const ang = (Math.atan2(vy, vx) * 180) / Math.PI - 90;
  return (
    <g transform={`translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${ang.toFixed(1)})`} opacity={o}>
      <ellipse rx={rr / Math.sqrt(st)} ry={rr * st} fill={fill} />
      {spec && rr > 1.25 && <circle cx={-rr * 0.28} cy={-rr * 0.32} r={rr * 0.24} fill={K.white} opacity={0.45} />}
    </g>
  );
};

export const L06LiquidFill: React.FC = () => {
  const t = useT();

  // ── السائل ──
  const L = levelAt(t);
  const env = waveEnv(t);
  const slosh = 2.1 * env * Math.sin(t * (TAU / 1.3) + 0.6);
  const dip = env * 1.8 * (1 - p(t, POUR_END + 0.12, 0.18));
  const front = (x: number) => L + env * (3.6 * Math.sin(x * (TAU / 56) + t * 3.4) + 1.3 * Math.sin(x * (TAU / 23) - t * 5.2 + 1.7)) + (slosh * (x - cx)) / r + dip * Math.exp(-(((x - XS) / 6) ** 2));
  const back = (x: number) => L - 2.0 * env + env * (3.1 * Math.sin(x * (TAU / 74) - t * 2.5 + 0.9) + 1.0 * Math.sin(x * (TAU / 31) + t * 3.9 + 2.2)) - (0.7 * slosh * (x - cx)) / r;
  const wet = t >= IMPACT;
  const liquidOn = t < SOLID;
  const frontPts = wet ? surfPts(front) : [];
  const frontD = wet ? regionD(frontPts) : "";
  const backD = wet ? regionD(surfPts(back)) : "";
  const gloss = 1 - p(t, 2.12, 0.4, easeInOut);
  const glass = lerp(0.45, 1, p(t, 0, 0.6, ease)) * (1 - p(t, 2.1, 0.42, easeInOut));

  // ── الشلال ──
  const sfS = wet ? front(XS) : BOT;
  const yHead = fallY(t - POUR);
  const headFree = yHead < sfS + 4;
  const yB = Math.min(yHead, sfS + 4);
  const yA = t < POUR_END ? Y0 : fallY(t - POUR_END);
  const streamOn = t >= POUR && yA < yB - 0.5;
  const xcAt = (y: number) => XS + 0.6 * Math.sin(y * 0.07 - t * 12) * c01((y - Y0) / 250) + 0.4 * noise1("sway", t * 1.4);
  const wAt = (y: number) => {
    let w = widthAt(y);
    if (headFree) w *= 1 + 0.32 * Math.exp(-(yB - y) / 5); // راس منفوخ
    if (t >= POUR_END) w *= 0.42 + 0.58 * (1 - Math.exp(-(y - yA) / 14)); // ديل رفيع
    return w;
  };
  let streamD = "";
  let hiD = "";
  let shD = "";
  if (streamOn) {
    const n = 52;
    const Lp: string[] = [];
    const Rp: string[] = [];
    const hi: string[] = [];
    const sh: string[] = [];
    let wA = 0;
    let wB = 0;
    for (let i = 0; i <= n; i++) {
      const y = yA + ((yB - yA) * i) / n;
      const w = wAt(y);
      const x = xcAt(y);
      Lp.push(`${(x - w / 2).toFixed(2)},${y.toFixed(2)}`);
      Rp.push(`${(x + w / 2).toFixed(2)},${y.toFixed(2)}`);
      if (i > 1 && i < n - 1) {
        hi.push(`${(x - w * 0.24).toFixed(2)},${y.toFixed(2)}`);
        sh.push(`${(x + w * 0.28).toFixed(2)},${y.toFixed(2)}`);
      }
      if (i === 0) wA = w;
      if (i === n) wB = w;
    }
    const rA = (wA / 2).toFixed(2);
    const rB = (wB / 2).toFixed(2);
    streamD = `M${Lp.join(" L")} A${rB},${rB} 0 0 0 ${Rp[n]} L${Rp.slice(0, n).reverse().join(" L")} A${rA},${rA} 0 0 0 ${Lp[0]} Z`;
    if (hi.length > 1) hiD = `M${hi.join(" L")}`;
    if (sh.length > 1) shD = `M${sh.join(" L")}`;
  }

  // ── الكاميرا: الرمز في النص الأول، وبعدين ترجع للشعار كامل ──
  const camK = p(t, CAM, 1.0, easeInOut);
  const sFill = lerp(1.24, 1.28, p(t, 0, CAM, easeInOut));
  const cam = lerp(sFill, 1, camK);
  const camX = -(1 - camK) * cam * (cx - VIEW.w / 2) * U;

  // ── القبعة ──
  const hy = hatY(t);
  const hv = (hatY(t) - hatY(t - 1 / 60)) * 60;
  const tauL = t - LAND;
  // تموّج الدايرة لما القبعة تنزل
  const wob = tauL > 0 && tauL < 1.3 ? 0.014 * Math.exp(-4.5 * tauL) * Math.sin(TAU * 2.2 * tauL) : 0;

  // ── الكلمة ──
  const wipeOn = t >= WIPE && t < WIPE + WIPE_D + 0.05;

  const ripK = p(t, LAND - 0.02, 0.85, ease);
  const glintK = p(t, GLINT, 1.15, easeInOut);
  const glintX = lerp(cx - r - 40, cx + r + 40, glintK);
  const glintO = Math.sin(Math.PI * glintK) * 0.3;

  return (
    <Stage bg={`radial-gradient(ellipse at 50% 46%, #FFFFFF 0%, #FBFAF8 38%, ${K.offwhite} 78%)`} vignette={0.07} grain={0.045}>
      <Sfx at={IMPACT - 0.1} name="liquid" vol={0.5} />
      <Sfx at={1.2} name="bubbles" vol={0.26} />
      <Sfx at={ENTRY - 0.02} name="pop_lo" vol={0.55} />
      <Sfx at={WIPE - 0.02} name="slide" vol={0.42} />
      <Sfx at={4.0} name="chime" vol={0.45} />
      <Center x={camX} scale={cam}>
        <Logo
          width={LOGO_W}
          defs={
            <>
              <clipPath id="l6-circ">
                <circle cx={cx} cy={cy} r={r} />
              </clipPath>
              {/* الشلال يبان فوق الدايرة، وتحت نصها جوه الدايرة بس */}
              <clipPath id="l6-pour">
                <rect x={cx - 200} y={-400} width={400} height={400 + cy} />
                <circle cx={cx} cy={cy} r={r} />
              </clipPath>
              {wet && (
                <>
                  <clipPath id="l6-front">
                    <path d={frontD} />
                  </clipPath>
                  {/* الكوباية بيضا في أي حتة السائل وصلها */}
                  <clipPath id="l6-wet">
                    <path d={frontD} />
                    <path d={backD} />
                  </clipPath>
                  <linearGradient id="l6-depth" gradientUnits="userSpaceOnUse" x1={0} y1={L - 4} x2={0} y2={BOT}>
                    <stop offset={0} stopColor={K.sky} stopOpacity={0.34} />
                    <stop offset={0.16} stopColor={K.sky} stopOpacity={0.12} />
                    <stop offset={0.5} stopColor={K.sky} stopOpacity={0} />
                    <stop offset={0.8} stopColor={K.navy} stopOpacity={0} />
                    <stop offset={1} stopColor={K.navy} stopOpacity={0.22} />
                  </linearGradient>
                </>
              )}
              <filter id="l6-soft" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation={0.55} />
              </filter>
              {wipeOn && (
                <>
                  <clipPath id="l6-ink">
                    <path d={inkRegion(t, false)} />
                  </clipPath>
                  <clipPath id="l6-ink-lead">
                    <path d={inkRegion(t, true)} />
                  </clipPath>
                </>
              )}
              <linearGradient id="l6-glint" x1={0} x2={1} y1={0} y2={0}>
                <stop offset={0} stopColor={K.white} stopOpacity={0} />
                <stop offset={0.5} stopColor={K.white} stopOpacity={1} />
                <stop offset={1} stopColor={K.white} stopOpacity={0} />
              </linearGradient>
            </>
          }
          under={
            <>
              {liquidOn && (
                <>
                  {/* الكوباية الفاضية: خط الدايرة + حافة جوه + لمحة الكوباية */}
                  <g opacity={glass}>
                    <circle cx={cx} cy={cy} r={r} fill={K.blue} fillOpacity={0.035} stroke={K.blue} strokeOpacity={0.9} strokeWidth={0.9} />
                    <circle cx={cx} cy={cy} r={r - 2.3} fill="none" stroke={K.blue} strokeOpacity={0.13} strokeWidth={0.5} />
                    <path d={CUP.d} fill="none" stroke={K.blue} strokeOpacity={0.24} strokeWidth={0.55} />
                  </g>
                  {/* الموجة اللي ورا (أفتح) */}
                  {wet && (
                    <g clipPath="url(#l6-circ)">
                      <path d={backD} fill={K.blue} />
                      <path d={backD} fill={K.sky} fillOpacity={0.4} />
                    </g>
                  )}
                  {/* الشلال + النقط (تحت الموجة اللي قدام علشان يدخل جوه السائل) */}
                  <g clipPath="url(#l6-pour)">
                    {streamOn && (
                      <>
                        <path d={streamD} fill={K.blue} />
                        {shD && <path d={shD} fill="none" stroke={K.navy} strokeOpacity={0.2} strokeWidth={1.3} strokeLinecap="round" filter="url(#l6-soft)" />}
                        {hiD && <path d={hiD} fill="none" stroke={K.white} strokeOpacity={0.55} strokeWidth={0.9} strokeLinecap="round" filter="url(#l6-soft)" />}
                      </>
                    )}
                    {SATS.map((s, i) => {
                      const tau = t - s.t0;
                      if (tau <= 0) return null;
                      const y = fallY(tau);
                      const x = XS + s.dx + tau * s.dx * 1.4;
                      if (y > BOT + 4) return null;
                      return <Droplet key={i} x={x} y={y} vx={s.dx * 1.4} vy={speedAt(y)} r={s.r} o={1} fill={K.blue} />;
                    })}
                    {t >= POUR_END &&
                      [0, 1].map((j) => {
                        const tau = t - POUR_END - 0.07 * (j + 1);
                        if (tau <= 0) return null;
                        const y = fallY(tau) - 4;
                        if (y > BOT + 4) return null;
                        return <Droplet key={`tail${j}`} x={xcAt(y)} y={y} vx={0} vy={speedAt(y)} r={j ? 0.9 : 1.35} o={1} fill={K.blue} spec />;
                      })}
                    {wet &&
                      SPLASH.map((d, i) => {
                        const tau = t - d.t0;
                        if (tau <= 0 || tau > 0.85) return null;
                        const y0 = Math.min(levelAt(d.t0), L) - 0.5;
                        const x = XS + d.vx * tau;
                        const y = y0 - d.vy * tau + 0.5 * SPLASH_G * tau * tau;
                        const o = c01(tau * 30) * (1 - p(tau, 0.5, 0.35));
                        return <Droplet key={`s${i}`} x={x} y={y} vx={d.vx} vy={-d.vy + SPLASH_G * tau} r={d.r * (1 - 0.3 * c01(tau / 0.8))} o={o} fill={K.blue} spec />;
                      })}
                  </g>
                  {/* الموجة اللي قدام + العمق + الفقاعات + خط السطح */}
                  {wet && (
                    <g clipPath="url(#l6-circ)">
                      <path d={frontD} fill={K.blue} />
                      <path d={frontD} fill="url(#l6-depth)" opacity={gloss} />
                      <g clipPath="url(#l6-front)" opacity={1 - p(t, FULL - 0.15, 0.3)}>
                        {BUBBLES.map((b, i) => {
                          const tau = t - b.t0;
                          if (tau <= 0 || tau > 1.8) return null;
                          let x0: number;
                          let y0: number;
                          const L0 = levelAt(b.t0);
                          if (b.fromPour) {
                            x0 = XS + b.u * 7;
                            y0 = L0 + 4 + b.dv * 12;
                          } else {
                            y0 = lerp(L0 + 7, BOT - 3, b.dv);
                            x0 = cx + b.u * halfChord(y0) * 0.78;
                          }
                          if (y0 > BOT - 2) return null;
                          const y = y0 - b.v * tau - 16 * tau * tau;
                          const x = x0 + 1.1 * Math.sin(tau * 8 + b.ph) * c01(tau * 3);
                          const o = c01(tau / 0.1) * c01((y - front(x)) / 3.5);
                          if (o <= 0) return null;
                          return <circle key={i} cx={x} cy={y} r={b.r} fill={K.white} fillOpacity={0.16 * o} stroke={K.white} strokeOpacity={0.62 * o} strokeWidth={0.28} />;
                        })}
                      </g>
                      <path d={`M${frontPts.join(" L")}`} fill="none" stroke={K.white} strokeOpacity={0.42 * gloss} strokeWidth={0.7} />
                    </g>
                  )}
                  {/* الكوباية بيضا (مساحة سلبية) لما السائل يعدّي عليها */}
                  {wet && (
                    <g clipPath="url(#l6-wet)">
                      <path d={CUP.d} fill={K.white} />
                    </g>
                  )}
                  {/* انعكاس الإزاز: بيبان بس فوق الأزرق */}
                  {wet && (
                    <g clipPath="url(#l6-circ)" opacity={gloss}>
                      <path
                        d={`M${cx + (r - 6) * Math.cos((205 * Math.PI) / 180)},${cy + (r - 6) * Math.sin((205 * Math.PI) / 180)} A${r - 6},${r - 6} 0 0 1 ${cx + (r - 6) * Math.cos((246 * Math.PI) / 180)},${cy + (r - 6) * Math.sin((246 * Math.PI) / 180)}`}
                        fill="none"
                        stroke={K.white}
                        strokeOpacity={0.3}
                        strokeWidth={3.2}
                        strokeLinecap="round"
                        filter="url(#l6-soft)"
                      />
                      <circle cx={cx + (r - 6) * Math.cos((254 * Math.PI) / 180)} cy={cy + (r - 6) * Math.sin((254 * Math.PI) / 180)} r={1.4} fill={K.white} opacity={0.3} filter="url(#l6-soft)" />
                    </g>
                  )}
                </>
              )}
              {/* رشّة القبعة: نقط زرقا بتنط من حافة الدايرة (تحت القبعة والدايرة) */}
              {t > ENTRY && t < ENTRY + 0.6 && <path d={crownD(t - ENTRY)} fill={K.blue} />}
              {HAT_SPLASH.map((d, i) => {
                const tau = t - ENTRY - d.d;
                if (tau <= 0 || tau > 0.7) return null;
                // بتطلع من قمة التاج
                const x0 = crownX(d.side, d.d) + d.off;
                const x = x0 + d.vx * tau;
                const y = topEdge(x0) - crownH(d.d) * 0.85 - d.vy * tau + 0.5 * 760 * tau * tau;
                if (y > topEdge(x) + 1.5) return null;
                return <Droplet key={`h${i}`} x={x} y={y} vx={d.vx} vy={-d.vy + 760 * tau} r={d.r * (1 - 0.35 * c01(tau / 0.6))} o={c01(tau * 25)} fill={K.blue} spec />;
              })}
            </>
          }
          part={(pt) => {
            const id = pt.id;
            // الدايرة والكوباية الأصليين بعد ما تتملي (مع تموّج بسيط لما القبعة تنزل)
            if (id === "circle" || id === "cup") {
              if (t < SOLID) return { hidden: true };
              if (!wob) return {};
              const origin = id === "circle" ? "50% 100%" : `${(cx - CUP.box.x).toFixed(2)}px ${(BOT - CUP.box.y).toFixed(2)}px`;
              return { scaleY: 1 - wob, scaleX: 1 + wob * 0.7, origin };
            }
            if (id === "hat") {
              if (t < HAT_AT) return { hidden: true };
              if (tauL > 1.1) return {};
              const stroke = 0.7 * (1 - p(t, ENTRY, 0.32));
              if (t < LAND) {
                // ممطوطة على قد سرعتها
                const st = Math.min(0.07, Math.abs(hv) / 6000);
                return { y: hy, scaleY: 1 + st, scaleX: 1 - st * 0.5, origin: "50% 100%", stroke: K.blue, strokeWidth: stroke };
              }
              // ضغط على الكوباية (الأطراف ثابتة) وبعدين ترفع شعرة وتهدى
              const sq = Math.max(0, hy);
              return { y: Math.min(0, hy), scaleY: 1 - 0.02 * sq - 0.012 * Math.min(0, hy), scaleX: 1 + 0.012 * sq, origin: "50% 100%", stroke: K.blue, strokeWidth: stroke };
            }
            if (id === "word") return t < WIPE + WIPE_D + 0.05 ? { hidden: true } : {};
            const mi = MARKS.findIndex((m) => m.id === id);
            if (mi >= 0) {
              // النقط بتنقط زي نقط حبر: تقع، تنضغط، تهدى
              const a = DOTS + mi * 0.065;
              const FALL = 0.24;
              if (t < a) return { hidden: true };
              if (t < a + FALL) {
                const k = (t - a) / FALL;
                return { y: -24 * (1 - k * k), opacity: c01(k * 4), scale: lerp(0.7, 1, ease(k)), scaleY: 1 + 0.12 * k, scaleX: 1 - 0.05 * k, origin: "50% 100%" };
              }
              const tau = t - a - FALL;
              if (tau > 0.6) return {};
              const w = TAU * 3.4;
              const d = (60 / w) * Math.exp(-9 * tau) * Math.sin(w * tau);
              const sq = Math.max(0, d);
              return { y: Math.min(0, d), scaleY: 1 - 0.07 * sq + 0.03 * Math.max(0, -d), scaleX: 1 + 0.045 * sq, origin: "50% 100%" };
            }
            const ti = TAG.findIndex((m) => m.id === id);
            if (ti >= 0) {
              const k = p(t, TAGS + ti * 0.014, 0.36, ease);
              if (k <= 0) return { hidden: true };
              if (k >= 1) return {};
              return { y: 7 * (1 - k), opacity: k, blur: 1.2 * (1 - k) };
            }
            return {};
          }}
          over={
            <>
              {/* موجة دايرية من مكان نزول القبعة */}
              {ripK > 0 && ripK < 1 && (
                <g clipPath="url(#l6-circ)">
                  <circle cx={cx} cy={44} r={lerp(4, 82, ripK)} fill="none" stroke={K.white} strokeOpacity={0.34 * Math.pow(1 - ripK, 1.4)} strokeWidth={lerp(1.6, 0.3, ripK)} />
                </g>
              )}
              {INK.map((d, i) => {
                const tau = t - d.t0;
                if (tau <= 0 || tau > 0.32) return null;
                const x0 = inkFront(d.y0, d.t0, true);
                const x = x0 + d.vx * tau;
                const y = d.y0 - d.vy * tau + 0.5 * 700 * tau * tau;
                return <Droplet key={`i${i}`} x={x} y={y} vx={d.vx} vy={-d.vy + 700 * tau} r={d.r * (1 - 0.4 * (tau / 0.32))} o={c01(tau * 30) * (1 - p(tau, 0.18, 0.14))} fill={K.blue} />;
              })}
              {/* «متعلم» بتتملي حبر: موجة زرقا سابقة، وبعدها الحبر الأسود */}
              {wipeOn && (
                <>
                  <g clipPath="url(#l6-ink-lead)">
                    <path d={WORD.d} fill={K.blue} />
                  </g>
                  <g clipPath="url(#l6-ink)">
                    <path d={WORD.d} fill={K.black} />
                  </g>
                </>
              )}
              {/* لمعة هادية على الدايرة في الثبات */}
              {glintK > 0 && glintK < 1 && (
                <g clipPath="url(#l6-circ)" opacity={glintO}>
                  <rect x={glintX - 16} y={-30} width={32} height={210} fill="url(#l6-glint)" transform={`rotate(24 ${glintX} ${cy})`} />
                </g>
              )}
            </>
          }
        />
      </Center>
    </Stage>
  );
};

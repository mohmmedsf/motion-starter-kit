// 12 · قلبة 3D (3D flip)
// مسرح كحلي غامق وسبوت لايت بيلف ببطء ← الرمز جاي من العمق زي ميدالية تقيلة بتلف على محور Y (لفتين وربع) وبتهدى
// ← بتقف مكانها بوشها لقدّام مع ارتداد صغير ولمعة ← «متعلم» تقوم زي كارت على مفصلة ← النقط تطقطق
// ← الجملة تتقلب كلمة كلمة ← الشعار الأصلي (الثيم الغامق) ثابت، مع لمعة هادية وانعكاس خفيف على الأرض
// الـ 3D كله CSS: perspective + preserve-3d؛ حرف الميدالية 96 شريحة حوالين الدايرة (أسطوانة مقفولة، كل شريحة متنوّرة لوحدها)
import React from "react";
import { AbsoluteFill } from "remotion";
import { CIRCLE, CIRCLE_D, CUP, HAT, Logo, MARKS, Part, PartStyle, TAG, VIEW } from "../logo";
import { Center, H, K, LOGO_W, Sfx, Stage, U, W, ease, easeInOut, expoOut, lerp, p, useSpring, useT } from "../fx";

/* ---------------- المقاسات (بكسل الكادر) ---------------- */
const LH = (LOGO_W * VIEW.h) / VIEW.w; // ارتفاع الشعار
const LX = (W - LOGO_W) / 2; // ركن الشعار فوق شمال
const LY = (H - LH) / 2;
const CX = LX + CIRCLE.cx * U; // نص الدايرة في الكادر
const CY = LY + CIRCLE.cy * U;
const R = CIRCLE.r * U; // نص قطر الدايرة
const FLOOR = LY + LH + 3; // خط الأرض (تحت الشعار على طول)
const PERSP = 1800; // بعد الكاميرا
const REFL_H = 190; // طول الانعكاس تحت الأرض
const REFL_MASK = "linear-gradient(180deg, rgba(0,0,0,1) 0px, rgba(0,0,0,0.3) 58px, rgba(0,0,0,0) 165px)";
const PO = { x: W / 2, y: H / 2 }; // نقطة التلاشي
const T0 = 40; // سُمك الميدالية
const NF = 96; // عدد شرايح الحرف
const FACET_W = 2 * R * Math.tan(Math.PI / NF) + 1.4; // عرض الشريحة (مع تداخل بسيط يمنع الفتحات)

/* ---------------- التوقيت (على فريمات مظبوطة) ---------------- */
const fr = (n: number) => n / 30;
const IN = fr(6); // الميدالية تظهر من بعيد
const LAND = fr(62); // توصل مكانها بوشها لقدّام (الضربة)
const D = (LAND - IN) * 30; // مدة الطيران بالفريمات
const COIN_X = fr(80); // الرمز المسطح الأصلي يظهر تحت الميدالية (تبديل ناعم)
const COIN_FLAT = fr(90); // الميدالية اختفت خالص
const CARD = fr(66); // «متعلم» تبدأ تقوم
const MARK0 = fr(84); // أول نقطة (والباقي كل فريمين)
const TAG0 = fr(90); // أول كلمة في الجملة (والباقي كل 3 فريمات)
const TAG_GAP = fr(3);
const RESOLVE = TAG0 + 2 * TAG_GAP + fr(7); // آخر كلمة وقفت: الشعار كامل (chime)
const FREEZE = fr(112); // بواقي الزنابرك خلصت صفر بالظبط
const ALL_FLAT = fr(120); // كل الطبقات بقت الشعار الأصلي المسطح بالظبط
const GLINT = 4.45; // لمعة الثبات

// كلمات الجملة (من اليمين): حان / وقت / الإبداع
const TAG_WORDS: Part[][] = [TAG.slice(0, 3), TAG.slice(3, 9), TAG.slice(9)];
const TAG_HINGE = 113; // المفصلة فوق الجملة (وحدات الشعار)
const WORD_HINGE = 134.5; // المفصلة تحت الكلمة

/* ---------------- حركة الميدالية ---------------- */
const SPIN = 810; // لفتين وربع: بتبدأ بحرفها ناحيتنا وتخلص بوشها
const Z0 = 7000; // جاية من بعيد قوي
const CS = 0.2; // سرعة اللف اللي فاضلة لحظة الوصول (عشان الارتداد يطلع طبيعي)
const CZ = 0.08;
const W_OSC = Math.PI / 9; // تذبذب الارتداد (لكل فريم)
const A_OSC = 0.085;
// ارتداد مخمّد بيبدأ بسرعة v0 (لكل فريم) من الصفر
const damped = (tau: number, v0: number) => (v0 / W_OSC) * Math.exp(-A_OSC * tau) * Math.sin(W_OSC * tau);

type Pose = { x: number; y: number; z: number; ry: number; rx: number; rz: number };
const coinPose = (t: number): Pose => {
  if (t < LAND) {
    const u = Math.max(0, ((t - IN) * 30) / D);
    const q = 1 - u;
    const g = (1 - CS) * q ** 3 + CS * q; // تهدية قوية (شبه expo) مع سرعة صغيرة في الآخر
    const h = (1 - CZ) * q ** 4 + CZ * q;
    return { x: CX - 300 * q ** 2.5, y: CY - 230 * q ** 3, z: -Z0 * h, ry: -SPIN * g, rx: 20 * q * q, rz: -10 * q * q };
  }
  const tau = (t - LAND) * 30;
  const settle = 1 - p(t, LAND + 0.3, COIN_X - LAND - 0.3, easeInOut); // البواقي تخلص صفر بالظبط قبل التبديل
  return {
    x: CX,
    y: CY,
    z: damped(tau, (Z0 * CZ) / D) * settle,
    ry: damped(tau, (SPIN * CS) / D) * settle,
    rx: -damped(tau, 0.55) * settle,
    rz: 0,
  };
};

/* ---------------- إضاءة بسيطة (كله في إحداثيات CSS: x يمين، y تحت، z ناحية الكاميرا) ---------------- */
type V3 = [number, number, number];
const norm = (v: V3): V3 => {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
};
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const rad = (d: number) => (d * Math.PI) / 180;
// نفس مصفوفات CSS: rotateZ(rz) rotateX(rx) rotateY(ry)
const rotate = (v: V3, o: Pose): V3 => {
  let [x, y, z] = v;
  let c = Math.cos(rad(o.ry));
  let s = Math.sin(rad(o.ry));
  [x, z] = [x * c + z * s, -x * s + z * c];
  c = Math.cos(rad(o.rx));
  s = Math.sin(rad(o.rx));
  [y, z] = [y * c - z * s, y * s + z * c];
  c = Math.cos(rad(o.rz));
  s = Math.sin(rad(o.rz));
  [x, y] = [x * c - y * s, x * s + y * c];
  return [x, y, z];
};
const KEY = norm([-0.5, -0.62, 0.6]); // نور أساسي: فوق شمال قدّام
const BACK = norm([0.85, -0.2, -0.5]); // نور حافة سماوي من ورا يمين
const HALF = norm([KEY[0], KEY[1], KEY[2] + 1]);
const CAM: V3 = [PO.x, PO.y, PERSP];

const hex = (h: string): V3 => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const BLUE = hex(K.blue);
const NAVY = hex(K.navy);
const SKY = hex(K.sky);
const WHITE: V3 = [255, 255, 255];
const RIM: V3 = [0.62 * NAVY[0] + 0.38 * BLUE[0], 0.62 * NAVY[1] + 0.38 * BLUE[1], 0.62 * NAVY[2] + 0.38 * BLUE[2]]; // حرف كحلي-أزرق
const FOG: V3 = [5, 11, 20]; // لون الضلمة البعيدة (كحلي على أسود)
const rgb = (c: V3, a = 1) => `rgba(${c.map((v) => Math.round(Math.max(0, Math.min(255, v)))).join(",")},${a})`;
const addC = (a: V3, b: V3, k: number): V3 => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
const mixC = (a: V3, b: V3, k: number): V3 => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];

/* ---------------- الميدالية ---------------- */
type CoinState = { pose: Pose; thick: number; fog: number; dec: number; sweep: number };

const Overlay: React.FC<{ style: React.CSSProperties }> = ({ style }) => <div style={{ position: "absolute", inset: 0, borderRadius: "50%", ...style }} />;

// شريط لمعة جوه الوش (pos: 0..100٪ من الشمال، k: الشدة)
const Band: React.FC<{ pos: number; k: number; w?: number }> = ({ pos, k, w = 40 }) =>
  k > 0.004 ? (
    <div
      style={{
        position: "absolute",
        left: `${pos}%`,
        top: "-30%",
        width: `${w}%`,
        height: "160%",
        transform: "translateX(-50%) rotate(16deg)",
        background: `linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,${k * 0.35}) 30%, rgba(255,255,255,${k}) 50%, rgba(255,255,255,${k * 0.35}) 70%, rgba(255,255,255,0) 100%)`,
      }}
    />
  ) : null;

// حافة مشطوفة رفيعة بتمسك النور من فوق شمال (لمعة الميداليات)
const Chamfer: React.FC<{ k: number; mirror?: boolean }> = ({ k, mirror }) => {
  const a = mirror ? 45 : -45; // ضهر الميدالية متقلوب يمين-شمال
  const ring = "radial-gradient(circle, rgba(0,0,0,0) 0, rgba(0,0,0,0) calc(100% - 7px), #000 calc(100% - 5px), #000 calc(100% - 1px), rgba(0,0,0,0) 100%)";
  return (
    <Overlay
      style={{
        background: `conic-gradient(from ${a - 70}deg, rgba(255,255,255,0) 0deg, rgba(255,255,255,${0.55 * k}) 70deg, rgba(255,255,255,0) 140deg, rgba(255,255,255,0) 360deg)`,
        WebkitMaskImage: ring,
        maskImage: ring,
      }}
    />
  );
};

const MarkSvg: React.FC<{ tone?: number }> = ({ tone }) => (
  <svg width={2 * R} height={2 * R} viewBox={`${CIRCLE.cx - CIRCLE.r} ${CIRCLE.cy - CIRCLE.r} ${2 * CIRCLE.r} ${2 * CIRCLE.r}`} style={{ position: "absolute", left: 0, top: 0 }}>
    <circle cx={CIRCLE.cx} cy={CIRCLE.cy} r={CIRCLE.r} fill={K.blue} />
    <path d={CUP.d} fill={K.white} fillOpacity={tone ?? 1} />
    <path d={HAT.d} fill={K.white} fillOpacity={tone ?? 1} />
  </svg>
);

const Coin: React.FC<{ c: CoinState }> = ({ c }) => {
  const { pose, thick, fog, dec, sweep } = c;
  const zc = pose.z - thick / 2; // الوش الأمامي يقع على z بالظبط
  const center: V3 = [pose.x, pose.y, zc];
  const nf = rotate([0, 0, 1], pose);
  const toCam = norm([CAM[0] - center[0], CAM[1] - center[1], CAM[2] - center[2]]);
  const frontVis = dot(nf, toCam) > 0;

  // إضاءة الوش: بالنسبة للوضع الأمامي (عشان في الآخر يبقى صفر بالظبط)
  const faceLight = (n: V3) => {
    const k = Math.max(0, dot(n, KEY)) / KEY[2];
    const shade = Math.min(0.62, Math.max(0, 1 - k) * 0.7);
    const bright = Math.max(0, k - 1) * 0.32;
    // انعكاس السوفت بوكس: بيعدّي على الوش وهو بيلف
    const da = Math.atan2(n[0], n[2]) - Math.atan2(HALF[0], HALF[2]);
    const dv = Math.abs(Math.atan2(n[1], n[2]) - Math.atan2(HALF[1], HALF[2]));
    const sk = Math.max(0, 1 - Math.abs(da) / 0.55) ** 2 * Math.max(0, 1 - dv / 0.9) * 0.42 * (n[2] > 0 ? 1 : 0.6);
    return { shade, bright, sheenPos: 50 - (da / 0.55) * 75, sheen: sk };
  };

  const faceStyle: React.CSSProperties = {
    position: "absolute",
    left: -R,
    top: -R,
    width: 2 * R,
    height: 2 * R,
    borderRadius: "50%",
    overflow: "hidden",
    backfaceVisibility: "hidden",
  };

  const front = (() => {
    const L = faceLight(nf);
    return (
      <div style={{ ...faceStyle, transform: `translateZ(${thick / 2}px)` }}>
        <MarkSvg />
        {dec > 0.002 && (
          <>
            {/* نقش الميدالية (أثناء الطيران بس) */}
            <Overlay style={{ background: `radial-gradient(circle at 34% 28%, rgba(255,255,255,${0.17 * dec}) 0%, rgba(255,255,255,0) 58%)` }} />
            <Overlay style={{ background: `radial-gradient(circle at 72% 82%, rgba(0,0,0,${0.22 * dec}) 0%, rgba(0,0,0,0) 62%)` }} />
            <Overlay style={{ boxShadow: `inset 0 0 0 ${4}px rgba(255,255,255,${0.09 * dec}), inset 0 -10px 24px rgba(0,0,0,${0.32 * dec}), inset 0 8px 18px rgba(255,255,255,${0.07 * dec})` }} />
            <Chamfer k={dec} />
          </>
        )}
        {L.shade + fog > 0.002 && <Overlay style={{ background: rgb(FOG, Math.min(0.9, L.shade + fog)) }} />}
        {L.bright > 0.002 && <Overlay style={{ background: `rgba(255,255,255,${L.bright})` }} />}
        <Band pos={L.sheenPos} k={L.sheen * Math.max(dec, 0)} w={46} />
        {/* لمعة الوصول: بتعدّي على الوش من الشمال لليمين */}
        <Band pos={lerp(-40, 150, sweep)} k={0.5 * Math.sin(Math.PI * Math.min(1, Math.max(0, sweep)))} w={34} />
      </div>
    );
  })();

  const back = (() => {
    const L = faceLight([-nf[0], -nf[1], -nf[2]]);
    return (
      <div style={{ ...faceStyle, transform: `rotateY(180deg) translateZ(${thick / 2}px)`, background: K.blue }}>
        {/* ضهر الميدالية: نفس الرمز محفور بلون قريب */}
        <MarkSvg tone={0.13} />
        <Overlay style={{ background: `radial-gradient(circle at 62% 30%, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0) 60%)` }} />
        <Overlay style={{ boxShadow: `inset 0 0 0 4px rgba(255,255,255,0.08), inset 0 -10px 24px rgba(0,0,0,0.3)` }} />
        <Chamfer k={0.8} mirror />
        <Overlay style={{ background: rgb(FOG, Math.min(0.9, L.shade + fog + 0.1)) }} />
        {L.bright > 0.002 && <Overlay style={{ background: `rgba(255,255,255,${L.bright})` }} />}
        <Band pos={L.sheenPos} k={L.sheen} w={46} />
      </div>
    );
  })();

  // شرايح الحرف: كل شريحة بنورها، وبنرسم اللي باصّة للكاميرا بس (جسم محدّب ⇒ مفيش تداخل ولا z-fighting)
  const facets: React.ReactNode[] = [];
  if (thick > 0.4) {
    for (let i = 0; i < NF; i++) {
      const phi = (i * 360) / NF;
      const ln: V3 = [Math.sin(rad(phi)), -Math.cos(rad(phi)), 0];
      const n = rotate(ln, pose);
      const pr = rotate([ln[0] * R, ln[1] * R, 0], pose);
      const v = norm([CAM[0] - (center[0] + pr[0]), CAM[1] - (center[1] + pr[1]), CAM[2] - (center[2] + pr[2])]);
      if (dot(n, v) <= -0.02) continue;
      // تظليل ناعم: لون كل طرف من الشريحة بنورمال الطرف ده (من غير درجات سلم بين الشرايح)
      const shadeAt = (deg: number) => {
        const nn = rotate([Math.sin(rad(deg)), -Math.cos(rad(deg)), 0], pose);
        const lam = Math.max(0, dot(nn, KEY));
        const spec = Math.max(0, dot(nn, HALF)) ** 14;
        const rim = Math.max(0, dot(nn, BACK)) ** 1.6;
        let col: V3 = [RIM[0] * (0.3 + 0.95 * lam), RIM[1] * (0.3 + 0.95 * lam), RIM[2] * (0.3 + 0.95 * lam)];
        col = addC(col, WHITE, 0.75 * spec);
        col = addC(col, SKY, 0.32 * rim);
        return rgb(mixC(col, FOG, fog));
      };
      const half = 180 / NF;
      facets.push(
        <div
          key={i}
          style={{
            position: "absolute",
            left: -FACET_W / 2,
            top: -thick / 2,
            width: FACET_W,
            height: thick,
            background: `linear-gradient(90deg, ${shadeAt(phi - half)}, ${shadeAt(phi + half)})`,
            backfaceVisibility: "hidden",
            transform: `rotateZ(${phi}deg) translateY(${-R}px) rotateX(90deg)`,
          }}
        />,
      );
    }
  }

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: 0,
        height: 0,
        transformStyle: "preserve-3d",
        transform: `translate3d(${pose.x}px, ${pose.y}px, ${zc}px) rotateZ(${pose.rz}deg) rotateX(${pose.rx}deg) rotateY(${pose.ry}deg)`,
      }}
    >
      {facets}
      {frontVis ? front : back}
    </div>
  );
};

/* ---------------- كروت الكلام (مفصلة rotateX) ---------------- */
const Card: React.FC<{ angle: number; hinge: number; part: (pt: Part) => PartStyle | undefined }> = ({ angle, hinge, part }) => (
  <div
    style={{
      position: "absolute",
      left: LX,
      top: LY,
      width: LOGO_W,
      height: LH,
      transformOrigin: `50% ${hinge * U}px`,
      transform: `rotateX(${angle}deg)`,
      backfaceVisibility: "hidden",
    }}
  >
    <Logo width={LOGO_W} theme="dark" part={(pt) => part(pt) ?? { hidden: true }} />
  </div>
);

// الكلام بيغمق وهو مايل عن النور
const tilt = (a: number) => 0.38 + 0.62 * Math.cos(rad(Math.min(90, Math.abs(a)))) ** 0.8;

type SceneState = {
  t: number;
  coin: CoinState;
  coinOpacity: number;
  blur: number;
  word: number; // زاوية كارت «متعلم»
  marks: number[]; // تقدّم كل نقطة (زنبرك)
  tags: number[]; // زوايا كلمات الجملة
  glint: number; // -1 = مفيش
};

const Scene: React.FC<{ s: SceneState; id: string }> = ({ s, id }) => {
  const { t } = s;
  const markIdx = (pid: string) => MARKS.findIndex((m) => m.id === pid);
  const markStyle = (pid: string): PartStyle | undefined => {
    const k = s.marks[markIdx(pid)];
    if (k <= 0.001) return { hidden: true };
    return { scale: k, y: -7 * (1 - Math.min(1, k)), opacity: Math.min(1, k * 2.5) };
  };
  const persp: React.CSSProperties = { position: "absolute", inset: 0, perspective: `${PERSP}px`, perspectiveOrigin: `${PO.x}px ${PO.y}px` };
  const gx = lerp(CIRCLE.cx + CIRCLE.r + 50, CIRCLE.cx - CIRCLE.r - 50, s.glint);
  // التبديل للشعار المسطح: المسطح تحت بيظهر، والـ 3D فوقه بيختفي (مزج حقيقي من غير قفزة)
  const xMark = p(t, COIN_X, 0.7 * (COIN_FLAT - COIN_X), easeInOut);
  const coinOut = 1 - p(t, COIN_X + 0.3 * (COIN_FLAT - COIN_X), 0.7 * (COIN_FLAT - COIN_X), easeInOut);
  const xText = p(t, FREEZE, 0.7 * (ALL_FLAT - FREEZE), easeInOut);
  const cardsOut = 1 - p(t, FREEZE + 0.3 * (ALL_FLAT - FREEZE), 0.7 * (ALL_FLAT - FREEZE), easeInOut);
  const isMark = (pt: Part) => pt.id === "circle" || pt.id === "cup" || pt.id === "hat";
  return (
    <AbsoluteFill>
      {/* الشعار الأصلي المسطح (تحت كل حاجة، SVG واحد): الرمز بيظهر من COIN_X والكلام من FREEZE، ومن ALL_FLAT هو الشعار الأصلي بالظبط */}
      {t >= COIN_X && (
        <Center>
          <Logo
            width={LOGO_W}
            theme="dark"
            defs={
              <>
                <clipPath id={`l12c-${id}`}>
                  <circle cx={CIRCLE.cx} cy={CIRCLE.cy} r={CIRCLE.r} />
                </clipPath>
                <linearGradient id={`l12g-${id}`} x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0" stopColor="#FFFFFF" stopOpacity="0" />
                  <stop offset="0.5" stopColor="#FFFFFF" stopOpacity="0.2" />
                  <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
                </linearGradient>
              </>
            }
            // الرمز كمجموعة واحدة بشفافية (عشان الكوباية ما تبانش شفافة فوق الدايرة وهو بيظهر)
            under={
              t < ALL_FLAT ? (
                <g opacity={xMark}>
                  <path d={CIRCLE_D} fill={K.blue} />
                  <path d={CUP.d} fill={K.white} />
                  <path d={HAT.d} fill={K.white} />
                </g>
              ) : undefined
            }
            part={(pt) => (t >= ALL_FLAT ? undefined : isMark(pt) || xText <= 0 ? { hidden: true } : { fillOpacity: xText })}
            over={
              s.glint >= 0 && s.glint <= 1 ? (
                <g clipPath={`url(#l12c-${id})`} opacity={Math.sin(Math.PI * s.glint)}>
                  <rect x={gx - 45} y={-30} width={90} height={210} fill={`url(#l12g-${id})`} transform={`rotate(16 ${gx} ${CIRCLE.cy})`} />
                </g>
              ) : null
            }
          />
        </Center>
      )}
      {/* الكروت */}
      {t < ALL_FLAT && (
        <div style={{ ...persp, opacity: cardsOut }}>
          {t >= CARD && <Card angle={s.word} hinge={WORD_HINGE} part={(pt) => (pt.id === "word" ? { fillOpacity: tilt(s.word) } : markIdx(pt.id) >= 0 ? markStyle(pt.id) : undefined)} />}
          {TAG_WORDS.map((ws, i) =>
            t >= TAG0 + i * TAG_GAP ? <Card key={i} angle={s.tags[i]} hinge={TAG_HINGE} part={(pt) => (ws.includes(pt) ? { fillOpacity: tilt(s.tags[i]) } : undefined)} /> : null,
          )}
        </div>
      )}
      {/* الميدالية (والبلور الأفقي للسرعة على الغلاف بره الـ 3D) */}
      {t < COIN_FLAT && s.coinOpacity > 0 && (
        <AbsoluteFill style={{ opacity: s.coinOpacity * coinOut, filter: s.blur > 0.25 ? "url(#l12mb)" : undefined }}>
          <div style={persp}>
            <Coin c={s.coin} />
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

/* ---------------- نقطة نور بعيدة (تمهيد): الميدالية بتطلع منها ---------------- */
const Flare: React.FC<{ x: number; y: number; k: number }> = ({ x, y, k }) =>
  k > 0.003 ? (
    <>
      <div
        style={{
          position: "absolute",
          left: x - 70,
          top: y - 70,
          width: 140,
          height: 140,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(255,255,255,${0.85 * k}) 0%, rgba(0,182,255,${0.3 * k}) 16%, rgba(0,86,210,${0.12 * k}) 40%, rgba(0,86,210,0) 70%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: x - 260 * k,
          top: y - 1.5,
          width: 520 * k,
          height: 3,
          borderRadius: 2,
          background: `linear-gradient(90deg, rgba(0,182,255,0) 0%, rgba(0,182,255,${0.35 * k}) 38%, rgba(255,255,255,${0.75 * k}) 50%, rgba(0,182,255,${0.35 * k}) 62%, rgba(0,182,255,0) 100%)`,
        }}
      />
    </>
  ) : null;

/* ---------------- الخلفية: كحلي غامق، سبوت بيلف، أرض لامعة ---------------- */
const Backdrop: React.FC<{ t: number; coinScreen: { x: number; y: number; r: number; a: number }; impact: number; ring: number }> = ({ t, coinScreen, impact, ring }) => {
  // السبوت: مصدر فوق، بيلف من الشمال لحد ما يقف على الشعار، وبعدها بيتنفّس بالراحة
  const ang = lerp(27, -3, p(t, 0, 4.2, easeInOut)) + 0.8 * Math.sin(t * 0.9) * p(t, 3.6, 1.5);
  const src = { x: 930, y: -260 };
  const hitX = src.x - Math.tan(rad(ang)) * (FLOOR - src.y);
  const beamA = 0.75 + 0.25 * p(t, 0, 0.8);
  const rr = lerp(R * 0.95, R * 3.4, ring);
  return (
    <AbsoluteFill>
      {/* الأرض: بقعة كحلي ناعمة تحت الشعار (من غير خط أفق) */}
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 980px 210px at ${W / 2}px ${FLOOR + 30}px, rgba(31,61,99,0.32) 0%, rgba(31,61,99,0.1) 55%, rgba(31,61,99,0) 100%)` }} />
      {/* شعاع السبوت */}
      <div
        style={{
          position: "absolute",
          left: src.x - 900,
          top: src.y,
          width: 1800,
          height: 1500,
          transformOrigin: "50% 0",
          transform: `rotate(${ang}deg)`,
          opacity: beamA,
          background: `conic-gradient(from 166deg at 50% 0%, rgba(255,255,255,0) 0deg, rgba(255,255,255,0.028) 8deg, rgba(255,255,255,0.06) 14deg, rgba(255,255,255,0.028) 20deg, rgba(255,255,255,0) 28deg, rgba(255,255,255,0) 360deg)`,
          WebkitMaskImage: "linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,1) 45%, rgba(0,0,0,0.6) 75%, rgba(0,0,0,0) 100%)",
          maskImage: "linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,1) 45%, rgba(0,0,0,0.6) 75%, rgba(0,0,0,0) 100%)",
        }}
      />
      {/* بقعة النور على الأرض */}
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 340px 52px at ${hitX}px ${FLOOR + 14}px, rgba(255,255,255,${0.06 * beamA}) 0%, rgba(255,255,255,0) 100%)` }} />
      {/* توهج أزرق على الأرض تحت الشعار (بيزيد مع الضربة) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse ${lerp(420, 760, p(t, LAND, 1.6, ease))}px ${lerp(46, 70, p(t, LAND, 1.6, ease))}px at ${lerp(CX, W / 2, p(t, LAND + 0.3, 1.8, easeInOut))}px ${FLOOR + 6}px, rgba(0,86,210,${0.05 + 0.2 * coinScreen.a + 0.3 * impact}) 0%, rgba(0,86,210,0) 100%)`,
        }}
      />
      {/* هالة ورا الميدالية: بتتبعها وهي جاية */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle ${coinScreen.r * 2.6}px at ${coinScreen.x}px ${coinScreen.y}px, rgba(0,86,210,${0.26 * coinScreen.a + 0.22 * impact}) 0%, rgba(0,86,210,0) 100%)`,
        }}
      />
      {/* موجة على الأرض لحظة الوصول */}
      {ring > 0 && ring < 1 && (
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          <defs>
            <filter id="l12ring" x="-20%" y="-200%" width="140%" height="500%">
              <feGaussianBlur stdDeviation="1.6" />
            </filter>
          </defs>
          <ellipse cx={CX} cy={FLOOR + 2} rx={rr} ry={rr * 0.1} fill="none" stroke={K.sky} strokeOpacity={0.32 * (1 - ring) ** 1.5} strokeWidth={lerp(4, 1.2, ring)} filter="url(#l12ring)" />
        </svg>
      )}
    </AbsoluteFill>
  );
};

export const L12Flip3D: React.FC = () => {
  const t = useT();
  const spr = useSpring();

  /* الميدالية */
  const pose = coinPose(t);
  const prev = coinPose(t - 1 / 30);
  const thick = T0 * (1 - p(t, LAND + 0.15, 0.5, easeInOut)); // السمك بيدوب في الشعار المسطح
  const fog = 0.42 * Math.min(1, Math.max(0, -pose.z / Z0)) ** 0.8; // البعيد بيغرق في الضلمة
  const dec = 1 - p(t, LAND - 0.1, 0.6, ease);
  const sweep = p(t, LAND - 0.03, 0.62, easeInOut); // لمعة الوصول
  const sc = PERSP / (PERSP - pose.z);
  // بلور السرعة: حركة نقط الوش أفقيًا (أقصاها والميدالية بحرفها)
  const omega = rad(Math.abs(pose.ry - prev.ry));
  const blur = Math.min(9, 0.17 * omega * R * sc * (0.35 + 0.65 * Math.abs(Math.sin(rad(pose.ry))))) * (1 - p(t, LAND - 0.2, 0.3));
  const coinOpacity = p(t, IN, 0.35, ease);

  /* الكروت */
  const freeze = 1 - p(t, FREEZE - 0.35, 0.35, easeInOut); // بواقي الزنبرك تخلص صفر قبل التبديل
  const word = 90 * (1 - spr(CARD, { damping: 11, stiffness: 100, mass: 0.9 })) * freeze;
  const marks = MARKS.map((_, i) => {
    const k = spr(MARK0 + i * fr(2), { damping: 9, stiffness: 190, mass: 0.6 });
    return t < MARK0 + i * fr(2) ? 0 : 1 - (1 - k) * freeze;
  });
  const tags = TAG_WORDS.map((_, i) => 90 * (1 - spr(TAG0 + i * TAG_GAP, { damping: 13, stiffness: 140, mass: 0.75 })) * freeze);
  const glintP = (t - GLINT) / 0.95;
  const glint = glintP >= 0 && glintP <= 1 ? easeInOut(glintP) : -1;

  /* الكاميرا: دخول بطيء 1.04 → 1 + نبضة صغيرة مع الضربة */
  // الكاميرا بتوصل 1 بالظبط قبل ما أي جزء مسطح يظهر (عشان مفيش ولا نص بكسل قفزة بعد كده)
  const kick = t >= LAND && t < COIN_X ? Math.min(1, (t - LAND) * 15) * Math.exp(-(t - LAND) * 7) * (1 - p(t, LAND + 0.3, COIN_X - LAND - 0.35)) : 0;
  const cam = lerp(1.04, 1, p(t, 0, COIN_X, easeInOut)) * (1 + 0.007 * kick);
  const impact = t >= LAND ? Math.exp(-(t - LAND) * 2.6) * Math.min(1, (t - LAND) * 20) : 0;
  const ring = t >= LAND ? p(t, LAND, 1.1, expoOut) : 0;

  const coinScreen = {
    x: PO.x + (pose.x - PO.x) * sc,
    y: PO.y + (pose.y - PO.y) * sc,
    r: R * sc,
    a: coinOpacity * lerp(1, 0.45, p(t, LAND, 1.4, ease)),
  };

  // التمهيد: نقطة نور في العمق بتولّع، والميدالية طالعة منها (النقطة ماشية معاها وبتطفي)
  const flare = { x: coinScreen.x, y: coinScreen.y, k: p(t, 0, 0.28, ease) * (1 - p(t, 0.26, 0.34, easeInOut)) };

  const s: SceneState = { t, coin: { pose, thick, fog, dec, sweep }, coinOpacity, blur, word, marks, tags, glint };
  const refl = 0.16 * p(t, 0.6, 1.4, ease);

  return (
    <Stage bg={`radial-gradient(ellipse 80% 75% at 52% 44%, rgba(31,61,99,0.62) 0%, rgba(31,61,99,0.24) 42%, rgba(31,61,99,0.06) 70%, rgba(0,0,0,0) 100%), ${K.black}`} vignette={0.55} grain={0.06}>
      <Sfx at={fr(7)} name="spin" vol={0.42} />
      <Sfx at={LAND - 1.3} name="reverse" vol={0.5} />
      <Sfx at={LAND} name="impact" vol={0.55} />
      <Sfx at={CARD + fr(8)} name="flap" vol={0.5} />
      <Sfx at={MARK0 + fr(2)} name="pop_hi" vol={0.3} />
      <Sfx at={TAG0 + fr(7)} name="flap" vol={0.24} rate={1.2} />
      <Sfx at={RESOLVE} name="chime" vol={0.32} />

      {/* فلتر بلور السرعة (أفقي بس، لأن اللف على محور Y) */}
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <defs>
          <filter id="l12mb" x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
            <feGaussianBlur stdDeviation={`${s.blur} 0`} />
          </filter>
        </defs>
      </svg>

      <Backdrop t={t} coinScreen={coinScreen} impact={impact} ring={ring} />

      <AbsoluteFill style={{ transform: `scale(${cam})` }}>
        {/* الانعكاس على الأرض: نفس المشهد مقلوب حوالين خط الأرض، في شريط تحت الأرض بس، وبيختفي لتحت */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: FLOOR,
            height: REFL_H,
            overflow: "hidden",
            opacity: refl,
            filter: "blur(1.6px)",
            WebkitMaskImage: REFL_MASK,
            maskImage: REFL_MASK,
          }}
        >
          <AbsoluteFill style={{ top: -FLOOR, height: H, bottom: "auto", transformOrigin: `50% ${FLOOR}px`, transform: "scaleY(-1)" }}>
            <Scene s={s} id="r" />
          </AbsoluteFill>
        </div>
        <Scene s={s} id="m" />
        <Flare x={flare.x} y={flare.y} k={flare.k} />
      </AbsoluteFill>
    </Stage>
  );
};

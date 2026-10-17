// 16 · الهيرو (Brand hero) — فيلم تقديم هوية، على طريقة فيديوهات تقديم الشعارات (مرجع AstroPay على Pinterest)
// الفكرة: الرمز بيتولد من هندسته. شرايط عريضة شفافة زي الزجاج (بعرض خطوط الرمز نفسه) بتدخل وتتقاطع، ومكان التقاطع بينوّر،
// وقوس سماوي بيلف على حلقة الكوباية لحد ما يستقر تحتها ← القبعة والكوباية بيطلعوا من التقاطعات ← الدايرة بتتملي أزرق بومضة
// ← الشرايط بتختفي والكلمة بتنكشف من اليمين. كل ده في حركة كاميرا واحدة متصلة من قريب جدًا لبعيد
// ← قطع على خلفية فاتحة ← قطع سريع على صور موكاب حقيقية (public/mockups) ← الشعار ثابت على الغامق.
// عرضي (1920×1080) وطولي (1080×1920)
import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useVideoConfig } from "remotion";
import { CIRCLE, CIRCLE_D, CUP, HAT, Logo, MARKS, TAG, VIEW } from "../logo";
import { Center, K, Sfx, Stage, clamp, easeInOut, expoOut, lerp, p, useT } from "../fx";

const { cx, cy, r } = CIRCLE;
const DARK_BG = `radial-gradient(ellipse at 50% 42%, rgba(31,61,99,0.95) 0%, rgba(31,61,99,0.45) 50%, ${K.black} 100%)`;

// ---------------- هندسة الرمز (وحدات الشعار) ----------------
// القبعة: ذراعين بميل 30° وسُمك 12.5 تقريبًا؛ خط النص بيعدّي من (375.1, 31.6)
const HAT_MID = { x: 375.1, y: 31.6 };
const HAT_T = 12.4;
const HAT_ANG = (30 * Math.PI) / 180;
// الكوباية: حيطتين رأسيتين بسُمك 13.3، وقاعدة نص دايرة حوالين (375.2, 83.6)
const CUP_T = 13.3;
const WALL_L = CUP.box.x + CUP_T / 2;
const WALL_R = CUP.box.x + CUP.box.w - CUP_T / 2;
const RING = { x: 375.23, y: CUP.box.y + CUP.box.h - CUP.box.w / 2, r: CUP.box.w / 2 - CUP_T / 2 };

type Band = { a: number; x: number; y: number; ang: number; w: number; from: number };
// كل شريط: يبدأ إمتى، بيعدّي من أنهي نقطة، بأي ميل، عرضه، ومنين بيدخل (إزاحة عمودية عليه)
const BANDS: Band[] = [
  { a: 1.0, x: HAT_MID.x, y: HAT_MID.y, ang: Math.PI - HAT_ANG, w: HAT_T, from: 60 },
  { a: 1.25, x: HAT_MID.x, y: HAT_MID.y, ang: HAT_ANG, w: HAT_T, from: -60 },
  { a: 1.5, x: WALL_L, y: RING.y, ang: Math.PI / 2, w: CUP_T, from: -45 },
  { a: 1.7, x: WALL_R, y: RING.y, ang: Math.PI / 2, w: CUP_T, from: 45 },
  { a: 1.9, x: cx, y: RING.y, ang: 0, w: CUP_T * 0.7, from: 40 },
];
const BAND_LEN = 2400;

// القوس السماوي: 70° على حلقة الكوباية، بيلف ويستقر تحت (90° = لتحت)
const ARC_SPAN = 70;
const arcD = (deg: number) => {
  const a0 = ((deg - ARC_SPAN / 2) * Math.PI) / 180;
  const a1 = ((deg + ARC_SPAN / 2) * Math.PI) / 180;
  return `M ${RING.x + RING.r * Math.cos(a0)} ${RING.y + RING.r * Math.sin(a0)} A ${RING.r} ${RING.r} 0 0 1 ${RING.x + RING.r * Math.cos(a1)} ${RING.y + RING.r * Math.sin(a1)}`;
};
const ARC0 = -38;
const arcAngle = (t: number) => ARC0 + 4 * Math.sin(t * 2.4) * (1 - p(t, 1.0, 0.4)) + (90 + 360 - ARC0) * p(t, 1.35, 1.45, (q) => 1 - Math.pow(1 - q, 3));

const RESOLVE = 2.85; // الرمز بيتملي
const CAM_END = 4.0;

const Birth: React.FC<{ t: number; LW: number }> = ({ t, LW }) => {
  const U = LW / VIEW.w;
  // كاميرا واحدة: تكبير على مقياس لوغاريتمي من 9 لـ 1، والتركيز من القوس للرمز للشعار كله
  const zk = p(t, 0.55, CAM_END - 0.55, (q) => (q < 0.5 ? 4 * q * q * q : 1 - Math.pow(-2 * q + 2, 3) / 2));
  const z = Math.exp(lerp(Math.log(6), 0, zk));
  const a0 = (ARC0 * Math.PI) / 180;
  const start = { x: RING.x + RING.r * Math.cos(a0), y: RING.y + RING.r * Math.sin(a0) };
  const k1 = p(t, 0.55, 2.2, easeInOut);
  const k2 = p(t, 2.6, CAM_END - 2.6, easeInOut);
  const fx = lerp(lerp(start.x, cx, k1), VIEW.w / 2, k2);
  const fy = lerp(lerp(start.y, cy, k1), VIEW.h / 2, k2);
  const drift = 1.2 * Math.sin(t * 0.9);
  const px = (v: number) => v / (U * z); // بكسلات شاشة ← وحدات شعار
  const ang = arcAngle(t);
  const resolve = p(t, RESOLVE, 0.35, expoOut);
  const flood = p(t, RESOLVE + 0.05, 0.6, expoOut);
  const bandsOut = 1 - p(t, RESOLVE + 0.15, 0.8);
  const flash = interpolate(t, [RESOLVE - 0.02, RESOLVE + 0.08, RESOLVE + 0.7], [0, 0.55, 0], clamp);
  const arcFade = 1 - p(t, RESOLVE + 0.05, 0.3);
  const wipe = p(t, 3.15, 0.85, easeInOut);
  const wipeX = lerp(300, -50, wipe);
  const tagX = lerp(290, 0, p(t, 3.45, 0.7, easeInOut));
  const ambient = 0.5 + 0.5 * Math.sin(Math.min(1, t / 1.0) * Math.PI * 0.5);
  return (
    <Stage bg={DARK_BG} vignette={0.45} grain={0.07}>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 50%, rgba(0,182,255,${0.1 * ambient + 0.12 * flash}) 0%, rgba(0,182,255,0) 42%)` }} />
      <Center x={-(fx - VIEW.w / 2) * U * z + drift} y={-(fy - VIEW.h / 2) * U * z} scale={z}>
        <Logo
          width={LW}
          theme="dark"
          defs={
            <>
              <filter id="l16Bloom" x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur stdDeviation={px(14)} />
              </filter>
              <linearGradient id="l16Silver" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#FFFFFF" />
                <stop offset="1" stopColor="#FFFFFF" stopOpacity="0.55" />
              </linearGradient>
              <linearGradient id="l16Edge" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#fff" stopOpacity="0" />
                <stop offset="1" stopColor="#fff" stopOpacity="1" />
              </linearGradient>
              <mask id="l16Word" maskUnits="userSpaceOnUse" x={-60} y={-60} width={580} height={280}>
                <rect x={wipeX - 40} y={-60} width={40} height={280} fill="url(#l16Edge)" />
                <rect x={wipeX} y={-60} width={360} height={280} fill="#fff" />
              </mask>
              <mask id="l16Tag" maskUnits="userSpaceOnUse" x={-60} y={-60} width={580} height={280}>
                <rect x={tagX - 30} y={95} width={30} height={80} fill="url(#l16Edge)" />
                <rect x={tagX} y={95} width={330} height={80} fill="#fff" />
              </mask>
            </>
          }
          under={
            <>
              {/* الدايرة الزرقا بتتملي من نصها بعد ما الرمز يكتمل */}
              {flood > 0 && <circle cx={cx} cy={cy} r={r * lerp(0.62, 1, flood)} fill={K.blue} opacity={Math.min(1, flood * 1.6)} />}
              {/* الشرايط الزجاج: تعبئة باهتة + حافتين منوّرين، والتداخل بيتجمّع بالـ screen */}
              <g style={{ mixBlendMode: "screen" }} opacity={bandsOut}>
                {BANDS.map((b, i) => {
                  const k = p(t, b.a, 0.75, expoOut);
                  if (k <= 0) return null;
                  const off = b.from * (1 - k);
                  const rot = 9 * (1 - k) * (i % 2 ? -1 : 1);
                  const deg = (b.ang * 180) / Math.PI;
                  return (
                    <g key={i} transform={`translate(${-Math.sin(b.ang) * off} ${Math.cos(b.ang) * off}) rotate(${deg + rot} ${b.x} ${b.y})`} opacity={Math.min(1, k * 1.8)}>
                      <rect x={b.x - BAND_LEN / 2} y={b.y - b.w / 2} width={BAND_LEN} height={b.w} fill="#FFFFFF" fillOpacity={0.075} />
                      <line x1={b.x - BAND_LEN / 2} x2={b.x + BAND_LEN / 2} y1={b.y - b.w / 2} y2={b.y - b.w / 2} stroke="#FFFFFF" strokeOpacity={0.32} strokeWidth={px(1.3)} />
                      <line x1={b.x - BAND_LEN / 2} x2={b.x + BAND_LEN / 2} y1={b.y + b.w / 2} y2={b.y + b.w / 2} stroke="#FFFFFF" strokeOpacity={0.32} strokeWidth={px(1.3)} />
                    </g>
                  );
                })}
                {/* حلقة الكوباية: حافتين رفيعين */}
                {t > 1.2 && (
                  <g opacity={p(t, 1.2, 0.5)} fill="none" stroke="#FFFFFF" strokeOpacity={0.3} strokeWidth={px(1.3)}>
                    <circle cx={RING.x} cy={RING.y} r={RING.r + CUP_T / 2} />
                    <circle cx={RING.x} cy={RING.y} r={RING.r - CUP_T / 2} />
                    <circle cx={RING.x} cy={RING.y} r={RING.r} strokeOpacity={0.06} strokeWidth={CUP_T} />
                  </g>
                )}
                {/* حلقة الدايرة الكبيرة */}
                {t > 1.9 && <path d={CIRCLE_D} fill="none" stroke="#FFFFFF" strokeOpacity={0.22} strokeWidth={px(1.2)} strokeDasharray={`${2 * Math.PI * r * p(t, 1.9, 0.9, easeInOut)} 9999`} />}
              </g>
            </>
          }
          over={
            <>
              {/* القوس السماوي (أول ما الكاميرا قريبة جدًا بيبان كأنه شريحة منوّرة) */}
              {arcFade > 0 && (
                <g opacity={arcFade}>
                  <path d={arcD(ang)} fill="none" stroke={K.sky} strokeWidth={CUP_T} strokeLinecap="butt" filter="url(#l16Bloom)" opacity={0.9} />
                  <path d={arcD(ang)} fill="none" stroke={K.sky} strokeWidth={CUP_T} strokeLinecap="butt" />
                </g>
              )}
              {/* ومضة على مكان التقاطع لحظة الاكتمال */}
              {flash > 0 && <circle cx={cx} cy={cy - 8} r={r * 0.9} fill="#FFFFFF" opacity={flash * 0.16} filter="url(#l16Bloom)" />}
            </>
          }
          part={(pt) => {
            if (pt.id === "circle") return { hidden: true };
            if (pt.id === "hat" || pt.id === "cup") {
              // بيطلعوا فضي من التقاطعات (القبعة الأول)، وبعدين أبيض صافي
              const a = pt.id === "hat" ? 2.25 : 2.5;
              const k = p(t, a, 0.5, easeInOut);
              if (k <= 0) return { hidden: true };
              return { fill: resolve > 0 ? K.white : "url(#l16Silver)", opacity: lerp(0, 1, k) * (resolve > 0 ? 1 : 0.85) };
            }
            if (pt.id === "word") return wipe > 0 ? { mask: "url(#l16Word)" } : { hidden: true };
            const mi = MARKS.findIndex((m) => m.id === pt.id);
            if (mi >= 0) {
              const m = MARKS[mi];
              const at = 3.15 + 0.85 * Math.min(1, (300 - (m.box.x + m.box.w / 2)) / 350) + 0.1;
              const k = p(t, at, 0.3, expoOut);
              return k <= 0 ? { hidden: true } : { opacity: k, y: lerp(-3, 0, k) };
            }
            if (TAG.some((q) => q.id === pt.id)) return t > 3.45 ? { mask: "url(#l16Tag)" } : { hidden: true };
            return undefined;
          }}
        />
      </Center>
    </Stage>
  );
};

// ---------------- الموكاب: صور حقيقية (public/mockups/*.webp، 1254×1254) + الشعار متركّب عليها ----------------
// المقاسات كلها ببكسلات الصورة: at = نص الشعار، w = عرضه، focus = النقطة اللي لازم تفضل في الكادر لما الصورة تتقص
type Photo = {
  name: string;
  kind: "full" | "full-dark" | "sketch" | "emboss" | "screen";
  at: { x: number; y: number };
  w: number;
  focus: { x: number; y: number };
  opacity?: number;
};
const IMG = 1254;
export const PHOTOS: Photo[] = [
  { name: "phone", kind: "screen", at: { x: 627.5, y: 565.5 }, w: 420, focus: { x: 628, y: 566 } },
  { name: "hoodie", kind: "full", at: { x: 640, y: 845 }, w: 360, focus: { x: 640, y: 760 }, opacity: 0.9 },
  { name: "cards", kind: "full", at: { x: 630, y: 583 }, w: 470, focus: { x: 630, y: 600 }, opacity: 0.92 },
  { name: "poster", kind: "full", at: { x: 627, y: 612 }, w: 560, focus: { x: 627, y: 612 }, opacity: 0.92 },
  { name: "emboss", kind: "emboss", at: { x: 640, y: 640 }, w: 760, focus: { x: 627, y: 627 } },
  { name: "notebook", kind: "sketch", at: { x: 631, y: 600 }, w: 380, focus: { x: 631, y: 610 } },
];
const SCREEN = { x0: 418, x1: 838, y0: 112, y1: 1020 }; // شاشة الموبايل الخضرا

// الرمز كخطوط رصاص (للنوتة)
const SketchMark: React.FC<{ size: number }> = ({ size }) => (
  <svg viewBox={`${cx - r * 1.25} ${cy - r * 1.25} ${r * 2.5} ${r * 2.5}`} width={size} height={size} style={{ overflow: "visible", display: "block" }}>
    <g fill="none" stroke="#2B3440" strokeLinecap="round" strokeLinejoin="round">
      <g strokeOpacity={0.28} strokeWidth={0.45}>
        <line x1={cx - r * 1.2} y1={cy} x2={cx + r * 1.2} y2={cy} />
        <line x1={cx} y1={cy - r * 1.2} x2={cx} y2={cy + r * 1.2} />
        <line x1={HAT_MID.x - 110 * Math.cos(HAT_ANG)} y1={HAT_MID.y + 110 * Math.sin(HAT_ANG)} x2={HAT_MID.x + 50 * Math.cos(HAT_ANG)} y2={HAT_MID.y - 50 * Math.sin(HAT_ANG)} />
        <line x1={HAT_MID.x + 110 * Math.cos(HAT_ANG)} y1={HAT_MID.y + 110 * Math.sin(HAT_ANG)} x2={HAT_MID.x - 50 * Math.cos(HAT_ANG)} y2={HAT_MID.y - 50 * Math.sin(HAT_ANG)} />
        <circle cx={RING.x} cy={RING.y} r={RING.r} />
        <circle cx={cx} cy={cy} r={r * 1.12} />
      </g>
      {[0, 1].map((k) => (
        <g key={k} strokeWidth={k ? 0.55 : 0.85} strokeOpacity={k ? 0.45 : 0.85} transform={k ? `translate(0.5 -0.35) rotate(0.5 ${cx} ${cy})` : undefined}>
          <path d={CIRCLE_D} />
          <path d={CUP.d} />
          <path d={HAT.d} />
        </g>
      ))}
    </g>
  </svg>
);

export const PhotoMock: React.FC<{ ph: Photo; lt: number; W: number; H: number; dur: number }> = ({ ph, lt, W, H, dur }) => {
  // الصورة بتملا الكادر (cover) حوالين نقطة التركيز
  const sc = Math.max(W, H) / IMG;
  const D = IMG * sc;
  const ox = Math.min(0, Math.max(W - D, W / 2 - ph.focus.x * sc));
  const oy = Math.min(0, Math.max(H - D, H / 2 - ph.focus.y * sc));
  const X = (v: number) => ox + v * sc;
  const Y = (v: number) => oy + v * sc;
  const z = lerp(1.0, 1.045, Math.min(1, lt / dur));
  const lw = ph.kind === "screen" || ph.kind === "sketch" ? ph.w * sc : Math.min(ph.w * sc, W * 0.8);
  const src = staticFile(`mockups/${ph.name}.webp`);
  const place: React.CSSProperties = { position: "absolute", left: X(ph.at.x), top: Y(ph.at.y), transform: "translate(-50%, -50%)" };
  let logo: React.ReactNode = null;
  if (ph.kind === "full" || ph.kind === "full-dark")
    logo = (
      <div style={{ ...place, mixBlendMode: "multiply", opacity: ph.opacity ?? 0.92 }}>
        <Logo width={lw} theme={ph.kind === "full-dark" ? "dark" : "light"} />
      </div>
    );
  if (ph.kind === "sketch")
    logo = (
      <div style={{ ...place, mixBlendMode: "multiply" }}>
        <SketchMark size={lw * 1.25} />
      </div>
    );
  if (ph.kind === "emboss")
    logo = (
      <div style={{ ...place, filter: `drop-shadow(${-lw * 0.0022}px ${-lw * 0.0022}px 0px rgba(255,255,255,0.22)) drop-shadow(${lw * 0.003}px ${lw * 0.0035}px ${lw * 0.003}px rgba(0,0,0,0.75))` }}>
        <Logo width={lw} part={(q) => ({ fill: q.id === "cup" || q.id === "hat" ? "rgba(8,16,30,0.85)" : "rgba(31,61,99,0.92)" })} />
      </div>
    );
  return (
    <AbsoluteFill style={{ transform: `scale(${z})`, transformOrigin: `${X(ph.at.x)}px ${Y(ph.at.y)}px`, background: K.black }}>
      {ph.kind === "screen" && (
        // شاشة التطبيق تحت الصورة، والأخضر في الصورة بيتشال بفلتر
        <div style={{ position: "absolute", left: X(SCREEN.x0), top: Y(SCREEN.y0), width: (SCREEN.x1 - SCREEN.x0) * sc, height: (SCREEN.y1 - SCREEN.y0) * sc, borderRadius: 46 * sc, background: `linear-gradient(165deg, ${K.blue} 0%, ${K.navy} 100%)`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 42%, rgba(0,182,255,0.35) 0%, rgba(0,182,255,0) 55%)" }} />
          <Logo width={(SCREEN.x1 - SCREEN.x0) * sc * 0.78} theme="dark" />
        </div>
      )}
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <filter id="l16Key" colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  1.6 -2.2 1.6 0 1.15" />
        </filter>
      </svg>
      <Img src={src} style={{ position: "absolute", left: ox, top: oy, width: D, height: D, filter: ph.kind === "screen" ? "url(#l16Key)" : undefined }} />
      {logo}
    </AbsoluteFill>
  );
};

// ---------------- التجميع ----------------
const LIGHT = 4.35; // قطع على الخلفية الفاتحة
const M0 = LIGHT + 0.6; // أول موكاب
const MD = 0.8; // مدة كل موكاب
const END = M0 + PHOTOS.length * MD; // الرجوع للشعار على الغامق
export const L16_DUR = Math.round((END + 2.6) * 10) / 10;

export const L16Hero: React.FC = () => {
  const t = useT();
  const { width: W, height: H } = useVideoConfig();
  const vert = H > W;
  const LW = vert ? W * 0.78 : 940;
  let scene: React.ReactNode;
  if (t < LIGHT) scene = <Birth t={t} LW={LW} />;
  else if (t < M0) {
    const lt = t - LIGHT;
    scene = (
      <Stage bg={`radial-gradient(ellipse at 50% 45%, ${K.white} 0%, ${K.offwhite} 75%)`} vignette={0.08} grain={0.05}>
        <Center scale={lerp(1.0, 1.035, lt / (M0 - LIGHT))}>
          <Logo width={LW} theme="light" />
        </Center>
      </Stage>
    );
  } else if (t < END) {
    const i = Math.floor((t - M0) / MD);
    scene = <PhotoMock ph={PHOTOS[i]} lt={t - M0 - i * MD} W={W} H={H} dur={MD} />;
  } else {
    const k = p(t - END, 0, 1.4, expoOut);
    scene = (
      <Stage bg={DARK_BG} vignette={0.45} grain={0.07}>
        <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 50%, rgba(0,182,255,${0.08 * k}) 0%, rgba(0,182,255,0) 42%)` }} />
        <Center scale={lerp(1.05, 1, k)}>
          <Logo width={LW} theme="dark" style={{ opacity: Math.min(1, k * 3) }} />
        </Center>
      </Stage>
    );
  }
  return (
    <AbsoluteFill style={{ background: K.black }}>
      {scene}
      <Sfx at={0.0} name="swell" vol={0.32} />
      <Sfx at={0.95} name="whoosh_hi" vol={0.32} />
      <Sfx at={1.22} name="whoosh_hi" vol={0.26} />
      <Sfx at={1.35} name="spin" vol={0.28} />
      <Sfx at={1.62} name="whoosh_hi" vol={0.22} />
      <Sfx at={RESOLVE - 0.02} name="hit" vol={0.5} />
      <Sfx at={RESOLVE + 0.02} name="shimmer" vol={0.28} />
      <Sfx at={LIGHT} name="snap" vol={0.5} />
      {PHOTOS.map((_, i) => (
        <Sfx key={i} at={M0 + i * MD} name="flap" vol={0.26} />
      ))}
      <Sfx at={END} name="hit" vol={0.4} />
      <Sfx at={END + 0.05} name="chime" vol={0.45} />
    </AbsoluteFill>
  );
};

// 17 · لوحة التصميم (Design canvas) — فيلم هوية بلغة برامج التصميم (مرجع Framer على Pinterest)
// ماوس أصفر بيرسم الرمز على لوحة زرقا: يسحب دايرة، ومستطيل يتسحب لتحت يبقى الكوباية، وخط يتشد من نصه يبقى القبعة
// ← قطع على الأسود: شريط «التعبئة» بيتسحب والرمز بيتملي ← الأجزاء بتتفكك على خطوط إرشاد وقايمة «انطلاق» ← ترجع مكانها
// ← خط نور ← الرمز مجسّم 3D بيلف (أبيض، وبعدين زجاج أزرق منوّر) ← مسطّح ← الشعار على ورق مربعات بخطوط القياس
// ← على شبكة زرقا ← الاسم ضخم بيعدّي ← كروت الألوان ← الرمز فاتح، وزجاج قزحي، وستيكر ← على الهودي والماوس بيحدّده ← الختام
// عرضي (1920×1080) وطولي (1080×1920). القطعات سريعة ونضيفة، وكل قطع عليه صوت خفيف
import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useVideoConfig } from "remotion";
import { CIRCLE, CIRCLE_D, CUP, HAT, Logo, MARKS, VIEW, WORD } from "../logo";
import { Center, K, Sfx, clamp, easeInOut, expoOut, backOut, lerp, p, useSpring, useT } from "../fx";
import { MONO, SANS } from "../kit";

const { cx, cy, r } = CIRCLE;
const AMBER = K.amber;
const ease = easeInOut;

// ---------------- أدوات الواجهة ----------------
const Cursor: React.FC<{ x: number; y: number; press?: number; s?: number }> = ({ x, y, press = 0, s = 1 }) => (
  <svg width={30 * s} height={30 * s} viewBox="0 0 30 30" style={{ position: "absolute", left: x - 3 * s, top: y - 2 * s, transform: `scale(${1 - 0.15 * press})`, transformOrigin: "3px 2px", filter: "drop-shadow(0 3px 5px rgba(0,0,0,0.35))", overflow: "visible" }}>
    <path d="M3 2 L25 13 L14.5 15.5 L9.5 26 Z" fill={AMBER} stroke={K.black} strokeWidth={1.4} strokeLinejoin="round" />
  </svg>
);
// مربع تحديد بمقابض
const Sel: React.FC<{ x: number; y: number; w: number; h: number; o?: number; color?: string }> = ({ x, y, w, h, o = 1, color = K.sky }) => {
  const hs = 9;
  const pts = [
    [x, y],
    [x + w, y],
    [x, y + h],
    [x + w, y + h],
  ];
  return (
    <div style={{ position: "absolute", left: 0, top: 0, opacity: o }}>
      <div style={{ position: "absolute", left: x, top: y, width: w, height: h, boxShadow: `inset 0 0 0 1.5px ${color}` }} />
      {pts.map(([a, b], i) => (
        <div key={i} style={{ position: "absolute", left: a - hs / 2, top: b - hs / 2, width: hs, height: hs, background: K.white, boxShadow: `inset 0 0 0 1.5px ${color}` }} />
      ))}
    </div>
  );
};
const Grid: React.FC<{ step: number; color: string; major?: string; bg: string }> = ({ step, color, major, bg }) => (
  <AbsoluteFill
    style={{
      background: bg,
      backgroundImage: [
        major ? `linear-gradient(${major} 1px, transparent 1px), linear-gradient(90deg, ${major} 1px, transparent 1px)` : "",
        `linear-gradient(${color} 1px, transparent 1px), linear-gradient(90deg, ${color} 1px, transparent 1px)`,
      ]
        .filter(Boolean)
        .join(", "),
      backgroundSize: major ? `${step * 5}px ${step * 5}px, ${step * 5}px ${step * 5}px, ${step}px ${step}px, ${step}px ${step}px` : `${step}px ${step}px, ${step}px ${step}px`,
      backgroundPosition: "center center",
    }}
  />
);
const Menu: React.FC<{ x: number; y: number; k: number; hot: number; s: number }> = ({ x, y, k, hot, s }) => {
  const items = ["انطلاق", "ثبات", "تكرار", "إخفاء"];
  return (
    <div style={{ position: "absolute", left: x, top: y, width: 190 * s, padding: 6 * s, borderRadius: 12 * s, background: "rgba(20,24,30,0.96)", boxShadow: "0 18px 40px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.08)", opacity: k, transform: `translateY(${(1 - k) * -8 * s}px) scale(${lerp(0.96, 1, k)})`, transformOrigin: "top left", direction: "rtl", fontFamily: SANS, fontSize: 19 * s, fontWeight: 500 }}>
      {items.map((it, i) => (
        <div key={it} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: `${7 * s}px ${12 * s}px`, borderRadius: 8 * s, color: i === 0 ? K.white : "rgba(255,255,255,0.6)", background: i === 0 ? `rgba(0,86,210,${0.6 + 0.4 * hot})` : "transparent" }}>
          <span>{it}</span>
          {i === 0 && <span style={{ fontSize: 13 * s }}>▶</span>}
        </div>
      ))}
    </div>
  );
};

// ---------------- الرمز ----------------
type MarkStyle = { circle?: string; cup?: string; hat?: string; stroke?: string; sw?: number; circleD?: string; cupD?: string; hatD?: string; parts?: { circle?: React.CSSProperties; cup?: React.CSSProperties; hat?: React.CSSProperties }; defs?: React.ReactNode; over?: React.ReactNode };
const MarkSvg: React.FC<{ size: number; st?: MarkStyle; style?: React.CSSProperties }> = ({ size, st = {}, style }) => (
  <svg viewBox={`${cx - r} ${cy - r} ${2 * r} ${2 * r}`} width={size} height={size} style={{ overflow: "visible", display: "block", ...style }}>
    {st.defs && <defs>{st.defs}</defs>}
    <path d={st.circleD ?? CIRCLE_D} fill={st.circle ?? K.blue} stroke={st.stroke} strokeWidth={st.sw} style={st.parts?.circle} />
    <path d={st.cupD ?? CUP.d} fill={st.cup ?? K.white} stroke={st.stroke} strokeWidth={st.sw} style={st.parts?.cup} />
    <path d={st.hatD ?? HAT.d} fill={st.hat ?? K.white} stroke={st.stroke} strokeWidth={st.sw} style={st.parts?.hat} />
    {st.over}
  </svg>
);

// شكل مستطيل قاعدته بتتدوّر لحد ما يبقى حرف U (الكوباية قبل ما تتحول للشكل الحقيقي)
const uShape = (k: number) => {
  const x0 = CUP.box.x;
  const x1 = CUP.box.x + CUP.box.w;
  const y0 = CUP.box.y;
  const y1 = CUP.box.y + CUP.box.h;
  const rr = (CUP.box.w / 2) * k;
  return `M ${x0} ${y0} H ${x1} V ${y1 - rr} A ${rr} ${rr} 0 0 1 ${x1 - rr} ${y1} H ${x0 + rr} A ${rr} ${rr} 0 0 1 ${x0} ${y1 - rr} Z`;
};
// خط بيتشد من نصه لفوق (القبعة قبل ما تتحول للشكل الحقيقي)
const HAT_L = { x: HAT.box.x + 6, y: HAT.box.y + HAT.box.h - 6 };
const HAT_R = { x: HAT.box.x + HAT.box.w - 6, y: HAT.box.y + HAT.box.h - 6 };
const HAT_TOP = { x: (HAT_L.x + HAT_R.x) / 2, y: HAT.box.y + 6 };

// الشعار على الأزرق: الدايرة بيضا والكوباية والقبعة أزرق (علشان الدايرة ما تختفيش في الخلفية)
const onBlue = (id: string) => (id === "circle" ? { fill: K.white } : id === "cup" || id === "hat" ? { fill: K.blue } : undefined);

// ---------------- المشاهد ----------------
type SP = { lt: number; W: number; H: number; M: number };

// A: الرسم على اللوحة الزرقا
const CanvasBuild: React.FC<SP> = ({ lt, W, H, M }) => {
  const S = M * 0.42;
  const u = S / (2 * r);
  const X = (x: number) => W / 2 + (x - cx) * u;
  const Y = (y: number) => H / 2 + (y - cy) * u;
  // الدايرة: سحبة من الركن للركن
  const kc = p(lt, 0.15, 0.5, ease);
  const c0 = { x: X(cx - r), y: Y(cy - r) };
  const cw = 2 * r * u * kc;
  // الكوباية: مستطيل بيتسحب، وبعدين قاعدته بتتدوّر
  const kr = p(lt, 0.75, 0.3, ease);
  const ku = p(lt, 1.05, 0.35, ease);
  const kcup = p(lt, 1.38, 0.15);
  // القبعة: خط بيتشد من نصه
  const kl = p(lt, 1.5, 0.18, ease);
  const kpull = p(lt, 1.68, 0.3, backOut);
  const khat = p(lt, 1.95, 0.12);
  const mid = { x: HAT_TOP.x, y: lerp(HAT_L.y, HAT_TOP.y, kpull) };
  const all = p(lt, 2.0, 0.15);
  // مسار الماوس (نقاط بالوقت)
  const path: [number, number, number][] = [
    [0, X(cx - r) - 60 * u, Y(cy - r) - 40 * u],
    [0.15, c0.x, c0.y],
    [0.65, X(cx + r), Y(cy + r)],
    [0.75, X(CUP.box.x), Y(CUP.box.y)],
    [1.0, X(CUP.box.x + CUP.box.w), Y(CUP.box.y + CUP.box.h * 0.7)],
    [1.05, X(cx), Y(CUP.box.y + CUP.box.h * 0.7)],
    [1.4, X(cx), Y(CUP.box.y + CUP.box.h)],
    [1.5, X(HAT_L.x), Y(HAT_L.y)],
    [1.68, X(HAT_R.x), Y(HAT_R.y)],
    [1.72, X(HAT_TOP.x), Y(HAT_L.y)],
    [1.98, X(HAT_TOP.x), Y(HAT_TOP.y)],
    [2.25, X(cx + r) + 40 * u, Y(cy + r) + 30 * u],
  ];
  let cxp = path[0][1];
  let cyp = path[0][2];
  for (let i = 1; i < path.length; i++) {
    if (lt <= path[i][0]) {
      const q = ease(Math.max(0, (lt - path[i - 1][0]) / (path[i][0] - path[i - 1][0])));
      cxp = lerp(path[i - 1][1], path[i][1], q);
      cyp = lerp(path[i - 1][2], path[i][2], q);
      break;
    }
    cxp = path[i][1];
    cyp = path[i][2];
  }
  const press = (lt > 0.15 && lt < 0.65) || (lt > 0.75 && lt < 1.4) || (lt > 1.5 && lt < 1.98) ? 1 : 0;
  const ghost = { fill: "rgba(255,255,255,0.2)", stroke: "rgba(255,255,255,0.9)", strokeWidth: 1.2 / u };
  return (
    <AbsoluteFill style={{ background: K.blue }}>
      <Grid step={M * 0.05} color="rgba(255,255,255,0.05)" bg={K.blue} />
      {/* خطوط إرشاد بتطلع مع كل شكل */}
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <g stroke="rgba(255,255,255,0.22)" strokeWidth={1}>
          {kc > 0 && (
            <>
              <line x1={0} x2={W} y1={c0.y} y2={c0.y} />
              <line x1={c0.x} x2={c0.x} y1={0} y2={H} />
            </>
          )}
          {kr > 0 && <line x1={0} x2={W} y1={Y(CUP.box.y + CUP.box.h)} y2={Y(CUP.box.y + CUP.box.h)} />}
          {kl > 0 && <line x1={X(HAT_L.x) - W} y1={Y(HAT_L.y) + W * Math.tan(Math.PI / 6)} x2={X(HAT_TOP.x) + W} y2={Y(HAT_TOP.y) - W * Math.tan(Math.PI / 6)} strokeOpacity={kpull} />}
        </g>
      </svg>
      <div style={{ position: "absolute", left: X(cx - r), top: Y(cy - r) }}>
        <svg viewBox={`${cx - r} ${cy - r} ${2 * r} ${2 * r}`} width={S} height={S} style={{ overflow: "visible", display: "block" }}>
          {kc > 0 && <ellipse cx={cx - r + r * kc} cy={cy - r + r * kc} rx={r * kc} ry={r * kc} {...ghost} fill={`rgba(255,255,255,${lerp(0.2, 0.28, all)})`} />}
          {kr > 0 && kcup < 1 && <path d={ku > 0 ? uShape(ku) : `M ${CUP.box.x} ${CUP.box.y} h ${CUP.box.w * kr} v ${CUP.box.h * 0.7 * kr} h ${-CUP.box.w * kr} Z`} {...ghost} opacity={1 - kcup} />}
          {kcup > 0 && <path d={CUP.d} {...ghost} fill={`rgba(255,255,255,${0.55 + 0.45 * all})`} opacity={kcup} />}
          {kl > 0 && khat < 1 && <polyline points={`${HAT_L.x},${HAT_L.y} ${kpull > 0 ? `${mid.x},${mid.y}` : ""} ${lerp(HAT_L.x, HAT_R.x, kl)},${HAT_R.y}`} fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" strokeOpacity={0.55} opacity={1 - khat} />}
          {khat > 0 && <path d={HAT.d} {...ghost} fill={`rgba(255,255,255,${0.55 + 0.45 * all})`} opacity={khat} />}
        </svg>
      </div>
      {/* تحديد الشكل اللي بيترسم */}
      {kc > 0 && lt < 0.75 && <Sel x={c0.x} y={c0.y} w={cw} h={cw} />}
      {kr > 0 && lt < 1.5 && <Sel x={X(CUP.box.x)} y={Y(CUP.box.y)} w={CUP.box.w * u * kr} h={CUP.box.h * u * lerp(0.7 * kr, 1, ku)} />}
      {kl > 0 && lt < 2.0 && <Sel x={X(HAT.box.x)} y={Y(HAT.box.y)} w={HAT.box.w * u * kl} h={HAT.box.h * u} />}
      {all > 0 && <Sel x={X(cx - r)} y={Y(cy - r)} w={2 * r * u} h={2 * r * u} o={all} color={K.white} />}
      <Cursor x={cxp} y={cyp} press={press} s={M / 700} />
    </AbsoluteFill>
  );
};

// B: شريط التعبئة على الأسود
const FillSlider: React.FC<SP> = ({ lt, W, H, M }) => {
  const S = M * 0.3;
  const k = p(lt, 0.05, 0.6, ease);
  const sw = M * 0.34;
  const sx = W / 2 - sw / 2;
  const sy = H / 2 + S * 0.85;
  const gray = (o: number) => `rgba(255,255,255,${o})`;
  return (
    <AbsoluteFill style={{ background: K.black }}>
      <Center>
        <MarkSvg
          size={S}
          st={{
            defs: (
              <linearGradient id="l17Fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#fff" stopOpacity={lerp(0.35, 1, k)} />
                <stop offset="1" stopColor="#fff" stopOpacity={lerp(0.05, 1, k)} />
              </linearGradient>
            ),
            circle: k < 1 ? gray(0.08 + 0.1 * k) : gray(0.18),
            cup: "url(#l17Fill)",
            hat: "url(#l17Fill)",
            parts: { circle: { opacity: 1 - k * 0.4 } },
          }}
        />
      </Center>
      <div style={{ position: "absolute", left: sx, top: sy, width: sw, height: 2, background: "rgba(255,255,255,0.25)" }}>
        <div style={{ width: `${k * 100}%`, height: "100%", background: K.white }} />
        <div style={{ position: "absolute", left: `${k * 100}%`, top: -7, width: 16, height: 16, marginLeft: -8, borderRadius: 99, background: K.white }} />
      </div>
      <div style={{ position: "absolute", left: sx, top: sy + 16, width: sw, display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: M * 0.016, color: "rgba(255,255,255,0.55)" }}>
        <span>{Math.round(k * 100)}%</span>
        <span style={{ fontFamily: SANS }}>التعبئة</span>
      </div>
      <Cursor x={sx + sw * k} y={sy + 4} press={lt < 0.7 ? 1 : 0} s={M / 700} />
    </AbsoluteFill>
  );
};

// C: الأجزاء بتتفكك على خطوط الإرشاد، والقايمة، وبعدين ترجع
const Explode: React.FC<SP & { spring: ReturnType<typeof useSpring>; at: number }> = ({ lt, W, H, M, spring, at }) => {
  const S = M * 0.34;
  const u = S / (2 * r);
  const out = p(lt, 0.0, 0.45, expoOut);
  const back = spring(at + 0.95, { damping: 13, stiffness: 170 });
  const k = out * (1 - Math.min(1, back));
  const hatD = { x: 26 * Math.cos(Math.PI / 6) * k, y: -26 * Math.sin(Math.PI / 6) * k };
  const cupD = { x: 0, y: 24 * k };
  const menuK = interpolate(lt, [0.35, 0.5, 0.95, 1.05], [0, 1, 1, 0], clamp);
  const X = (x: number) => W / 2 + (x - cx) * u;
  const Y = (y: number) => H / 2 + (y - cy) * u;
  const mx = X(cx) + 60 * u;
  const my = Y(cy) + 20 * u;
  const cur = { x: lerp(X(cx + r) + 80 * u, mx + 30 * u, p(lt, 0.15, 0.3, ease)), y: lerp(Y(cy + r) + 40 * u, my + 18 * u, p(lt, 0.15, 0.3, ease)) };
  return (
    <AbsoluteFill style={{ background: K.black }}>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <g stroke="rgba(255,255,255,0.28)" strokeWidth={1} strokeDasharray="6 7" opacity={out * (1 - Math.min(1, back) * 0.6)}>
          <line x1={X(HAT_TOP.x) - W} y1={Y(HAT_TOP.y) + W * Math.tan(Math.PI / 6)} x2={X(HAT_TOP.x) + W} y2={Y(HAT_TOP.y) - W * Math.tan(Math.PI / 6)} />
          <line x1={X(CUP.box.x)} y1={0} x2={X(CUP.box.x)} y2={H} />
          <line x1={X(CUP.box.x + CUP.box.w)} y1={0} x2={X(CUP.box.x + CUP.box.w)} y2={H} />
        </g>
      </svg>
      <Center>
        <MarkSvg size={S} st={{ circle: "rgba(255,255,255,0.1)", stroke: "rgba(255,255,255,0.35)", sw: 0.5, parts: { hat: { transform: `translate(${hatD.x}px, ${hatD.y}px)` }, cup: { transform: `translate(${cupD.x}px, ${cupD.y}px)`, fill: `rgba(255,255,255,${lerp(1, 0.75, k)})` } } }} />
      </Center>
      {menuK > 0 && <Menu x={mx} y={my} k={menuK} hot={p(lt, 0.8, 0.1)} s={M / 1000} />}
      <Cursor x={cur.x} y={cur.y} press={lt > 0.8 && lt < 0.92 ? 1 : 0} s={M / 700} />
    </AbsoluteFill>
  );
};

// D: خط نور: الرمز بيطير بذيل منوّر
const Streak: React.FC<SP> = ({ lt, W, H, M }) => {
  const S = M * 0.26;
  const k = p(lt, 0, 0.55, expoOut);
  const x = lerp(-M * 0.45, 0, k);
  const y = lerp(-M * 0.32, 0, k);
  const trail = Array.from({ length: 14 }, (_, i) => i);
  return (
    <AbsoluteFill style={{ background: K.black }}>
      {trail.map((i) => {
        const q = Math.max(0, k - i * 0.035);
        return (
          <div key={i} style={{ position: "absolute", left: W / 2 - S / 2 + lerp(-M * 0.45, 0, q) * 1, top: H / 2 - S / 2 + lerp(-M * 0.32, 0, q), opacity: (i ? 0.16 : 1) * (1 - i / 14) * (i ? 1 - k * 0.6 : 1), filter: i ? `blur(${4 + i}px)` : "drop-shadow(0 0 18px rgba(255,255,255,0.7))" }}>
            <MarkSvg size={S} st={{ circle: K.white, cup: i ? K.white : "rgba(0,0,0,0.85)", hat: i ? K.white : "rgba(0,0,0,0.85)" }} />
          </div>
        );
      })}
      <div style={{ position: "absolute", left: W / 2 + x - M * 0.6, top: H / 2 + y - 6, width: M * 0.6, height: 12, transform: `rotate(${(Math.atan2(0.32, 0.45) * 180) / Math.PI}deg)`, transformOrigin: "right center", background: "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.5))", filter: "blur(6px)", opacity: 1 - k * 0.7 }} />
    </AbsoluteFill>
  );
};

// E: مجسّم 3D بيلف (أبيض مطفي، وبعدين زجاج أزرق منوّر)
const Extrude: React.FC<SP> = ({ lt, W, H, M }) => {
  const S = M * 0.36;
  const N = 26;
  const depth = S * 0.22;
  const ry = lerp(-55, 28, p(lt, 0, 1.6, ease));
  const rx = lerp(18, 8, p(lt, 0, 1.6, ease));
  const glass = p(lt, 0.75, 0.35, ease);
  const glow = glass;
  return (
    <AbsoluteFill style={{ background: K.black, perspective: M * 2.2 }}>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 52%, rgba(0,86,210,${0.4 * glow}) 0%, rgba(0,182,255,${0.08 * glow}) 26%, rgba(0,0,0,0) 55%)` }} />
      <div style={{ position: "absolute", left: W / 2 - S / 2, top: H / 2 - S / 2, width: S, height: S, transformStyle: "preserve-3d", transform: `rotateX(${rx}deg) rotateY(${ry}deg)` }}>
        {Array.from({ length: N }, (_, i) => {
          const z = depth / 2 - (i / (N - 1)) * depth;
          const front = i === 0;
          const back = i === N - 1;
          const shade = lerp(0.92, 0.55, i / (N - 1));
          const matte = `rgb(${Math.round(255 * shade)},${Math.round(255 * shade)},${Math.round(255 * shade)})`;
          const glassFill = front ? "rgba(0,182,255,0.22)" : back ? "rgba(0,86,210,0.2)" : "rgba(0,182,255,0.012)";
          return (
            <div key={i} style={{ position: "absolute", inset: 0, transform: `translateZ(${z}px)` }}>
              <MarkSvg
                size={S}
                st={{
                  circle: glass < 1 ? (front ? `rgba(255,255,255,${1 - glass})` : matte) : glassFill,
                  cup: front ? (glass > 0.5 ? "rgba(255,255,255,0.85)" : "rgba(30,34,40,0.9)") : glass > 0.5 ? "rgba(255,255,255,0.06)" : "rgba(40,44,50,0.9)",
                  hat: front ? (glass > 0.5 ? "rgba(255,255,255,0.85)" : "rgba(30,34,40,0.9)") : glass > 0.5 ? "rgba(255,255,255,0.06)" : "rgba(40,44,50,0.9)",
                  stroke: glass > 0 && (front || back || i % 5 === 0) ? `rgba(${front ? "255,255,255" : "0,182,255"},${(front ? 0.9 : back ? 0.7 : 0.25) * glass})` : undefined,
                  sw: front ? 0.7 : 0.45,
                  parts: { circle: { opacity: glass > 0 && !front && !back ? lerp(1, 0.9, glass) : 1 } },
                }}
                style={glass > 0 && front ? { filter: `drop-shadow(0 0 ${6 * glass}px rgba(0,182,255,0.6))` } : undefined}
              />
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// G/H: الشعار على ورق مربعات بخطوط القياس
const Spec: React.FC<SP & { dark?: boolean; LW: number }> = ({ lt, W, H, M, dark, LW }) => {
  const U = LW / VIEW.w;
  const X = (x: number) => W / 2 + (x - VIEW.w / 2) * U;
  const Y = (y: number) => H / 2 + (y - VIEW.h / 2) * U;
  const kg = p(lt, 0.0, 0.45, ease);
  const km = p(lt, 0.15, 0.35, expoOut);
  const wipe = dark ? 1 : p(lt, 0.3, 0.55, ease);
  const wipeX = lerp(300, -50, wipe);
  const guide = dark ? "rgba(255,255,255,0.6)" : K.sky;
  const lines = [WORD.box.y + 18, WORD.box.y + 55, WORD.box.y + WORD.box.h - 26];
  return (
    <AbsoluteFill>
      {dark ? <Grid step={M * 0.022} color="rgba(255,255,255,0.1)" major="rgba(255,255,255,0.2)" bg={K.blue} /> : <Grid step={M * 0.022} color="rgba(31,61,99,0.07)" major="rgba(31,61,99,0.14)" bg={K.offwhite} />}
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <g stroke={guide} strokeWidth={1.5}>
          {lines.map((y, i) => (
            <line key={i} x1={W - W * kg} x2={W} y1={Y(y)} y2={Y(y)} strokeDasharray={i === 1 ? "8 6" : undefined} opacity={0.85} />
          ))}
          <line x1={X(cx - r - 6)} x2={X(cx - r - 6)} y1={H * (1 - kg)} y2={H} />
        </g>
      </svg>
      <div style={{ position: "absolute", left: X(cx - r - 6) + 8, top: Y(lines[2]) + 8, fontFamily: MONO, fontSize: M * 0.014, color: guide, opacity: kg }}>baseline</div>
      <Center>
        <Logo
          width={LW}
          theme={dark ? "dark" : "light"}
          defs={
            <>
              <linearGradient id="l17Edge" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#fff" stopOpacity="0" />
                <stop offset="1" stopColor="#fff" stopOpacity="1" />
              </linearGradient>
              <mask id="l17Word" maskUnits="userSpaceOnUse" x={-60} y={-60} width={580} height={280}>
                <rect x={wipeX - 40} y={-60} width={40} height={280} fill="url(#l17Edge)" />
                <rect x={wipeX} y={-60} width={400} height={280} fill="#fff" />
              </mask>
            </>
          }
          part={(pt) => {
            const inv = dark ? onBlue(pt.id) : undefined;
            if (pt.id === "circle" || pt.id === "cup" || pt.id === "hat") return { ...inv, scale: lerp(0.6, 1, km), opacity: Math.min(1, km * 2) };
            return { mask: "url(#l17Word)" };
          }}
        />
      </Center>
    </AbsoluteFill>
  );
};

// J: الاسم ضخم بيعدّي
const BigWord: React.FC<SP> = ({ lt, W, H, M }) => {
  const h = (H > W ? W * 0.62 : H * 0.85);
  const wb = { x: WORD.box.x - 4, y: 0, w: WORD.box.w + 8, h: WORD.box.y + WORD.box.h + 4 };
  const w = (h * wb.w) / wb.h;
  const x = lerp(W * 0.15, W - w - W * 0.1, p(lt, 0, 0.75, (q) => q));
  const S = M * 0.42;
  return (
    <AbsoluteFill style={{ background: K.blue }}>
      <svg viewBox={`${wb.x} ${wb.y} ${wb.w} ${wb.h}`} width={w} height={h} style={{ position: "absolute", left: x, top: H / 2 - h / 2 }}>
        <path d={WORD.d} fill={K.white} />
        {MARKS.map((m) => (
          <path key={m.id} d={m.d} fill={K.white} />
        ))}
      </svg>
      <Center>
        <MarkSvg size={S} st={{ circle: "rgba(255,255,255,0.1)", cup: "rgba(255,255,255,0.12)", hat: "rgba(255,255,255,0.12)", stroke: "rgba(255,255,255,0.75)", sw: 0.6 }} style={{ backdropFilter: "blur(2px)", filter: "drop-shadow(0 20px 30px rgba(0,0,0,0.25))" }} />
      </Center>
    </AbsoluteFill>
  );
};

// K: كروت الألوان
const Palette: React.FC<SP & { spring: ReturnType<typeof useSpring>; at: number }> = ({ lt, W, H, M, spring, at }) => {
  const cards = [
    { c: K.sky, t: "#00B6FF", ink: K.black },
    { c: K.blue, t: "#0056D2", ink: K.white },
    { c: K.white, t: "#FFFFFF", ink: K.black },
    { c: K.navy, t: "#1F3D63", ink: K.white },
  ];
  const cw = M * 0.13;
  const ch = M * 0.5;
  const gap = M * 0.004;
  const total = cards.length * cw + (cards.length - 1) * gap;
  return (
    <AbsoluteFill style={{ background: "#E4E6EA" }}>
      {cards.map((cd, i) => {
        const s = spring(at + i * 0.07, { damping: 14, stiffness: 150 });
        const lift = i === 1 ? -M * 0.05 * p(lt, 0.55, 0.3, backOut) : 0;
        const spread = p(lt, 0.5, 0.4, ease) * (i - 1.5) * M * 0.012;
        return (
          <div key={i} style={{ position: "absolute", left: W / 2 - total / 2 + i * (cw + gap) + spread, top: H / 2 - ch / 2 + (1 - s) * H * 0.7 + lift, width: cw, height: ch, background: cd.c, boxShadow: `0 ${M * 0.02}px ${M * 0.04}px -${M * 0.01}px rgba(0,0,0,0.25)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ transform: "rotate(-90deg)", fontFamily: MONO, fontWeight: 600, fontSize: M * 0.018, color: cd.ink, letterSpacing: "0.12em", whiteSpace: "nowrap" }}>{cd.t}</div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// M: زجاج قزحي على الأزرق
const Iridescent: React.FC<SP> = ({ lt, W, H, M }) => {
  const S = M * 0.36;
  const sh = lerp(-30, 30, p(lt, 0, 0.8, (q) => q));
  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 55%, #1a6ae0 0%, ${K.blue} 45%, rgba(0,86,210,0.85) 100%)`, perspective: M * 2 }}>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 64%, rgba(31,61,99,0.55) 0%, rgba(31,61,99,0) 30%)` }} />
      <div style={{ position: "absolute", left: W / 2 - S / 2, top: H / 2 - S / 2, transform: `rotateY(${lerp(-18, 10, p(lt, 0, 0.8, ease))}deg) rotateX(10deg)`, filter: "drop-shadow(0 30px 30px rgba(0,0,0,0.35))" }}>
        <MarkSvg
          size={S}
          st={{
            defs: (
              <linearGradient id="l17Iri" x1="0" y1="0" x2="1" y2="1" gradientTransform={`rotate(${sh} 0.5 0.5)`}>
                <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.95" />
                <stop offset="0.3" stopColor={K.sky} stopOpacity="0.7" />
                <stop offset="0.48" stopColor={K.coral} stopOpacity="0.35" />
                <stop offset="0.62" stopColor={K.amber} stopOpacity="0.3" />
                <stop offset="0.8" stopColor={K.white} stopOpacity="0.85" />
                <stop offset="1" stopColor={K.sky} stopOpacity="0.6" />
              </linearGradient>
            ),
            circle: "rgba(255,255,255,0.14)",
            cup: "url(#l17Iri)",
            hat: "url(#l17Iri)",
            stroke: "rgba(255,255,255,0.8)",
            sw: 0.6,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

// O: الشعار على الهودي، والماوس بيحدّده
const IMG = 1254;
const HOOD = { at: { x: 640, y: 845 }, w: 360, focus: { x: 640, y: 760 } };
const OnHoodie: React.FC<SP & { LW: number }> = ({ lt, W, H, M }) => {
  const sc = Math.max(W, H) / IMG;
  const D = IMG * sc;
  const ox = Math.min(0, Math.max(W - D, W / 2 - HOOD.focus.x * sc));
  const oy = Math.min(0, Math.max(H - D, H / 2 - HOOD.focus.y * sc));
  const lw = Math.min(HOOD.w * sc, W * 0.8);
  const lh = (lw * VIEW.h) / VIEW.w;
  const lx = ox + HOOD.at.x * sc;
  const ly = oy + HOOD.at.y * sc;
  const kc = p(lt, 0.15, 0.4, ease);
  const sel = p(lt, 0.58, 0.12);
  const menuK = p(lt, 0.75, 0.2, expoOut);
  const z = lerp(1, 1.05, Math.min(1, lt / 1.3));
  return (
    <AbsoluteFill style={{ transform: `scale(${z})`, transformOrigin: `${lx}px ${ly}px` }}>
      <Img src={staticFile("mockups/hoodie.webp")} style={{ position: "absolute", left: ox, top: oy, width: D, height: D }} />
      <div style={{ position: "absolute", left: lx, top: ly, transform: "translate(-50%, -50%)", mixBlendMode: "multiply", opacity: 0.9 }}>
        <Logo width={lw} />
      </div>
      {sel > 0 && <Sel x={lx - lw / 2 - 10} y={ly - lh / 2 - 10} w={lw + 20} h={lh + 20} o={sel} color={K.blue} />}
      {menuK > 0 && <Menu x={lx + lw * 0.1} y={ly + lh / 2 + 14} k={menuK} hot={p(lt, 1.05, 0.1)} s={M / 1000} />}
      <Cursor x={lerp(lx + lw * 0.7, lx + lw * 0.18, kc)} y={lerp(ly + lh * 1.6, ly + lh * 0.3, kc)} press={lt > 0.55 && lt < 0.65 ? 1 : 0} s={M / 700} />
    </AbsoluteFill>
  );
};

// ---------------- الخط الزمني ----------------
type Shot = { d: number; sfx?: string; vol?: number };
const SHOTS: Record<string, Shot> = {
  canvas: { d: 2.25 },
  slider: { d: 0.8, sfx: "slide", vol: 0.35 },
  explode: { d: 1.4, sfx: "whoosh_hi", vol: 0.3 },
  streak: { d: 0.6, sfx: "whoosh", vol: 0.4 },
  extrude: { d: 1.6, sfx: "spin", vol: 0.35 },
  flat: { d: 0.7, sfx: "hit", vol: 0.4 },
  spec: { d: 1.1, sfx: "tick", vol: 0.4 },
  specDark: { d: 0.6, sfx: "flap", vol: 0.3 },
  blue: { d: 0.6, sfx: "tick", vol: 0.35 },
  bigword: { d: 0.75, sfx: "whoosh_long", vol: 0.3 },
  palette: { d: 1.2, sfx: "slide", vol: 0.35 },
  light: { d: 0.65, sfx: "flap", vol: 0.28 },
  iri: { d: 0.8, sfx: "shimmer", vol: 0.3 },
  sticker: { d: 0.75, sfx: "pop_lo", vol: 0.4 },
  hoodie: { d: 1.35, sfx: "flap", vol: 0.28 },
  end: { d: 2.2, sfx: "hit", vol: 0.4 },
};
const ORDER = Object.keys(SHOTS);
const START: Record<string, number> = {};
{
  let t = 0;
  for (const k of ORDER) {
    START[k] = t;
    t += SHOTS[k].d;
  }
}
export const L17_DUR = Math.round(ORDER.reduce((a, k) => a + SHOTS[k].d, 0) * 10) / 10;

export const L17Canvas: React.FC = () => {
  const t = useT();
  const spring = useSpring();
  const { width: W, height: H } = useVideoConfig();
  const M = Math.min(W, H) * (H > W ? 1 : 1.25);
  const LW = H > W ? W * 0.78 : 940;
  const shot = ORDER.find((k) => t >= START[k] && t < START[k] + SHOTS[k].d) ?? "end";
  const lt = t - START[shot];
  const sp: SP = { lt, W, H, M };
  let scene: React.ReactNode = null;
  if (shot === "canvas") scene = <CanvasBuild {...sp} />;
  if (shot === "slider") scene = <FillSlider {...sp} />;
  if (shot === "explode") scene = <Explode {...sp} spring={spring} at={START.explode} />;
  if (shot === "streak") scene = <Streak {...sp} />;
  if (shot === "extrude") scene = <Extrude {...sp} />;
  if (shot === "flat")
    scene = (
      <AbsoluteFill style={{ background: K.black }}>
        <Center scale={lerp(1.08, 1, p(lt, 0, 0.5, expoOut))}>
          <MarkSvg size={M * 0.3} st={{ circle: K.blue, defs: null }} />
        </Center>
      </AbsoluteFill>
    );
  if (shot === "spec") scene = <Spec {...sp} LW={LW} />;
  if (shot === "specDark") scene = <Spec {...sp} LW={LW} dark />;
  if (shot === "blue")
    scene = (
      <AbsoluteFill style={{ background: K.blue }}>
        <Center scale={lerp(0.96, 1, p(lt, 0, 0.6, ease))}>
          <Logo width={LW * 0.55} theme="dark" part={(q) => onBlue(q.id)} />
        </Center>
      </AbsoluteFill>
    );
  if (shot === "bigword") scene = <BigWord {...sp} />;
  if (shot === "palette") scene = <Palette {...sp} spring={spring} at={START.palette} />;
  if (shot === "light")
    scene = (
      <AbsoluteFill style={{ background: "#E4E6EA" }}>
        <Center scale={lerp(1, 1.04, lt / 0.65)}>
          <MarkSvg size={M * 0.26} />
        </Center>
      </AbsoluteFill>
    );
  if (shot === "iri") scene = <Iridescent {...sp} />;
  if (shot === "sticker")
    scene = (
      <AbsoluteFill style={{ background: "#2A2D33" }}>
        <Center scale={lerp(0.9, 1, spring(START.sticker, { damping: 11, stiffness: 200 }))}>
          <div style={{ width: M * 0.3, height: M * 0.3, borderRadius: "50%", background: K.black, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 20px 40px rgba(0,0,0,0.45), inset 0 0 0 1px rgba(255,255,255,0.06)" }}>
            <MarkSvg size={M * 0.2} st={{ circle: K.blue }} />
          </div>
        </Center>
      </AbsoluteFill>
    );
  if (shot === "hoodie") scene = <OnHoodie {...sp} LW={LW} />;
  if (shot === "end") {
    const k = p(lt, 0, 0.9, expoOut);
    scene = (
      <AbsoluteFill style={{ background: K.blue }}>
        <Grid step={M * 0.05} color={`rgba(255,255,255,${0.05 * (1 - k)})`} bg={K.blue} />
        <Center scale={lerp(1.06, 1, k)}>
          <Logo width={LW} theme="dark" part={(q) => onBlue(q.id)} />
        </Center>
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill style={{ background: K.black }}>
      {scene}
      {/* أصوات الماوس في مشهد الرسم */}
      <Sfx at={0.15} name="click" vol={0.45} />
      <Sfx at={0.2} name="slide" vol={0.2} />
      <Sfx at={0.75} name="click" vol={0.4} />
      <Sfx at={1.05} name="stretch" vol={0.25} />
      <Sfx at={1.5} name="click" vol={0.4} />
      <Sfx at={1.7} name="pop" vol={0.35} />
      <Sfx at={START.explode + 0.8} name="click" vol={0.45} />
      <Sfx at={START.explode + 0.98} name="snap" vol={0.5} />
      <Sfx at={START.hoodie + 0.58} name="click" vol={0.45} />
      {ORDER.slice(1).map((k) => (SHOTS[k].sfx ? <Sfx key={k} at={START[k]} name={SHOTS[k].sfx!} vol={SHOTS[k].vol} /> : null))}
      <Sfx at={START.end + 0.05} name="chime" vol={0.45} />
    </AbsoluteFill>
  );
};

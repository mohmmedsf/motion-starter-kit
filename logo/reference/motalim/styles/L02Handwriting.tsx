// 02 · الكتابة بالقلم (Handwriting) — القلم بيعدّي على الشعار كله
// يرسم حدود الدايرة ← الحبر الأزرق يتملي جواها ← يرسم الكوباية والقبعة بحبر أبيض ← يكتب «متعلم» على هيكل الحروف
// من اليمين للشمال (والقلم بيترفع بين الحركات) ← ينقّط التشكيل ← يكتب الجملة ← يطلع، والكاميرا تفتح على الشعار كله
import React from "react";
import { getLength, getPointAtLength } from "@remotion/paths";
import { CIRCLE, CIRCLE_D, CUP, HAT, Logo, MARKS, TAG, WORD } from "../logo";
import { Center, K, LOGO_W, Sfx, Stage, ease, easeInOut, expoOut, lerp, p, useSpring, useT } from "../fx";
import { Pt, SKEL, Seg, endOf, plan, pointAt } from "../strokes";

// ---------------- الخطة الزمنية ----------------
const CIRC_LEN = getLength(CIRCLE_D);
const CIRC_PTS: Pt[] = Array.from({ length: 121 }, (_, i) => {
  const q = getPointAtLength(CIRCLE_D, (CIRC_LEN * i) / 120);
  return [q?.x ?? 0, q?.y ?? 0];
});
type PenSeg = { t0: number; t1: number; pts: Pt[]; lift: boolean; travel?: boolean };
const PEN: PenSeg[] = [];
const travel = (from: Pt, to: Pt, t0: number, dur: number) => {
  PEN.push({ t0, t1: t0 + dur, pts: [from, to], lift: true, travel: true });
  return t0 + dur;
};
const add = (segs: Seg[]) => segs.forEach((s) => PEN.push({ t0: s.t0, t1: s.t1, pts: s.pts, lift: s.lift }));

const ENTER: Pt = [470, -60];
const C0 = 0.35;
const C1 = C0 + 0.7; // الدايرة
PEN.push({ t0: 0, t1: C0, pts: [ENTER, CIRC_PTS[0]], lift: true, travel: true });
PEN.push({ t0: C0, t1: C1, pts: CIRC_PTS, lift: false });
const FLOOD = { a: C1 - 0.05, d: 0.55 };
const cupStart = SKEL.cup.moves[0].pts[0] as Pt;
let t = travel(CIRC_PTS[CIRC_PTS.length - 1], cupStart, C1, 0.3);
const CUP_S = plan("cup", t, 430);
add(CUP_S);
t = endOf(CUP_S);
const hatStart = SKEL.hat.moves[0].pts[0] as Pt;
t = travel(CUP_S[CUP_S.length - 1].pts[CUP_S[CUP_S.length - 1].pts.length - 1], hatStart, t, 0.16);
const HAT_S = plan("hat", t, 320);
add(HAT_S);
t = endOf(HAT_S);
const WORD_S = plan("word", 0, 440, 1100);
const wordStart = WORD_S[0].pts[0];
t = travel(HAT_S[HAT_S.length - 1].pts[HAT_S[HAT_S.length - 1].pts.length - 1], wordStart, t, 0.34);
const W0 = t;
WORD_S.forEach((s) => ((s.t0 += W0), (s.t1 += W0)));
add(WORD_S);
t = endOf(WORD_S);
// النقط والتشكيل: القلم ينط من نقطة للتانية وينقّط
const DAB = MARKS.map((m, i) => {
  const c: Pt = [m.box.x + m.box.w / 2, m.box.y + m.box.h / 2];
  const prev: Pt = i === 0 ? WORD_S[WORD_S.length - 1].pts[WORD_S[WORD_S.length - 1].pts.length - 1] : [MARKS[i - 1].box.x + MARKS[i - 1].box.w / 2, MARKS[i - 1].box.y + MARKS[i - 1].box.h / 2];
  t = travel(prev, c, t, i === 0 ? 0.24 : 0.09);
  const at = t;
  PEN.push({ t0: t, t1: t + 0.05, pts: [c, c], lift: false });
  t += 0.05;
  return at;
});
const lastMark: Pt = [MARKS[MARKS.length - 1].box.x + MARKS[MARKS.length - 1].box.w / 2, MARKS[MARKS.length - 1].box.y + MARKS[MARKS.length - 1].box.h / 2];
const TAG_S0 = plan("tag", 0, 760, 2200);
t = travel(lastMark, TAG_S0[0].pts[0], t, 0.24);
const T0 = t;
TAG_S0.forEach((s) => ((s.t0 += T0), (s.t1 += T0)));
add(TAG_S0);
t = endOf(TAG_S0);
const TAG_END = t;
const EXIT = travel(TAG_S0[TAG_S0.length - 1].pts[TAG_S0[TAG_S0.length - 1].pts.length - 1], [-90, -70], t, 0.55);
const DONE = TAG_END + 0.15;

const penAt = (tt: number) => {
  const s = PEN.find((q) => tt >= q.t0 && tt < q.t1) ?? (tt < PEN[0].t0 ? PEN[0] : PEN[PEN.length - 1]);
  const k = Math.min(1, Math.max(0, (tt - s.t0) / Math.max(1e-6, s.t1 - s.t0)));
  if (s.travel) {
    const e = easeInOut(k);
    const a = s.pts[0];
    const b = s.pts[1];
    return { x: lerp(a[0], b[0], e), y: lerp(a[1], b[1], e), lift: 9 * Math.sin(Math.PI * k) + 3 };
  }
  const L = s.pts.length > 1 ? s.pts.reduce((acc, q, i) => (i ? acc + Math.hypot(q[0] - s.pts[i - 1][0], q[1] - s.pts[i - 1][1]) : 0), 0) : 0;
  const q = pointAt(s.pts, L * k);
  return { x: q[0], y: q[1], lift: s.lift ? 5 : 0 };
};

// مسار مكشوف لحد الوقت tt
const revealed = (s: Seg, tt: number) => Math.max(0, Math.min(1, (tt - s.t0) / (s.t1 - s.t0))) * s.len;

// ---------------- القلم (رفيع) ----------------
const Pen: React.FC<{ x: number; y: number; lift: number; angle: number; opacity: number }> = ({ x, y, lift, angle, opacity }) => (
  <g transform={`translate(${x} ${y - lift}) rotate(${angle})`} opacity={opacity}>
    <g transform={`translate(${3 + lift * 0.5} ${5 + lift * 0.9})`} opacity={0.16} filter="url(#penShadow)">
      <path d="M0 0 L2.4 -7 L2.2 -64 L-2.2 -64 L-2.4 -7 Z" fill={K.black} />
    </g>
    <path d="M0 0 L1.7 -5.2 L-1.7 -5.2 Z" fill={K.navy} />
    <path d="M-1.7 -5.2 L1.7 -5.2 L2.3 -11 L-2.3 -11 Z" fill="#c8d0da" />
    <rect x={-2.3} y={-62} width={4.6} height={51} rx={2.2} fill={K.navy} />
    <rect x={-0.9} y={-60} width={0.9} height={46} rx={0.45} fill={K.white} opacity={0.35} />
    <rect x={-2.45} y={-34} width={4.9} height={2.2} fill={K.amber} />
  </g>
);

const MaskStrokes: React.FC<{ segs: Seg[]; tt: number; width: number; solid: number }> = ({ segs, tt, width, solid }) => (
  <>
    <rect x={-40} y={-40} width={540} height={240} fill="black" />
    {segs
      .filter((s) => !s.lift && tt > s.t0)
      .map((s, i) => (
        <path key={i} d={s.d} fill="none" stroke="white" strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`${revealed(s, tt)} ${s.len * 2 + 10}`} />
      ))}
    <rect x={-40} y={-40} width={540} height={240} fill="white" opacity={solid} />
  </>
);

export const L02Handwriting: React.FC = () => {
  const tt = useT();
  const spring = useSpring();
  const pen = penAt(tt);
  // الكاميرا: متوسط مكان القلم في آخر نص ثانية، وتكبير 1.4 وهو بيكتب، وفي الآخر تفتح على الشعار كله
  let cxu = 0;
  let cyu = 0;
  const N = 9;
  for (let k = 0; k < N; k++) {
    const q = penAt(Math.max(0, tt - 0.07 * k));
    cxu += q.x / N;
    cyu += q.y / N;
  }
  const open = p(tt, DONE - 0.2, 1.1, easeInOut);
  cxu = lerp(Math.min(400, Math.max(40, cxu)), 225, open);
  cyu = lerp(Math.min(120, Math.max(40, cyu)), 74.78, open);
  const zoom = lerp(lerp(1.15, 1.42, p(tt, 0, 0.8, ease)), 1, open);
  const U = LOGO_W / 450;
  const camX = -(cxu - 225) * U * zoom;
  const camY = -(cyu - 74.78) * U * zoom;
  const circK = Math.min(1, Math.max(0, (tt - C0) / (C1 - C0)));
  const flood = p(tt, FLOOD.a, FLOOD.d, expoOut);
  const solid = (segs: Seg[]) => p(tt, endOf(segs) - 0.02, 0.18);
  const penOpacity = p(tt, 0.05, 0.25) * (1 - p(tt, DONE + 0.05, 0.35));
  return (
    <Stage bg={`radial-gradient(ellipse at 50% 45%, #FFFFFF 0%, ${K.offwhite} 75%)`} vignette={0.16} grain={0.07}>
      <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.35, mixBlendMode: "multiply" }}>
        <filter id="paper">
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.04" numOctaves="3" seed="4" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.93  0 0 0 0 0.91  0 0 0 0 0.86  0 0 0 0.5 0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#paper)" />
      </svg>
      {/* الأصوات: القلم وقت الرسم بس */}
      <Sfx at={C0} name="pen" vol={0.85} dur={C1 - C0} />
      <Sfx at={FLOOD.a + 0.05} name="slide" vol={0.35} />
      <Sfx at={CUP_S[0].t0} name="marker" vol={0.7} dur={endOf(HAT_S) - CUP_S[0].t0} />
      <Sfx at={W0} name="pen" vol={0.95} />
      <Sfx at={W0 + 1.5} name="pen" vol={0.85} dur={Math.max(0.1, endOf(WORD_S) - W0 - 1.5)} />
      {DAB.map((a, i) => (
        <Sfx key={i} at={a} name="tick" vol={0.42 - i * 0.03} />
      ))}
      <Sfx at={T0} name="marker" vol={0.55} dur={TAG_END - T0} />
      <Sfx at={DONE + 0.1} name="chime" vol={0.5} />
      <Center x={camX} y={camY} scale={zoom}>
        <Logo
          width={LOGO_W}
          defs={
            <>
              <filter id="penShadow" x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur stdDeviation="1.6" />
              </filter>
              <clipPath id="inCircle">
                <circle cx={CIRCLE.cx} cy={CIRCLE.cy} r={CIRCLE.r} />
              </clipPath>
              <mask id="mCup" maskUnits="userSpaceOnUse" x={-40} y={-40} width={540} height={240}>
                <MaskStrokes segs={CUP_S} tt={tt} width={SKEL.cup.half * 2 + 2.2} solid={solid(CUP_S)} />
              </mask>
              <mask id="mHat" maskUnits="userSpaceOnUse" x={-40} y={-40} width={540} height={240}>
                <MaskStrokes segs={HAT_S} tt={tt} width={SKEL.hat.half * 2 + 2.2} solid={solid(HAT_S)} />
              </mask>
              <mask id="mWord" maskUnits="userSpaceOnUse" x={-40} y={-40} width={540} height={240}>
                <MaskStrokes segs={WORD_S} tt={tt} width={SKEL.word.half * 2 + 2.4} solid={solid(WORD_S)} />
              </mask>
              <mask id="mTag" maskUnits="userSpaceOnUse" x={-40} y={-40} width={540} height={240}>
                <MaskStrokes segs={TAG_S0} tt={tt} width={SKEL.tag.half * 2 + 1.6} solid={solid(TAG_S0)} />
              </mask>
            </>
          }
          part={(pt) => {
            const mi = MARKS.findIndex((m) => m.id === pt.id);
            if (mi >= 0) {
              const a = DAB[mi];
              if (tt < a) return { hidden: true };
              const s = spring(a, { damping: 11, stiffness: 280, mass: 0.45 });
              return { scale: lerp(0.25, 1, Math.min(1.12, s)), opacity: Math.min(1, s * 2.5) };
            }
            return { hidden: true };
          }}
          over={
            <>
              {/* الدايرة: خط الحبر، وبعدين يتملي من نصها */}
              {tt >= C0 && circK < 1 && (
                <path d={CIRCLE_D} fill="none" stroke={K.blue} strokeWidth={2.2} strokeLinecap="round" strokeDasharray={`${CIRC_LEN * circK} ${CIRC_LEN * 2}`} />
              )}
              {circK >= 1 && <circle cx={CIRCLE.cx} cy={CIRCLE.cy} r={CIRCLE.r} fill="none" stroke={K.blue} strokeWidth={2.2} opacity={1 - flood} />}
              {flood > 0 && (
                <g clipPath="url(#inCircle)">
                  <circle cx={CIRCLE.cx} cy={CIRCLE.cy} r={CIRCLE.r * 1.1 * flood} fill={K.blue} />
                </g>
              )}
              {/* الكوباية والقبعة بحبر أبيض */}
              <path d={CUP.d} fill={K.white} mask="url(#mCup)" />
              <path d={HAT.d} fill={K.white} mask="url(#mHat)" />
              {/* الكلمة والجملة */}
              <path d={WORD.d} fill={K.black} mask="url(#mWord)" />
              <g mask="url(#mTag)" fill={K.black}>
                {TAG.map((q) => (
                  <path key={q.id} d={q.d} />
                ))}
              </g>
              <Pen x={pen.x} y={pen.y} lift={pen.lift} angle={30 + 3 * Math.sin(tt * 4)} opacity={penOpacity} />
            </>
          }
        />
      </Center>
    </Stage>
  );
};

export const L02_DUR = Math.ceil((DONE + 1.9) * 10) / 10;
void EXIT;

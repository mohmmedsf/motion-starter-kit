// 14 · Glitch
// شاشة CRT غامقة: سطور سكان + شريط سكان بيعدّي + نقط نويز، وكيرسر بيرمش ويتمد لخط
// ← الشعار بيبوت بدفعات جليتش: شرايح أفقية متزحزحة + فصل ألوان (مرجاني شمال/سماوي يمين) + بلوكات داتا
// ← كل دفعة أهدى من اللي قبلها ← ضربة جليتش قوية (زاب) ← سناب نضيف للشعار الأصلي (الثيم الغامق)
// ← ثبات هادي مع رعشة صغيرة واحدة في الجملة
import React from "react";
import { AbsoluteFill, Easing, useCurrentFrame } from "remotion";
import { CIRCLE_D, CUP, HAT, Logo, MARKS, TAG, WORD } from "../logo";
import { Center, K, LOGO_W, Sfx, Stage, ease, easeIn, easeInOut, expoOut, lerp, noise1, p, rnd, rndRange } from "../fx";

// كل الأزمنة بالفريم (30 فريم/ث) علشان كل دفعة تقع بالظبط على ضربة الصوت بتاعتها
const CUR_ON = 0; // الكيرسر موجود من أول فريم
const CUR_OFF = 8; // يطفي
const CUR_ON2 = 12; // يرمش تاني (tick)
const LINE: [number, number] = [15, 23]; // الكيرسر يتمد لخط أفقي
const SNAP = 103; // الشعار يثبت نضيف (hit)

// دفعات الجليتش [من، لحد) + قوتها. glitch@20 ضرباته على +0.09/+0.19/+0.40..0.57ث،
// و glitch_short ضربتينه على +0/+0.15ث، و zap@95 هجمته فورية
type Pulse = { a: number; b: number; k: number; inv?: number; decay?: boolean };
const PULSES: Pulse[] = [
  { a: 23, b: 25, k: 1 },
  { a: 26, b: 28, k: 0.88 },
  { a: 32, b: 37, k: 0.8, inv: 34 },
  { a: 48, b: 50, k: 0.66 },
  { a: 52, b: 55, k: 0.58 },
  { a: 70, b: 72, k: 0.42 },
  { a: 74, b: 77, k: 0.34 },
  { a: 95, b: SNAP, k: 1, inv: 97, decay: true },
];
// الحالة بين الدفعات (كل مرة أثبت): V نسبة الشرايح الظاهرة كاملة، R فصل الألوان، J الرعشة
const LEVELS = [
  { at: 25, V: 0.42, R: 2.4, J: 0.16 },
  { at: 55, V: 0.74, R: 1.4, J: 0.08 },
  { at: 77, V: 0.95, R: 0.7, J: 0.03 },
];
// رعشة الجملة الوحيدة في الثبات (glitch_short واطي @126)
const MICRO: [number, number][] = [
  [126, 128],
  [130, 133],
];

const LOGO_H = 149.56;
const TYPE = [WORD, ...MARKS, ...TAG];
const SCREEN: React.CSSProperties = { mixBlendMode: "screen" };

// شريحة أفقية من الشعار: mode 0 فاضية، 1 كاملة بفصل ألوان، 2 شبح سماوي، 3 شبح مرجاني
type Strip = { y: number; h: number; dx: number; mode: number; op: number; r: number; inv: boolean; smear: boolean };
type StripOpts = { I: number; V: number; R: number; dMax: number; pd: number; inv?: boolean; minMoved?: number };

const makeStrips = (seed: string, y0: number, y1: number, hMin: number, hMax: number, o: StripOpts): Strip[] => {
  const out: Strip[] = [];
  let y = y0;
  for (let i = 0; y < y1 - 0.01; i++) {
    const h = Math.min(y1 - y, rndRange(`${seed}h${i}`, hMin, hMax));
    const m = rnd(`${seed}m${i}`);
    const mode = m < o.V ? 1 : m < o.V + (1 - o.V) * 0.55 ? (rnd(`${seed}g${i}`) < 0.75 ? 2 : 3) : 0;
    const big = rnd(`${seed}b${i}`) < 0.2 * o.I;
    const moved = big || rnd(`${seed}d${i}`) < o.pd || i < (o.minMoved ?? 0);
    const sign = rnd(`${seed}s${i}`) < 0.5 ? -1 : 1;
    const dx = moved ? sign * lerp(0.35, 1, rnd(`${seed}x${i}`)) * o.dMax * (big ? 2 : 1) : 0;
    out.push({ y, h, dx, mode, op: mode === 1 ? 1 : rndRange(`${seed}o${i}`, 0.4, 0.7), r: o.R * rndRange(`${seed}r${i}`, 0.7, 1.3), inv: false, smear: big && o.I > 0.55 });
    y += h;
  }
  if (o.inv) {
    // شريحة واحدة نيجاتيف (أبيض وأسود معكوس) لفريم واحد
    const cand = out.filter((s) => s.h >= 9 && s.y > 12 && s.y < 118);
    if (cand.length) {
      const s = cand[Math.floor(rnd(`${seed}inv`) * cand.length)];
      s.inv = true;
      s.mode = 1;
      s.smear = false;
    }
  }
  return out;
};

// الشريحة الكاملة: نسختين ملونين متزحزحين تحت الأصل (الحواف بس اللي تبان) + الكوباية والقبعة فوق الدايرة
const Full: React.FC<{ r: number; tagOnly?: boolean }> = ({ r, tagOnly }) =>
  tagOnly ? (
    <>
      <use href="#L14-tag" x={-r} fill={K.coral} style={SCREEN} />
      <use href="#L14-tag" x={r} fill={K.sky} style={SCREEN} />
      <use href="#L14-tag" fill={K.white} />
    </>
  ) : (
    <>
      <use href="#L14-sil" x={-r} fill={K.coral} style={SCREEN} />
      <use href="#L14-sil" x={r} fill={K.sky} style={SCREEN} />
      <use href="#L14-circle" fill={K.blue} />
      <use href="#L14-cuphat" x={-r} fill={K.coral} />
      <use href="#L14-cuphat" x={r} fill={K.sky} />
      <use href="#L14-ink" fill={K.white} />
    </>
  );

// شبح قناة لون واحد (الإشارة لسه ضعيفة): الدايرة حلقة رفيعة والباقي بلون القناة
const Ghost: React.FC<{ c: string }> = ({ c }) => (
  <>
    <use href="#L14-circle" fill="none" stroke={c} strokeWidth={1.4} />
    <use href="#L14-ink" fill={c} />
  </>
);

// نيجاتيف: لوح أبيض والشعار أسود (الكوباية والقبعة فتحات)
const Negative: React.FC = () => (
  <>
    <rect x={-14} y={-10} width={478} height={LOGO_H + 20} fill={K.white} opacity={0.92} />
    <use href="#L14-type" fill={K.black} />
    <use href="#L14-disc" fill={K.black} />
  </>
);

const Strips: React.FC<{ list: Strip[]; id: string; tagOnly?: boolean }> = ({ list, id, tagOnly }) => (
  <>
    <defs>
      {list.map((s, i) => (
        <clipPath key={i} id={`${id}${i}`}>
          {/* تداخل صغير بين الشرايح علشان مايبانش خط رفيع بينهم */}
          <rect x={-240} y={s.y - 0.15} width={930} height={s.h + 0.3} />
        </clipPath>
      ))}
    </defs>
    {list.map((s, i) =>
      s.mode === 0 ? null : (
        <g key={i} clipPath={`url(#${id}${i})`}>
          <g transform={`translate(${s.dx} 0)`} opacity={s.op} filter={s.smear ? "url(#L14-smear)" : undefined}>
            {s.inv ? <Negative /> : s.mode === 1 ? <Full r={s.r} tagOnly={tagOnly} /> : <Ghost c={s.mode === 2 ? K.sky : K.coral} />}
          </g>
        </g>
      ),
    )}
  </>
);

// بلوكات داتا صغيرة بتنط حوالين الشعار
const Blocks: React.FC<{ seed: string; n: number; alpha: number }> = ({ seed, n, alpha }) => (
  <g>
    {Array.from({ length: n }, (_, i) => {
      const s = `${seed}-${i}`;
      const x = rndRange(`${s}x`, -26, 462);
      const y = rndRange(`${s}y`, 4, 146);
      const c = rnd(`${s}c`);
      const fill = c < 0.4 ? K.sky : c < 0.68 ? K.coral : c < 0.92 ? K.white : K.blue;
      const op = alpha * rndRange(`${s}o`, 0.45, 1);
      if (rnd(`${s}t`) < 0.38) {
        // سطر بكسلات
        const m = 3 + Math.floor(rnd(`${s}m`) * 5);
        const q = rndRange(`${s}q`, 1.5, 2.8);
        return (
          <g key={i} fill={fill} opacity={op}>
            {Array.from({ length: m }, (_, j) => (rnd(`${s}j${j}`) < 0.75 ? <rect key={j} x={x + j * q * 1.7} y={y} width={q} height={q} /> : null))}
          </g>
        );
      }
      return <rect key={i} x={x} y={y} width={rndRange(`${s}w`, 4, 34)} height={rndRange(`${s}h`, 1.2, 6)} fill={fill} opacity={op} />;
    })}
  </g>
);

// خطوط قطع رفيعة (tearing)
const Tears: React.FC<{ seed: string; n: number; alpha: number }> = ({ seed, n, alpha }) => (
  <g>
    {Array.from({ length: n }, (_, i) => {
      const s = `${seed}-t${i}`;
      return (
        <rect
          key={i}
          x={rndRange(`${s}x`, -40, 280)}
          y={rndRange(`${s}y`, 6, 144)}
          width={rndRange(`${s}w`, 60, 230)}
          height={rndRange(`${s}h`, 0.35, 0.8)}
          fill={rnd(`${s}c`) < 0.6 ? K.sky : K.white}
          opacity={alpha * rndRange(`${s}o`, 0.35, 0.8)}
        />
      );
    })}
  </g>
);

// نقط نويز ديجيتال على الشاشة كلها، كل نقطة ليها عمر مختلف
const Specks: React.FC<{ frame: number; amt: number; burst: number }> = ({ frame, amt, burst }) => {
  if (amt <= 0.001) return null;
  const n = Math.round(22 + 30 * burst);
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
      {Array.from({ length: n }, (_, i) => {
        const life = 3 + (i % 5);
        const b = Math.floor((frame + i * 3) / life);
        const s = `sp${i}-${b}`;
        if (rnd(`${s}on`) < 0.3) return null;
        const x = rndRange(`${s}x`, 80, 1840);
        const y = 540 + (rnd(`${s}a`) + rnd(`${s}b`) + rnd(`${s}c`) - 1.5) * 560;
        const long = rnd(`${s}l`) < 0.22;
        return (
          <rect
            key={i}
            x={Math.round(x)}
            y={Math.round(y)}
            width={long ? Math.round(rndRange(`${s}w`, 8, 26)) : 3}
            height={long ? 2 : 3}
            fill={rnd(`${s}k`) < 0.55 ? K.white : K.sky}
            opacity={amt * rndRange(`${s}o`, 0.1, 0.36)}
          />
        );
      })}
    </svg>
  );
};

// شريط السكان: نور خفيف بيعدّي من فوق لتحت
const barEase = Easing.bezier(0.42, 0.12, 0.58, 0.88);
const ScanBar: React.FC<{ t: number }> = ({ t }) => {
  const period = 2.7;
  const y = lerp(-340, 1420, barEase(((t + 1.15) % period) / period));
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: y,
        height: 300,
        background: "linear-gradient(to bottom, rgba(0,182,255,0) 0%, rgba(0,182,255,0.03) 40%, rgba(255,255,255,0.045) 50%, rgba(0,182,255,0.03) 60%, rgba(0,182,255,0) 100%)",
      }}
    />
  );
};

// الكيرسر: بلوك أبيض بيرمش، وبعدين يتمد لخط أفقي (زي شاشة CRT بتفتح)
const Cursor: React.FC<{ frame: number; t: number }> = ({ frame, t }) => {
  if (frame < CUR_ON || frame >= LINE[1] || (frame >= CUR_OFF && frame < CUR_ON2)) return null;
  const k = p(t, LINE[0] / 30, 0.22, expoOut);
  const w = lerp(22, LOGO_W * 1.04, k);
  const h = lerp(44, 2.5, Math.min(1, k * 1.5));
  const flick = frame >= LINE[0] ? rndRange(`cf${frame}`, 0.82, 1) : 1;
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          width: w,
          height: h,
          background: K.white,
          opacity: flick,
          borderRadius: 1,
          boxShadow: `0 0 ${lerp(14, 26, k)}px rgba(0,182,255,${lerp(0.45, 0.7, k)}), 0 0 3px rgba(255,255,255,0.7)`,
        }}
      />
    </AbsoluteFill>
  );
};

export const L14Glitch: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  const bk = Math.floor(frame * 0.4); // الشكل بيتغير كل 2–3 فريم
  const pulse = PULSES.find((q) => frame >= q.a && frame < q.b);
  const level = [...LEVELS].reverse().find((l) => frame >= l.at);
  const booted = frame >= PULSES[0].a;
  const clean = frame >= SNAP;
  const micro = MICRO.some(([a, b]) => frame >= a && frame < b);
  const charge = p(t, 2.85, 0.32, easeIn); // شحنة قبل الضربة الأخيرة

  // شدة الجليتش في الفريم ده
  let I = 0;
  let V = 0;
  let R = 0;
  let dMax = 0;
  let pd = 0;
  if (pulse) {
    const fall = pulse.decay ? lerp(1, 0.55, (frame - pulse.a) / (pulse.b - pulse.a)) : 1;
    I = pulse.k * fall * rndRange(`I${bk}`, 0.8, 1);
    V = Math.min(1, Math.max(level?.V ?? 0, 0.6) + (pulse.decay ? 0.1 : 0));
    R = 1.2 + 4.2 * I;
    // الضربة الأخيرة أعنف: إزاحات أكبر وشرايح أكتر بتتحرك
    dMax = (5 + 30 * I) * (pulse.decay ? 1.3 : 1);
    pd = 0.25 + 0.4 * I + (pulse.decay ? 0.1 : 0);
  } else if (level) {
    I = level.J + 0.05 * charge;
    V = Math.min(1, level.V + 0.05 * charge);
    R = level.R * (1 + 0.25 * noise1("rw", t * 6)) + 2 * charge;
    dMax = 40 * I;
    pd = 0.3;
  }

  // نطّة للشعار كله في بعض الفريمات، ورعشة خفيفة بين الدفعات
  const hit0 = !!pulse?.decay && frame < pulse.a + 2; // أول فريمين من الضربة الأخيرة
  const jumpOn = hit0 || (!!pulse && rnd(`j${bk}`) < 0.32 * pulse.k);
  const jx = hit0 ? -30 : jumpOn ? (rnd(`jx${bk}`) * 2 - 1) * 28 * I : !clean && booted ? noise1("jit", t * 9) * I * 14 : 0;
  const jy = hit0 ? 8 : jumpOn ? (rnd(`jy${bk}`) * 2 - 1) * 12 * I : 0;
  const sx = hit0 ? 1.06 : 1; // تمدد أفقي لحظي مع الزاب
  // وميض خفيف للشعار كله وهو لسه مش ثابت (من غير فلاش للشاشة)
  const dim = !pulse && level && level.V < 0.9 && rnd(`fl${bk}`) < (1 - V) * 0.35 ? 0.5 : 1;

  const glitching = booted && !clean;
  const strips = glitching
    ? makeStrips(pulse ? `p${bk}` : `u${bk}`, -6, LOGO_H + 6, pulse ? 6 : 9, pulse ? 26 : 32, { I, V, R, dMax, pd, inv: !!pulse && frame === pulse.inv })
    : micro
      ? makeStrips(`m${frame}`, 111, 150, 7, 15, { I: 0.1, V: 1, R: 1.1, dMax: 3, pd: 0.45, minMoved: 1 })
      : [];
  const nBlocks = pulse ? Math.round(3 + 11 * I + (pulse.decay ? 6 : 0)) : glitching && level ? (level.J >= 0.15 ? 2 : level.J >= 0.07 ? 1 : 0) + (charge > 0.4 ? 2 : 0) : 0;
  const nTears = pulse ? 1 + Math.round(2.5 * I) : 0;

  // الكاميرا: قرب خفيف 1.04 ← 1، ونطّة صغيرة لحظة السناب
  const snapK = clean ? 1 - p(t, SNAP / 30, 0.38, expoOut) : 0;
  const cam = (1 + 0.04 * (1 - p(t, 0.75, 2.6, easeInOut))) * (1 + 0.014 * snapK);
  const glow = clean ? 0.3 * (1 - p(t, SNAP / 30, 0.9, ease)) : 0;
  const speckAmt = 1 - p(t, SNAP / 30, 0.5, ease);

  return (
    <Stage bg="radial-gradient(ellipse at 50% 48%, #13253D 0%, #08111F 55%, #020408 100%)" vignette={0.5} grain={0.06}>
      {/* سطور CRT ثابتة في الخلفية */}
      <AbsoluteFill style={{ background: "repeating-linear-gradient(to bottom, rgba(255,255,255,0.024) 0px, rgba(255,255,255,0.024) 1px, rgba(0,0,0,0) 1px, rgba(0,0,0,0) 4px)" }} />
      <ScanBar t={t} />
      <Specks frame={frame} amt={speckAmt} burst={pulse ? I : 0} />
      <Cursor frame={frame} t={t} />

      <Sfx at={CUR_ON2 / 30} name="tick" vol={0.32} />
      <Sfx at={20 / 30} name="glitch" vol={0.7} />
      <Sfx at={48 / 30} name="glitch_short" vol={0.55} />
      <Sfx at={70 / 30} name="glitch_short" vol={0.42} />
      <Sfx at={95 / 30} name="zap" vol={0.7} />
      <Sfx at={SNAP / 30} name="hit" vol={0.42} />
      <Sfx at={126 / 30} name="glitch_short" vol={0.14} />

      {booted && (
        <Center scale={cam} x={jx} y={jy} style={sx !== 1 ? { transform: `translate(${jx}px, ${jy}px) scale(${cam * sx}, ${cam})` } : undefined}>
          <Logo
            width={LOGO_W}
            theme="dark"
            defs={
              <>
                {/* نسخ من الأجزاء من غير لون (اللون بييجي من الـ use) */}
                <g id="L14-type">
                  {TYPE.map((pt) => (
                    <path key={pt.id} d={pt.d} />
                  ))}
                </g>
                <g id="L14-tag">
                  {TAG.map((pt) => (
                    <path key={pt.id} d={pt.d} />
                  ))}
                </g>
                <path id="L14-circle" d={CIRCLE_D} />
                <g id="L14-sil">
                  <use href="#L14-type" />
                  <use href="#L14-circle" />
                </g>
                <g id="L14-cuphat">
                  <path d={CUP.d} />
                  <path d={HAT.d} />
                </g>
                <g id="L14-ink">
                  <use href="#L14-type" />
                  <use href="#L14-cuphat" />
                </g>
                {/* الدايرة والكوباية والقبعة فتحات فيها */}
                <path id="L14-disc" d={`${CIRCLE_D} ${CUP.d} ${HAT.d}`} fillRule="evenodd" />
                <filter id="L14-smear" x="-30%" y="-60%" width="160%" height="220%">
                  <feGaussianBlur stdDeviation="3.5 0" />
                </filter>
                <radialGradient id="L14-glow">
                  <stop offset="0%" stopColor={K.sky} stopOpacity={0.55} />
                  <stop offset="100%" stopColor={K.sky} stopOpacity={0} />
                </radialGradient>
              </>
            }
            under={glow > 0.002 ? <ellipse cx={225} cy={78} rx={270} ry={105} fill="url(#L14-glow)" opacity={glow} /> : undefined}
            part={(pt) => (glitching ? { hidden: true } : micro && pt.id.startsWith("tag") ? { hidden: true } : undefined)}
            over={
              strips.length ? (
                <g opacity={dim}>
                  <Strips list={strips} id={glitching ? "L14-s" : "L14-m"} tagOnly={!glitching} />
                  {nTears > 0 && <Tears seed={`t${bk}`} n={nTears} alpha={I} />}
                  {pulse && frame < 25 && <rect x={-20} y={LOGO_H / 2 - 0.5} width={490} height={1} fill={K.white} opacity={0.65} />}
                  {nBlocks > 0 && <Blocks seed={`b${bk}`} n={nBlocks} alpha={pulse ? 1 : 0.55} />}
                </g>
              ) : undefined
            }
          />
        </Center>
      )}

      {/* سطور CRT فوق الشعار وهو لسه بيبوت بس (بتختفي لحظة السناب) */}
      {glitching && (
        <AbsoluteFill
          style={{
            background: "repeating-linear-gradient(to bottom, rgba(4,9,18,0.34) 0px, rgba(4,9,18,0.34) 1px, rgba(0,0,0,0) 1px, rgba(0,0,0,0) 3px)",
            // حوالين الشعار بس، علشان الخلفية كلها ماتنورش فجأة لحظة السناب
            maskImage: "radial-gradient(ellipse 42% 34% at 50% 50%, #000 55%, transparent 100%)",
            WebkitMaskImage: "radial-gradient(ellipse 42% 34% at 50% 50%, #000 55%, transparent 100%)",
          }}
        />
      )}
    </Stage>
  );
};

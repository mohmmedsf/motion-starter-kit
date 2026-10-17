// عناصر هوية متعلم للفيديو (Design System v2): منقولة من kit الدرس 4، من غير أجزاء تسجيلات الشاشة
// شرايط ملونة بإطار، كروت بيضا، شباك المنتج، كروت طايرة، IBM Plex Sans Arabic، والباليت العشر ألوان بس
import React from "react";
import { AbsoluteFill, Easing, Html5Audio, Img, Sequence, continueRender, delayRender, interpolate, staticFile, useCurrentFrame } from "remotion";
import * as Ph from "@phosphor-icons/react";
import FONTS from "./fonts.json";
import { K } from "./tokens";

export const FPS = 30;
export const f = (s: number) => Math.round(s * FPS);

/* ---------------- التوكنز (من tokens.json) ---------------- */
export { K };
export const SANS = "'IBM Plex Sans Arabic', sans-serif";
export const MONO = "'IBM Plex Mono', monospace";
// الفيديو 1920 والموقع مصمم على 1440، فكل المقاسات ×1.33
export const S = 1.33;
export const R = { band: 44 * S, card: 30 * S, window: 26 * S, inner: 20 * S, sm: 14 * S, xs: 11 * S };
export const INSET = 12 * S;
// مقاس الشريط من جوه
export const BW = 1920 - INSET * 2;
export const BH = 1080 - INSET * 2;
export const ease = Easing.bezier(0.22, 0.7, 0.2, 1);
export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// الخطوط من ملفات محلية (Plex عربي ولاتيني + Plex Mono)
if (typeof document !== "undefined" && !(window as unknown as { __mtFonts?: boolean }).__mtFonts) {
  (window as unknown as { __mtFonts?: boolean }).__mtFonts = true;
  const h = delayRender("Motalim fonts");
  Promise.all(
    FONTS.map((ft) => new FontFace(ft.family, `url(${staticFile(`fonts/${ft.file}`)}) format('woff2')`, { weight: ft.weight, unicodeRange: ft.range }).load().then((l) => document.fonts.add(l))),
  ).then(() => continueRender(h), () => continueRender(h));
}

/* ---------------- أدوات الحركة ---------------- */
export const useT = () => useCurrentFrame() / FPS;
export const p = (t: number, a: number, d = 0.9) => interpolate(t, [a, a + d], [0, 1], { ...clamp, easing: ease });
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

export const Sfx: React.FC<{ at: number; name: string; vol?: number }> = ({ at, name, vol = 1 }) => (
  <Sequence from={f(at)} layout="none" name={`sfx:${name}`}>
    <Html5Audio src={staticFile(`sfx/${name}`)} volume={vol} />
  </Sequence>
);

/* ---------------- الشريط ---------------- */
export const Band: React.FC<{ color: string; motif?: boolean; children?: React.ReactNode }> = ({ color, motif = true, children }) => (
  <div style={{ position: "absolute", inset: INSET, borderRadius: R.band, background: color, overflow: "hidden" }}>
    {motif && (
      <svg viewBox="0 0 1440 800" preserveAspectRatio="xMidYMid slice" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        <g fill="none" stroke={K.motif} strokeWidth={70} strokeLinecap="round" strokeLinejoin="round">
          <polyline points="120,520 400,360 680,520" />
          <polyline points="120,720 400,560 680,720" />
          <polyline points="760,420 1040,260 1320,420" />
        </g>
      </svg>
    )}
    {children}
  </div>
);

/* ---------------- النصوص ---------------- */
export const Kicker: React.FC<{ color: string; text: React.ReactNode; at: number; onBand?: boolean; size?: number }> = ({ color, text, at, onBand, size = 28 }) => {
  const t = useT();
  const k = p(t, at);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, opacity: k, transform: `translateY(${(1 - k) * 14}px)`, fontFamily: SANS, fontWeight: 500, fontSize: size, lineHeight: 1.5, color: onBand ? K.onBand2 : K.navy, direction: "rtl" }}>
      <span style={{ width: size / 2, height: size / 2, borderRadius: 3, background: color }} />
      {text}
    </div>
  );
};

// سطر عنوان بيطلع من تحت (القناع وقت الحركة بس عشان النقط ما تتقصش)
export const Line: React.FC<{ at: number; size: number; color: string; children: React.ReactNode; weight?: number; dir?: "rtl" | "ltr"; wrap?: boolean; font?: string }> = ({ at, size, color, children, weight = 700, dir = "rtl", wrap, font = SANS }) => {
  const t = useT();
  const k = p(t, at, 1.0);
  return (
    <div style={{ clipPath: k < 1 ? "inset(-30px -60px -24px -60px)" : undefined }}>
      <div style={{ fontFamily: font, fontWeight: weight, fontSize: size, lineHeight: 1.3, color, direction: dir, whiteSpace: wrap ? "normal" : "nowrap", textWrap: "balance", transform: `translateY(${(1 - k) * 110}%)`, opacity: interpolate(k, [0, 0.25], [0, 1], clamp) } as React.CSSProperties}>{children}</div>
    </div>
  );
};

// راس السكشن على الأوف وايت: علامة + عنوان بنقطة
export const Head: React.FC<{ color: string; kicker: React.ReactNode; at: number; title: React.ReactNode; titleAt?: number; size?: number }> = ({ color, kicker, at, title, titleAt, size = 92 }) => (
  <div style={{ direction: "rtl" }}>
    <Kicker color={color} text={kicker} at={at} />
    <div style={{ marginTop: 6 }}>
      <Line at={titleAt ?? at + 0.15} size={size} color={K.black}>
        {title}
      </Line>
    </div>
  </div>
);

// اسم إنجليزي (أداة أو ستايل) جوه سطر عربي
export const En: React.FC<{ children: React.ReactNode; mono?: boolean; style?: React.CSSProperties }> = ({ children, mono, style }) => (
  <bdi style={{ direction: "ltr", unicodeBidi: "isolate", fontFamily: mono ? MONO : undefined, ...style }}>{children}</bdi>
);

/* ---------------- كبسولات وكروت ---------------- */
export const Pill: React.FC<{ at: number; bg: string; color: string; children: React.ReactNode; size?: number; style?: React.CSSProperties; shadow?: string; exitAt?: number }> = ({ at, bg, color, children, size = 28, style, shadow, exitAt }) => {
  const t = useT();
  const k = p(t, at, 0.7);
  const ex = exitAt ? p(t, exitAt, 0.4) : 0;
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 12, padding: `${size * 0.4}px ${size * 0.85}px`, borderRadius: 999, background: bg, color, fontFamily: SANS, fontWeight: 600, fontSize: size, lineHeight: 1.5, direction: "rtl", whiteSpace: "nowrap", boxShadow: shadow, opacity: k * (1 - ex), transform: `translateY(${(1 - k) * 12 - ex * 10}px)`, ...style }}>
      {children}
    </div>
  );
};

export const Card: React.FC<{ at: number; w: number; h: number; style?: React.CSSProperties; children: React.ReactNode; lift?: number }> = ({ at, w, h, style, children, lift = 0 }) => {
  const t = useT();
  const k = p(t, at, 0.9);
  return (
    <div style={{ position: "relative", width: w, height: h, borderRadius: R.card, background: K.white, boxShadow: K.shadowCard, opacity: interpolate(k, [0, 0.3], [0, 1], clamp), transform: `translateY(${(1 - k) * 40 - lift}px)`, ...style }}>
      {children}
    </div>
  );
};

// كارت طاير: بيطفو 10px كل 8 ثواني
export const Float: React.FC<{ at: number; x: number; y: number; rot: number; delay: number; children: React.ReactNode; style?: React.CSSProperties; exitAt?: number }> = ({ at, x, y, rot, delay, children, style, exitAt }) => {
  const t = useT();
  const k = p(t, at, 0.9);
  const ex = exitAt ? p(t, exitAt, 0.5) : 0;
  if (k <= 0 || ex >= 1) return null;
  const bob = Math.sin(((t + delay) / 8) * Math.PI * 2) * 10;
  return (
    <div style={{ position: "absolute", left: x, top: y, boxShadow: K.shadowFloat, borderRadius: R.inner, transform: `translateY(${bob + (1 - k) * 60 + ex * 30}px) rotate(${rot}deg) scale(${0.9 + k * 0.1})`, opacity: k * (1 - ex), ...style }}>
      {children}
    </div>
  );
};

/* ---------------- شباك المنتج ---------------- */
export const CHROME = 64;
export const WindowFrame: React.FC<{ w: number; h: number; url?: React.ReactNode; children: React.ReactNode; dark?: boolean; bottom?: number; right?: React.ReactNode }> = ({ w, h, url, children, dark, bottom = 14, right }) => (
  <div style={{ width: w, height: h, borderRadius: R.window, background: K.white, boxShadow: K.shadowWindow, overflow: "hidden", position: "relative" }}>
    <div style={{ height: CHROME, display: "flex", alignItems: "center", gap: 10, padding: "0 26px", direction: "ltr" }}>
      {[0, 1, 2].map((i) => (
        <span key={i} style={{ width: 14, height: 14, borderRadius: "50%", background: K.line }} />
      ))}
      {url && <span style={{ marginLeft: 18, padding: "6px 22px", borderRadius: 999, background: K.offwhite, fontFamily: MONO, fontWeight: 500, fontSize: 20, lineHeight: 1.5, color: K.ink3, whiteSpace: "nowrap" }}>{url}</span>}
      {right && <span style={{ marginLeft: "auto" }}>{right}</span>}
    </div>
    <div style={{ position: "absolute", left: 14, right: 14, top: CHROME, bottom, borderRadius: R.inner, overflow: "hidden", background: dark ? K.black : K.offwhite }}>{children}</div>
  </div>
);
// مقاس الشباك من مقاس المحتوى
export const winSize = (cw: number, ch: number, bottom = 14) => ({ W: cw + 28, H: ch + CHROME + bottom });

// مربع تحديد ملون حوالين حتة جوه الشباك
export const HiBox: React.FC<{ at: number; until?: number; x: number; y: number; w: number; h: number; color?: string }> = ({ at, until, x, y, w, h, color = K.amber }) => {
  const t = useT();
  const k = p(t, at, 0.5);
  const ex = until ? p(t, until, 0.4) : 0;
  if (k <= 0 || ex >= 1) return null;
  const pad = 8;
  return (
    <div style={{ position: "absolute", left: x - pad, top: y - pad, width: w + pad * 2, height: h + pad * 2, borderRadius: 14, boxShadow: `0 0 0 ${4 * k}px ${color}, 0 0 0 ${10 * k}px ${color}33`, opacity: k * (1 - ex), transform: `scale(${1.04 - 0.04 * k})` }} />
  );
};

/* ---------------- كبسولة تعليق (Toast) ---------------- */
export type Kind = "ok" | "warn" | "info" | "tip";
const KIND: Record<Kind, { c: string; I: Ph.Icon }> = {
  ok: { c: K.green, I: Ph.Check },
  warn: { c: K.coral, I: Ph.WarningCircle },
  info: { c: K.blue, I: Ph.Sparkle },
  tip: { c: K.amber, I: Ph.Lightning },
};
export const Toast: React.FC<{ kind?: Kind; children: React.ReactNode; size?: number; icon?: Ph.Icon; color?: string }> = ({ kind = "info", children, size = 30, icon, color }) => {
  const { c, I } = KIND[kind];
  const Icon = icon ?? I;
  const bg = color ?? c;
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 14, padding: `10px ${size}px 10px 12px`, borderRadius: 999, background: K.white, fontFamily: SANS, fontWeight: 600, fontSize: size, lineHeight: 1.5, color: K.black, direction: "rtl", whiteSpace: "nowrap" }}>
      <span style={{ width: size * 1.6, height: size * 1.6, borderRadius: "50%", background: bg, display: "flex", justifyContent: "center", alignItems: "center", flex: "none" }}>
        <Icon size={size * 0.85} color={bg === K.amber ? K.black : K.white} weight="bold" />
      </span>
      {children}
    </div>
  );
};

export type Cap = { at: number; text: React.ReactNode; kind?: Kind; until?: number; icon?: Ph.Icon; color?: string };
// تعليقات بتظهر واحدة ورا التانية في نفس المكان (كبسولة طايرة)
export const Captions: React.FC<{ caps: Cap[]; x: number; y: number; align?: "center" | "right" | "left"; size?: number }> = ({ caps, x, y, align = "center", size }) => {
  const t = useT();
  return (
    <>
      {caps.map((c, i) => {
        const end = c.until ?? (caps[i + 1] ? caps[i + 1].at - 0.3 : 99999);
        const k = p(t, c.at, 0.7);
        const ex = p(t, end, 0.4);
        if (k <= 0 || ex >= 1) return null;
        const bob = Math.sin((t / 8) * Math.PI * 2 + i) * 6;
        const tx = align === "center" ? "-50%" : "0";
        return (
          <div key={i} style={{ position: "absolute", left: align === "right" ? undefined : x, right: align === "right" ? x : undefined, top: y, transform: `translate(${tx}, ${bob + (1 - k) * 30 - ex * 20}px) rotate(${i % 2 ? 1.5 : -1.5}deg)`, opacity: k * (1 - ex), borderRadius: 999, boxShadow: K.shadowFloat }}>
            <Toast kind={c.kind} icon={c.icon} color={c.color} size={size}>
              {c.text}
            </Toast>
          </div>
        );
      })}
    </>
  );
};

/* ---------------- الورق: كل مشهد بيطلع من تحت فوق اللي قبله ---------------- */
export type SheetItem = { from: number; node: React.ReactNode; first?: boolean };
export const Sheets: React.FC<{ items: SheetItem[]; end: number; h?: number }> = ({ items, end, h = 1080 }) => {
  const t = useT();
  const list = [...items].sort((a, b) => a.from - b.from);
  return (
    <>
      {list.map((it, i) => {
        const next = list[i + 1]?.from;
        const to = next ?? end;
        if (t < it.from - 0.05 || t > to + 1.0) return null;
        const k = it.first ? 1 : p(t, it.from, 1.0);
        const out = next ? p(t, next, 1.0) : 0;
        return (
          <AbsoluteFill key={i} style={{ background: K.offwhite, borderRadius: k < 1 ? R.band : 0, transform: `translateY(${(1 - k) * h}px) scale(${1 - out * 0.04})` }}>
            {it.node}
          </AbsoluteFill>
        );
      })}
    </>
  );
};

// صفحة أوف وايت بهامش الموقع
export const Page: React.FC<{ children: React.ReactNode; top?: number }> = ({ children, top = 64 }) => (
  <div style={{ position: "absolute", inset: 0, padding: `${top}px 110px 0`, direction: "rtl" }}>{children}</div>
);

/* ---------------- علامات القناة الثابتة (نفس اللي في الدروس) ---------------- */
const badge: React.CSSProperties = {
  position: "absolute",
  bottom: 34,
  display: "flex",
  alignItems: "center",
  gap: 12,
  borderRadius: 999,
  background: "rgba(255,255,255,0.78)",
  boxShadow: "inset 0 1.5px 0 #fff, 0 0 0 1px rgba(130,190,205,0.25), 0 10px 26px rgba(15,90,110,0.12)",
};
export const Watermark: React.FC = () => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [15, 45], [0, 1], clamp);
  return (
    <div style={{ ...badge, left: 40, padding: "8px 20px 8px 8px", opacity: o * 0.95, direction: "ltr" }}>
      <Img src={staticFile("brand/motalim-logo.jpg")} style={{ width: 40, height: 40, borderRadius: "50%" }} />
      <span style={{ fontFamily: SANS, fontWeight: 600, fontSize: 22, lineHeight: 1.5, color: "#3D5B67", letterSpacing: 0.5 }}>motalim.com</span>
    </div>
  );
};
export const ChannelBadge: React.FC = () => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [25, 55], [0, 1], clamp);
  return (
    <div style={{ ...badge, right: 40, padding: "8px 8px 8px 20px", opacity: o * 0.95, direction: "rtl" }}>
      <span style={{ width: 40, height: 40, borderRadius: "50%", background: "#fff", display: "flex", justifyContent: "center", alignItems: "center", boxShadow: "0 0 0 1px rgba(255,0,0,0.12)" }}>
        <Ph.YoutubeLogo size={30} color="#FF0000" weight="fill" />
      </span>
      <span style={{ fontFamily: SANS, fontWeight: 600, fontSize: 22, lineHeight: 1.5, color: "#3D5B67" }}>
        متعلم - <span style={{ letterSpacing: 1 }}>MOTALIM</span>
      </span>
    </div>
  );
};

export { Ph };

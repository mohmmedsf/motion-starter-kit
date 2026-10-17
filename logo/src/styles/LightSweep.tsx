// Light sweep: the logo fades in softly -> one diagonal band of light crosses the logo shapes only, right to left,
// with a thin bright line behind it -> it settles on the original logo. Works with any logo (no grouping needed).
import React from "react";
import { Logo, PARTS, VIEW } from "../logo";
import { CONFIG } from "../config";
import { Center, LOGO_W, Sfx, Stage, U, W, ease, easeInOut, lerp, p, useT } from "../fx";

const IN = { a: 0.15, d: 0.9 };
const SWEEP = { a: 1.1, d: 1.5 };
const ANGLE = 22;
const DONE = SWEEP.a + SWEEP.d;

export const LightSweep: React.FC = () => {
  const t = useT();
  const kin = p(t, IN.a, IN.d, ease);
  const ks = p(t, SWEEP.a, SWEEP.d, (q) => 0.8 * q + 0.2 * easeInOut(q));
  const band = VIEW.w * 0.21; // band width relative to the logo width
  const x = lerp(VIEW.x + VIEW.w + band * 0.8, VIEW.x - band, ks);
  const cy = VIEW.y + VIEW.h / 2;
  const on = ks > 0 && ks < 1;
  const breath = 1 + 0.012 * Math.sin(Math.min(1, ks) * Math.PI);
  const cam = lerp(1.04, 1, p(t, 0, DONE + 0.6, easeInOut));
  return (
    <Stage>
      <Sfx at={IN.a} name="swell" vol={0.28} />
      <Sfx at={SWEEP.a - 0.05} name="whoosh_hi" vol={0.45} />
      <Sfx at={SWEEP.a + 0.2} name="shimmer" vol={0.38} />
      <Sfx at={DONE - 0.05} name="chime" vol={0.45} />
      {/* a soft glow behind the logo (only with a background) */}
      {on && CONFIG.background !== null && (
        <div style={{ position: "absolute", left: W / 2 + (x - VIEW.x - VIEW.w / 2) * U - 420, top: CONFIG.height / 2 - 300, width: 840, height: 600, borderRadius: "50%", background: "radial-gradient(ellipse at center, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0) 65%)", opacity: Math.sin(ks * Math.PI) * 0.9 }} />
      )}
      <Center y={lerp(10, 0, kin)} scale={cam * breath}>
        <Logo
          width={LOGO_W}
          style={{ opacity: kin, filter: kin < 1 ? `blur(${(1 - kin) * 5}px)` : undefined }}
          defs={
            <>
              <clipPath id="lsShapes">
                {PARTS.map((q) => (
                  <path key={q.id} d={q.d} />
                ))}
              </clipPath>
              <linearGradient id="lsWide" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
                <stop offset="0.3" stopColor="#ffffff" stopOpacity="0.45" />
                <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.95" />
                <stop offset="0.7" stopColor="#ffffff" stopOpacity="0.45" />
                <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="lsThin" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
                <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.95" />
                <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
              </linearGradient>
            </>
          }
          over={
            on ? (
              <g clipPath="url(#lsShapes)" style={{ mixBlendMode: "screen" }}>
                <rect x={x - band / 2} y={VIEW.y - VIEW.h} width={band} height={VIEW.h * 3} fill="url(#lsWide)" transform={`rotate(${ANGLE} ${x} ${cy})`} />
                <rect x={x + band * 0.46} y={VIEW.y - VIEW.h} width={band * 0.11} height={VIEW.h * 3} fill="url(#lsThin)" transform={`rotate(${ANGLE} ${x + band * 0.52} ${cy})`} />
              </g>
            ) : null
          }
        />
      </Center>
    </Stage>
  );
};

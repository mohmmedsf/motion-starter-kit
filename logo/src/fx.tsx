// Shared tools: the stage (a background or transparent), sound effects, time, easings, and deterministic randomness
import React from "react";
import { AbsoluteFill, Easing, Html5Audio, Sequence, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { CONFIG } from "./config";
import { VIEW } from "./logo";

export const FPS = CONFIG.fps;
export const W = CONFIG.width;
export const H = CONFIG.height;
export const LOGO_W = CONFIG.logoWidth;
export const U = LOGO_W / VIEW.w; // px per logo unit
export const f = (s: number) => Math.round(s * FPS);
export const useT = () => useCurrentFrame() / FPS;
export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const ease = Easing.bezier(0.22, 0.7, 0.2, 1);
export const easeIn = Easing.bezier(0.55, 0, 0.9, 0.4);
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);
export const expoOut = Easing.bezier(0.16, 1, 0.3, 1);
export const backOut = Easing.bezier(0.34, 1.56, 0.64, 1);

export const p = (t: number, a: number, d = 0.8, e: (x: number) => number = ease) => interpolate(t, [a, a + d], [0, 1], { ...clamp, easing: e });
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export const mix = (k: number, ...stops: number[]) => interpolate(k, stops.map((_, i) => i / (stops.length - 1)), stops, clamp);

export const useSpring = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (at: number, config: { damping?: number; stiffness?: number; mass?: number } = {}) =>
    spring({ frame: frame - Math.round(at * fps), fps, config: { damping: 12, stiffness: 120, mass: 1, ...config } });
};

export const rnd = (seed: string | number) => random(`${seed}`);
export const rndRange = (seed: string | number, a: number, b: number) => a + (b - a) * random(`${seed}`);
export const noise1 = (seed: string | number, x: number) => {
  const i = Math.floor(x);
  const fr = x - i;
  const a = random(`${seed}-${i}`) * 2 - 1;
  const b = random(`${seed}-${i + 1}`) * 2 - 1;
  const u = fr * fr * (3 - 2 * fr);
  return a + (b - a) * u;
};

// A sound effect from public/sfx/<name>.wav (make them with npm run sfx)
export const Sfx: React.FC<{ at: number; name: string; vol?: number; dur?: number; rate?: number }> = ({ at, name, vol = 1, dur, rate }) => (
  <Sequence from={f(at)} durationInFrames={dur ? f(dur) : undefined} layout="none" name={`sfx:${name}`}>
    <Html5Audio src={staticFile(`sfx/${name}.wav`)} volume={vol} playbackRate={rate} />
  </Sequence>
);

// The stage: with CONFIG.background = null it is transparent (no background, grain or vignette)
export const Stage: React.FC<{ bg?: string | null; vignette?: number; grain?: number; children?: React.ReactNode }> = ({ bg = CONFIG.background, vignette = 0.12, grain = 0.04, children }) => {
  const frame = useCurrentFrame();
  if (bg === null) return <AbsoluteFill>{children}</AbsoluteFill>;
  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      {children}
      {vignette > 0 && <AbsoluteFill style={{ background: `radial-gradient(ellipse at center, rgba(0,0,0,0) 45%, rgba(0,0,0,${vignette}) 100%)`, pointerEvents: "none" }} />}
      {grain > 0 && (
        <AbsoluteFill style={{ opacity: grain, mixBlendMode: "overlay", pointerEvents: "none" }}>
          <svg width="100%" height="100%">
            <filter id={`grain-${frame % 6}`}>
              <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={frame % 6} stitchTiles="stitch" />
              <feColorMatrix type="saturate" values="0" />
            </filter>
            <rect width="100%" height="100%" filter={`url(#grain-${frame % 6})`} />
          </svg>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

export const Center: React.FC<{ children: React.ReactNode; y?: number; x?: number; scale?: number; rotate?: number; style?: React.CSSProperties }> = ({ children, y = 0, x = 0, scale = 1, rotate = 0, style }) => (
  <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
    <div style={{ transform: `translate(${x}px, ${y}px) scale(${scale}) rotate(${rotate}deg)`, ...style }}>{children}</div>
  </AbsoluteFill>
);

export const speedBlur = (v: number, k = 0.35, max = 14) => Math.min(max, Math.abs(v) * k);

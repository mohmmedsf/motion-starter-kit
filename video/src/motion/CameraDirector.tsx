import React from 'react';
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

export type CameraKeyframe = { at: number; x: number; y: number; zoom: number };
export type CameraDirectorProps = { keyframes: CameraKeyframe[]; children: React.ReactNode };

/** Deterministic pan/zoom in seconds. Transform origin is the scene centre. */
export const CameraDirector: React.FC<CameraDirectorProps> = ({ keyframes, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const keys = [...keyframes].sort((a, b) => a.at - b.at);
  if (keys.length === 0) return <>{children}</>;
  const valid = keys.every(k => [k.at, k.x, k.y, k.zoom].every(Number.isFinite) && k.zoom > 0);
  if (!valid) throw new Error('Invalid camera keyframe');
  let i = 0;
  while (i < keys.length - 2 && t > keys[i + 1].at) i++;
  const a = keys[i], b = keys[Math.min(i + 1, keys.length - 1)];
  const p = a === b || b.at <= a.at ? (t >= b.at ? 1 : 0) :
    interpolate(t, [a.at, b.at], [0, 1], { extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic) });
  const x = a.x + (b.x - a.x) * p;
  const y = a.y + (b.y - a.y) * p;
  const zoom = a.zoom + (b.zoom - a.zoom) * p;
  return <div style={{ width: '100%', height: '100%', transformOrigin: 'center center',
    transform: `translate(${x}px, ${y}px) scale(${zoom})` }}>{children}</div>;
};

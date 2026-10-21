import { interpolate, Easing } from 'remotion';

/** Deterministic SVG stroke drawing. Use pathLength=1 to normalize any SVG path. */
export const drawProgress = (frame: number, fps: number, startSeconds: number, durationSeconds: number) => {
  if (!Number.isFinite(frame) || !Number.isFinite(fps) || fps <= 0) throw new Error('Invalid frame or fps');
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) throw new Error('durationSeconds must be positive');
  const start = startSeconds * fps;
  const end = start + durationSeconds * fps;
  return interpolate(frame, [start, end], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });
};

export const strokeReveal = (progress: number) => {
  const p = Math.max(0, Math.min(1, progress));
  return { pathLength: 1, strokeDasharray: 1, strokeDashoffset: 1 - p } as const;
};

/** Returns a point on a normalized SVG path in the browser; no DOM calls during module evaluation. */
export const markerPoint = (path: SVGPathElement, progress: number) => {
  const length = path.getTotalLength();
  const point = path.getPointAtLength(Math.max(0, Math.min(length, length * progress)));
  return { x: point.x, y: point.y };
};

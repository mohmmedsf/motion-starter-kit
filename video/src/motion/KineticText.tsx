import React from 'react';
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

export type KineticTextProps = {
  text: string;
  startSeconds?: number;
  durationSeconds?: number;
  direction?: 'rtl' | 'ltr';
  fontFamily?: string;
  fontSize?: number;
  color?: string;
  distance?: number;
};

/** Reveals the complete shaped text node, never splitting Arabic letters. */
export const KineticText: React.FC<KineticTextProps> = ({
  text, startSeconds = 0, durationSeconds = 0.65, direction = 'rtl',
  fontFamily = 'sans-serif', fontSize = 72, color = '#23272e', distance = 32,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = startSeconds * fps;
  const b = a + Math.max(0.001, durationSeconds) * fps;
  const p = interpolate(frame, [a, b], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  return (
    <div dir={direction} lang={direction === 'rtl' ? 'ar' : undefined} style={{
      fontFamily, fontSize, color, whiteSpace: 'pre-wrap',
      unicodeBidi: 'plaintext', opacity: p,
      transform: `translateY(${(1 - p) * distance}px)`,
      filter: `blur(${(1 - p) * 4}px)`,
    }}>{text}</div>
  );
};

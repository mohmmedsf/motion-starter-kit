import React from 'react';
import { getLength, getPointAtLength } from '@remotion/paths';
import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { drawProgress, strokeReveal } from './draw';

export type WhiteboardPathProps = {
  d: string; startSeconds?: number; durationSeconds?: number;
  color?: string; strokeWidth?: number; marker?: boolean; markerRadius?: number;
  fillColor?: string;
};

/** A path and visible marker share the same deterministic timeline. */
export const WhiteboardPath: React.FC<WhiteboardPathProps> = ({
  d, startSeconds = 0, durationSeconds = 1.4, color = '#23272e',
  strokeWidth = 6, marker = true, markerRadius = 9, fillColor = 'none',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = drawProgress(frame, fps, startSeconds, durationSeconds);
  const length = getLength(d);
  const distance = Math.max(0, Math.min(length > 0 ? length - 0.0001 : 0, length * progress));
  const pt = length > 0 ? getPointAtLength(d, distance) : null;
  const fade = interpolate(progress, [0, 0.1, 0.9, 1], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  return <g>
    <path d={d} fill={progress >= 1 ? fillColor : 'none'} stroke={color}
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      {...strokeReveal(progress)} />
    {marker && pt && progress > 0 && progress < 1 && <g transform={`translate(${pt.x} ${pt.y})`} opacity={fade}>
      <ellipse cx="4" cy="8" rx={markerRadius * 1.2} ry={markerRadius * 0.55} fill="#000" opacity={0.12} />
      <circle r={markerRadius} fill="#fff" stroke={color} strokeWidth="3" />
      <circle r={markerRadius * 0.35} fill={color} />
    </g>}
  </g>;
};

import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { drawProgress, strokeReveal } from './draw';

export type DrawPathProps = {
  d: string;
  startSeconds?: number;
  durationSeconds?: number;
  stroke?: string;
  strokeWidth?: number;
  fill?: string;
};

/** Drop this component inside an SVG with an appropriate viewBox. */
export const DrawPath: React.FC<DrawPathProps> = ({
  d, startSeconds = 0, durationSeconds = 1.2,
  stroke = '#23272e', strokeWidth = 5, fill = 'none',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = drawProgress(frame, fps, startSeconds, durationSeconds);
  return <path d={d} fill={fill} stroke={stroke} strokeWidth={strokeWidth}
    strokeLinecap="round" strokeLinejoin="round" {...strokeReveal(progress)} />;
};

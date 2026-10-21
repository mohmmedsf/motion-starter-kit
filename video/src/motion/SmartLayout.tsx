import React from 'react';
import { gridLayout, LayoutItem, LayoutOptions } from './layout';

export type SmartLayoutProps = LayoutOptions & {
  items: Array<LayoutItem & { node: React.ReactNode }>;
  background?: string;
};

/** Measured-size, collision-free grid: rejects elements that do not fit. */
export const SmartLayout: React.FC<SmartLayoutProps> = ({ items, background, ...options }) => {
  const placements = gridLayout(items, options);
  return <div style={{ position: 'relative', width: options.width, height: options.height, background }}>
    {items.map(item => {
      const rect = placements[item.id];
      return <div key={item.id} style={{ position: 'absolute', left: rect.x, top: rect.y,
        width: rect.width, height: rect.height, overflow: 'hidden' }}>{item.node}</div>;
    })}
  </div>;
};

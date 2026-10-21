export type Rect = { x: number; y: number; width: number; height: number };
export type LayoutItem = { id: string; width: number; height: number };
export type LayoutOptions = { width: number; height: number; padding?: number; gap?: number; columns?: number };

/** Predictable grid layout for scene planning. Throws rather than silently overflowing. */
export function gridLayout(items: LayoutItem[], options: LayoutOptions): Record<string, Rect> {
  const { width, height, padding = 64, gap = 24 } = options;
  const columns = options.columns ?? Math.max(1, Math.ceil(Math.sqrt(items.length)));
  if (![width, height, padding, gap, columns].every(Number.isFinite) || width <= 0 || height <= 0 || padding < 0 || gap < 0 || !Number.isInteger(columns) || columns < 1) {
    throw new Error('Invalid layout dimensions');
  }
  const rows = Math.ceil(items.length / columns);
  const cellWidth = (width - 2 * padding - gap * (columns - 1)) / columns;
  const cellHeight = rows ? (height - 2 * padding - gap * (rows - 1)) / rows : 0;
  if (items.length && (cellWidth <= 0 || cellHeight <= 0)) throw new Error('Not enough space for layout');
  const result: Record<string, Rect> = Object.create(null);
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item.id || !Number.isFinite(item.width) || !Number.isFinite(item.height) || item.width <= 0 || item.height <= 0) throw new Error('Invalid layout item');
    if (Object.hasOwn(result, item.id)) throw new Error('Duplicate layout id: ' + item.id);
    if (item.width > cellWidth || item.height > cellHeight) throw new Error('Item does not fit: ' + item.id);
    const col = i % columns;
    const row = Math.floor(i / columns);
    result[item.id] = {
      x: padding + col * (cellWidth + gap) + (cellWidth - item.width) / 2,
      y: padding + row * (cellHeight + gap) + (cellHeight - item.height) / 2,
      width: item.width, height: item.height,
    };
  }
  return result;
}

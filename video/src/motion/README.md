# Reusable motion primitives (Phase 1)

These components are additive: existing scenes, skills and reference styles remain unchanged.

## SVG drawing

```tsx
import { DrawPath } from './motion';
<svg viewBox="0 0 400 200">
  <DrawPath d="M 20 100 C 100 10 300 190 380 100" durationSeconds={2} />
</svg>
```

The SVG path is revealed through normalized `pathLength`, without browser measurements during rendering. `markerPoint` is a browser-only utility for following an existing path; it is not yet wired to a visible marker component.

## Arabic kinetic text

```tsx
import { KineticText } from './motion';
<KineticText text="تطوير الأعمال يبدأ بفهم العميل" startSeconds={0.5} />
```

Arabic text is kept in a single DOM text node to preserve shaping. The motion is a whole-text fade, slide and blur.

## Layout

```ts
const placements = gridLayout(
  [{ id: 'title', width: 500, height: 90 }, { id: 'chart', width: 700, height: 400 }],
  { width: 1920, height: 1080, columns: 2 }
);
```

`gridLayout` uses deterministic cells and rejects overflow. It is not a text-measurement or collision-solving engine.

## Validation status

Source modules added through GitHub. Local install, typecheck, visual rendering and performance benchmarking still need to run in a Node/Remotion environment.

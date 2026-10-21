# Motion Engine — Phase 1

Additive Remotion components for reusable drawing, layout, camera movement and Arabic typography.

## Demo

Run `npm run studio` from `video/` and choose composition `MotionEngineDemo`.
For static review: `npm run stills -- --id MotionEngineDemo 0 1 2 3 5`.

## Components

- `WhiteboardPath`: SVG path reveal with a visible moving marker. Uses `@remotion/paths` for deterministic point sampling. Marker is a stylized circular nib, **not** a photographic hand.
- `DrawPath`: normalized path stroke reveal.
- `KineticText`: Arabic-safe whole-text fade, slide and blur.
- `SmartLayout`: grid when sizes are known; throws on overflow. No automatic text measurement.
- `CameraDirector`: time-keyed smooth pan/zoom.
- `gridLayout`: pure layout planner.
- `drawProgress`: frame-based easing helper.

## Example

```tsx
import { WhiteboardPath, KineticText, CameraDirector } from './motion';
<CameraDirector keyframes={[{at:0,x:0,y:0,zoom:1},{at:2,x:20,y:0,zoom:1.15}]}>
  <KineticText text="مرحبا بالعالم" />
  <svg viewBox="0 0 400 200">
    <WhiteboardPath d="M 20 100 L 380 100" durationSeconds={2} />
  </svg>
</CameraDirector>
```

This is a component library and demo, not automatic script-to-video planning. Existing `Main` composition and user workflows remain unchanged. Run typecheck and visual render review before merging.

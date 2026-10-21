# Eight new Remotion motion styles (Phase 3)

These are **code-driven six-second example compositions** (not complete video generators). Each one is available in Remotion Studio, with editable JSX and palette constants. No generated video or test success is implied.

| Composition | Visual concept | Reusable techniques |
| --- | --- | --- |
| Style-glass-motion | Translucent floating cards | Blur, glass panels, easing |
| Style-editorial-motion | Oversized editorial type | Staggered typography, color blocks |
| Style-paper-cutout | Layered organic paper | Shadows, depth, stagger |
| Style-exploded-view | Separated numbered components | Component offsets and connector strokes |
| Style-data-storytelling | Animated bar chart | Interpolated numeric values and heights |
| Style-ui-walkthrough | Animated app interface | UI cards, cursor motion, highlight |
| Style-timeline-documentary | Animated milestones | Timeline progress, staged events |
| Style-network-visualization | Graph of connected nodes | Node and edge motion |

## Review

From `video/`:

```bash
npm install
npm run typecheck
npm run studio
npm run stills -- --id Style-glass-motion 0 1 3 5
npm run stills -- --id Style-data-storytelling 0 1 3 5
```

Use the `STYLE_IDS` constant to enumerate compositions for screenshot review.

## Extend

Edit `src/styles/StyleShowcase.tsx` to change example visuals and `STYLE_PALETTES` for colors. All timing derives from `useCurrentFrame` and `useVideoConfig` to keep rendering deterministic.

### Scope limitations

These eight style compositions demonstrate real motion effects but do not implement all advanced techniques implied by their names (e.g. actual 3D meshes, realistic paper physics, real data ingestion, real browser interaction, or physics-based graph layouts). No extra rendering dependencies are added. Original reference styles remain unchanged.

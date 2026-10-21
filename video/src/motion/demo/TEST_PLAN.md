# Motion engine verification

1. `cd video && npm install`
2. `npm run typecheck`
3. `npm run stills -- --id MotionEngineDemo 0 1 2 3 5`
4. Inspect images in `out/stills/`:
   - Arabic glyphs stay connected, and title remains readable.
   - The blue rectangular path starts after 0.8s and finishes near 2.6s.
   - Orange arrow starts after 2.4s and finishes near 4.5s.
   - Marker stays near the visible path and disappears at completion.
   - Camera finishes zooming by 1.5s.
   - No overlapping content or clipped text.
5. Check original `Main` composition is unchanged.
6. Only after approval of a user video, use its existing render approval process.

This file describes test steps, **not** completed test results.

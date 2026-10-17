# Logo animation styles — build guide (Motalim logo, Remotion)

One composition per style: 1920×1080, 30 fps, 6.0 s (180 frames) unless the brief says otherwise.
Reference implementation to match in quality and code style: `src/styles/L01LineDraw.tsx`.

## The logo (src/logo.tsx, src/logo-data.ts)
- Logo viewBox is 450 × 149.56. Mark on the right (blue circle cx 375.22 cy 74.78 r 74.78, with a white `cup` and a white `hat` on it); on the left the Arabic word «متعلم» = one connected path `word` + 5 small `MARKS` (damma, dot-r, dot-l, fatha, shadda, sorted right→left), and under it the tagline «حان وقت الإبداع» = 16 small paths `TAG` (tag0..tag15, right→left).
- `<Logo width theme part={(pt, i) => PartStyle} defs under over />` renders every part; `part` returns per-part style: hidden, opacity, x/y (logo units), scale/scaleX/scaleY, rotate (deg), origin (CSS, default part center via fill-box), fill, fillOpacity, stroke, strokeWidth, draw (0..1 stroke reveal via evolvePath), blur (px), filter (url(#id) from defs), d (replacement path, e.g. for morphing).
- Exports: `CIRCLE`, `CIRCLE_PART` (circle as a path starting at 12 o'clock), `CUP`, `HAT`, `WORD`, `MARKS`, `TAG`, `ALL_PARTS`, `MARK_PARTS`, `WORD_PARTS`, `VIEW`, `baseFill(id, theme)`. Each part has `box {x,y,w,h}` and `len` (path length).
- Original colors: light theme → circle #0056D2, cup/hat #FFFFFF, word/marks/tag #000000. Dark theme → same but word/marks/tag #FFFFFF.
- `@remotion/paths` is available (evolvePath, interpolatePath, getPointAtLength, getTangentAtLength, getBoundingBox, getLength, getSubpaths, scalePath, translatePath, reversePath, normalizePath).

## Shared helpers (src/fx.tsx)
`useT()` seconds; `p(t, start, dur, easing)` 0..1; `lerp`, `mix(k, ...stops)`; easings `ease` (Motalim brand curve), `easeIn`, `easeInOut`, `expoOut`, `backOut`; `useSpring()(at, {damping, stiffness, mass})`; deterministic random `rnd(seed)`, `rndRange(seed,a,b)`, smooth `noise1(seed, x)`; `<Stage bg vignette grain>` (background + vignette + animated film grain); `<Center x y scale rotate>`; `<Sfx at name vol dur rate />`; `LOGO_W` = 1080 px standard logo width; `U` = px per logo unit; `speedBlur(v)`.
Never use Math.random(), Date, CSS animations/transitions or React state: every frame must be a pure function of the frame.

## Brand palette (only these, plus transparency of them)
offwhite #F3F2EE · black #000000 · white #FFFFFF · blue #0056D2 · sky #00B6FF · teal #47B6CC · green #2EA57C · coral #FF4F5C · amber #FFB300 · orange #EE702E · navy #1F3D63. Dark backgrounds: use navy, black, or deep blends of navy/blue/black. Fonts are not needed (the logo is paths).

## Sound (public/sfx/*.wav, synthesized, stereo, already mastered quietly)
whoosh (0.55s fast air sweep L→R) · whoosh_long (1.1s, R→L) · whoosh_hi (0.35s airy) · reverse (1.3s reverse-cymbal build that ENDS at its peak: start it 1.3s before the hit) · riser (2.2s tension build) · impact (big cinematic hit with sub + tail; use once) · hit (soft thump) · drop (falling sub) · pop / pop_hi / pop_lo · tick · click · snap (tight assembly click) · boing (cartoon spring) · thud (soft landing) · stretch (rising rubbery tone) · sparkle (random bells) · shimmer (rising glitter arpeggio) · chime (warm major chord + bell: the "logo resolve" note) · swell (warm pad rising 2.8s) · pen (pencil scratch 1.6s) · marker · liquid (2.4s pour/gurgle with bubbles) · bubbles · glitch (0.7s digital stutter) · glitch_short · zap (electric) · neon_on (1.4s tube flicker-on with clicks and hum) · neon_hum (4s steady hum bed) · swirl (2.4s particle swirl, panning) · magic (whoosh+shimmer) · spin (rotating whoosh) · flap (card flip) · slide (soft slide) · type.
Sound design rules: 3–7 cues per style, each tied to a visible event, frame-accurate. One clear "resolve" moment when the logo completes (often chime, impact or hit + sparkle). Typical volumes 0.2–0.8; never let two loud sounds stack. A `reverse` must end exactly on the hit.

## Motion quality bar
- Structure: anticipation → main action (≈ 2.5–3.5 s) → the logo resolves exactly into its ORIGINAL look (original colors/shapes/positions, centered, `LOGO_W` width unless the style needs a different scale) by ≈ 3.5–4.2 s → a calm hold to 6.0 s (tiny life allowed: a slow glint, a 1% breath; nothing distracting). The final 1.5 s must show the clean, complete logo.
- Use easing everywhere (no linear motion), overlap actions (stagger 40–120 ms), springs with overshoot where physical, motion blur via `blur`/speedBlur on fast moves, subtle camera drift (scale 1.04→1.0) for depth.
- Frame 0 is not an ugly empty screen: give the background life from frame 0 (gradient, grain, a faint element).
- Keep it brand-elegant: premium, not cheesy; no rainbow colors; glows subtle.
- Performance: keep SVG filters modest (feGaussianBlur ≤ 12, few filtered nodes), particle counts ≤ ~250 elements, no heavy per-frame canvas.

## How to check your work (mandatory)
- Type-check: `npx tsc --noEmit` (only fix errors in your own files).
- Stills: `node stills.mjs work/<dir> <CompositionId> 0.1 0.5 1 1.5 2 2.5 3 3.5 4 5.5` then build a contact sheet with ffmpeg (~/.local/bin/ffmpeg, xstack) and look at it with the Read tool; also zoom (crop) into 1–2 frames at full resolution to check edges, glows and the final logo. Iterate until it looks genuinely professional. The final frame must be pixel-clean and identical in layout to the original logo.
- stills.mjs renders at scale 0.5 (960×540 PNGs); crop accordingly.

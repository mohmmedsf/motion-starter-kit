<div dir="rtl">

# صور الموكاب لستايل «الهيرو»

ستايل «الهيرو» يعرض الشعار على صور حقيقية. **لا ترسم الموكاب بالكود:** الموبايل والكروت المرسومة بـ CSS بدت رخيصة ورُفضت. استخدم صورًا.

## من أين تأتي الصور
اسأل المستخدم مرة واحدة (مع باقي الأسئلة):
1. **يولّدها هو:** أعطه البرومبتات التالية ليولّدها في أي مولّد صور (ChatGPT، أو Gemini، أو Midjourney، أو غيرها).
2. **تولّدها أنت:** إن كان عندك أداة توليد صور ورصيد كافٍ. الصورة الجيدة بدقة 2K غالبًا، و6 صور تكفي.
3. **عنده صور جاهزة:** صور موكاب فاضية من موقع موكاب مجاني أو مدفوع.

## المواصفات
- **مربعة (1:1)**، بدقة 1254 بكسل على الأقل. الكود يقصّها (cover) حول نقطة تركيز، فالصورة نفسها تعمل في العرضي والطولي.
- **فاضية تمامًا:** لا شعار، ولا كلام، ولا علامات.
- **السطح مواجه للكاميرا** (من فوق أو من الأمام)، حتى يُركَّب الشعار دون منظور معقّد.
- **شاشة الموبايل لونها أخضر صريح** (#00FF00): الكود يزيل الأخضر بمرشح ويضع شاشة التطبيق تحته.
- **الألوان:** من ألوان شعار المستخدم. البرومبتات التالية بألوان متعلم (كحلي، وأوف وايت، وأزرق): غيّر الأكواد إلى ألوان المستخدم.

## الحفظ والتركيب
- احفظها في `logo/public/mockups/` بالأسماء: `phone.webp`، و`hoodie.webp`، و`cards.webp`، و`poster.webp`، و`emboss.webp`، و`notebook.webp` (أو `.jpg`).
- في الكود المرجعي (`logo/reference/motalim/styles/L16Hero.tsx`، مصفوفة `PHOTOS`) لكل صورة: نوع التركيب، ومكان نص الشعار وعرضه ونقطة التركيز ببكسلات الصورة. انظر إلى كل صورة، وقِس السطح الفاضي، ثم راجع بصورة ثابتة في المقاسين.
- أمثلة جاهزة (بألوان متعلم) في `logo/reference/motalim/mockups/`.

</div>

---

### Shared style (paste before every prompt)
```
Premium brand-identity mockup photograph, square 1:1, shot on a full-frame camera, 50mm lens, soft natural window light from the upper left, gentle realistic shadows, subtle film grain, muted color palette of deep navy blue (#1F3D63), off-white (#F3F2EE) and a touch of royal blue (#0056D2). Minimal, calm, high-end design studio look. Absolutely no logos, no text, no letters, no symbols, no watermarks anywhere in the image. The main surface is completely blank and faces the camera straight on so a logo can be added later.
```

### phone
```
A hand holding a modern black smartphone upright, the phone screen faces the camera perfectly straight on with no tilt. The entire screen is filled with a flat solid pure chroma green (#00FF00), no reflections, no glare, no interface. Blurred deep navy studio background with soft bokeh. The phone is centered and large in the frame.
```

### hoodie
```
Top-down flat lay of a neatly folded plain off-white heavyweight cotton hoodie on a deep navy linen surface. The chest area of the hoodie is flat, smooth and completely blank, centered in the frame and facing the camera directly. Visible fabric texture, soft folds around the edges, drawstrings resting naturally.
```

### cards
```
Top-down view of a stack of thick premium blank off-white business cards with one blank card on top, lying perfectly flat and square to the camera, on a dark navy textured stone surface. Crisp card edges, subtle paper texture, soft long shadow. The top card is centered and fully blank.
```

### poster
```
A large blank off-white paper poster taped flat to a smooth light-grey concrete wall, photographed straight on (front view, no perspective). Small pieces of white tape on the four corners, very subtle paper wrinkles and a soft shadow under the poster. The poster is centered and fully blank.
```

### emboss
```
Close-up of a blank sheet of thick deep navy cotton paper with a fine textured surface, lit by a single low-angle light from the left that creates soft raking light across the texture, photographed straight on. The center of the paper is completely blank, edges fade gently into darkness. Moody, elegant, high-end print studio.
```

### notebook
```
Top-down view of an open spiral-bound sketchbook with a completely blank white page facing the camera straight on, lying on a light grey desk, a sharpened yellow wooden pencil resting beside it. The blank page is centered and flat, soft paper texture, gentle shadow.
```

---
name: logo-animation
description: Animate the user's own logo in Remotion in one of 17 styles (line draw, handwriting, assembly, morph, geometric, liquid fill, mask wipe, light sweep, kinetic typing, elastic, character, 3D flip, particles, glitch, neon, a brand-hero film with real photo mockups, and a design-canvas brand film in the language of design tools), with synthesized sound effects, on a background colour or transparent (alpha MOV/WebM). Use when the user asks for an animated logo, a logo reveal, a logo intro or «تحريك الشعار» / «شعار متحرك», names a style from the logo styles gallery (gallery/logo/), or hands you the file «ستايلات تحريك الشعار.html». Covers getting the SVG, splitting it into parts, one round of questions (including background colour vs transparent), building with Arabic-safe techniques, review in Remotion Studio, and rendering only after the user approves.
---

<div dir="rtl">

# تحريك الشعار في Remotion

**الهدف:** شعار المستخدم نفسه متحركًا بأحد الستايلات السبعة عشر في [معرض تحريك الشعار](https://motalim-ai.github.io/motion-starter-kit/gallery/logo/) (`gallery/logo/index.html`)، بمؤثرات صوتية، وينتهي بالشعار الأصلي تمامًا.

**قبل أن تبدأ:**
- المشروع الجاهز في `logo/`. شغّل أوامر `npm` من داخله.
- كل أمثلة المعرض لشعار متعلم، وكودها في `logo/reference/motalim/styles/`. خذ منها **الطريقة** فقط، وطبّقها على أجزاء شعار المستخدم. لا تضع شعار متعلم في عمل المستخدم.
- طريقة بناء كل ستايل في [references/styles.md](references/styles.md). وقواعد الكلمة العربية في [references/arabic.md](references/arabic.md).
- المراحل بالترتيب، ولا تقفز فوق مرحلة.

## المرحلة 0: التجهيز
1. **إن بدأت من رابط الريبو أو من ملف المعرض** ولست داخل المشروع، فانسخه وادخل إليه:
   - المجلد الحالي فارغ: `git clone https://github.com/motalim-ai/motion-starter-kit.git .`
   - المجلد فيه ملفات: `git clone https://github.com/motalim-ai/motion-starter-kit.git logo-animation`، ثم ادخل `logo-animation`.
2. **تحقّق من الأدوات:** `node -v` (الإصدار 18 أو أحدث)، و`uv --version`. إن نقصت أداة، فاشرح للمستخدم في جملة بسيطة ما هي، واعرض أن تثبّتها بعد موافقته (`brew install node uv` على macOS، و`winget install OpenJS.NodeJS.LTS astral-sh.uv` على Windows).
3. **ثبّت المشروع:** `cd logo && npm install`، ثم `npm run sfx` (يصنع 36 مؤثرًا صوتيًا في `public/sfx/` بالكود، دون تحميل ولا رخص).

## المرحلة 1: الشعار
1. **اطلب الشعار بصيغة SVG** إن لم يرسله. إن كان عنده PNG أو JPG فقط، فاشرح له أن SVG هو ما يسمح بتحريك كل جزء وحده، وأن مصمّم الشعار أو برنامج التصميم يصدّره (Illustrator أو Figma أو Inkscape). ستايل «اللمعة» وحده يمكن أن يعمل بصورة، وما عداه يحتاج SVG.
2. ضعه في `logo/public/logo/logo.svg`، ثم: `npm run split`. يكتب `src/logo-data.json`: جزء لكل شكل (`p0`، `p1`، ...) بمساره ولونه ومربعه.
3. **اقرأ التحذيرات** التي يطبعها:
   - `transform` غير مدعوم، أو شكل بخط فقط (stroke)، أو نص حي، أو صورة داخل الملف: اطلب من المستخدم تصدير الملف مرة أخرى بعد «Outline stroke» و«Create outlines»، أو أصلح الملف بنفسك إن استطعت.
4. **اعرف الأجزاء:** `npm run stills -- --id Parts 0`، ثم انظر إلى `out/stills/Parts-t00.00.png`: كل جزء بلون ورقمه عليه.
5. **سمِّ المجموعات** في `src/groups.ts`: `mark` (الرمز، والشكل الخلفي أولًا)، و`word` (الكلمة)، و`dots` (نقاطها وتشكيلها)، و`tag` (الجملة الصغيرة). احذف ما ليس في الشعار، وأضف ما يلزم.
6. **حدّد لغة الكلمة:** إن كانت عربية، فاقرأ [references/arabic.md](references/arabic.md) الآن.

## المرحلة 2: الأسئلة، مرة واحدة فقط
اسأل كل الأسئلة في رسالة واحدة، بلغة المستخدم وبكلام بسيط، مع اقتراحك لكل سؤال. لا تسأل عما قاله في طلبه.
1. **الستايل:** أي ستايل من المعرض؟ إن لم يعرف، فأعطه رابط المعرض، واقترح ستايلين يناسبان شعاره (عمود «يناسب» في كل بطاقة).
2. **الخلفية:** هل يريد الشعار **بخلفية بلون محدد** (وما اللون؟)، أم **بدون خلفية** (شفافًا) ليضعه فوق فيديوهاته، أم **النسختين**؟ اقترح الخلفية الافتراضية للستايل (فاتحة أو داكنة)، بلون من ألوان شعاره.
3. **ألوان الشعار:** إن كانت الخلفية داكنة، أو سيضع النسخة الشفافة فوق فيديو داكن، والشعار فيه نص أسود: هل يتحوّل الأسود إلى الأبيض؟ أم عنده نسخة من الشعار للخلفيات الداكنة؟
4. **المدة:** اقترح مدة الستايل (6 ثوانٍ تقريبًا). من 3 إلى 8 ثوانٍ تكفي.
5. **الصوت:** مؤثرات صوتية على لحظات الحركة، أم بدون صوت؟
6. **المقاس:** عرضي 16:9، أم طولي 9:16، أم مربع 1:1؟ وبدقة 1080p أم 4K؟
7. **الاستخدام:** أين سيضعه؟ بداية فيديو يوتيوب، أو موقع، أو ريلز.
8. **ستايلا «الهيرو» و«لوحة التصميم» فقط:** يحتاج صور موكاب فاضية (هودي، وموبايل، وكروت، وبوستر، وورق داكن، ونوتة). اسأله: هل يولّدها هو ببرومبتات تعطيها له من [references/mockups.md](references/mockups.md)، أم تولّدها أنت إن كان عندك مولّد صور، أم عنده صور جاهزة؟ لا ترسم الموكاب بالكود.

انتظر الإجابات، ولا تبدأ البناء قبلها.

## المرحلة 3: البناء
1. **الإعدادات** في `src/config.ts`:
   - `width` و`height` من المقاس: 1920×1080، أو 1080×1920، أو 1080×1080. الـ 4K يأتي عند الرندر بـ `--scale 2`.
   - `background`: اللون الذي اختاره، أو `null` للنسخة الشفافة.
   - `recolor`: تبديل الألوان، مثل `{ "#000000": "#FFFFFF" }`.
   - `logoWidth`: عرض الشعار في الكادر (نحو 56% من عرض الكادر في العرضي، و80% في الطولي).
2. **هيكل الحروف** إن كان الستايل يحتاجه (مكتوب في بطاقته) والكلمة عربية أو مكتوبة بخط اليد:
   - `npm run skeleton -- --group word=p8 --group tag=p9-p24` (بأرقام أجزاء شعار المستخدم).
   - تحقّق منه: `npm run stills -- --id Skeleton 0`. الخط الملوّن يمرّ في منتصف كل حرف، والترقيم يبدأ من اليمين، ولا فروع غريبة.
3. **اكتب الستايل** في `src/styles/<Name>.tsx`، وسجّله في `src/styles/index.ts` (المعرّف والمدة).
   - اتبع خطواته في [references/styles.md](references/styles.md)، واقرأ كوده المرجعي في `logo/reference/motalim/styles/`.
   - الأدوات: `src/logo.tsx` (`<Logo part={...}>` وستايل كل جزء)، و`src/groups.ts`، و`src/fx.tsx` (الزمن والتسارع والمسرح والصوت)، و`src/strokes.ts` (حركة القلم على الهيكل)، و`src/morph.ts` (تحويل شكل لشكل).
   - مثال كامل يعمل مع أي شعار: `src/styles/LightSweep.tsx`.
4. **قواعد الحركة:**
   - كل إطار دالة في الزمن: لا CSS animations، ولا `Math.random()` (استخدم `rnd(seed)`)، ولا state.
   - البنية: تمهيد، ثم الحركة الرئيسية (2.5 إلى 3.5 ثانية)، ثم **الشعار الأصلي تمامًا** (نفس الألوان والأشكال والأماكن، في الوسط)، ثم ثبات لا يقل عن 1.5 ثانية.
   - تسارع في كل حركة (لا حركة خطية)، وتداخل بين الأجزاء (40 إلى 120 ملي ثانية)، وspring حيث توجد فيزياء.
   - الإطار الأول ليس فارغًا قبيحًا: الخلفية حيّة من الإطار 0. ومع النسخة الشفافة: الشعار يبدأ بالظهور مبكرًا.
   - الألوان من ألوان شعار المستخدم فقط، وبشفافياتها.
5. **الصوت** (إن أراده): 3 إلى 7 مؤثرات، كل مؤثر على حدث يُرى، بدقة الإطار، بـ `<Sfx at name vol />`. لحظة «اكتمال» واحدة واضحة (غالبًا `chime`). المستوى بين 0.2 و0.8، ولا يتراكم صوتان عاليان. قائمة الأصوات في أول `scripts/sfx.py`.

## المرحلة 4: المراجعة
1. `npm run typecheck`.
2. صور ثابتة على مراحل الحركة، مثل: `npm run stills -- --id <Name> 0.2 0.8 1.5 2.2 3 4 5.5`. انظر إلى كل صورة:
   - هل الكلمة العربية سليمة في كل لحظة (لا حروف مقطّعة ولا فراغات غريبة)؟
   - هل الصورة الأخيرة مطابقة للشعار الأصلي، بنظافة وفي الوسط؟
   - مع النسخة الشفافة: هل الخلفية شفافة فعلًا (الصورة PNG بقناة شفافية)؟
3. شغّل Remotion Studio: `npm run studio`، وافتحه للمستخدم، وأخبره باسم الـ composition وبالثواني التي يراجعها. مع النسخة الشفافة: زر الشطرنج (Checkerboard) في Studio يُظهر الشفافية.
4. عدّل حسب ملاحظاته، حتى يوافق.

## المرحلة 5: التصدير (بعد الموافقة فقط)
- **لا رندر** حتى يقول المستخدم «رندر» أو يوافق صراحة. الصور الثابتة مسموحة دائمًا.
- **بخلفية:** `npm run render -- --approved --id <Name>` ← `out/<Name>.mp4`.
- **بدون خلفية:** تأكّد أن `background: null`، ثم `npm run render -- --approved --id <Name> --alpha` ← ملفان:
  - `out/<Name>-alpha.mov` (ProRes 4444): لبرامج المونتاج مثل Premiere وFinal Cut وDaVinci Resolve.
  - `out/<Name>-alpha.webm` (VP9): للمواقع ولمشاريع Remotion.
  - اشرح له أن MP4 لا يحفظ الشفافية، ولهذا الصيغتان.
- **النسختان:** رندر بالخلفية أولًا، ثم اجعل `background: null` ورندر الشفافة.
- **4K:** أضف `--scale 2`.
- أخبر المستخدم بمكان الملفات، وبأي ملف يستخدم في أي برنامج.

## قواعد
- لا تعدّل `logo/reference/` ولا `gallery/` ولا ملفات السكيل.
- عند الشك في اختيار صغير: اختر الأبسط والأقرب لمثال الستايل في المعرض، واذكره في رسالة التسليم.

</div>

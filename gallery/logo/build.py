# Builds the logo-animation styles gallery (one HTML file) and the skill's style recipes from the same data:
#   gallery/logo/index.html                                  (videos in gallery/logo/videos/)
#   .agents/skills/logo-animation/references/styles.md
# The page is also a reference for AI agents: a user can hand it to any agent and say which style they want.
#
#   python3 gallery/logo/build.py
#   python3 gallery/logo/build.py --out "<lesson>/ستايلات تحريك الشعار.html" --vid "ستايلات الشعار - فيديو" --alpha "بدون خلفية/L08-LightSweep-Alpha.webm"
import argparse, base64, html, json
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parent.parent
REPO_URL = "https://github.com/motalim-ai/motion-starter-kit"
PAGE_URL = "https://motalim-ai.github.io/motion-starter-kit/gallery/logo/"
SKILL = ".agents/skills/logo-animation/SKILL.md"
REF = "logo/reference/motalim/styles"

SND = {
    "pen": "قلم", "marker": "ماركر", "tick": "تكّة", "click": "نقرة", "snap": "طقّة", "pop": "فرقعة", "pop_hi": "فرقعة خفيفة", "pop_lo": "فرقعة عميقة",
    "whoosh": "سحبة هواء", "whoosh_hi": "سحبة سريعة", "whoosh_long": "سحبة طويلة", "slide": "انزلاق", "type": "كتابة", "hit": "ضربة", "impact": "ضربة سينمائية",
    "thud": "ارتطام", "boing": "زنبرك", "stretch": "تمطّط", "shimmer": "بريق", "sparkle": "لمعات", "chime": "نغمة الشعار", "swell": "تصاعد هادئ",
    "liquid": "سائل", "bubbles": "فقاعات", "magic": "سحر", "flap": "قلبة", "spin": "دوران", "reverse": "سحبة عكسية", "riser": "تصاعد", "swirl": "دوّامة",
    "glitch": "تشويش رقمي", "glitch_short": "تشويش قصير", "zap": "صعقة", "neon_on": "اشتعال نيون", "neon_hum": "طنين نيون",
}

FAMS = [
    {"key": "draw", "name": "رسم وكتابة", "color": "#FF4F5C", "title": "الشعار يُرسم أمامك.", "sub": "خط أو قلم يرسم الشعار، ثم يمتلئ باللون."},
    {"key": "build", "name": "تجميع وتحوّل", "color": "#EE702E", "title": "قطع تتجمّع، وأشكال تتحوّل.", "sub": "الشعار يتكوّن من أجزائه، أو من شكل بسيط يتحوّل إليه."},
    {"key": "reveal", "name": "كشف وإضاءة", "color": "#FFB300", "title": "الشعار ينكشف.", "sub": "سائل، أو شرائط ألوان، أو ضوء يكشف الشعار."},
    {"key": "type", "name": "حروف وحركة", "color": "#00B6FF", "title": "الحروف تتحرك، والشعار له روح.", "sub": "حركة مرحة: حروف تقفز، ومطاط، وشخصية."},
    {"key": "fx", "name": "أبعاد ومؤثرات", "color": "#0056D2", "title": "أبعاد ومؤثرات قوية.", "sub": "ثلاثي الأبعاد، وجزيئات، وتشويش رقمي، ونيون."},
    {"key": "brand", "name": "عرض الهوية", "color": "#2EA57C", "title": "الشعار في عالمه.", "sub": "أفلام قصيرة تقدّم الهوية كاملة: الشعار يولد أمامك، ثم يظهر في عالمه."},
]

# id, family, Arabic name, English name, fits, what you see, sounds, Pinterest search, poster second, duration, default background, reference file
S = [
    ("L01-LineDraw", "draw", "رسم الخطوط", "Line draw", "الشعارات الأنيقة، والمقدّمات التعليمية الهادئة.", "قلم بسنٍّ مضيء يرسم حدود الشعار جزءًا بعد جزء، ثم يمتلئ اللون من مركز الرمز، وتتلوّن الكلمة من اليمين.", ["pen", "whoosh_hi", "tick", "hit", "chime"], "logo animation line draw", 1.5, 6, "فاتحة", "L01LineDraw.tsx"),
    ("L02-Handwriting", "draw", "الكتابة بالقلم", "Handwriting reveal", "الشعارات النصية، والخط العربي خصوصًا.", "قلم رفيع يمرّ على الشعار كله: يرسم الرمز فيمتلئ الحبر داخله، ثم يكتب الكلمة على هيكل حروفها من اليمين إلى اليسار، وينقّط التشكيل، ويكتب الجملة.", ["pen", "slide", "marker", "tick", "chime"], "logo animation handwriting", 3.4, 8.4, "فاتحة", "L02Handwriting.tsx"),
    ("L03-Assembly", "build", "تجميع الأجزاء", "Logo assembly", "الشعارات المكوّنة من قطع واضحة.", "الرمز ينفتح، وأجزاؤه الداخلية تخرج منه وتسقط فوقه بنطّة، ثم تخرج الكلمة من خلف الرمز وتسقط النقاط في أماكنها.", ["pop_lo", "snap", "thud", "slide", "type", "chime"], "logo assembly animation", 1.7, 6, "فاتحة", "L03Assembly.tsx"),
    ("L04-Morph", "build", "التحوّل", "Shape morph", "العلامات الذكية والتقنية.", "نقطة تتحوّل إلى مربع ثم إلى شكل الرمز، ونقطة أخرى تصير الجزء الداخلي، ثم يُرسم خط متموّج تنهض منه الحروف بشكلها الحقيقي من اليمين إلى اليسار.", ["pop", "stretch", "whoosh", "magic", "chime"], "logo morph animation", 2.55, 6, "فاتحة", "L04Morph.tsx"),
    ("L05-Geometric", "build", "أشكال هندسية", "Geometric build", "الشركات والمنصات المنظّمة.", "أربعة أرباع ملوّنة تدور وتبني الرمز ثم تتوحّد بلونه، والكلمة تنكشف بأعمدة متتالية، وأشكال هندسية تطفو حولها.", ["snap", "shimmer", "flap", "type", "hit", "chime"], "geometric logo animation", 0.8, 6, "فاتحة", "L05Geometric.tsx"),
    ("L06-LiquidFill", "reveal", "السائل الذي يملأ", "Liquid fill", "المنتجات، وأي فكرة عن الامتلاء والنمو.", "سائل يُصبّ في رمز فارغ ويرتفع بموجتين وفقاعات، ثم يسقط جزء فيه برذاذ، وتمتلئ الكلمة كالحبر.", ["liquid", "bubbles", "pop_lo", "slide", "chime"], "liquid logo animation", 1.2, 6, "فاتحة", "L06LiquidFill.tsx"),
    ("L07-MaskWipe", "reveal", "المسح بالألوان", "Mask wipe", "الإعلانات السريعة، ومقدّمات البرامج.", "شرائط مائلة بألوان الهوية تعبر الشاشة بسرعة وتكشف الرمز، ثم تنكشف الكلمة بمسحة يركبها شريط ملوّن.", ["whoosh_hi", "slide", "hit", "pop_hi", "chime"], "logo reveal mask wipe", 0.65, 6, "فاتحة", "L07MaskWipe.tsx"),
    ("L08-LightSweep", "reveal", "اللمعة", "Light sweep", "العلامات الفاخرة والمقدّمات السينمائية.", "الشعار يظهر بهدوء على خلفية نظيفة، ثم يعبره شريط ضوء مائل واحد من اليمين إلى اليسار، فيلمع على الحروف كالفضة وعلى الرمز بلون أفتح، ثم يستقر.", ["swell", "whoosh_hi", "shimmer", "chime"], "logo light sweep shine", 1.85, 6, "فاتحة", "L08LightSweep.tsx"),
    ("L09-Kinetic", "type", "حرفًا بعد حرف", "Kinetic typing", "الأسماء والكلمات، والشعارات النصية.", "الكلمة تُكتب كأنها على لوحة مفاتيح: مؤشّر يومض، وكل ضغطة تُظهر حرفًا كاملًا متصلًا بما قبله، ثم التشكيل، ثم الجملة، ثم يظهر الرمز كأنك ضغطت Enter.", ["click", "tick", "type", "pop_lo", "chime"], "typing text logo animation", 1.2, 6, "فاتحة", "L09Kinetic.tsx"),
    ("L10-Elastic", "type", "المطاطي", "Elastic / jelly", "العلامات المرحة، ومحتوى الأطفال.", "خيط مطاطي يتمطّط ثم ينقطع، فتنهض منه الكلمة قطعةً واحدة متصلة وتهتز كالجيلي في موجة من اليمين إلى اليسار، ثم لمسة صغيرة تهزّ الرمز من جديد.", ["stretch", "snap", "boing", "thud", "chime"], "elastic logo animation", 1.2, 6, "فاتحة", "L10Elastic.tsx"),
    ("L11-Character", "type", "الشعار شخصية", "Logo as a character", "التعليم، ومحتوى الأطفال، والعلامات الودودة.", "الرمز يقفز كالكرة، ثم تظهر له عينان، ويرفع جزءه العلوي تحيّةً، ويرتّب الكلمة والتشكيل بجانبه، ثم يعود شعارًا.", ["boing", "thud", "pop_hi", "tick", "pop", "chime"], "character logo animation", 2.85, 6, "فاتحة", "L11Character.tsx"),
    ("L12-Flip3D", "fx", "قلبة 3D", "3D flip", "المقدّمات القوية والإعلانات.", "الرمز يأتي من العمق ويدور كعملة سميكة حتى يستقر أمامك، ثم تنقلب الكلمة كبطاقة، وتسقط الجملة كلمة كلمة.", ["spin", "reverse", "impact", "flap", "chime"], "3d logo flip animation", 1.85, 6, "داكنة", "L12Flip3D.tsx"),
    ("L13-Particles", "fx", "الجزيئات", "Particles", "التقنية والذكاء الاصطناعي.", "جزيئات صغيرة تدور كمجرّة، ثم تتجمّع على حدود الشعار نقطةً نقطة، وومضة تكشفه كاملًا.", ["swirl", "riser", "impact", "sparkle", "chime"], "particles logo reveal", 2.6, 6, "داكنة", "L13Particles.tsx"),
    ("L14-Glitch", "fx", "Glitch", "Glitch", "التقنية والألعاب.", "مؤشّر يومض، ثم يظهر الشعار بتشويش رقمي: شرائح منزاحة وانقسام ألوان، وكل مرة أهدأ من سابقتها، حتى يستقر نظيفًا.", ["tick", "glitch", "glitch_short", "zap", "hit"], "glitch logo animation", 1.0, 6, "داكنة", "L14Glitch.tsx"),
    ("L15-Neon", "fx", "النيون", "Neon", "الأجواء الليلية والترفيه.", "أنابيب نيون مطفأة على جدار مظلم، تشتعل بالترتيب برجفة حقيقية، ثم ينقطع التيار لحظة، ويعود ويضيء الشعار بألوانه.", ["neon_on", "neon_hum", "zap", "chime"], "neon logo animation", 2.2, 6, "داكنة", "L15Neon.tsx"),
    ("L16-Hero", "brand", "الهيرو", "Brand hero", "تقديم هوية جديدة، وافتتاحية القناة أو الموقع.", "شرائط زجاجية بعرض خطوط الرمز تتقاطع، وقوس سماوي يدور، فيولد الرمز من التقاطعات في حركة كاميرا واحدة، ثم تنكشف الكلمة. بعدها قطع سريع على الشعار في صور حقيقية: موبايل، وهودي، وكروت، وبوستر، وورق محفور، ونوتة.", ["swell", "whoosh_hi", "spin", "hit", "shimmer", "flap", "chime"], "logo reveal brand identity mockup", 2.75, 12.4, "داكنة", "L16Hero.tsx"),
    ("L17-Canvas", "brand", "لوحة التصميم", "Design canvas", "المنصات التقنية وأدوات التصميم، وتقديم الهوية بروح عصرية.", "ماوس يرسم الرمز على لوحة زرقاء: يسحب دائرة، ويشدّ مستطيلًا فيصير كوبًا، وخطًا فيصير قبعة. ثم شريط تعبئة، وأجزاء تتفكك على خطوط إرشاد مع قائمة، ورمز مجسّم يدور أبيض ثم زجاجيًا، والشعار على ورق مربعات بخطوط القياس، وكروت الألوان، والرمز قزحي، وعلى هودي يحدّده الماوس.", ["click", "slide", "snap", "whoosh", "spin", "flap", "shimmer", "chime"], "brand identity motion design system", 6.2, 17.4, "زرقاء", "L17Canvas.tsx"),
]

# How to build each style, for the agent. Group names (mark, word, dots, tag) are the ones in logo/src/groups.ts.
# skel: the style needs the letter skeleton of the word (npm run skeleton) when the word is Arabic or handwritten.
R = {
    "L01-LineDraw": {
        "skel": False,
        "steps": [
            "من الإطار 0: خطوط إرشاد باهتة (شبكة أو دوائر رفيعة) حتى لا تبدأ الشاشة فارغة.",
            "ارسم حدود كل جزء بـ `draw` في `PartStyle` (يعتمد على evolvePath): خط بلون الجزء وسُمكه نحو 1.4 وحدة شعار، بالترتيب: الرمز، ثم الكلمة، ثم النقاط، ثم الجملة، مع تداخل 40 إلى 120 ملي ثانية بين الأجزاء.",
            "ضع سنًّا مضيئًا صغيرًا (دائرة بتوهّج خفيف) على طرف الخط الذي يُرسم الآن، بنقطة من `getPointAtLength`.",
            "التعبئة: الرمز يمتلئ من مركزه (دائرة قص تكبر)، والكلمة تتلوّن من اليمين إلى اليسار (مستطيل قص يتحرك).",
            "نطّة خفيفة (1.02) عند الاكتمال، ثم ثبات على الشعار الأصلي.",
        ],
        "needs": "أجزاء الشعار فقط.",
        "avoid": ["خط سميك يغطي تفاصيل الحروف الصغيرة.", "رسم الأجزاء كلها في وقت واحد: الترتيب هو ما يجعلها تبدو مرسومة."],
    },
    "L02-Handwriting": {
        "skel": True,
        "steps": [
            "اصنع هيكل الحروف بأرقام أجزاء الكلمة والجملة في شعار المستخدم، مثل: `npm run skeleton -- --group word=p8 --group tag=p9-p24`. وتحقّق منه بصورة `Skeleton`. أضف مجموعة لكل جزء من الرمز يُرسم كخط.",
            "`plan(group, start, speed)` في `src/strokes.ts` يعطي حركات القلم بالزمن: رسم أو رفع. السرعة نحو 440 وحدة/ثانية للكلمة، و760 للجملة، والرفع أسرع.",
            "الكشف: قناع (mask) فيه خطوط بيضاء على مسار كل حركة، بعرض `half × 2 + 2.4`، مع strokeDasharray يكبر مع الزمن. الشكل الحقيقي يظهر من خلال القناع، فتبدو الحروف مكتوبة بسُمكها الحقيقي.",
            "القلم رفيع (نحو 4.6 بكسل عرضًا) ومائل، ويتبع `pointAt` على الحركة الحالية، ويرتفع قليلًا في حركات الرفع.",
            "الرمز: حدّه يُرسم بخط حبر، ثم يمتلئ لونه من مركزه. الأجزاء الداخلية تُكتب بحبر بلونها.",
            "النقاط والتشكيل: القلم يقفز إليها بعد الكلمة، وكل نقطة تظهر بـ spring.",
            "الكاميرا تتبع القلم بتكبير نحو 1.4، ثم تنفتح على الشعار كاملًا في النهاية. القناع يصبح مصمتًا لينتهي بالشكل الأصلي تمامًا.",
        ],
        "needs": "هيكل الكلمة والجملة (`npm run skeleton`).",
        "avoid": ["قلم يمرّ على جزء من الكلمة فقط: القلم يمرّ على الشعار كله والكلمة كاملة.", "قلم سميك.", "كشف الكلمة بمسحة مستقيمة بدل الكتابة على الهيكل."],
    },
    "L03-Assembly": {
        "skel": False,
        "steps": [
            "الشكل الخلفي للرمز يكبر من نقطة بـ spring (damping نحو 11).",
            "الأجزاء الداخلية تخرج من تحت أو تسقط من فوق وتستقر بنطّة. اقصصها بالشكل الخلفي (`clip`) حتى لا تظهر خارجه.",
            "الكلمة تنزلق من خلف الرمز: قصّ (`clip`) يخفي ما يقع فوق الرمز أثناء الانزلاق.",
            "النقاط تسقط في أماكنها واحدة بعد الأخرى من اليمين، ثم الجملة تظهر قطعة قطعة.",
        ],
        "needs": "أجزاء الرمز منفصلة (الشكل الخلفي والأجزاء الداخلية).",
        "avoid": ["أجزاء داخلية تظهر خارج حدود الرمز.", "الكلمة تمرّ فوق الرمز وهي تنزلق."],
    },
    "L04-Morph": {
        "skel": True,
        "steps": [
            "`morph(a, b, k)` في `src/morph.ts` يحوّل شكلًا مقفولًا إلى آخر بعيّنات نقاط متساوية. لا تستخدم interpolatePath (يفشل حين يختلف عدد النقاط).",
            "نقطة في الوسط تتمطّط إلى مربع ناعم، ثم إلى الشكل الخلفي للرمز في مكانه.",
            "داخل الرمز: نقطة تصير الجزء الداخلي. الأشكال التي فيها أكثر من كونتور (شكل بفتحة) تنمو بـ `grow(d, k)`.",
            "الكلمة: خط متموّج، ثم نقاط هيكل الحروف تنهض من الموجة من اليمين إلى اليسار وتُرسم خطوطًا بسُمك الحرف، ثم تتلاشى إلى الشكل الحقيقي.",
            "النقاط والتشكيل تظهر من نقاط صغيرة.",
        ],
        "needs": "هيكل الكلمة (`npm run skeleton`).",
        "avoid": ["تحويل الكلمة العربية من شكل لا علاقة له بها: النتيجة سيئة جدًا. ابنِها من هيكلها.", "خط مائل يظهر داخل شكل له فتحة (استخدم grow)."],
    },
    "L05-Geometric": {
        "skel": False,
        "steps": [
            "من الإطار 0: شبكة خطوط باهتة وأشكال هندسية صغيرة تطفو.",
            "الشكل الخلفي للرمز يُبنى من 4 أرباع (قصّ بأربعة أرباع) بأربعة ألوان من الهوية، تدور وتقفل، ثم تتوحّد بلون الرمز الأصلي.",
            "الأجزاء الداخلية تخرج، وجزء ينقلب في مكانه (scaleX من -1 إلى 1).",
            "الكلمة تنكشف بأعمدة رأسية متتالية (مستطيلات قص) من اليمين إلى اليسار، ثم الجملة.",
        ],
        "needs": "أجزاء الشعار فقط.",
        "avoid": ["ألوان من خارج هوية الشعار."],
    },
    "L06-LiquidFill": {
        "skel": False,
        "steps": [
            "حدّ الرمز يظهر فارغًا.",
            "شلال من فوق (مسار عرضه يتغيّر بضجيج ناعم `noise1`) يصبّ في الرمز.",
            "المستوى يرتفع بموجتين (مجموع جيبين) داخل قصّ بشكل الرمز، مع فقاعات صغيرة (`rnd`)، ثم يهدأ.",
            "جزء داخلي يسقط في السائل برذاذ قطرات، ثم يستقر.",
            "الكلمة تمتلئ كالحبر من اليمين (قصّ بحافة متموّجة)، ثم النقاط، ثم الجملة.",
        ],
        "needs": "شكل مقفول كبير في الرمز يُملأ.",
        "avoid": ["سائل يخرج من حدود الشكل.", "حركة ماء خطية بلا تسارع."],
    },
    "L07-MaskWipe": {
        "skel": False,
        "steps": [
            "3 شرائط مائلة بألوان من الهوية تعبر الشاشة من اليمين إلى اليسار، بينها 80 ملي ثانية تقريبًا.",
            "الرمز يظهر خلف آخر شريط.",
            "الكلمة تنكشف بمسحة مائلة (قصّ بمضلّع) يركبها شريط ملوّن رفيع على حافتها.",
            "النقاط تظهر، ثم الجملة بشريط رفيع.",
        ],
        "needs": "أجزاء الشعار فقط.",
        "avoid": ["قناع الكلمة يغطي الرمز: ارسمه بعد ظهور الكلمة فقط."],
    },
    "L08-LightSweep": {
        "skel": False,
        "steps": [
            "الكود جاهز: `logo/src/styles/LightSweep.tsx`، ويعمل مع أي شعار دون تقسيم.",
            "خلفية فاتحة نظيفة (تدرّج دائري ناعم)، والشعار يظهر بهدوء (شفافية وبلور خفيف).",
            "شريط ضوء واحد مائل (22°) مقصوص بأشكال الشعار فقط، بمزج screen، ووراءه خط لامع رفيع. يعبر من اليمين إلى اليسار في نحو 1.5 ثانية بسرعة شبه ثابتة.",
            "توهّج خفيف خلف الشعار يتبع الشريط (مع الخلفية فقط)، و«تنفّس» 1.2% أثناء العبور، ثم ثبات.",
        ],
        "needs": "لا شيء.",
        "avoid": ["خلفية مزدحمة أو داكنة بلا سبب.", "لمعات كثيرة أو شرائط متعددة: شريط واحد فقط.", "لمعة خارج حدود الشعار."],
    },
    "L09-Kinetic": {
        "skel": False,
        "steps": [
            "مؤشّر يومض عند بداية الكلمة (يمينها في العربية).",
            "الكلمة لا تُقطّع ولا تتحرك قطعها: تنكشف بقصّ (مستطيل) يتوقف عند نقاط الوصل بين الحروف. حدّد هذه النقاط (قيم x على خط الوصل الرفيع) من صورة `Parts`، مثل `CUTS = [300, 222, 165, 112, 68, -15]`.",
            "كل ضغطة تكشف حرفًا كاملًا متصلًا بما قبله، والحرف الجديد يلمع بلون مميز لحظة، والمؤشّر يقفز إلى حافة القص.",
            "ثم النقاط والتشكيل، ثم الجملة بسرعة، ثم «Enter»: الرمز يظهر بنبضة.",
        ],
        "needs": "نقاط الوصل بين الحروف (من صورة Parts).",
        "avoid": ["تقسيم الكلمة العربية إلى حروف منفصلة تتحرك: الحروف العربية متصلة.", "قصّ في منتصف حرف."],
    },
    "L10-Elastic": {
        "skel": True,
        "steps": [
            "خيط مطاطي رفيع (منحنى) يتمطّط ثم ينقطع.",
            "الكلمة قطعة واحدة: ارسم نقاط هيكلها خطوطًا بسُمك الحرف (`half × 2`)، وحرّك كل نقطة بموجة نابض تخمد (إزاحة y = سعة × جيب × خمود) تبدأ من اليمين وتمشي إلى اليسار، ثم تتلاشى إلى الشكل الحقيقي.",
            "الرمز: ضغط ومطّ (scaleX وscaleY) بـ spring.",
            "في النهاية لمسة على الرمز فيهتز مرة أخرى بخفة، ثم ثبات.",
        ],
        "needs": "هيكل الكلمة (`npm run skeleton`).",
        "avoid": ["تقطيع الكلمة إلى شرائح تهتز كلٌّ وحدها.", "فيزياء مبالغ فيها: السعة خفيفة."],
    },
    "L11-Character": {
        "skel": False,
        "steps": [
            "الرمز يطلّ من حافة الكادر، ثم يقفز إلى مكانه بقوس وثلاث نطّات تتناقص، مع ضغط ومطّ وظلّ يكبر ويصغر.",
            "تظهر له عينان (بيضاويان) تنفتحان وترمشان، وجزؤه العلوي يرتفع كتحية، وينظر نحو الكلمة.",
            "الكلمة تظهر بزنبرك، والنقاط تسقط واحدة واحدة، والجملة تزحف.",
            "نطّة رضا، والعينان تُغلقان وتختفيان، فيعود الشعار الأصلي تمامًا.",
        ],
        "needs": "رمز له شكل جسم (دائرة أو مربع).",
        "avoid": ["أن يبقى للرمز عينان في الإطار الأخير."],
    },
    "L12-Flip3D": {
        "skel": False,
        "steps": [
            "خلفية داكنة مع بقعة ضوء تدور ببطء. حوّل النص الأسود إلى أبيض (`CONFIG.recolor`).",
            "الـ 3D كله CSS: perspective وpreserve-3d. الرمز ميدالية سميكة: وجه أمامي وخلفي، وحافة من شرائح (96 للدائرة) كل شريحة مضاءة حسب زاويتها.",
            "الرمز يأتي من العمق ويدور حول محور Y (لفّتان وربع) ويهدأ، ويستقر بارتداد صغير ولمعة.",
            "الكلمة تقوم كبطاقة على مفصلة (rotateX من 90°)، والنقاط تطقطق، والجملة تنقلب كلمة كلمة.",
            "سحبة reverse تنتهي تمامًا لحظة الاستقرار.",
        ],
        "needs": "أجزاء الشعار، وكلمات الجملة كمجموعات.",
        "avoid": ["رمز رقيق بلا سُمك: الحافة هي ما يعطي الإحساس بالعمق."],
    },
    "L13-Particles": {
        "skel": False,
        "steps": [
            "خلفية داكنة عميقة. 250 جزيئًا على الأكثر، ولكلٍّ منها نقطة هدف على حدود الشعار (`getPointAtLength` موزّعة حسب طول كل جزء).",
            "الجزيئات تعوم، ثم تُسحب إلى دوّامة مائلة حول وسط الكادر.",
            "كل جزيء يفلت من الدوّامة وينزل على نقطته (الرمز أولًا، ثم الكلمة، ثم الجملة)، وخيط رفيع يصل النقاط.",
            "النقاط تشحن ضوءًا، ثم ومضة ناعمة: الشعار الصلب يظهر من اليمين إلى اليسار، والنقاط تذوب فيه، والباقي يتفرّق، وحلقة ضوء من الرمز.",
        ],
        "needs": "أجزاء الشعار فقط.",
        "avoid": ["آلاف العناصر (الرندر يبطؤ جدًا).", "Math.random: استخدم rnd(seed) الثابت."],
    },
    "L14-Glitch": {
        "skel": False,
        "steps": [
            "شاشة داكنة: سطور مسح أفقية، وشريط مسح يعبر، ونقاط ضجيج، ومؤشّر يومض ثم يتمدّد إلى خط.",
            "الشعار يظهر بدفعات تشويش: شرائح أفقية عبر الشعار كله مزاحة أفقيًا (`rnd(seed + frame)` ثابت)، وانقسام ألوان (نسختان بلونين بمزج screen)، وكتل بيانات.",
            "كل دفعة أهدأ من سابقتها، ثم صعقة قوية، ثم ثبات نظيف على الشعار الأصلي، مع رجفة صغيرة واحدة في الجملة.",
        ],
        "needs": "أجزاء الشعار فقط.",
        "avoid": ["تشويش يستمر حتى النهاية: الثانية ونصف الأخيرة نظيفة.", "ومضات سريعة جدًا ومزعجة للعين."],
    },
    "L15-Neon": {
        "skel": False,
        "steps": [
            "جدار داكن، وأنابيب زجاج مطفأة: حدود الأجزاء بخط باهت.",
            "كل أنبوب يشتعل بالترتيب برجفة حقيقية (تسلسل ثابت من التشغيل والإطفاء)، والتوهّج نسخ من الخط ببلور 12 على الأكثر.",
            "الرمز، ثم الكلمة والنقاط، ثم الجملة. ثم صعقة ورجفة في الإشارة كلها.",
            "الألوان تمتلئ داخل الأنابيب، فيظهر الشعار الأصلي بهالة خفيفة، وطنين هادئ حتى النهاية.",
        ],
        "needs": "أجزاء الشعار فقط.",
        "avoid": ["توهّج قوي يمحو شكل الحروف.", "مرشّحات بلور كثيرة (الرندر يبطؤ)."],
    },
    "L16-Hero": {
        "skel": False,
        "vertical": "L16-Hero-Vertical",
        "steps": [
            "حلّل هندسة الرمز: لكل خط مستقيم فيه شريط طويل بعرض الخط نفسه يمرّ في منتصفه، ولكل منحنى حلقة بعرضه. هذه الشرائط هي التي يولد منها الرمز.",
            "الشريط: مستطيل طويل جدًا بتعبئة بيضاء شفافة (7.5%)، وحافتين رفيعتين أوضح (32%)، بمزج screen فيضيء التقاطع وحده. الشرائط تدخل بالتتابع (0.25 ثانية بينها) بانزلاق عمودي عليها وميل صغير يستقر.",
            "قطعة منحنية بلون مميز (قوس 70° على إحدى الحلقات) بتوهّج خفيف: في البداية تملأ الكادر تقريبًا، ثم تدور لفّة ونصفًا وتستقر في مكانها من الرمز.",
            "كاميرا واحدة متصلة: تكبير على مقياس لوغاريتمي من 6 إلى 1، والتركيز ينتقل من القطعة إلى الرمز ثم إلى الشعار كله. لا قفزات.",
            "أجزاء الرمز تظهر فضية حيث تتقاطع الشرائط، ثم لحظة الاكتمال: ومضة خفيفة، والشكل الخلفي يمتلئ بلونه من مركزه، والشرائط تختفي.",
            "الكلمة تنكشف كاملة بقناع بحافة ناعمة من اليمين إلى اليسار (`mask` في `PartStyle`)، ثم الجملة.",
            "قطع على خلفية فاتحة (0.6 ثانية)، ثم صور الموكاب: 0.8 ثانية لكل صورة، مع دفع كاميرا 4.5% حول الشعار. الصورة تملأ الكادر (cover) حول نقطة تركيز، فتعمل في العرضي والطولي.",
            "التركيب على الصور: على الأسطح الفاتحة الشعار بمزج multiply فيظهر ملمس السطح عليه، وعلى الورق الداكن محفور بظلّين (فاتح أعلى اليسار وداكن أسفل اليمين)، وعلى النوتة خطوط رصاص مع خطوط الإنشاء. شاشة الموبايل الخضراء تُزال بمرشح feColorMatrix، وتحتها شاشة التطبيق.",
            "الختام: الشعار على الخلفية الداكنة 2.6 ثانية.",
        ],
        "needs": "صور موكاب فاضية مربعة من المستخدم أو من مولّد صور (البرومبتات في `.agents/skills/logo-animation/references/mockups.md`)، وقياس هندسة الرمز (عرض خطوطه ومراكز منحنياته).",
        "avoid": ["خطوط رفيعة كالرسم الهندسي بدل الشرائط العريضة: النتيجة تبدو درسًا لا فيلمًا (رُفضت).", "موكاب مرسوم بالكود (موبايل أو كروت من CSS): يبدو رخيصًا (رُفض). استخدم صورًا حقيقية.", "كاميرا بقفزات تكبير منفصلة.", "توهّج قوي أو ومضة بيضاء كبيرة."],
    },
    "L17-Canvas": {
        "skel": False,
        "vertical": "L17-Canvas-Vertical",
        "steps": [
            "لغة برامج التصميم: ماوس أصفر، ومربعات تحديد بأربعة مقابض بيضاء، وخطوط إرشاد رفيعة، وشبكة خفيفة، وقائمة داكنة بعناصر قليلة («انطلاق» مظلّل بلون الهوية). كل ضغطة ماوس عليها صوت click.",
            "الرسم على لوحة بلون الهوية: الماوس يسحب كل شكل من ركن إلى ركن (شكل أبيض شفاف بحد رفيع داخل مربع تحديد)، ثم يحوّله: مستطيل تُدوَّر قاعدته فيصير U ثم يتلاشى إلى الشكل الحقيقي، وخط يُشدّ من منتصفه فيصير زاوية ثم الشكل الحقيقي. في النهاية تحديد أبيض حول الرمز كله.",
            "قطع على الأسود: شريط «التعبئة» تحت الرمز، والماوس يسحب المقبض من 0% إلى 100%، والرمز يمتلئ معه.",
            "الأجزاء تتفكك على خطوط إرشاد متقطعة (كل جزء على اتجاه هندسته)، وتظهر القائمة، والماوس يضغط «انطلاق»، فترجع الأجزاء بـ spring.",
            "خط نور: الرمز أبيض يطير قطريًا بذيل من نسخ مغبّشة، ثم مجسّم 3D بـ CSS (طبقات من الرمز بـ translateZ داخل preserve-3d) يدور: أبيض مطفي أولًا، ثم زجاج (وجه شفاف بحدود، وطبقات جانبية شبه شفافة، وتوهّج خفيف خلفه).",
            "صفحة المواصفات: الشعار على ورق مربعات بخطوط قياس (أعلى الحروف والخط الأساسي وحافة الرمز) وكلمة baseline صغيرة، والكلمة تنكشف بقناع ناعم من اليمين. ثم نفس اللقطة على شبكة بلون الهوية بشعار أبيض (الشكل الخلفي للرمز يصير أبيض والداخلي بلون الخلفية).",
            "قطعات سريعة (0.6 إلى 0.8 ثانية): الشعار صغير على لون الهوية، والكلمة ضخمة تعبر الكادر ورمز زجاجي فوقها، وكروت الألوان رأسية بأكوادها تصعد بـ spring، والرمز فاتح، والرمز بزجاج قزحي من ألوان الهوية، والرمز ستيكر على دائرة داكنة.",
            "صورة موكاب (هودي) والشعار عليها بمزج multiply، والماوس يحدّده وتفتح القائمة. ثم الختام: الشعار على لون الهوية 2.2 ثانية.",
        ],
        "needs": "أجزاء الرمز وأشكالها البسيطة (دائرة، ومستطيل، وخط)، وصورة موكاب واحدة على الأقل (انظر `references/mockups.md`)، وأكواد ألوان الهوية.",
        "avoid": ["تقطيع الكلمة العربية حرفًا حرفًا مثل الكتابة اللاتينية في المرجع: الكلمة تنكشف كاملة بقناع ناعم، أو تعبر ضخمة كاملة.", "رمز بلون الخلفية نفسه (دائرة زرقاء على أزرق): اعكس ألوانه على خلفية الهوية.", "ماوس صغير جدًا أو حركة ماوس خطية: الماوس يتحرك بتسارع ويضغط بوضوح.", "توهّج زجاج قوي يمحو الشكل."],
    },
}

data = []
for n, (i, fam, ar, en, use, look, snd, q, poster, dur, bg, ref) in enumerate(S):
    r = R[i]
    data.append({"id": i, "n": n + 1, "fam": fam, "ar": ar, "en": en, "use": use, "look": look, "sounds": snd, "snd": [SND[x] for x in snd], "q": q, "t": poster, "dur": dur, "bg": bg, "ref": f"{REF}/{ref}", **r})

esc = html.escape


def md_inline(s):
    # `code` -> <code>
    parts = s.split("`")
    return "".join(f"<code>{esc(p)}</code>" if k % 2 else esc(p) for k, p in enumerate(parts))


def card(s, vid):
    src = lambda ext: f"{vid}/{s['id']}.{ext}"
    vlink = f'<a class="lk" href="{esc(vid)}/{s["vertical"]}.mp4" target="_blank" rel="noopener">النسخة الطولية ↗</a>' if s.get("vertical") else ""
    steps = "".join(f"<li>{md_inline(x)}</li>" for x in s["steps"])
    avoid = "".join(f"<li>{md_inline(x)}</li>" for x in s["avoid"])
    skel = '<span class="tagx coral">يحتاج هيكل الحروف</span>' if s["skel"] else ""
    return f"""
    <article class="card" data-id="{s['id']}" data-t="{s['t']}">
      <div class="media">
        <video muted loop playsinline preload="metadata" poster="{esc(src('jpg'))}" src="{esc(src('mp4'))}"></video>
        <span class="num">{s['n']:02d}</span>
        <span class="play"></span>
        <span class="prog"><i></i></span>
      </div>
      <div class="cb">
        <div class="cb-top"><h3>{esc(s['ar'])}</h3><span class="en ltr">{esc(s['en'])} · <span class="mono">{s['id']}</span></span></div>
        <p class="use"><b>يناسب:</b> {esc(s['use'])}</p>
        <p class="look"><b>الحركة:</b> {esc(s['look'])}</p>
        <div class="snds">{''.join(f'<span>{esc(x)}</span>' for x in s['snd'])}</div>
        <details class="recipe">
          <summary>للوكيل: طريقة البناء</summary>
          <div class="meta"><span class="tagx">المدة {s['dur']:g} ث</span><span class="tagx">الخلفية الافتراضية: {s['bg']}</span>{skel}</div>
          <ol>{steps}</ol>
          <p><b>يحتاج:</b> {md_inline(s['needs'])}</p>
          <p><b>تجنّب:</b></p><ul>{avoid}</ul>
          <p><b>الكود المرجعي:</b> <a class="ltr mono" href="{REPO_URL}/blob/main/{s['ref']}" target="_blank" rel="noopener">{s['ref']}</a></p>
        </details>
        <div class="links">
          <a class="lk" href="https://www.pinterest.com/search/pins/?q={esc(s['q'].replace(' ', '+'))}" target="_blank" rel="noopener">ابحث في Pinterest ↗</a>
          <a class="lk" href="{esc(src('mp4'))}" target="_blank" rel="noopener">الفيديو كاملًا ↗</a>{vlink}
        </div>
      </div>
    </article>"""


QUESTIONS = [
    ("الستايل", "أي ستايل من هذه الصفحة؟ (اسمه أو رقمه)"),
    ("الخلفية", "هل يريد الشعار <b>بخلفية بلون محدد</b> (وما اللون؟)، أم <b>بدون خلفية</b> (شفافًا) ليضعه فوق فيديوهاته، أم النسختين معًا؟"),
    ("ألوان الشعار", "إن كانت الخلفية داكنة، أو سيضع النسخة الشفافة فوق فيديو داكن: هل يتحوّل النص الأسود إلى الأبيض؟ أم عنده نسخة من الشعار للخلفيات الداكنة؟"),
    ("المدة", "اقترح مدة الستايل (6 ثوانٍ تقريبًا). من 3 إلى 8 ثوانٍ تكفي."),
    ("الصوت", "مؤثرات صوتية على لحظات الحركة، أم بدون صوت؟"),
    ("المقاس", "عرضي 16:9، أم طولي 9:16، أم مربع 1:1؟ وبدقة 1080p أم 4K؟"),
    ("الاستخدام", "أين سيضعه؟ بداية فيديو يوتيوب، أو موقع، أو ريلز. هذا يحدد صيغة التصدير."),
]

SPEC = {
    "about": "Logo animation styles for Remotion. A user hands this page to an AI agent and names a style; the agent builds the user's own logo in that style.",
    "repo": REPO_URL,
    "skill": SKILL,
    "project": "logo/",
    "steps": [
        "Clone the repo, read AGENTS.md, then follow .agents/skills/logo-animation/SKILL.md.",
        "Get the user's logo as SVG (logo/public/logo/logo.svg), run npm run split, look at the Parts still, name the groups in logo/src/groups.ts.",
        "Ask all questions once (below), in the user's language, with your suggestion for each. Do not ask what the user already said.",
        "Build the chosen style from its recipe and its reference file. Arabic words: never split into letters; use the letter skeleton (npm run skeleton).",
        "Open Remotion Studio for the user. Do not render until they approve.",
        "Export: with a background -> MP4. Without a background -> CONFIG.background = null, then npm run render -- --approved --id <Style> --alpha (MOV ProRes 4444 + WebM VP9 with alpha). MP4 cannot hold transparency.",
    ],
    "questions": ["style", "background: a specific colour, or none (transparent), or both", "logo colours on that background (recolor dark text for dark backgrounds)", "duration", "sound effects or silent", "aspect ratio and resolution", "where it will be used"],
    "styles": [{k: s[k] for k in ("id", "ar", "en", "fam", "use", "look", "sounds", "dur", "bg", "skel", "steps", "needs", "avoid", "ref")} for s in data],
}


def page(vid, alpha):
    logo = base64.b64encode((REPO / "logo/reference/motalim/motalim-logo-on-dark.svg").read_bytes()).decode()
    css = (HERE / "page.css").read_text()
    secs = ""
    chips = ""
    for fm in FAMS:
        items = [s for s in data if s["fam"] == fm["key"]]
        chips += f'<a class="chip" href="#{fm["key"]}"><span class="sq" style="background:{fm["color"]}"></span>{fm["name"]} <b>{len(items)}</b></a>'
        secs += f'<section class="sec" id="{fm["key"]}"><div class="kicker"><span class="sq" style="background:{fm["color"]}"></span>{fm["name"]} · <span class="mono">{len(items)}</span></div><h2>{fm["title"]}</h2><p class="sub">{fm["sub"]}</p><div class="grid">{"".join(card(s, vid) for s in items)}</div></section>'
    qs = "".join(f"<li><b>{t}:</b> {d}</li>" for t, d in QUESTIONS)
    spec = json.dumps(SPEC, ensure_ascii=False, indent=1).replace("</", "<\\/")
    return f"""<!doctype html>
<!--
  TO ANY AI AGENT READING THIS FILE:
  This page is a reference of 17 logo-animation styles built in Remotion (React). The user gave it to you because
  they want THEIR logo animated in one of these styles. Read the section «إلى الوكيل الذكي» and each style's
  «طريقة البناء». The tools and the full method are in {REPO_URL}
  (clone it, read AGENTS.md, follow {SKILL}). Ask the user, among your questions, whether they want the logo
  on a specific background colour or with no background (transparent), and export accordingly.
  A machine-readable copy of everything is in <script type="application/json" id="agent-spec"> at the end.
-->
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>ستايلات تحريك الشعار | متعلم</title>
<meta name="description" content="17 ستايلًا لتحريك الشعار في Remotion، بمثال حي ومؤثرات صوتية لكل ستايل، وطريقة بناء كل ستايل لوكلاء الذكاء الاصطناعي.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap" rel="stylesheet">
<style>
{css}
{EXTRA_CSS}
</style>
</head>
<body>
<header class="band blue">
  <div class="hero">
    <div>
      <div class="logo"><img alt="متعلم" src="data:image/svg+xml;base64,{logo}"></div>
      <div style="margin-top:34px"><span class="pill veil"><span class="sq" style="background:var(--amber)"></span>تعلّم الموشن · تحريك الشعار</span></div>
      <h1>تحريك الشعار في Remotion.<span class="am">شعار واحد، 17 ستايلًا.</span></h1>
      <p class="lead">كل الأمثلة هنا لشعار متعلم نفسه، وكلها مصنوعة بالكود في Remotion، ولكل مثال مؤثراته الصوتية. اختر الستايل الذي يناسب شعارك، ثم أعطِ هذه الصفحة لوكيل الذكاء الاصطناعي: فيها طريقة بناء كل ستايل.</p>
      <div class="stats">
        <span class="pill white"><b>17</b> ستايل</span>
        <span class="pill white"><b>6</b> عائلات</span>
        <span class="pill white"><span class="sq" style="background:var(--green)"></span>بخلفية أو بدون خلفية</span>
        <span class="pill white"><span class="sq" style="background:var(--coral)"></span>مرجع لوكلاء الذكاء الاصطناعي</span>
      </div>
    </div>
    <div class="stage">
      <div class="win">
        <div class="chrome"><i></i><i></i><i></i><span class="url mono">localhost:3000 · Remotion Studio</span></div>
        <video id="heroVid" muted loop playsinline autoplay preload="auto" src="{esc(vid)}/L16-Hero.mp4"></video>
      </div>
      <div class="float ok"><span class="dot">✓</span>نفس الشعار، 17 حركة</div>
      <div class="float prompt"><small>إلى الوكيل</small>هذا شعاري بصيغة SVG. حرّكه بستايل «الهيرو».</div>
    </div>
  </div>
</header>

<nav class="bar"><div class="bar-in">
  <div class="fams" id="fams">{chips}<a class="chip" href="#agent"><span class="sq" style="background:#000"></span>إلى الوكيل</a><a class="chip" href="#bg"><span class="sq" style="background:var(--green)"></span>الخلفية</a></div>
  <button class="snd-all" id="sndAll" aria-pressed="false">🔈 الصوت مع التشغيل</button>
</div></nav>

<main>
  <section class="sec agent" id="agent">
    <div class="kicker"><span class="sq" style="background:#000"></span>إلى الوكيل الذكي <span class="en ltr">· For AI agents</span></div>
    <h2>أعطاك المستخدم هذا الملف؟ <span class="hl">هو يريد شعاره متحركًا.</span></h2>
    <p class="sub">هذه الصفحة مرجع لتحريك الشعار في Remotion. اختار المستخدم ستايلًا منها (أو سيختار)، وطريقة بناء كل ستايل مكتوبة في بطاقته تحت «للوكيل: طريقة البناء».</p>
    <div class="agent-grid">
      <div class="box dark">
        <h4>الطريقة</h4>
        <ol>
          <li>الأدوات والطريقة كلها في الريبو. انسخه: <code class="ltr">git clone {REPO_URL}.git</code>، واقرأ <code>AGENTS.md</code>، ثم اتبع <code>{SKILL}</code> مرحلة بمرحلة. المشروع الجاهز في <code>logo/</code>.</li>
          <li>اطلب ملف الشعار بصيغة <b>SVG</b> إن لم يرسله، وضعه في <code>logo/public/logo/logo.svg</code>. ثم <code>npm run split</code>، وانظر إلى صورة <code>Parts</code> لتعرف الرمز والكلمة والنقاط والجملة.</li>
          <li><b>اسأل كل أسئلتك مرة واحدة</b> (القائمة المجاورة)، بلغة المستخدم وبكلام بسيط، مع اقتراحك لكل سؤال. لا تسأل عما قاله في طلبه.</li>
          <li>ابنِ الستايل بطريقته المكتوبة في بطاقته، وبالكود المرجعي المذكور فيها، على شعار المستخدم.</li>
          <li>الكلمة العربية لا تُقسَّم إلى حروف منفصلة أبدًا. الستايلات التي تكتبها أو تحرّكها تبنيها من <b>هيكل الحروف</b> (<code>npm run skeleton</code>).</li>
          <li>افتح <b>Remotion Studio</b> للمستخدم، و<b>لا ترندر</b> حتى يشاهد ويوافق.</li>
        </ol>
      </div>
      <div class="box">
        <h4>الأسئلة (مرة واحدة)</h4>
        <ol class="qs">{qs}</ol>
      </div>
    </div>
  </section>

  <section class="sec" id="bg">
    <div class="kicker"><span class="sq" style="background:var(--green)"></span>الخلفية والتصدير</div>
    <h2>بخلفية، أم بدون خلفية؟</h2>
    <p class="sub">اسأل المستخدم عن هذا دائمًا. الشعار الشفاف يوضع فوق أي فيديو أو صورة في برنامج المونتاج.</p>
    <div class="bg-grid">
      <div class="box">
        <h4><span class="sq" style="background:var(--offwhite);box-shadow:inset 0 0 0 1px var(--line-2)"></span> بخلفية بلون محدد</h4>
        <p>اللون في <code>logo/src/config.ts</code>: <code class="ltr">background: "#F3F2EE"</code>. اقترح لونًا من ألوان شعار المستخدم، أو الخلفية الافتراضية للستايل.</p>
        <p><b>التصدير:</b> <code class="ltr">npm run render -- --approved --id &lt;Style&gt;</code> ← ملف <b>MP4</b> جاهز للنشر.</p>
      </div>
      <div class="box">
        <h4><span class="sq checker"></span> بدون خلفية (شفاف)</h4>
        <p>اجعل <code class="ltr">background: null</code>: لا تُرسم الخلفية ولا الحبيبات ولا التظليل ولا التوهّج خلف الشعار.</p>
        <p><b>التصدير:</b> <code class="ltr">npm run render -- --approved --id &lt;Style&gt; --alpha</code> ← ملفان:</p>
        <ul>
          <li><b>MOV</b> (ProRes 4444): لبرامج المونتاج مثل Premiere وFinal Cut وDaVinci Resolve.</li>
          <li><b>WebM</b> (VP9): للمواقع ولمشاريع Remotion.</li>
        </ul>
        <p>ملف MP4 لا يحفظ الشفافية. وإن كان في الشعار نص أسود والفيديو الذي سيوضع فوقه داكن، فاقترح نسخة بنص أبيض (<code class="ltr">recolor: {{ "#000000": "#FFFFFF" }}</code>).</p>
      </div>
      <div class="box demo">
        <div class="alpha" id="alphaBox" data-bg="checker"><video muted loop playsinline autoplay preload="metadata" src="{esc(alpha)}"></video></div>
        <div class="bgs"><button data-bg="checker" aria-pressed="true">شفاف</button><button data-bg="light">فاتح</button><button data-bg="blue">أزرق</button><button data-bg="photo">فوق صورة</button></div>
        <p class="small">مثال: ستايل «اللمعة» بدون خلفية (WebM). متصفح Safari لا يعرض شفافية WebM؛ افتحه في Chrome أو Firefox.</p>
      </div>
    </div>
  </section>
  {secs}
</main>

<section class="band navy">
  <div class="desc">
    <span class="pill veil"><span class="sq" style="background:var(--amber)"></span>قبل أن تطلب</span>
    <h2>كيف تطلب تحريك شعارك <span class="am">من الذكاء الاصطناعي؟</span></h2>
    <p class="lead">أعطِ الوكيل (Claude Code أو Codex أو Antigravity) رابط الريبو أو هذه الصفحة، وشعارك بصيغة SVG، واسم الستايل. وهو يسألك الباقي.</p>
    <div class="four">
      <div class="c"><span class="n" style="color:var(--coral)">01</span><h4>ملف SVG</h4><p>الشعار بصيغة SVG، لا صورة PNG. فبه يستطيع الوكيل أن يحرّك كل جزء وحده.</p></div>
      <div class="c"><span class="n" style="color:var(--orange)">02</span><h4>الستايل</h4><p>اختر ستايلًا من هذه الصفحة باسمه أو رقمه.</p></div>
      <div class="c"><span class="n" style="color:var(--amber)">03</span><h4>الخلفية</h4><p>بلون محدد، أم بدون خلفية لتضعه فوق فيديوهاتك؟ أم النسختين؟</p></div>
      <div class="c"><span class="n" style="color:var(--green)">04</span><h4>المراجعة</h4><p>يفتح لك الوكيل Remotion Studio لتشاهد. ولا يرندر حتى تقول «رندر».</p></div>
    </div>
    <div class="ex-prompt"><small>مثال على الطلب</small><span class="ltr">{REPO_URL}</span><br>هذا شعاري بصيغة SVG. أريده متحركًا بستايل <mark>«اللمعة»</mark> من ملف ستايلات تحريك الشعار، <mark>بدون خلفية</mark> لأضعه فوق فيديوهاتي.</div>
    <div class="foot">
      <div class="logo"><img alt="متعلم" src="data:image/svg+xml;base64,{logo}"></div>
      <a class="ltr" href="{REPO_URL}" target="_blank" rel="noopener">github.com/motalim-ai/motion-starter-kit</a>
      <a class="ltr" href="https://www.youtube.com/@motalim-ai?sub_confirmation=1" target="_blank" rel="noopener">youtube.com/@motalim-ai</a>
    </div>
  </div>
</section>

<script type="application/json" id="agent-spec">
{spec}
</script>
<script>
{JS}
</script>
</body>
</html>
"""


EXTRA_CSS = """
code{font-family:"IBM Plex Mono",ui-monospace,monospace;font-size:.86em;background:var(--offwhite);border-radius:6px;padding:1px 6px;direction:ltr;unicode-bidi:isolate;display:inline-block;max-width:100%;overflow-wrap:anywhere;line-height:1.5;vertical-align:middle}
.hl{color:var(--blue)}
.agent h2 .hl{display:block}
.agent-grid{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(0,1fr);gap:14px}
.bg-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
.box{background:#fff;border-radius:28px;box-shadow:var(--shadow-card);padding:22px 24px;font-size:16px;line-height:1.8;color:var(--ink-2)}
.box h4{margin:0 0 10px;font-size:20px;color:var(--ink);display:flex;align-items:center;gap:9px}
.box ol,.box ul{margin:0;padding-inline-start:22px}
.box li{margin:4px 0}
.box p{margin:8px 0}
.box b{color:var(--ink)}
.box.dark{background:#000;color:rgba(255,255,255,.86);box-shadow:none}
.box.dark h4,.box.dark b{color:#fff}
.box.dark code{background:rgba(255,255,255,.14);color:#fff}
.qs li::marker{color:var(--blue);font-weight:700}
.sq.checker{background:repeating-conic-gradient(#cfd5dd 0 25%,#fff 0 50%) 0 0/8px 8px;box-shadow:inset 0 0 0 1px var(--line-2)}
.demo{display:flex;flex-direction:column;gap:10px;padding:12px}
.alpha{aspect-ratio:16/9;border-radius:18px;overflow:hidden;transition:background .3s var(--ease)}
.alpha video{width:100%;height:100%;display:block}
.alpha[data-bg=checker]{background:repeating-conic-gradient(#d9dee5 0 25%,#fff 0 50%) 0 0/22px 22px}
.alpha[data-bg=light]{background:var(--offwhite)}
.alpha[data-bg=blue]{background:var(--blue)}
.alpha[data-bg=photo]{background:linear-gradient(160deg,#FFB300 0%,#EE702E 35%,#FF4F5C 60%,#1F3D63 100%)}
.bgs{display:flex;gap:6px;flex-wrap:wrap}
.bgs button{all:unset;cursor:pointer;font-size:13px;font-weight:600;border-radius:999px;padding:6px 12px;box-shadow:inset 0 0 0 1px var(--line);color:var(--ink-2)}
.bgs button[aria-pressed=true]{background:#000;color:#fff;box-shadow:none}
.small{font-size:13px;color:var(--ink-3);margin:0 4px;line-height:1.6}
.recipe{margin-top:8px;border-radius:18px;background:var(--offwhite);padding:0 14px}
.recipe summary{cursor:pointer;list-style:none;padding:11px 0;font-size:14px;font-weight:700;color:var(--ink);display:flex;align-items:center;gap:8px}
.recipe summary::-webkit-details-marker{display:none}
.recipe summary::before{content:"";width:9px;height:9px;border-radius:2px;background:#000;flex:none}
.recipe summary::after{content:"+";margin-inline-start:auto;font-family:"IBM Plex Mono",monospace;font-size:16px;color:var(--ink-3)}
.recipe[open] summary::after{content:"−"}
.recipe ol,.recipe ul{margin:6px 0;padding-inline-start:20px;font-size:14px;line-height:1.75;color:var(--ink-2)}
.recipe p{margin:8px 0;font-size:14px;line-height:1.7;color:var(--ink-2)}
.recipe p:last-child{padding-bottom:12px}
.recipe code{background:#fff}
.recipe a{color:var(--blue);font-size:12.5px;word-break:break-all}
.meta{display:flex;flex-wrap:wrap;gap:5px;margin:2px 0 4px}
.tagx{font-size:12px;font-weight:600;color:var(--ink-2);background:#fff;border-radius:999px;padding:4px 9px}
.tagx.coral{background:var(--coral);color:#000}
.foot{gap:18px}
@media (max-width:980px){.agent-grid,.bg-grid{grid-template-columns:1fr}}
"""

JS = """
const PLAY = '<svg viewBox="0 0 14 14" fill="currentColor"><path d="M3 1.8v10.4L12 7z"/></svg>';
const SPK = '<svg viewBox="0 0 14 14" fill="currentColor"><path d="M2 5h2.5L8 2v10L4.5 9H2z"/><path d="M10 4.5c1 .8 1 4.2 0 5" stroke="currentColor" stroke-width="1.3" fill="none"/></svg>';
// Playback: each video plays muted while visible; a click restarts it with sound (the others go quiet)
let soundAll = false;
const cards = [...document.querySelectorAll(".card")];
const setSound = (card, on) => {
  const v = card.querySelector("video");
  v.muted = !on;
  card.classList.toggle("sound", on);
  card.querySelector(".play").innerHTML = on ? `${SPK} الصوت يعمل` : `${PLAY} شغّل بالصوت`;
};
for (const card of cards) {
  setSound(card, false);
  const v = card.querySelector("video");
  const bar = card.querySelector(".prog i");
  v.addEventListener("timeupdate", () => { bar.style.width = (100 * v.currentTime / (v.duration || 1)) + "%"; });
  card.querySelector(".media").addEventListener("click", () => {
    const on = !card.classList.contains("sound");
    for (const c of cards) if (c !== card) setSound(c, false);
    setSound(card, on);
    if (on) v.currentTime = 0;
    v.play().catch(() => {});
  });
}
const io = new IntersectionObserver(es => {
  for (const e of es) {
    const v = e.target.querySelector("video");
    if (e.isIntersecting) {
      // the first time: start at the best moment of the motion (the poster frame) instead of the empty start
      if (!e.target.dataset.started) { e.target.dataset.started = "1"; try { v.currentTime = +e.target.dataset.t; } catch (_) {} }
      v.play().catch(() => {});
    } else { v.pause(); setSound(e.target, false); }
  }
}, { threshold: 0.45 });
cards.forEach(c => io.observe(c));
document.getElementById("sndAll").addEventListener("click", e => {
  soundAll = !soundAll;
  e.currentTarget.setAttribute("aria-pressed", soundAll);
  e.currentTarget.textContent = soundAll ? "🔊 الصوت يعمل عند المرور" : "🔈 الصوت مع التشغيل";
});
for (const card of cards) {
  card.addEventListener("mouseenter", () => {
    if (!soundAll) return;
    for (const c of cards) if (c !== card) setSound(c, false);
    setSound(card, true);
    const v = card.querySelector("video"); v.currentTime = 0; v.play().catch(() => {});
  });
  card.addEventListener("mouseleave", () => { if (soundAll) setSound(card, false); });
}
// the transparent example: switch what is behind it
const box = document.getElementById("alphaBox");
for (const b of document.querySelectorAll(".bgs button")) b.addEventListener("click", () => {
  box.dataset.bg = b.dataset.bg;
  for (const x of document.querySelectorAll(".bgs button")) x.setAttribute("aria-pressed", x === b);
});
"""


def styles_md():
    out = [
        '<div dir="rtl">',
        "",
        "# طريقة بناء كل ستايل",
        "",
        f"هذا الملف يُولَّد من `gallery/logo/build.py` (نفس بيانات [المعرض]({PAGE_URL})). لا تعدّله يدويًا.",
        "",
        "- أسماء المجموعات (`mark` و`word` و`dots` و`tag`) هي التي في `logo/src/groups.ts`.",
        "- الكود المرجعي مكتوب لشعار متعلم: `CIRCLE` و`CUP` و`HAT` هي أجزاء الرمز، و`WORD` الكلمة، و`MARKS` النقاط والتشكيل، و`TAG` الجملة. استبدلها بأجزاء شعار المستخدم، والدوائر والأرقام الثابتة بمقاسات أجزائه (`box`).",
        "- الكود المرجعي يستورد من `../logo` و`../fx` و`../strokes`: نسخها التي كُتب بها في `logo/reference/motalim/kit/`. الأدوات العامة في `logo/src/` بنفس الأسماء تقريبًا (`useT` و`p` و`lerp` و`ease` و`useSpring` و`rnd` و`Sfx` و`Stage` و`Center`).",
        "- كل ستايل ينتهي بالشعار الأصلي تمامًا، ثم ثبات لا يقل عن 1.5 ثانية.",
        "",
    ]
    for s in data:
        out += [f"## {s['n']:02d} · {s['ar']} ({s['en']}) · `{s['id']}`", ""]
        out += [f"- **يناسب:** {s['use']}", f"- **ما يراه المشاهد:** {s['look']}", f"- **المدة:** {s['dur']:g} {'ثوانٍ' if float(s['dur']).is_integer() else 'ثانية'} · **الخلفية الافتراضية:** {s['bg']}" + (" · **يحتاج هيكل الحروف**" if s["skel"] else ""),
                f"- **الأصوات:** {' · '.join(f'`{x}`' for x in s['sounds'])}", f"- **الكود المرجعي:** `{s['ref']}`", "", "**الخطوات:**", ""]
        out += [f"{k + 1}. {x}" for k, x in enumerate(s["steps"])]
        out += ["", f"**يحتاج:** {s['needs']}", "", "**تجنّب:**", ""] + [f"- {x}" for x in s["avoid"]] + [""]
    out += ["</div>", ""]
    return "\n".join(out)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=str(HERE / "index.html"))
    ap.add_argument("--vid", default="videos")
    ap.add_argument("--alpha", default="videos/L08-LightSweep-Alpha.webm")
    a = ap.parse_args()
    Path(a.out).write_text(page(a.vid, a.alpha), encoding="utf-8")
    print(f"wrote {a.out}")
    md = REPO / ".agents/skills/logo-animation/references/styles.md"
    md.parent.mkdir(parents=True, exist_ok=True)
    md.write_text(styles_md(), encoding="utf-8")
    print(f"wrote {md}")

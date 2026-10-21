import unittest
from production import clean_lines, classify, make_plan, markdown
from validate_production import validate_storyboard, validate_words
from production_assets import inspect
from production_subtitles import make_srt, stamp
from production_scene import isolate

class ProductionTests(unittest.TestCase):
    def test_arabic_plan(self):
        lines = clean_lines("[happy] أهلاً بكم\nكيف يعمل النظام؟\nنسبة النمو 35٪")
        plan = make_plan(lines)
        self.assertEqual(len(plan["scenes"]), 3)
        self.assertEqual(plan["scenes"][1]["kind"], "diagram")
        self.assertEqual(plan["scenes"][2]["kind"], "data")
        self.assertFalse(validate_storyboard(plan))
        self.assertIn("Storyboard", markdown(plan))

    def test_invalid_inputs(self):
        with self.assertRaises(ValueError):
            make_plan([])
        with self.assertRaises(ValueError):
            make_plan(["test"], wps=0)
        self.assertTrue(validate_storyboard({"duration": 1, "scenes": [
            {"id": "x", "text": "a", "start": 0, "end": 3}
        ]}))

    def test_words(self):
        self.assertFalse(validate_words({"duration": 3, "lines": [
            {"start": 0, "end": 2, "words": [{"w": "مرحبا", "start": 0, "end": 1}]}
        ]}))
        self.assertTrue(validate_words({"duration": 1, "lines": [
            {"start": 0, "end": 2, "words": []}
        ]}))

    def test_asset_and_brand(self):
        plan = make_plan(["نسبة النمو 30٪"])
        report = inspect(plan, {"primaryColor": "#2563EB", "allowedStyles": ["whiteboard"]})
        self.assertTrue(report["assets"])
        self.assertTrue(report["styleWarnings"])

    def test_subtitle_and_scene(self):
        srt = make_srt({"lines": [{"text": "أهلاً", "start": 0.5, "end": 1.2}]})
        self.assertIn("00:00:00,500 --> 00:00:01,200", srt)
        self.assertEqual(stamp(3661.001), "01:01:01,001")
        plan = make_plan(["كيف نبدأ", "ثم نتوسع"])
        task = isolate(plan, "scene-002")
        self.assertEqual(task["scene"]["lineIndex"], 1)
        with self.assertRaises(ValueError):
            isolate(plan, "unknown")

if __name__ == "__main__":
    unittest.main()

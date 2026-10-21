import unittest
from production import clean_lines, classify, make_plan, markdown
from validate_production import validate_storyboard, validate_words

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

if __name__ == "__main__":
    unittest.main()

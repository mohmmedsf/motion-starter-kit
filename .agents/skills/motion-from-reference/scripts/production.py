#!/usr/bin/env python3
"""Deterministic script-to-storyboard planning, no model/API dependency.

Input: UTF-8 script, one utterance per line.
Output: JSON storyboard and Markdown shot plan. Does not generate artwork or claim AI inference.
"""
from __future__ import annotations
import argparse
import json
import math
import re
from pathlib import Path

KINDS = (
    ("comparison", ("مقارنة", "مقابل", "أفضل من", "versus", "vs.")),
    ("data", ("%", "٪", "نسبة", "إحصائ", "أرقام", "percent", "growth")),
    ("timeline", ("أولاً", "ثانياً", "بعد ذلك", "ثم", "المرحلة", "خطوة", "step")),
    ("diagram", ("كيف", "عملية", "نظام", "خطوات", "workflow", "process")),
    ("product", ("تطبيق", "موقع", "منتج", "واجهة", "app", "product")),
)
STYLES = {
    "comparison": "infographic", "data": "infographic",
    "timeline": "whiteboard", "diagram": "whiteboard",
    "product": "product", "statement": "kinetic-text",
}

def clean_lines(text: str) -> list[str]:
    lines = []
    for raw in text.splitlines():
        line = re.sub(r"\[[^\]]*\]", "", raw).strip()
        if line and not line.startswith("#"):
            lines.append(line)
    return lines

def classify(text: str) -> str:
    lower = text.casefold()
    for kind, terms in KINDS:
        if any(term in lower for term in terms):
            return kind
    return "statement"

def make_plan(lines: list[str], *, wps: float = 2.2, gap: float = 0.65,
              lead: float = 0.5, tail: float = 1.0) -> dict:
    if not lines:
        raise ValueError("Script must contain at least one line")
    if not all(math.isfinite(n) for n in (wps, gap, lead, tail)) or wps <= 0 or min(gap, lead, tail) < 0:
        raise ValueError("Invalid timing parameters")
    cursor = lead
    scenes = []
    for index, text in enumerate(lines):
        words = text.split()
        if not words:
            continue
        duration = max(1.8, len(words) / wps)
        kind = classify(text)
        scenes.append({
            "id": f"scene-{index + 1:03d}", "lineIndex": index,
            "text": text, "kind": kind, "style": STYLES[kind],
            "start": round(cursor, 3), "end": round(cursor + duration, 3),
            "assets": (
                ["chart", "numeric-labels"] if kind == "data" else
                ["two-panels"] if kind == "comparison" else
                ["flow-arrows", "icons"] if kind in ("timeline", "diagram") else
                ["product-frame"] if kind == "product" else ["typography"]
            ),
            "motion": "draw" if kind in ("diagram", "timeline") else "fade-slide",
            "confidence": "heuristic",
        })
        cursor += duration + gap
    return {
        "schemaVersion": 1, "generator": "rule-based", "audio": None,
        "duration": round(scenes[-1]["end"] + tail, 3), "scenes": scenes,
    }

def markdown(plan: dict) -> str:
    out = ["# Storyboard (automatically suggested — review before production)", "",
           "| Scene | Start | End | Kind | Style | Text |", "|---|---:|---:|---|---|---|"]
    for s in plan["scenes"]:
        safe = s["text"].replace("|", "\\|").replace("\n", " ")
        out.append(f'| {s["id"]} | {s["start"]:.2f} | {s["end"]:.2f} | {s["kind"]} | {s["style"]} | {safe} |')
    out.extend(["", "## Asset checklist", ""])
    for s in plan["scenes"]:
        out.append(f'- [ ] {s["id"]}: {", ".join(s["assets"])}')
    out.extend(["", "## Review notes", "- Suggestions are deterministic heuristics, not AI visual analysis.",
                "- Align actual word timing with align.py before final animation.",
                "- Confirm chosen styles against the reference and user brief."])
    return "\n".join(out) + "\n"

def main() -> None:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--script", type=Path, required=True)
    p.add_argument("--out", type=Path, default=Path("production/storyboard.json"))
    p.add_argument("--wps", type=float, default=2.2)
    p.add_argument("--gap", type=float, default=0.65)
    args = p.parse_args()
    plan = make_plan(clean_lines(args.script.read_text(encoding="utf-8")), wps=args.wps, gap=args.gap)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(plan, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    md = args.out.with_suffix(".md")
    md.write_text(markdown(plan), encoding="utf-8")
    print(f"{len(plan['scenes'])} scenes, {plan['duration']} seconds -> {args.out}, {md}")

if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Validate planned scenes and optionally aligned words before building."""
import argparse
import json
import math
from pathlib import Path

def validate_storyboard(data: dict) -> list[str]:
    issues = []
    scenes = data.get("scenes", [])
    if not isinstance(scenes, list) or not scenes:
        return ["No storyboard scenes"]
    seen = set()
    previous = -1.0
    for i, s in enumerate(scenes):
        ident = s.get("id")
        if not isinstance(ident, str) or not ident or ident in seen:
            issues.append(f"Scene {i}: duplicate/invalid id")
        seen.add(ident)
        a, b = s.get("start"), s.get("end")
        if not all(isinstance(n, (float, int)) and math.isfinite(n) for n in (a, b)):
            issues.append(f"Scene {i}: nonnumeric timing")
            continue
        if a < 0 or b <= a:
            issues.append(f"Scene {i}: invalid interval")
        if a < previous - 1e-6:
            issues.append(f"Scene {i}: overlapping previous scene")
        previous = b
        if not str(s.get("text", "")).strip():
            issues.append(f"Scene {i}: missing text")
    duration = data.get("duration")
    if not isinstance(duration, (int, float)) or not math.isfinite(duration) or duration < previous:
        issues.append("Video duration shorter than last scene")
    return issues

def validate_words(data: dict) -> list[str]:
    issues = []
    lines = data.get("lines", [])
    if not isinstance(lines, list):
        return ["Invalid words lines"]
    duration = data.get("duration")
    if not isinstance(duration, (int, float)) or not math.isfinite(duration) or duration <= 0:
        issues.append("Invalid words duration")
        return issues
    for i, line in enumerate(lines):
        a, b = line.get("start"), line.get("end")
        if not all(isinstance(n, (float, int)) and math.isfinite(n) for n in (a, b)) or a < 0 or b < a or b > duration:
            issues.append(f"Line {i}: invalid timing")
        for j, word in enumerate(line.get("words", [])):
            wa, wb = word.get("start"), word.get("end")
            if not all(isinstance(n, (float, int)) and math.isfinite(n) for n in (wa, wb)) or wa < 0 or wb < wa or wb > duration:
                issues.append(f"Line {i}, word {j}: invalid timing")
    return issues

def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--storyboard", type=Path, required=True)
    p.add_argument("--words", type=Path)
    args = p.parse_args()
    errors = validate_storyboard(json.loads(args.storyboard.read_text(encoding="utf-8")))
    if args.words:
        errors.extend(validate_words(json.loads(args.words.read_text(encoding="utf-8"))))
    if errors:
        raise SystemExit("\n".join(errors))
    print("Production data validated")

if __name__ == "__main__":
    main()

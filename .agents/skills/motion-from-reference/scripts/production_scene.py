#!/usr/bin/env python3
"""Prepare an isolated scene edit task, without rewriting unrelated scenes."""
import argparse
import json
from pathlib import Path

def isolate(plan: dict, scene_id: str) -> dict:
    scene = next((s for s in plan.get("scenes", []) if s.get("id") == scene_id), None)
    if scene is None:
        raise ValueError(f"Unknown scene: {scene_id}")
    return {
        "schemaVersion": 1,
        "mode": "scene-only",
        "scene": scene,
        "instructions": [
            "Modify only the requested scene component and its own assets.",
            "Preserve scene id, start, end and other scene boundaries unless user explicitly requests timing changes.",
            "Review adjacent scene frames for continuity.",
            "Do not render final video without user approval.",
        ],
    }

def main():
    p = argparse.ArgumentParser()
    p.add_argument("--storyboard", type=Path, required=True)
    p.add_argument("--scene", required=True)
    p.add_argument("--out", type=Path)
    args = p.parse_args()
    plan = json.loads(args.storyboard.read_text(encoding="utf-8"))
    task = isolate(plan, args.scene)
    output = args.out or Path("production") / (args.scene + "-task.json")
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(task, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Isolated scene task -> {output}")

if __name__ == "__main__":
    main()

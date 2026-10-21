#!/usr/bin/env python3
"""Create asset manifest and brand/style consistency warnings from storyboard."""
import argparse
import json
import re
from pathlib import Path

def inspect(plan: dict, style: dict | None = None) -> dict:
    style = style or {}
    assets = []
    issues = []
    allowed = set(style.get("allowedStyles", []))
    for scene in plan.get("scenes", []):
        ident = scene.get("id", "")
        kind = scene.get("kind", "")
        for asset in scene.get("assets", []):
            assets.append({"sceneId": ident, "type": asset, "status": "needed",
                           "description": f"{asset} for {kind}", "source": None})
        if allowed and scene.get("style") not in allowed:
            issues.append(f'{ident}: style {scene.get("style")} outside brand allowedStyles')
    for name in ("primaryColor", "backgroundColor"):
        color = style.get(name)
        if color is not None and not re.fullmatch(r"#[0-9a-fA-F]{6}", str(color)):
            issues.append(f"Invalid {name}: use #RRGGBB")
    if style.get("fontFamily") is not None and not str(style["fontFamily"]).strip():
        issues.append("Empty fontFamily")
    return {"schemaVersion": 1, "assets": assets, "styleWarnings": issues,
            "brand": {k: style[k] for k in ("primaryColor", "backgroundColor", "fontFamily")
                      if k in style}}

def main():
    p = argparse.ArgumentParser()
    p.add_argument("--storyboard", type=Path, required=True)
    p.add_argument("--brand", type=Path)
    p.add_argument("--out", type=Path, default=Path("production/assets.json"))
    args = p.parse_args()
    plan = json.loads(args.storyboard.read_text(encoding="utf-8"))
    brand = json.loads(args.brand.read_text(encoding="utf-8")) if args.brand else {}
    report = inspect(plan, brand)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f'{len(report["assets"])} asset requirements; {len(report["styleWarnings"])} warnings')

if __name__ == "__main__":
    main()

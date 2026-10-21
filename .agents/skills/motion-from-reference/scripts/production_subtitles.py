#!/usr/bin/env python3
"""Generate UTF-8 SRT subtitles from existing words.json (no transcription)."""
import argparse
import json
from pathlib import Path

def stamp(seconds: float) -> str:
    milliseconds = round(seconds * 1000)
    h, rem = divmod(milliseconds, 3600000)
    m, rem = divmod(rem, 60000)
    s, ms = divmod(rem, 1000)
    return f"{h:02}:{m:02}:{s:02},{ms:03}"

def make_srt(data: dict) -> str:
    entries = []
    for line in data.get("lines", []):
        start, end = line["start"], line["end"]
        text = str(line.get("text", "")).strip()
        if not text or end <= start:
            continue
        entries.append(f"{len(entries) + 1}\n{stamp(start)} --> {stamp(end)}\n{text}\n")
    return "\n".join(entries) + ("\n" if entries else "")

def main():
    p = argparse.ArgumentParser()
    p.add_argument("--words", type=Path, required=True)
    p.add_argument("--out", type=Path, default=Path("video/public/subtitles.srt"))
    args = p.parse_args()
    data = json.loads(args.words.read_text(encoding="utf-8"))
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(make_srt(data), encoding="utf-8")
    print(f"Created {args.out}")

if __name__ == "__main__":
    main()

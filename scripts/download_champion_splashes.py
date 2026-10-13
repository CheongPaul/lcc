#!/usr/bin/env python3
from pathlib import Path
import json
import re
import time
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
MAPPING = ROOT / "docs" / "champion-art.js"
OUT = ROOT / "docs" / "images" / "champions"
OUT.mkdir(parents=True, exist_ok=True)

text = MAPPING.read_text(encoding="utf-8")
match = re.search(r"const\s+championArt\s*=\s*(\{.*\});?\s*$", text, re.S)
if not match:
    raise SystemExit("Could not parse docs/champion-art.js")

champions = json.loads(match.group(1))
headers = {"User-Agent": "Mozilla/5.0 LCC-Chadwick/1.0"}
failed = []

for i, (display_name, asset_id) in enumerate(champions.items(), start=1):
    target = OUT / f"{asset_id}.jpg"
    if target.exists() and target.stat().st_size > 20_000:
        print(f"[{i}/{len(champions)}] exists: {display_name}")
        continue

    url = f"https://ddragon.leagueoflegends.com/cdn/img/champion/splash/{asset_id}_0.jpg"
    ok = False
    for attempt in range(4):
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=30) as r:
                data = r.read()
            if len(data) < 20_000:
                raise RuntimeError(f"download too small ({len(data)} bytes)")
            target.write_bytes(data)
            print(f"[{i}/{len(champions)}] saved: {display_name} -> {target.name}")
            ok = True
            break
        except Exception as exc:
            print(f"[{i}/{len(champions)}] attempt {attempt+1} failed for {display_name}: {exc}")
            time.sleep(2 + attempt * 2)
    if not ok:
        failed.append((display_name, asset_id))

if failed:
    print("Failed downloads:")
    for name, asset_id in failed:
        print(f"- {name} ({asset_id})")
    raise SystemExit(1)

print(f"Downloaded/verified {len(champions)} champion splash images in {OUT}")

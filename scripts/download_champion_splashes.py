#!/usr/bin/env python3
from pathlib import Path
import json
import re
import time
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
MAPPING = ROOT / "docs" / "champion-art.js"
SPLASH_OUT = ROOT / "docs" / "images" / "champions"
ICON_OUT = ROOT / "docs" / "images" / "champion-icons"
SPLASH_OUT.mkdir(parents=True, exist_ok=True)
ICON_OUT.mkdir(parents=True, exist_ok=True)

text = MAPPING.read_text(encoding="utf-8")
match = re.search(r"const\s+championArt\s*=\s*(\{.*\});?\s*$", text, re.S)
if not match:
    raise SystemExit("Could not parse docs/champion-art.js")

champions = json.loads(match.group(1))
headers = {"User-Agent": "Mozilla/5.0 LCC-Chadwick/1.0"}
failed = []

# Riot Data Dragon icon URLs are versioned, so resolve the newest version first.
versions_req = urllib.request.Request(
    "https://ddragon.leagueoflegends.com/api/versions.json", headers=headers
)
with urllib.request.urlopen(versions_req, timeout=30) as r:
    latest_version = json.loads(r.read().decode("utf-8"))[0]
print(f"Using Riot Data Dragon version {latest_version} for champion icons")


def download(url, target, min_bytes, label, attempts=4):
    if target.exists() and target.stat().st_size > min_bytes:
        print(f"exists: {label} -> {target.name}")
        return True
    for attempt in range(attempts):
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=30) as r:
                data = r.read()
            if len(data) < min_bytes:
                raise RuntimeError(f"download too small ({len(data)} bytes)")
            target.write_bytes(data)
            print(f"saved: {label} -> {target.name}")
            return True
        except Exception as exc:
            print(f"attempt {attempt+1} failed for {label}: {exc}")
            time.sleep(2 + attempt * 2)
    return False


for i, (display_name, asset_id) in enumerate(champions.items(), start=1):
    print(f"[{i}/{len(champions)}] {display_name}")

    splash_target = SPLASH_OUT / f"{asset_id}.jpg"
    splash_url = (
        "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/"
        f"{asset_id}_0.jpg"
    )
    if not download(splash_url, splash_target, 20_000, f"{display_name} splash"):
        failed.append((display_name, "splash", splash_url))

    icon_target = ICON_OUT / f"{asset_id}.png"
    icon_url = (
        f"https://ddragon.leagueoflegends.com/cdn/{latest_version}/img/champion/"
        f"{asset_id}.png"
    )
    if not download(icon_url, icon_target, 2_000, f"{display_name} icon"):
        failed.append((display_name, "icon", icon_url))

if failed:
    print("Failed downloads:")
    for name, kind, url in failed:
        print(f"- {name} {kind}: {url}")
    raise SystemExit(1)

print(
    f"Downloaded/verified {len(champions)} splash images in {SPLASH_OUT} "
    f"and {len(champions)} champion icons in {ICON_OUT}"
)

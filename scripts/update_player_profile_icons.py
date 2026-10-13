#!/usr/bin/env python3
from pathlib import Path
from urllib.parse import quote
import hashlib
import json
import os
import time
import urllib.request
import urllib.error

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "docs" / "data.json"
OUT_DIR = ROOT / "docs" / "images" / "player-icons"
MAP_FILE = ROOT / "docs" / "player-icons.json"
OUT_DIR.mkdir(parents=True, exist_ok=True)

API_KEY = os.environ.get("RIOT_API_KEY", "").strip()
if not API_KEY:
    raise SystemExit("RIOT_API_KEY is not set")

with DATA.open(encoding="utf-8") as f:
    data = json.load(f)

players = sorted(data.get("ratings", {}).keys())
if not players:
    players = sorted({r.get("player") for r in data.get("rows", []) if r.get("player")})

existing = {}
if MAP_FILE.exists():
    try:
        existing = json.loads(MAP_FILE.read_text(encoding="utf-8"))
    except Exception:
        existing = {}

headers = {
    "X-Riot-Token": API_KEY,
    "User-Agent": "LCC-Chadwick/1.0",
}

def get_json(url, retries=3):
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=25) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as exc:
            if exc.code == 429:
                wait = int(exc.headers.get("Retry-After", "2"))
                time.sleep(max(wait, 1))
                continue
            if exc.code in (500, 502, 503, 504) and attempt < retries - 1:
                time.sleep(2 + attempt * 2)
                continue
            raise
        except Exception:
            if attempt == retries - 1:
                raise
            time.sleep(2 + attempt * 2)


def download(url, target, retries=3):
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": headers["User-Agent"]})
            with urllib.request.urlopen(req, timeout=25) as resp:
                payload = resp.read()
            if len(payload) < 1000:
                raise RuntimeError(f"Downloaded file too small: {len(payload)} bytes")
            target.write_bytes(payload)
            return
        except Exception:
            if attempt == retries - 1:
                raise
            time.sleep(2 + attempt * 2)

# Data Dragon profile icons are versioned. Resolve the newest version once.
versions = get_json("https://ddragon.leagueoflegends.com/api/versions.json")
version = versions[0]

result = dict(existing)
failed = []

for i, riot_id in enumerate(players, start=1):
    if "#" not in riot_id:
        print(f"[{i}/{len(players)}] skip invalid Riot ID: {riot_id}")
        failed.append(riot_id)
        continue

    game_name, tag_line = riot_id.rsplit("#", 1)
    try:
        account_url = (
            "https://asia.api.riotgames.com/riot/account/v1/accounts/by-riot-id/"
            f"{quote(game_name, safe='')}/{quote(tag_line, safe='')}"
        )
        account = get_json(account_url)
        puuid = account["puuid"]

        summoner_url = (
            "https://kr.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/"
            f"{quote(puuid, safe='')}"
        )
        summoner = get_json(summoner_url)
        icon_id = int(summoner["profileIconId"])

        # Pull the current Ranked Solo/Duo entry. Keep only public rank fields.
        solo_queue = None
        summoner_id = summoner.get("id")
        if summoner_id:
            league_url = (
                "https://kr.api.riotgames.com/lol/league/v4/entries/by-summoner/"
                f"{quote(summoner_id, safe='')}"
            )
            entries = get_json(league_url)
            solo = next((e for e in entries if e.get("queueType") == "RANKED_SOLO_5x5"), None)
            if solo:
                solo_queue = {
                    "tier": solo.get("tier"),
                    "rank": solo.get("rank"),
                    "leaguePoints": solo.get("leaguePoints"),
                    "wins": solo.get("wins"),
                    "losses": solo.get("losses"),
                }

        slug = hashlib.sha1(riot_id.encode("utf-8")).hexdigest()[:16]
        filename = f"{slug}.png"
        target = OUT_DIR / filename
        icon_url = (
            f"https://ddragon.leagueoflegends.com/cdn/{version}/img/profileicon/{icon_id}.png"
        )
        download(icon_url, target)

        result[riot_id] = {
            "profileIconId": icon_id,
            "summonerLevel": summoner.get("summonerLevel"),
            "image": f"images/player-icons/{filename}",
            "soloQueue": solo_queue,
        }
        rank_label = "Unranked" if not solo_queue else f"{solo_queue['tier']} {solo_queue['rank']} {solo_queue['leaguePoints']} LP"
        print(f"[{i}/{len(players)}] saved {riot_id} -> {filename} (icon {icon_id}; solo {rank_label})")
    except Exception as exc:
        failed.append(riot_id)
        print(f"[{i}/{len(players)}] failed {riot_id}: {exc}")

MAP_FILE.write_text(
    json.dumps(result, ensure_ascii=False, indent=2) + "\n",
    encoding="utf-8",
)

print(f"Updated {len(players) - len(failed)} of {len(players)} Riot player records")
if failed:
    print("Failed players:")
    for player in failed:
        print(f"- {player}")

# Keep successful/cached results even if a few lookups fail. Fail only if nothing is usable.
usable = sum(1 for p in players if p in result and result[p].get("image"))
if usable == 0:
    raise SystemExit("No player Riot records could be resolved")

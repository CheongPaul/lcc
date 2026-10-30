# LCC — Champions Chadwick

2026–27 League of Legends statistics: player rankings, profiles, champion artwork and match history.

## Enable the public website

Open Settings → Pages. Under Build and deployment, select Deploy from a branch, then main and /docs, and Save. The expected website address is https://cheongpaul.github.io/lcc/.

## Match updates

Keep entering matches in the existing Google Sheets player tabs. The website reads the sheet on opening and every 60 seconds while visible. No XLSX upload or code edit is needed. Google may cache changes for a few minutes. Only complete ten-player matches are included. Use Refresh data for an immediate check. If loading fails, the visible status identifies the retained data or fallback snapshot.

## Site files

The docs directory is the complete static website. Edit its HTML, CSS and JavaScript to change the design. All 173 champions from Riot Data Dragon 16.20.1 are supported, including unplayed champion pages. Splash artwork loads directly from Riot’s CDN. This fan project is not endorsed by Riot Games.

## Statistics

KDA uses aggregate kills, assists and deaths. First-blood rate is first bloods divided by games. CC is the sum of workbook crowd-control scores. Per-minute stats average each game's values. Profile art uses the most-played champion, with ties broken by win rate, KDA, then name.

The Python workbook importer requires openpyxl and updates the fallback snapshot. Normal updates come from Google Sheets.


## Season selection

The top-right selector switches between 26/27 and 25/26. The URL query `?season=25-26` or `?season=26-27` is authoritative and stays with every hash-based subpage. Browser titles and visible season labels identify each tab. Switching seasons reloads the page to isolate requests and data; match details return to match history when switching seasons.

- Each season uses its own Google Sheets ID and fallback JSON snapshot, configured in `docs/seasons.js`.
- 26/27 retains complete-match validation. 25/26 uses recorded player appearances because its historical roster rotates and some fields are missing.
- The 25/26 feed and snapshot exclude 내꿈은 코르키#5877 and 절불이라능#KR1. Partial scoreboards and their recorded-player totals are labeled.
- Missing metrics are null, displayed as N/A. Averages and first-blood rates use available observations. 25/26 has no CC ranking.
- Three former usernames map to their current identities; old usernames remain searchable. Season statistics never combine.
- CSV exports include the selected season in both the filename and a Season column.

Run `node tests/seasons.cjs` for season routing, rendering, aliases, missing-metric and archive snapshot checks. The initial 25/26 snapshot was verified against all ten included player totals and live Google Sheets feeds on 2026-10-13 (299 appearances, 33 matches).

## Profile-only guest players

26/27 configures 윤조한#9326 in `profileOnly` in `docs/seasons.js`. The live feed loads that separate tab without adding it to Main. Complete scoreboards retain all ten participants and original team totals. The guest profile is linked from match records and keeps personal statistics/history; roster/search/export, comparisons, league/champion aggregates, records, POM, and power-ranking pools exclude guest appearances. Both live refreshes and the fallback snapshot use this policy.

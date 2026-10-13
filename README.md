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

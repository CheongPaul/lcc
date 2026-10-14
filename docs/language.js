// English / Korean UI translation layer for LCC.
// IMPORTANT: this is the only DOM translation observer on the site.
(() => {
  const STORAGE_KEY = 'lcc-language';
  let lang = localStorage.getItem(STORAGE_KEY) === 'ko' ? 'ko' : 'en';
  const gameTerms = window.LCC_KO_TERMS || {};

  const exact = new Map(Object.entries({
    'Daily power history':'일별 파워랭킹 변화',
    'Date':'날짜',
    'Power change':'점수 변동',
    'Rank change':'순위 변동',
    'End-of-day cumulative standings, compared with the previous matchday. Days without league matches are omitted.':'해당 날짜의 마지막 경기까지 반영한 누적 점수·순위입니다. 이전 경기일과 비교하며, 리그 경기가 없는 날은 제외합니다.',
    "Dates follow the match IDs. Today's standings may change as more games are added.":'날짜는 매치 ID를 기준으로 합니다. 오늘 기록은 경기가 추가되면 바뀔 수 있습니다.',
    'Settings':'설정',
    'New match POM alerts on this device.':'이 기기에서 새 경기의 POM 알림을 받습니다.',
    'ON':'켜짐',
    'OFF':'꺼짐',
    'An internet connection is required for statistics. Enable POM alerts separately on this device.':'통계를 보려면 인터넷 연결이 필요합니다. POM 알림은 이 기기에서 별도로 켜 주세요.',
    "POM notifications":"POM 알림",
    "Get a notification when a new match POM is announced.":"새 경기의 POM이 발표되면 알림을 받아보세요.",
    "POM alerts are on for this device. Delivery may be delayed.":"이 기기에서 POM 알림을 받습니다. 알림이 지연될 수 있습니다.",
    "Updating notification settings…":"알림 설정을 변경하고 있습니다…",
    "On iPhone or iPad, add LCC to your home screen and open it there first.":"아이폰·아이패드는 LCC를 홈 화면에 추가한 뒤 그 앱에서 설정해 주세요.",
    "Push notifications are not supported in this browser.":"이 브라우저에서는 푸시 알림을 지원하지 않습니다.",
    "Notifications are blocked. Allow them in your device or browser settings.":"알림이 차단되어 있습니다. 기기 또는 브라우저 설정에서 허용해 주세요.",
    "POM notifications are awaiting Firebase setup. Please try again later.":"POM 알림 서버 설정이 아직 완료되지 않았습니다. 나중에 다시 시도해 주세요.",
    "Could not update notifications. Check your connection and try again.":"알림 설정을 변경하지 못했습니다. 연결을 확인하고 다시 시도해 주세요.",
    "Please wait…":"잠시만 기다려 주세요…",
    "Turn off POM alerts":"POM 알림 끄기",
    "Get POM alerts":"POM 알림 받기",
    "Keep LCC on your home screen.": "LCC를 홈 화면에서 바로 열어보세요.",
    "Install LCC": "LCC 앱 설치",
    "Add LCC to your home screen and open it like an app.": "LCC를 홈 화면에 추가하고 앱처럼 실행하세요.",
    "iPhone / iPad": "아이폰 / 아이패드",
    "Open this site in Safari. Tap Share, then Add to Home Screen. Keep Open as Web App enabled if shown, then tap Add.": "Safari에서 이 사이트를 연 뒤 공유 → 홈 화면에 추가를 누르세요. ‘웹 앱으로 열기’가 보이면 켜두고 ‘추가’를 누르세요.",
    "Galaxy / Android": "갤럭시 / 안드로이드",
    "Open this site in Chrome or Samsung Internet. Use the browser menu to install the app or add it to your home screen.": "Chrome이나 삼성 인터넷에서 이 사이트를 열고, 브라우저 메뉴에서 앱 설치 또는 홈 화면에 추가를 선택하세요.",
    "If you opened LCC inside another app, open the link in Safari or Chrome first.": "다른 앱 안에서 LCC를 열었다면 먼저 Safari나 Chrome으로 링크를 여세요.",
    "An internet connection is required for statistics. Push notifications are not enabled yet.": "통계를 보려면 인터넷 연결이 필요합니다. 푸시 알림은 아직 지원하지 않습니다.",
    "Close": "닫기",
    'Compare player':'선수 비교','Choose another player':'비교할 선수 선택','Open comparison ↗':'비교 페이지 열기 ↗','Opens in a new tab using this season’s data.':'현재 시즌의 기록으로 새 탭에서 비교합니다.','No other players available.':'비교할 다른 선수가 없습니다.','Player comparison':'선수 비교','Choose two different players available in this season.':'이번 시즌에 기록이 있는 서로 다른 두 선수를 선택하세요.','Main champion':'주 챔피언','Top champions':'주요 챔피언','Player A':'선수 A','Player B':'선수 B','Compare':'비교하기','Statistic':'기록','Wins':'승리','Losses':'패배','Kill participation':'킬 관여율','Average damage':'평균 데미지','Average gold':'평균 골드','Average CS':'평균 CS','Average vision':'평균 시야','Season totals depend on games played. Per-minute averages use recorded games only. Missing statistics show N/A.':'누적 기록은 경기 수에 영향을 받습니다. 분당 평균은 기록된 경기만 사용하며, 미기록 항목은 N/A로 표시합니다.','Higher values are highlighted; for deaths, lower is highlighted. Ties and missing values are not highlighted.':'수치가 높은 쪽을 강조하며, 데스는 적은 쪽을 강조합니다. 동점이나 미기록 항목은 강조하지 않습니다.','Current solo rank':'현재 솔로 랭크','Power rankings · Top 3':'파워랭킹 · 상위 3명','POWER RANKING ↗':'파워랭킹 ↗','All power rankings & scoring':'전체 파워랭킹 및 산정 방식','Power score':'파워 점수','Data status':'데이터 상태','Provisional':'잠정 순위','Limited data':'표본 부족','Power ranking':'파워랭킹','Season rank':'시즌 순위',"Power v1: each game is compared with the same season and role. KDA 25%, kill participation 25%, damage/min 20%, gold/min 15%, vision/min 15%. Tied values share their average percentile; a single record scores 50. Zero-death KDA uses (kills + assists) / max(deaths, 1).":"Power v1: 각 경기의 지표를 같은 시즌·포지션의 기록과 비교합니다. KDA 25%, 킬 관여율 25%, 분당 데미지 20%, 분당 골드 15%, 분당 시야 15%를 반영합니다. 동점은 평균 백분위, 비교 기록이 하나뿐이면 50점을 부여합니다. 노데스 KDA는 (킬 + 어시스트) / max(데스, 1)로 계산합니다.","Base score = (scored games × average game score + 5 × 50) / (scored games + 5). Displayed score = 50 + 1.5 × (base score − 50), limited to 0–100. Missing metrics redistribute their weights; games with no usable metrics are excluded. Under 5 scored games is provisional. Limited data means a role metric has fewer than 5 records or 2 players, or a game has under 80% metric coverage. Equal scores to one decimal share a rank. Scores are relative to each season.":"기본 점수 = (평가 경기 수 × 평균 경기 점수 + 5 × 50) / (평가 경기 수 + 5). 표시 점수 = 50 + 1.5 × (기본 점수 − 50)이며, 0~100으로 제한합니다. 누락된 지표의 가중치는 재배분하며, 사용 가능한 지표가 없는 경기는 제외합니다. 평가 경기가 5회 미만이면 잠정 순위입니다. 같은 포지션의 지표 기록이 5건 또는 선수 2명 미만이거나 경기의 지표 충족률이 80% 미만이면 표본 부족으로 표시합니다. 소수 첫째 자리 점수가 같으면 공동 순위입니다. 점수는 각 시즌 내 상대 평가입니다.","Closest matchup":"박빙 매치업","Most-played champion":"모스트 챔피언","Power score gap":"파워 점수 차이","Three closest stats":"가장 비슷한 지표 3개","Compare these players ↗":"두 선수 비교 ↗","Not enough same-role player records.":"같은 포지션의 선수 기록이 부족합니다.","No shared recorded statistics.":"공통으로 기록된 지표가 없습니다.","Same main role, closest power scores. Stats cover the full season; three categories are selected by relative difference. Totals depend on games played.":"주 포지션이 같고 파워 점수 차이가 가장 작은 두 선수입니다. 시즌 전체 기록 중 상대적인 차이가 가장 작은 3개 지표를 표시하며, 누적 기록은 경기 수에 영향을 받습니다.",'THE LEAGUE':'리그 메뉴','Overview':'개요','Players':'선수','Leaderboard':'리더보드','Match history':'경기 기록','Champions':'챔피언',
    'League leaders':'리그의 대표들','Top three players across nine live season categories.':'각 분야별 탑 3',
    'Top KDA':'KDA','Top Kills':'킬','Top CS':'CS','Top Assists':'어시스트','Top Avg Kill Contribution':'평균 킬 관여율','Top Avg Damage':'평균 데미지','Top Avg Gold':'평균 골드','Top Vision':'시야','Top CC':'CC',
    'Ten players. One league.':'10명의 선수. 하나의 리그.','About the data ↗':'데이터 정보 ↗','Season 26/27':'시즌 26/27','Season 25/26':'시즌 25/26','25/26 archive: excluded players are omitted. Partial scoreboards contain recorded players only. Missing stats show N/A; averages and first-blood rates use recorded values only.':'25/26 기록: 제외된 선수는 통계에 포함되지 않습니다. 일부 스코어보드에는 기록이 있는 선수만 표시됩니다. 미기록 항목은 N/A로 표시하며, 평균과 퍼스트 블러드 확률은 기록된 값만으로 계산합니다.','Not recorded this season':'이번 시즌에 기록되지 않음','Partial scoreboard: totals below include displayed players only.':'일부 선수 기록만 표시됩니다. 아래 합계는 표시된 선수들의 기록만 포함합니다.',
    'Checking Google Sheets…':'Google Sheets 확인 중…','Refresh data ↻':'데이터 새로고침 ↻','Loading league statistics…':'리그 통계를 불러오는 중…',
    'Community competition · Unofficial fan project':'커뮤니티 대회 · 비공식 팬 프로젝트','The season, by the numbers':'숫자로 보는 이번 시즌',
    'Small league.\nBig plays.':'작은 리그.\n큰 플레이.','Your home for every player, pick, and performance.\nLeague of Legends Champions Chadwick · 2026–27':'모든 선수, 픽, 경기 기록을 한곳에서.\nLeague of Legends Champions Chadwick · 2026–27',
    'Matches played':'경기 수','Active players':'활동 선수','Champions picked':'사용된 챔피언','Total kills':'총 킬','Total deaths':'총 데스','Total assists':'총 어시스트',
    'Season standouts':'시즌 주요 선수','The players setting the pace':'리그를 이끌고 있는 선수들','ALL MATCHES':'전체 경기',
    'KDA LEADER ↗':'KDA 1위 ↗','DAMAGE LEADER ↗':'데미지 1위 ↗','VISION LEADER ↗':'시야 점수 1위 ↗','DMG / MIN':'분당 데미지','VISION / MIN':'분당 시야',
    'Player leaderboard':'선수 순위','Explore players ↗':'선수 보기 ↗','Rank':'순위','Player':'선수','Role':'포지션','GP':'경기','Win rate':'승률',
    'First blood %':'퍼스트 블러드 %','Total CC':'총 CC','KP':'킬 관여율','CS / min':'분당 CS','DMG / min':'분당 데미지','Last 5':'최근 5경기',
    'Latest matches':'최근 경기','All matches ↗':'전체 경기 ↗','Popular picks':'인기 챔피언','All champions ↗':'전체 챔피언 ↗','Meet the roster':'선수 명단',
    'The players':'선수','Every player. Every stat. Explore the season.':'모든 선수와 기록을 확인해 보세요.','Player profiles':'선수 프로필','WIN RATE':'승률','GAMES':'경기',
    'First blood':'퍼스트 블러드','On the rift':'소환사의 협곡','Search champions…':'챔피언 검색…','Most played':'가장 많이 플레이','Champion statistics':'챔피언 통계',
    'Player profile':'선수 프로필','Games played':'경기 수','Damage / minute':'분당 데미지','Season totals & impact':'시즌 누적 기록','First blood rate':'퍼스트 블러드 확률',
    'Total crowd control':'총 군중 제어','Champion pool':'챔피언 폭','Back':'뒤로','No recorded games yet.':'기록된 경기가 없습니다.',
    'No players match your search.':'검색 조건에 맞는 선수가 없습니다.','No matches found.':'검색 조건에 맞는 경기가 없습니다.','No champions found.':'검색 조건에 맞는 챔피언이 없습니다.',
    'Not played yet':'아직 플레이하지 않음','The champion pool':'챔피언 풀','Picks that define the league':'리그를 대표하는 픽','Behind the numbers':'데이터 살펴보기','League data':'리그 데이터',
    'Current source':'현재 데이터 출처','Keep entering matches in your spreadsheet':'스프레드시트에 경기 계속 입력하기','Automatic updates':'자동 업데이트','How statistics are calculated':'통계 계산 방식',
    'Champion artwork':'챔피언 이미지','Portable by design':'어디서든 호스팅 가능한 구조','Unable to load statistics':'통계를 불러올 수 없습니다','Please refresh the page to try again.':'페이지를 새로고침한 후 다시 시도해 주세요.',
    'Victory':'승리','Defeat':'패배','WIN':'승리','LOSS':'패배','Match':'경기','Champion / Role':'챔피언 / 포지션','Result':'결과','Damage':'데미지','Gold':'골드','Vision':'시야',
    'Main champion: most games played; ties use win rate, then KDA.':'주 챔피언은 가장 많이 플레이한 챔피언입니다. 동률이면 승률, 그다음 KDA 순으로 결정합니다.'
  }));

  const patterns = [
    [/^Previous username: (.+)$/, '이전 닉네임: $1'],
    [/^SEASON (.+)$/, '시즌 $1'],
    [/^Ranked by KDA$/, 'KDA 기준 순위'],[/^Ranked by (.+)$/, '$1 기준 순위'],
    [/^All (\d+) games\. Open a match to see the full scoreboard\.$/, '전체 $1경기 · 경기를 선택하면 전체 스코어보드를 볼 수 있습니다.'],
    [/^(\d+) champions available · (\d+) played · Pick counts are player appearances\.$/, '사용 가능 챔피언 $1개 · 사용된 챔피언 $2개 · 픽 수는 선수별 등장 횟수입니다.'],
    [/^(\d+) players picked this champion$/, '$1명의 선수가 이 챔피언을 선택했습니다'],[/^(\d+) picks · (.+) KDA$/, '$1회 픽 · KDA $2'],
    [/^(\d+) games$/, '$1경기'],[/^(\d+) players$/, '$1명'],[/^(\d+) kills$/, '$1킬'],[/^Match (.+)$/, '경기 $1'],
    [/^MAIN CHAMPION · (.+) · (\d+) games ↗$/, '주 챔피언 · $1 · $2경기 ↗'],[/^(.+) · Peak rank: (.+)$/, '$1 · 최고 티어: $2'],
    [/^(.+) · Solo Queue: (.+)$/, '$1 · 솔로 랭크: $2'],
    [/^(.+) win rate$/, '승률 $1'],[/^Google Sheets connected · Complete matches only · Checks every 60 seconds\.$/, 'Google Sheets 연결됨 · 완료된 경기만 반영 · 60초마다 확인합니다.'],
    [/^Uploaded workbook snapshot · Waiting for Google Sheets\.$/, '업로드된 워크북 데이터 · Google Sheets 연결을 기다리는 중입니다.'],[/^Latest match: (.+)\.$/, '최근 경기: $1.']
  ];

  const termKeys = Object.keys(gameTerms).sort((a,b)=>b.length-a.length);
  const escRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const termRegex = termKeys.length ? new RegExp('(^|[^A-Za-z0-9])(' + termKeys.map(escRe).join('|') + ')(?=$|[^A-Za-z0-9])', 'g') : null;
  const originals = new WeakMap();
  const attrOriginals = new WeakMap();

  function translateGameTerms(text) {
    if (!termRegex) return text;
    return text.replace(termRegex, (m,prefix,key) => prefix + (gameTerms[key] || key));
  }

  function translateText(text) {
    if (lang !== 'ko') return text;
    const leading = text.match(/^\s*/)?.[0] || '';
    const trailing = text.match(/\s*$/)?.[0] || '';
    const core = text.slice(leading.length, text.length - trailing.length);
    let out = exact.get(core) ?? core;
    if (out === core) {
      for (const [re,replacement] of patterns) {
        if (re.test(core)) { out = core.replace(re,replacement); break; }
      }
    }
    // Numeric values, standalone unit spans, and sortable headers all use
    // the same Korean per-minute wording. English originals remain untouched.
    const perMinute = out.match(/^(.*?)\s*\/\s*min(?:ute)?s?\b(.*)$/i);
    if (perMinute && /^(?:[\d,.]+|N\/A|—|CS|DMG|Damage|Gold|Vision)?$/i.test(perMinute[1].trim())) {
      const value = perMinute[1].trim();
      const suffix = perMinute[2];
      const label = exact.get(value) ?? ({DMG:'데미지',DAMAGE:'데미지',GOLD:'골드',VISION:'시야',CS:'CS'}[value.toUpperCase()] ?? value);
      out = '분당' + (label ? ' ' + label : '') + suffix;
    }
    out = gameTerms[out] || translateGameTerms(out);
    return leading + out + trailing;
  }

  function processTextNode(node) {
    if (node.parentElement?.closest('[translate="no"]')) return;
    if (!node.nodeValue || !node.nodeValue.trim()) return;
    if (!originals.has(node)) originals.set(node, node.nodeValue);
    const source = originals.get(node);
    const next = lang === 'ko' ? translateText(source) : source;
    if (node.nodeValue !== next) node.nodeValue = next;
  }

  function translateAttribute(el, attr) {
    if (!el.hasAttribute(attr)) return;
    let saved = attrOriginals.get(el);
    if (!saved) { saved = {}; attrOriginals.set(el, saved); }
    if (!(attr in saved)) saved[attr] = el.getAttribute(attr);
    const source = saved[attr];
    const attrs = {'⌕  Search a player…':'⌕  선수 검색…','Search by match ID or date (261011)…':'경기 ID 또는 날짜 검색 (261011)…','Search champions…':'챔피언 검색…','Search players':'선수 검색','Filter by main role':'주 포지션으로 필터','Search matches':'경기 검색','Sort champions':'챔피언 정렬'};
    const next = lang === 'ko' ? (attrs[source] || source) : source;
    if (el.getAttribute(attr) !== next) el.setAttribute(attr, next);
  }

  function process(root=document.body) {
    if (!root) return;
    if (root.nodeType === Node.TEXT_NODE) return processTextNode(root);
    if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) return;
    if (root.nodeType === Node.ELEMENT_NODE) { translateAttribute(root,'placeholder'); translateAttribute(root,'aria-label'); }
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node; while ((node = walker.nextNode())) processTextNode(node);
    root.querySelectorAll?.('[placeholder],[aria-label]').forEach(el=>{translateAttribute(el,'placeholder');translateAttribute(el,'aria-label')});
  }

  function updateToggle() {
    const button = document.querySelector('#language-toggle');
    if (!button) return;
    button.textContent = lang === 'ko' ? 'English' : '한국어';
    button.setAttribute('aria-label', lang === 'ko' ? 'Switch to English' : '한국어로 전환');
    button.title = lang === 'ko' ? 'Switch to English' : '한국어로 전환';
    document.documentElement.lang = lang === 'ko' ? 'ko' : 'en';
  }

  function setLanguage(next) {
    lang = next === 'ko' ? 'ko' : 'en';
    localStorage.setItem(STORAGE_KEY, lang);
    process(document.body);
    updateToggle();
  }

  const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList') mutation.addedNodes.forEach(process);
      else if (mutation.type === 'characterData') processTextNode(mutation.target);
    }
  });

  function init() {
    const button = document.querySelector('#language-toggle');
    if (button) button.addEventListener('click', () => setLanguage(lang === 'ko' ? 'en' : 'ko'));
    updateToggle(); process(document.body);
    observer.observe(document.body,{subtree:true,childList:true,characterData:true});
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',init); else init();
})();

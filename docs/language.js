// English / Korean UI translation layer for the static LCC site.
// Player names, champion names, IDs and numeric data are intentionally left unchanged.
(() => {
  const STORAGE_KEY = 'lcc-language';
  let lang = localStorage.getItem(STORAGE_KEY) === 'ko' ? 'ko' : 'en';

  const exact = new Map(Object.entries({
    'THE LEAGUE':'리그 메뉴',
    'Overview':'개요',
    'Players':'선수',
    'Match history':'경기 기록',
    'Champions':'챔피언',
    'Ten players. One league.':'10명의 선수. 하나의 리그.',
    'About the data ↗':'데이터 정보 ↗',
    'Season 26/27':'시즌 26/27',
    'Checking Google Sheets…':'Google Sheets 확인 중…',
    'Refresh data ↻':'데이터 새로고침 ↻',
    'Loading league statistics…':'리그 통계를 불러오는 중…',
    'Community competition · Unofficial fan project':'커뮤니티 대회 · 비공식 팬 프로젝트',
    'The season, by the numbers':'숫자로 보는 이번 시즌',
    'Small league.\nBig plays.':'작은 리그.\n큰 플레이.',
    'Your home for every player, pick, and performance.\nLeague of Legends Champions Chadwick · 2026–27':'모든 선수, 픽, 경기 기록을 한곳에서.\nLeague of Legends Champions Chadwick · 2026–27',
    'Matches played':'경기 수',
    'Active players':'활동 선수',
    'Champions picked':'사용된 챔피언',
    'Total kills':'총 킬',
    'Total deaths':'총 데스',
    'Total assists':'총 어시스트',
    'Season standouts':'시즌 주요 선수',
    'The players setting the pace':'리그를 이끌고 있는 선수들',
    'ALL MATCHES':'전체 경기',
    'KDA LEADER ↗':'KDA 1위 ↗',
    'DAMAGE LEADER ↗':'데미지 1위 ↗',
    'VISION LEADER ↗':'시야 점수 1위 ↗',
    'KDA':'KDA',
    'DMG / MIN':'분당 데미지',
    'VISION / MIN':'분당 시야',
    'Player leaderboard':'선수 순위',
    'Explore players ↗':'선수 보기 ↗',
    'Rank':'순위',
    'Player':'선수',
    'Role':'포지션',
    'GP':'경기',
    'Win rate':'승률',
    'First blood %':'퍼스트 블러드 %',
    'Total CC':'총 CC',
    'KP':'킬 관여율',
    'CS / min':'분당 CS',
    'DMG / min':'분당 데미지',
    'Last 5':'최근 5경기',
    'Latest matches':'최근 경기',
    'All matches ↗':'전체 경기 ↗',
    'Popular picks':'인기 챔피언',
    'All champions ↗':'전체 챔피언 ↗',
    'Meet the roster':'선수 명단',
    'The players':'선수',
    'Every player. Every stat. Explore the season.':'모든 선수와 기록을 확인해 보세요.',
    'Player profiles':'선수 프로필',
    'WIN RATE':'승률',
    'GAMES':'경기',
    'First blood':'퍼스트 블러드',
    'On the rift':'소환사의 협곡',
    'Search champions…':'챔피언 검색…',
    'Most played':'가장 많이 플레이',
    'Win rate':'승률',
    'Champion statistics':'챔피언 통계',
    'Player profile':'선수 프로필',
    'Games played':'경기 수',
    'Damage / minute':'분당 데미지',
    'Season totals & impact':'시즌 누적 기록',
    'First blood rate':'퍼스트 블러드 확률',
    'Total crowd control':'총 군중 제어',
    'Champion pool':'챔피언 폭',
    'Back':'뒤로',
    'No recorded games yet.':'기록된 경기가 없습니다.',
    'No players match your search.':'검색 조건에 맞는 선수가 없습니다.',
    'No matches found.':'검색 조건에 맞는 경기가 없습니다.',
    'No champions found.':'검색 조건에 맞는 챔피언이 없습니다.',
    'Not played yet':'아직 플레이하지 않음',
    'The champion pool':'챔피언 풀',
    'Picks that define the league':'리그를 대표하는 픽',
    'Behind the numbers':'데이터 살펴보기',
    'League data':'리그 데이터',
    'Current source':'현재 데이터 출처',
    'Keep entering matches in your spreadsheet':'스프레드시트에 경기 계속 입력하기',
    'Automatic updates':'자동 업데이트',
    'How statistics are calculated':'통계 계산 방식',
    'Champion artwork':'챔피언 이미지',
    'Portable by design':'어디서든 호스팅 가능한 구조',
    'Unable to load statistics':'통계를 불러올 수 없습니다',
    'Please refresh the page to try again.':'페이지를 새로고침한 후 다시 시도해 주세요.',
    'Victory':'승리',
    'Defeat':'패배',
    'WIN':'승리',
    'LOSS':'패배',
    'Match':'경기',
    'Champion / Role':'챔피언 / 포지션',
    'Result':'결과',
    'Damage':'데미지',
    'Gold':'골드',
    'Vision':'시야',
    'Main champion: most games played; ties use win rate, then KDA.':'주 챔피언은 가장 많이 플레이한 챔피언입니다. 동률이면 승률, 그다음 KDA 순으로 결정합니다.'
  }));

  const patterns = [
    [/^Ranked by KDA$/, 'KDA 기준 순위'],
    [/^Ranked by (.+)$/, '$1 기준 순위'],
    [/^All (\d+) games\. Open a match to see the full scoreboard\.$/, '전체 $1경기 · 경기를 선택하면 전체 스코어보드를 볼 수 있습니다.'],
    [/^(\d+) champions available · (\d+) played · Pick counts are player appearances\.$/, '사용 가능 챔피언 $1개 · 사용된 챔피언 $2개 · 픽 수는 선수별 등장 횟수입니다.'],
    [/^(\d+) players picked this champion$/, '$1명의 선수가 이 챔피언을 선택했습니다'],
    [/^(\d+) picks · (.+) KDA$/, '$1회 픽 · KDA $2'],
    [/^(\d+) games$/, '$1경기'],
    [/^(\d+) players$/, '$1명'],
    [/^(\d+) kills$/, '$1킬'],
    [/^Match (.+)$/, '경기 $1'],
    [/^MAIN CHAMPION · (.+) · (\d+) games ↗$/, '주 챔피언 · $1 · $2경기 ↗'],
    [/^(.+) · Peak rank: (.+)$/, '$1 · 최고 티어: $2'],
    [/^(.+) win rate$/, '승률 $1'],
    [/^Google Sheets connected · Complete matches only · Checks every 60 seconds\.$/, 'Google Sheets 연결됨 · 완료된 경기만 반영 · 60초마다 확인합니다.'],
    [/^Uploaded workbook snapshot · Waiting for Google Sheets\.$/, '업로드된 워크북 데이터 · Google Sheets 연결을 기다리는 중입니다.'],
    [/^Latest match: (.+)\.$/, '최근 경기: $1.']
  ];

  const originals = new WeakMap();
  const attrOriginals = new WeakMap();

  function translateText(text) {
    if (lang !== 'ko') return text;
    if (exact.has(text)) return exact.get(text);
    for (const [re, replacement] of patterns) {
      if (re.test(text)) return text.replace(re, replacement);
    }
    return text;
  }

  function processTextNode(node) {
    if (!node.nodeValue || !node.nodeValue.trim()) return;
    if (!originals.has(node)) originals.set(node, node.nodeValue);
    const source = originals.get(node);
    const translated = lang === 'ko' ? translateText(source) : source;
    if (node.nodeValue !== translated) node.nodeValue = translated;
  }

  function translateAttribute(el, attr) {
    if (!el.hasAttribute(attr)) return;
    let saved = attrOriginals.get(el);
    if (!saved) { saved = {}; attrOriginals.set(el, saved); }
    if (!(attr in saved)) saved[attr] = el.getAttribute(attr);
    const source = saved[attr];
    let value = source;
    if (lang === 'ko') {
      const attrs = {
        '⌕  Search a player…':'⌕  선수 검색…',
        'Search by match ID or date (261011)…':'경기 ID 또는 날짜 검색 (261011)…',
        'Search champions…':'챔피언 검색…',
        'Search players':'선수 검색',
        'Filter by main role':'주 포지션으로 필터',
        'Search matches':'경기 검색',
        'Sort champions':'챔피언 정렬'
      };
      value = attrs[source] || source;
    }
    if (el.getAttribute(attr) !== value) el.setAttribute(attr, value);
  }

  function process(root=document.body) {
    if (!root) return;
    if (root.nodeType === Node.TEXT_NODE) { processTextNode(root); return; }
    if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) return;

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) processTextNode(node);
    if (root.nodeType === Node.ELEMENT_NODE) {
      translateAttribute(root, 'placeholder');
      translateAttribute(root, 'aria-label');
    }
    root.querySelectorAll?.('[placeholder],[aria-label]').forEach(el => {
      translateAttribute(el, 'placeholder');
      translateAttribute(el, 'aria-label');
    });
  }

  function updateToggle() {
    const button = document.querySelector('#language-toggle');
    if (!button) return;
    button.textContent = lang === 'ko' ? 'EN' : '한국어';
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
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach(process);
      } else if (mutation.type === 'characterData') {
        processTextNode(mutation.target);
      }
    }
  });

  function init() {
    const button = document.querySelector('#language-toggle');
    if (button) button.addEventListener('click', () => setLanguage(lang === 'ko' ? 'en' : 'ko'));
    updateToggle();
    process(document.body);
    observer.observe(document.body, {subtree:true, childList:true, characterData:true});
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

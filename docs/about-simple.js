(() => {
  const baseRoute = route;

  function renderSimpleAbout() {
    app.innerHTML = `<h1>League data</h1>
      <div class="prose">
        <h2>Current source</h2>
        <p><a href="${LCC_SHEET_URL}" target="_blank" rel="noopener noreferrer">Google Sheets · Season ${activeSeason.label} ↗</a></p>
        <p>${activeSeason.completeMatches?'Complete matches only.':'Valid recorded player appearances. Partial scoreboards are labeled. Two excluded players are omitted from all statistics. CC was not recorded and is shown as N/A.'}</p>
        <p>Data manually added by Paul Cheong. Website created by Paul Cheong.</p>
      </div>`;
  }

  route = function() {
    const [page='overview'] = location.hash.slice(1).split('/');
    if (page !== 'about') return baseRoute();
    document.querySelectorAll('nav a').forEach(a=>a.classList.remove('active'));
    renderSimpleAbout();
    window.scrollTo(0,0);
  };
})();

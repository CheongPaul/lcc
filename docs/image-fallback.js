// More reliable champion splash loading for GitHub Pages.
// Prefer a repo-local cached image when available, then CommunityDragon,
// then Riot Data Dragon as a final fallback.
window.splash = function splash(name) {
  const id = championArt[name];
  if (!id) return '';

  const local = `images/champions/${encodeURIComponent(id)}.jpg`;
  const cdragonId = id.toLowerCase();
  const community = `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/assets/characters/${encodeURIComponent(cdragonId)}/skins/skin0/images/${encodeURIComponent(cdragonId)}_splash_centered_0.jpg`;
  const riot = `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${encodeURIComponent(id)}_0.jpg`;

  return `<img class="profile-splash" src="${local}" alt="${esc(name)} champion splash artwork" fetchpriority="high" data-community="${community}" data-riot="${riot}" onerror="if(!this.dataset.triedCommunity){this.dataset.triedCommunity='1';this.src=this.dataset.community}else if(!this.dataset.triedRiot){this.dataset.triedRiot='1';this.src=this.dataset.riot}else{this.onerror=null}">`;
};

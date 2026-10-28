(() => {
  const links = [...document.querySelectorAll('[data-social]')];
  if (!links.length) return;
  async function refresh() {
    try {
      const config = await fetch('/social-settings-config.json', { cache: 'no-store' }).then(r => { if (!r.ok) throw Error(); return r.json(); });
      const settings = await fetch(config.endpoint, { cache: 'no-store' }).then(r => { if (!r.ok) throw Error(); return r.json(); });
      links.forEach(link => { link.hidden = settings[link.dataset.social + 'Visible'] !== true; });
    } catch {} // Email and GitHub remain available even if settings cannot load.
  }
  refresh();
  setInterval(() => { if (!document.hidden) refresh(); }, 60000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
})();

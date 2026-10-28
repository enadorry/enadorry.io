(() => {
  const list = document.getElementById('music-list');
  const status = document.getElementById('music-status');
  if (!list || !status) return;
  function text(tag, value, className) {
    const node = document.createElement(tag);
    node.textContent = value; node.className = className;
    return node;
  }
  async function getData(endpoint) {
    const res = await fetch(endpoint, { credentials: 'omit' });
    if (!res.ok || !res.headers.get('content-type')?.includes('application/json')) {
      throw new Error('Music feed unavailable');
    }
    const data = await res.json();
    if (!Array.isArray(data.items)) throw new Error('Invalid music feed');
    return data;
  }
  async function load() {
    try {
      const config = await getConfig();
      let data;
      try { data = await getData(config.endpoint); }
      catch { data = await getData('/spotify-history.json'); }
      const rows = document.createDocumentFragment();
      for (const item of data.items.slice(0, 50)) {
        if (typeof item.name !== 'string') continue;
        const row = text('li', '', 'music-track');
        const placeholder = text('span', '♪', 'music-cover music-cover-placeholder');
        placeholder.setAttribute('aria-hidden', 'true');
        if (typeof item.image === 'string' && item.image.startsWith('https://i.scdn.co/')) {
          const img = document.createElement('img');
          img.className = 'music-cover'; img.alt = item.name + 'のジャケット';
          img.loading = 'lazy'; img.width = img.height = 48;
          img.src = item.image; img.onerror = () => img.replaceWith(placeholder);
          row.append(img);
        } else { row.append(placeholder); }
        const link = text('a', item.name, 'music-title');
        if (typeof item.url === 'string' && item.url.startsWith('https://open.spotify.com/track/')) {
          link.href = item.url; link.target = '_blank'; link.rel = 'noopener noreferrer';
        }
        row.append(link, text('span', String(item.artists || ''), 'music-artist'));
        rows.append(row);
      }
      if (rows.childNodes.length) {
        list.replaceChildren(rows); status.textContent = '';
      } else if (!list.children.length) {
        status.textContent = data.status === 'not_connected' ? 'Spotifyの接続準備中です。' : data.status === 'reconnect_required' ? 'Spotifyの再接続を待っています。' : '再生した曲はここに表示されます。';
      }
    } catch {
      if (!list.children.length) status.textContent = '曲の一覧を読み込めませんでした。しばらくしてからお試しください。';
    }
  }
  let configPromise;
  function getConfig() {
    if (!configPromise) configPromise = fetch('/spotify-config.json')
      .then(r => { if (!r.ok) throw new Error('Missing config'); return r.json(); })
      .then(c => {
        const url = new URL(c.endpoint, location.origin);
        if (url.protocol !== 'https:' && url.origin !== location.origin) throw new Error('Invalid endpoint');
        return { endpoint: url.href };
      });
    return configPromise;
  }
  load(); setInterval(() => { if (!document.hidden) load(); }, 300000);
})();

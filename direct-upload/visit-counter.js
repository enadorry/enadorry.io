(() => {
  const counter = document.querySelector('[data-visit-count]');
  if (!counter) return;
  const key = 'enadorry-visit-session-v1';
  let id;
  try { id = sessionStorage.getItem(key); } catch {}
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(id || '')) {
    if (crypto.randomUUID) id = crypto.randomUUID();
    else {
      const bytes = crypto.getRandomValues(new Uint8Array(16));
      bytes[6] = (bytes[6] & 15) | 64; bytes[8] = (bytes[8] & 63) | 128;
      const hex = [...bytes].map(n => n.toString(16).padStart(2, '0')).join('');
      id = hex.slice(0,8)+'-'+hex.slice(8,12)+'-'+hex.slice(12,16)+'-'+hex.slice(16,20)+'-'+hex.slice(20);
    }
    try { sessionStorage.setItem(key, id); } catch {}
  }
  let endpoint = '/api/visits';
  async function refresh(register = false) {
    try {
      const response = await fetch(endpoint, register ? {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }), cache: 'no-store',
      } : { cache: 'no-store' });
      if (!response.ok) throw new Error('Counter unavailable');
      const data = await response.json();
      if (!Number.isSafeInteger(data.total) || data.total < 0) throw new Error('Invalid counter');
      counter.textContent = String(data.total).padStart(6, '0');
      counter.setAttribute('aria-label', `累計訪問回数 ${data.total.toLocaleString('ja-JP')}回`);
    } catch {
      if (register) { setTimeout(() => refresh(false), 1500); }
      // Retain the last confirmed value; never substitute an invented count.
    }
  }
  fetch('/visit-counter-config.json').then(r => r.ok ? r.json() : {}).then(config => {
    if (typeof config.endpoint === 'string') {
      const url = new URL(config.endpoint, location.origin);
      if (url.protocol === 'https:' || url.origin === location.origin) endpoint = url.href;
    }
  }).catch(() => {}).finally(() => refresh(true));
  setInterval(() => { if (!document.hidden) refresh(); }, 60000);
})();

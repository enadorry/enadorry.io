(() => {
  const icons = ["/assets/favicons/01-paradox-32.png", "/assets/favicons/02-myu-32.png", "/assets/favicons/03-handa-32.png", "/assets/favicons/04-synth-32.png", "/assets/favicons/05-marble-32.png", "/assets/favicons/06-noise-32.png", "/assets/favicons/07-error-32.png", "/assets/favicons/08-mint-radio-32.png", "/assets/favicons/09-oto-32.png", "/assets/favicons/10-minto-32.png", "/assets/favicons/11-shizuku-cyber-32.png", "/assets/favicons/12-shizuku-32.png", "/assets/favicons/13-ribbon-32.png", "/assets/favicons/14-lilia-32.png", "/assets/favicons/15-sora-32.png", "/assets/favicons/16-chloe-32.png", "/assets/favicons/17-note-32.png", "/assets/favicons/18-yozora-32.png", "/assets/favicons/19-mashiro-32.png", "/assets/favicons/20-chrono-32.png", "/assets/favicons/21-mobius-32.png", "/assets/favicons/22-mimi-32.png", "/assets/favicons/23-yume-32.png", "/assets/favicons/24-stella-32.png", "/assets/favicons/25-veil-32.png"];
  const link = document.getElementById('site-favicon');
  if (!link) return;
  const key = 'enadorry-favicon-v1';
  let chosen;
  try { chosen = sessionStorage.getItem(key); } catch {}
  if (!icons.includes(chosen)) {
    chosen = icons[Math.floor(Math.random() * icons.length)];
    try { sessionStorage.setItem(key, chosen); } catch {}
  }
  // Keep one companion throughout this tab's visit; new visits get a new draw.
  link.href = chosen;
})();

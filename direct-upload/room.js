(() => {
  const pet = document.getElementById('pet');
  const canvas = document.getElementById('pet-canvas');
  const ctx = canvas.getContext('2d');
  const sheet = new Image();
  let cursorRaf = 0;
  let x = window.innerWidth - 145, y = window.innerHeight - 140;
  let targetX = x, targetY = y, lastX = x, moveUntil = 0;
  let frame = 0, lastFrame = 0, facing = 1;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const coarse = matchMedia('(pointer: coarse)');
  const heroButton = document.getElementById('hero-interact');
  const reaction = document.getElementById('hero-reaction');
  const lines = ['やっほー！', '一緒につくろう！', '今日もいいひらめき！'];
  let reactionIndex = 0, reactionTimer;
  heroButton.addEventListener('click', () => {
    reaction.textContent = lines[reactionIndex++ % lines.length];
    heroButton.classList.remove('is-reacting');
    // Restart the response even if clicked repeatedly.
    void heroButton.offsetWidth;
    heroButton.classList.add('is-reacting');
    clearTimeout(reactionTimer);
    reactionTimer = setTimeout(() => heroButton.classList.remove('is-reacting'), 1900);
  });
  function blink() {
    heroButton.classList.add('is-blinking');
    setTimeout(() => {
      heroButton.classList.remove('is-blinking');
      setTimeout(blink, 2600 + Math.random() * 2700);
    }, 150);
  }
  if (!reduceMotion.matches) setTimeout(blink, 1700);
  function placeDock() { if (coarse.matches) { targetX = window.innerWidth - 100; targetY = window.innerHeight - 115; } }
  placeDock();
  window.addEventListener('resize', placeDock);
  window.addEventListener('pointermove', e => {
    if (e.pointerType === 'touch') return;
    targetX = Math.max(0, Math.min(window.innerWidth - 90, e.clientX + 17));
    targetY = Math.max(0, Math.min(window.innerHeight - 105, e.clientY + 14));
    if (Math.abs(targetX - lastX) > 3) facing = targetX < lastX ? -1 : 1;
    lastX = targetX;
    moveUntil = performance.now() + 240;
  }, { passive:true });
  function animate(now) {
    cursorRaf = 0;
    if (pet.hidden || document.hidden) return;
    const moving = !coarse.matches && !reduceMotion.matches && now < moveUntil;
    const ease = reduceMotion.matches ? 1 : .13;
    x += (targetX - x) * ease; y += (targetY - y) * ease;
    pet.style.transform = `translate3d(${x}px,${y}px,0)`;
    if (sheet.complete && sheet.naturalWidth) {
      if (now - lastFrame > (moving ? 85 : 240)) { frame++; lastFrame = now; }
      ctx.clearRect(0,0,192,208);
      // The ChatGPT pet sprite sheet uses 192×208 cells (8 columns, 11 rows).
      const row = moving ? (facing < 0 ? 2 : 1) : 0;
      const count = moving ? 8 : 6;
      const sw=sheet.naturalWidth/8, sh=sheet.naturalHeight/11;
      ctx.drawImage(sheet,(frame % count)*sw,row*sh,sw,sh,0,0,192,208);
    }
    cursorRaf = requestAnimationFrame(animate);
  }
  // The room keeps the cursor companion opt-in to preserve a quiet viewing space.
  const toggle = document.getElementById('companion-toggle');
  const startCursor = () => { if (!pet.hidden && !document.hidden && !cursorRaf) cursorRaf = requestAnimationFrame(animate); };
  if (toggle) toggle.addEventListener('click', () => {
    pet.hidden = !pet.hidden;
    toggle.setAttribute('aria-pressed', String(!pet.hidden));
    if (!pet.hidden && !sheet.src) sheet.src = '/assets/shizuku.webp';
    startCursor();
  });
  document.addEventListener('visibilitychange', startCursor);
})();


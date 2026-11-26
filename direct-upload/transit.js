(() => {
  const root = document.documentElement;
  const motion = document.querySelector('#motion');
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const storageKey = 'transit-pause';
  function syncMotion() {
    const paused = preference.matches || localStorage.getItem(storageKey) === '1';
    root.toggleAttribute('data-still', paused);
    motion.disabled = preference.matches;
    motion.setAttribute('aria-pressed', String(paused));
    motion.textContent = preference.matches ? '動きを軽減中（OS設定）' : paused ? '動きを再開' : '動きを止める';
    if (paused) document.getAnimations().forEach(animation => animation.cancel());
    window.dispatchEvent(new CustomEvent('enadorry-motion', {detail: !paused}));
  }
  motion.addEventListener('click', () => {
    localStorage.setItem(storageKey, root.hasAttribute('data-still') ? '0' : '1');
    syncMotion();
  });
  preference.addEventListener('change', syncMotion);
  window.addEventListener('pageshow', syncMotion);
  window.addEventListener('storage', event => { if (event.key === storageKey) syncMotion(); });
  syncMotion();

  const observer = new IntersectionObserver(entries => {
    for (const {target, isIntersecting} of entries) {
      if (isIntersecting) {
        target.classList.add('seen');
        observer.unobserve(target);
      }
    }
  });
  document.querySelectorAll('h2').forEach(heading => observer.observe(heading));

  for (const link of document.querySelectorAll('.station-head nav a')) {
    const label = link.textContent;
    link.setAttribute('aria-label', label);
    link.replaceChildren(...Array.from(label, (letter, index) => {
      const span = document.createElement('span');
      span.className = 'rolling-letter';
      span.setAttribute('aria-hidden', 'true');
      span.style.setProperty('--delay', index * 26 + 'ms');
      const ink = document.createElement('span');
      ink.textContent = letter;
      ink.dataset.letter = letter;
      span.append(ink);
      return span;
    }));
    const markCurrent = () => {
      const dest = new URL(link.href);
      const isHome = location.pathname === '/' || location.pathname === '/index.html';
      if (isHome && dest.hash && dest.hash === location.hash) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    };
    markCurrent();
    window.addEventListener('hashchange', markCurrent);
    window.addEventListener('pageshow', markCurrent);
  }

  const choices = [...document.querySelectorAll('[data-project]')];
  const selector = document.querySelector('.selector');
  if (choices.length && selector) {
    const marker = document.createElement('i');
    marker.className = 'station-marker';
    marker.setAttribute('aria-hidden', 'true');
    selector.append(marker);
    const selected = () => choices.findIndex(button => button.getAttribute('aria-pressed') === 'true');
    const moveMarker = () => {
      const button = choices[selected()];
      marker.style.width = button.offsetWidth + 'px';
      marker.style.transform = 'translate(' + button.offsetLeft + 'px,' + (button.offsetTop + button.offsetHeight - 5) + 'px)';
    };
    function choose(index, focus) {
      const target = choices[(index + choices.length) % choices.length];
      target.click();
      if (focus) target.focus();
    }
    const figure = document.querySelector('.feature figure');
    const title = document.getElementById('linear-project-title');
    for (const [i, button] of choices.entries()) {
      button.addEventListener('keydown', event => {
        if (!['ArrowRight','ArrowLeft'].includes(event.key)) return;
        event.preventDefault();
        choose(i + (event.key === 'ArrowRight' ? 1 : -1), true);
      });
      button.addEventListener('click', () => {
        moveMarker();
        if (root.hasAttribute('data-still')) return;
        figure?.animate([{opacity:.55},{opacity:1}], {duration:240});
        title?.animate([{opacity:.45,transform:'translateY(.4em)'},{opacity:1,transform:'none'}], {duration:320});
      });
    }
    new ResizeObserver(moveMarker).observe(selector);
    moveMarker();
    if (figure) {
      let drag;
      figure.addEventListener('dragstart', event => event.preventDefault());
      figure.addEventListener('pointerdown', event => {
        if (!event.isPrimary || event.button !== 0 || event.target.closest('a,button,input,select')) return;
        drag = {id:event.pointerId, x:event.clientX, y:event.clientY, dx:0};
        figure.setPointerCapture(event.pointerId);
      });
      function reset() {
        drag = null;
        figure.classList.remove('tracking');
        figure.style.removeProperty('--offset');
        figure.style.removeProperty('--tilt');
      }
      figure.addEventListener('pointermove', event => {
        if (drag?.id !== event.pointerId) return;
        const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
        if (Math.abs(dy) > 12 && Math.abs(dy) >= Math.abs(dx)) return reset();
        drag.dx = dx;
        if (root.hasAttribute('data-still')) return;
        figure.classList.add('tracking');
        figure.style.setProperty('--offset', Math.max(-52, Math.min(52, dx * .4)) + 'px');
        figure.style.setProperty('--tilt', Math.max(-4, Math.min(4, dx * .035)) + 'deg');
      });
      figure.addEventListener('pointerup', event => {
        if (drag?.id !== event.pointerId) return;
        const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
        if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy)) choose(selected() + (dx < 0 ? 1 : -1), false);
        reset();
      });
      figure.addEventListener('lostpointercapture', reset);
      figure.addEventListener('pointercancel', reset);
      window.addEventListener('enadorry-motion', reset);
    }
  }
  for (const input of document.querySelectorAll('input[type=range]')) {
    const track = document.createElement('span');
    track.className = 'value-track';
    input.before(track);
    track.append(input);
    const tip = document.createElement('span');
    tip.className = 'range-tip';
    tip.setAttribute('aria-hidden', 'true');
    track.append(tip);
    const paint = () => {
      const min = Number(input.min || 0), max = Number(input.max || 100);
      track.style.setProperty('--level', (input.value - min) / (max - min) * 100 + '%');
      tip.textContent = input.value;
    };
    paint();
    input.addEventListener('input', paint);
    const output = document.querySelector('output[for="' + input.id + '"]') || document.getElementById(input.id + 'Out') || (input.id === 'sound-volume' && document.getElementById('sound-volume-out'));
    input.addEventListener('input', () => {
      if (!output || root.hasAttribute('data-still')) return;
      output.getAnimations().forEach(a => a.cancel());
      output.animate([{transform:'translateY(-.2em) scale(1.12,.9)'},{transform:'translateY(.04em) scale(.98,1.03)',offset:.7},{transform:'none'}],{duration:290});
    });
    if (output) new MutationObserver(paint).observe(output,{childList:true,subtree:true,characterData:true});
  }
})();

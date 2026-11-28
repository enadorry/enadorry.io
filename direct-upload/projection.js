(() => {
  'use strict';
  const one = selector => document.querySelector(selector);
  const all = selector => [...document.querySelectorAll(selector)];
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const motion = one('#motion');
  const stopped = () => root.hasAttribute('data-still');
  let manualStop = false;
  try {
    const stored = ['projection-stop', 'specimen-still', 'transit-pause']
      .map(key => localStorage.getItem(key)).find(value => value !== null);
    manualStop = stored === '1';
  } catch { /* A blocked storage area still permits a preference for this page. */ }

  function syncMotion() {
    const pause = reduced.matches || manualStop;
    root.toggleAttribute('data-still', pause);
    motion.disabled = reduced.matches;
    motion.textContent = reduced.matches ? '動き軽減中' : pause ? '動きを再開' : '動きを止める';
    motion.setAttribute('aria-pressed', String(pause));
    if (pause) {
      document.getAnimations().forEach(animation => animation.cancel());
      for (const frame of all('.frame')) frame.style.removeProperty('transform');
    }
    window.dispatchEvent(new CustomEvent('enadorry-motion', {detail: !pause}));
  }
  syncMotion();
  reduced.addEventListener('change', syncMotion);
  motion.addEventListener('click', () => {
    manualStop = !manualStop;
    try { localStorage.setItem('projection-stop', manualStop ? '1' : '0'); } catch {}
    syncMotion();
  });
  function animate(element, frames, duration, easing = 'cubic-bezier(.16,.8,.28,1)', delay = 0) {
    if (!element || stopped()) return;
    element.getAnimations().forEach(animation => animation.cancel());
    element.animate(frames, {duration, easing, delay, fill: 'backwards'});
  }
  const lift = [{opacity: 0.45, transform: 'translateY(.65em)'}, {opacity: 1, transform: 'translateY(0)'}];
  animate(one('.titlebar h1, .mix h1'), lift, 360);

  const screen = one('.screen');
  if (screen) {
    const slides = all('.frame');
    const picks = all('[data-frame]');
    const reel = one('.reel');
    const position = one('#position');
    const progress = one('.progress');
    const works = one('#works');
    let current = 0;
    let grip;

    function moveMarker() {
      const selected = picks[current];
      reel.style.setProperty('--marker-x', selected.offsetLeft + 'px');
      reel.style.setProperty('--marker-y', selected.offsetTop + 'px');
      reel.style.setProperty('--marker-w', selected.offsetWidth + 'px');
      reel.style.setProperty('--marker-h', selected.offsetHeight + 'px');
    }
    function show(index, initial = false) {
      const next = (index + slides.length) % slides.length;
      if (!initial && next === current) return;
      const focusWasInSlide = slides[current].contains(document.activeElement);
      const dir = index > current ? 1 : -1;
      current = next;
      slides.forEach((slide, i) => { slide.hidden = i !== current; });
      picks.forEach((button, i) => {
        button.setAttribute('aria-current', String(i === current));
        button.setAttribute('aria-disabled', String(i === current));
      });
      position.value = (current + 1) + ' / ' + slides.length;
      progress.style.setProperty('--fraction', (current + 1) / slides.length);
      moveMarker();
      if (focusWasInSlide) screen.focus({preventScroll: true});
      const frame = slides[current];
      if (!initial) {
        animate(frame, [{opacity: .5, transform: 'translateX(' + dir * 18 + 'px)'}, {opacity: 1, transform: 'none'}], 240);
        animate(frame.querySelector('h2'), lift, 310, undefined, 45);
        animate(position, lift, 200);
      }
    }
    works.setAttribute('aria-roledescription', 'カルーセル');
    reel.setAttribute('role', 'group');
    slides.forEach(slide => {
      slide.setAttribute('role', 'group');
      slide.setAttribute('aria-roledescription', 'スライド');
    });
    show(0, true);
    reel.classList.add('has-marker');
    new ResizeObserver(moveMarker).observe(reel);
    one('#prev').addEventListener('click', () => show(current - 1));
    one('#next').addEventListener('click', () => show(current + 1));
    picks.forEach((button, i) => button.addEventListener('click', () => show(i)));
    works.addEventListener('keydown', event => {
      if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
      if (event.altKey || event.metaKey || event.ctrlKey) return;
      event.preventDefault();
      if (event.key === 'Home') show(0);
      else if (event.key === 'End') show(slides.length - 1);
      else show(current + (event.key === 'ArrowRight' ? 1 : -1));
      if (picks.includes(event.target)) picks[current].focus({preventScroll: true});
    });

    screen.addEventListener('pointerdown', event => {
      if (!event.isPrimary || event.button !== 0 || event.target.closest('a,button')) return;
      grip = {pointer: event.pointerId, x: event.clientX, y: event.clientY, frame: slides[current], transform: ''};
      screen.setPointerCapture(event.pointerId);
    });
    screen.addEventListener('pointermove', event => {
      if (!grip || event.pointerId !== grip.pointer || stopped()) return;
      const dx = event.clientX - grip.x;
      if (Math.abs(dx) < Math.abs(event.clientY - grip.y)) return;
      const shift = Math.max(-48, Math.min(48, dx * .23));
      const tilt = Math.max(-3, Math.min(3, dx * .012));
      grip.transform = 'translateX(' + shift + 'px) rotate(' + tilt + 'deg)';
      grip.frame.style.transform = grip.transform;
    });
    function release(event, accept) {
      if (!grip || event.pointerId !== grip.pointer) return;
      const {x, y, frame, transform} = grip;
      grip = null;
      const dx = event.clientX - x;
      frame.style.removeProperty('transform');
      if (accept && frame === slides[current] && Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(event.clientY - y)) {
        show(current + (dx < 0 ? 1 : -1));
      } else if (transform) {
        animate(frame, [{transform}, {transform: 'none'}], 260, 'cubic-bezier(.2,1.24,.3,1)');
      }
    }
    screen.addEventListener('pointerup', event => release(event, true));
    screen.addEventListener('pointercancel', event => release(event, false));
    screen.addEventListener('lostpointercapture', event => release(event, false));
    window.addEventListener('enadorry-motion', () => { grip = null; });
  }

  for (const link of all('.spine nav a')) {
    const name = link.textContent.trim();
    link.setAttribute('aria-label', name);
    const line = document.createElement('span');
    line.className = 'roll-line';
    line.setAttribute('aria-hidden', 'true');
    [...name].forEach((char, i) => {
      const letters = document.createElement('span');
      letters.className = 'roll-letters';
      letters.textContent = char;
      letters.dataset.letter = char;
      letters.style.setProperty('--delay', i * 18 + 'ms');
      line.append(letters);
    });
    link.replaceChildren(line);
  }
  const navItems = all('.spine nav a').map(link => ({link, section: document.getElementById(link.hash.slice(1))}))
    .filter(item => item.section);
  if (navItems.length) {
    function markSection() {
      const visible = navItems.filter(item => item.section.getBoundingClientRect().top <= innerHeight * .45)
        .sort((a, b) => b.section.getBoundingClientRect().top - a.section.getBoundingClientRect().top)[0];
      for (const {link} of navItems) {
        if (link === visible?.link) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      }
    }
    markSection();
    window.addEventListener('scroll', markSection, {passive: true});
  }
  const projects = all('[data-project]');
  projects.forEach((button, i) => {
    button.addEventListener('click', () => animate(one('#linear-project-title'), lift, 240));
    button.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      let index = (i + (event.key === 'ArrowRight' ? 1 : -1) + projects.length) % projects.length;
      if (event.key === 'Home') index = 0;
      if (event.key === 'End') index = projects.length - 1;
      const next = projects[index];
      next.focus();
      next.click();
    });
  });

  for (const range of all('input[type=range]')) {
    const output = document.getElementById(range.id + 'Out') || document.getElementById(range.id + '-out');
    let previous = Number(range.value);
    range.addEventListener('input', () => {
      const direction = Math.sign(range.value - previous);
      previous = Number(range.value);
      animate(output, [
        {transform: 'translateY(-4px) skewX(' + direction * 10 + 'deg) scaleX(1.15)'},
        {transform: 'translateY(1px) scaleX(.98)', offset: .7},
        {transform: 'none'}
      ], 280);
    });
  }

  const copy = one('#copy-email');
  if (copy) {
    const link = one('a[href^="mailto:"]');
    const status = one('#copy-status');
    let reset;
    copy.addEventListener('click', async () => {
      clearTimeout(reset);
      try {
        await navigator.clipboard.writeText(decodeURIComponent(link.getAttribute('href').slice(7).split('?')[0]));
        status.textContent = 'コピーしました';
        copy.dataset.copied = 'true';
        animate(status, lift, 220);
      } catch {
        delete copy.dataset.copied;
        status.textContent = 'メールのリンクからアドレスをコピーできます。';
      }
      reset = setTimeout(() => { status.textContent = ''; delete copy.dataset.copied; }, 2400);
    });
  }
})();

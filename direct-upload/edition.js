const preference = matchMedia('(prefers-reduced-motion: reduce)');
const motion = document.querySelector('#motion');
function setPaused(paused) {
  document.body.classList.toggle('n-paused', paused);
  motion.setAttribute('aria-pressed', String(paused));
  motion.textContent = paused ? '動きを再開' : '動きを止める';
  window.dispatchEvent(new CustomEvent('enadorry-motion', { detail: !paused }));
}
motion.addEventListener('click', () => setPaused(motion.getAttribute('aria-pressed') !== 'true'));
preference.addEventListener('change', event => setPaused(event.matches));
setPaused(preference.matches);

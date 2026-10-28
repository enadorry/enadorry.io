(() => {
  const button = document.querySelector('.menu-button');
  const nav = document.querySelector('.navigation');
  const links = [...nav.querySelectorAll('a')];
  function setMenu(open) {
    document.body.classList.toggle('menu-open', open);
    button.setAttribute('aria-expanded', String(open));
    button.firstChild.textContent = open ? 'Close ' : 'Menu ';
  }
  button.addEventListener('click', () => setMenu(button.getAttribute('aria-expanded') !== 'true'));
  links.forEach(link => link.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', e => {
    if (button.getAttribute('aria-expanded') !== 'true') return;
    if (e.key === 'Escape') { setMenu(false); button.focus(); }
    if (e.key === 'Tab') {
      const stops = [button, ...links];
      const first = stops[0], last = stops[stops.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  const mobile = matchMedia('(max-width: 760px)');
  const synchronize = () => { if (!mobile.matches) setMenu(false); };
  mobile.addEventListener('change', synchronize);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const elements = [...document.querySelectorAll('.reveal')];
  if (!reduced.matches && 'IntersectionObserver' in window) {
    document.documentElement.classList.add('motion-enabled');
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('in-view'); observer.unobserve(entry.target); } });
    }, {threshold:.05});
    elements.forEach(element => observer.observe(element));
    reduced.addEventListener('change', () => {
      if (reduced.matches) { document.documentElement.classList.remove('motion-enabled'); observer.disconnect(); }
    });
  }
})();

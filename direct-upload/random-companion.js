(() => {
  const cardImage = document.querySelector('[data-random-companion]');
  if (cardImage) {
    fetch('/garden-pets.json').then(response => {
      if (!response.ok) throw new Error('catalog unavailable');
      return response.json();
    }).then(pets => {
      const styles = [['pixel', 'ドット絵'], ['anime', 'アニメ'], ['pencil', '色鉛筆・絵本']];
      const choice = Math.floor(Math.random() * pets.length * styles.length);
      const pet = pets[Math.floor(choice / styles.length)];
      const [style, title] = styles[choice % styles.length];
      const preload = new Image();
      preload.onload = () => {
        cardImage.src = preload.src;
        cardImage.alt = `${pet.name}（${title}）— Companions`;
        cardImage.style.imageRendering = style === 'pixel' ? 'pixelated' : 'auto';
      };
      preload.src = `/assets/companion-art/${pet.slug}-${style}.webp`;
    }).catch(() => {}); // Keep the existing artwork if the catalog cannot load.
  }
  const button = document.getElementById('hero-interact');
  const image = button?.querySelector('.hero-character:not(.hero-blink)');
  const blink = button?.querySelector('.hero-blink');
  const label = document.getElementById('companion-identity');
  const shuffle = document.getElementById('companion-shuffle');
  if (!image || !shuffle || !label) return;
  const styles = [['pixel', 'ドット絵'], ['anime', 'アニメ'], ['pencil', '色鉛筆・絵本']];
  let pets = [], current = -1, ticket = 0;
  const choose = () => {
    if (!pets.length) return;
    const count = pets.length * styles.length;
    let next = Math.floor(Math.random() * (current < 0 ? count : count - 1));
    if (current >= 0 && next >= current) next++;
    const pet = pets[Math.floor(next / styles.length)];
    const [style, title] = styles[next % styles.length];
    const request = ++ticket;
    shuffle.disabled = true;
    const preload = new Image();
    preload.onload = () => {
      if (request !== ticket) return;
      current = next;
      image.src = preload.src;
      image.alt = `${pet.name}（${title}）`;
      image.width = preload.naturalWidth;
      image.height = preload.naturalHeight;
      image.style.imageRendering = style === 'pixel' ? 'pixelated' : 'auto';
      if (blink) blink.style.display = 'none';
      button.setAttribute('aria-label', `${pet.name}に話しかける`);
      label.textContent = `${pet.name} / ${title}`;
      shuffle.disabled = false;
    };
    preload.onerror = () => {
      if (request !== ticket) return;
      shuffle.disabled = false;
      label.textContent = '画像を読み込めませんでした。もう一度切り替えてください。';
    };
    preload.src = `/assets/companion-art/${pet.slug}-${style}.webp`;
  };
  shuffle.addEventListener('click', choose);
  fetch('/garden-pets.json').then(response => {
    if (!response.ok) throw new Error('catalog unavailable');
    return response.json();
  }).then(catalog => { pets = catalog; choose(); }).catch(() => {
    shuffle.disabled = true;
    label.textContent = 'Shizuku / COMPANION';
  });
})();

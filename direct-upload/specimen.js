(() => {
  const $ = selector => document.querySelector(selector);
  const all = selector => Array.from(document.querySelectorAll(selector));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const motion = $('#motion');
  const still = () => document.documentElement.hasAttribute('data-still');
  function sync() {
    const saved = localStorage.getItem('specimen-still') ?? localStorage.getItem('transit-pause');
    const stop = reduce.matches || saved === '1';
    document.documentElement.toggleAttribute('data-still', stop);
    motion.setAttribute('aria-pressed', String(stop));
    motion.textContent = reduce.matches ? '動き軽減中' : stop ? '動きを再開' : '動きを止める';
    motion.disabled = reduce.matches;
    if (stop) document.getAnimations().forEach(a => a.cancel());
    window.dispatchEvent(new CustomEvent('enadorry-motion', {detail: !stop}));
  }
  sync();
  reduce.addEventListener('change', sync);
  window.addEventListener('pageshow', sync);
  window.addEventListener('storage', e => {
    if (e.key === 'specimen-still' || e.key === 'transit-pause') sync();
  });
  motion.onclick = () => {localStorage.setItem('specimen-still', still() ? '0' : '1'); sync()};
  const cards = all('.sample');
  const search = $('#find');
  function filter() {
    const query = search.value.normalize('NFKC').toLowerCase().trim();
    cards.forEach(card => {
      const searchable = card.dataset.names + ' ' + card.textContent;
      card.hidden = !searchable.normalize('NFKC').toLowerCase().includes(query);
    });
    const total = cards.filter(card => !card.hidden).length;
    const count = $('#count');
    const next = total + ' 件';
    if (count.textContent && count.textContent !== next && !still()) {
      count.getAnimations().forEach(animation => animation.cancel());
      count.animate([{transform:'translateY(.28em) scale(.96)',opacity:.55},{transform:'translateY(-.04em)',offset:.74},{transform:'none',opacity:1}], {duration:290});
    }
    count.textContent = next;
    $('#no-results').hidden = total !== 0;
    $('#clear-search').hidden = !search.value;
  }
  if (search) {
    const clear = () => {search.value = ''; filter(); search.focus()};
    $('#clear-search').onclick = clear;
    search.oninput = filter;
    search.addEventListener('keydown', event => {
      if (event.key === 'Escape' && !event.isComposing && search.value) {
        event.preventDefault();
        clear();
      }
    });
    filter();
  }
  for (const s of all('.bar nav span')) {
    s.parentElement.setAttribute('aria-label', s.textContent);
    s.setAttribute('aria-hidden','true');
    s.replaceChildren(...Array.from(s.textContent, (letter,index) => {
      const i=document.createElement('i'); i.textContent=letter;i.style.setProperty('--delay', index*28+'ms');return i;
    }));
  }
  const buttons=all('[data-project]');
  buttons.forEach((button,index) => {
    button.addEventListener('click', () => {
      $('.picks').style.setProperty('--slot', index*100+'%');
      if (!still()) $('.exhibit figcaption').animate([{opacity:.35,transform:'translateY(7px)'},{opacity:1,transform:'none'}],250);
    });
    button.onkeydown = e => {if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();const next=buttons[(index+buttons.length+(e.key==='ArrowLeft'?-1:1))%buttons.length];next.focus();next.click()}};
  });
  all('input[type=range]').forEach(input => {
    const output=document.getElementById(input.id+'Out') || (input.id==='sound-volume' && $('#sound-volume-out'));
    const rail=document.createElement('span');
    rail.className='sample-range';
    input.before(rail);
    rail.append(input);
    const bubble=document.createElement('span');
    bubble.className='sample-value';
    bubble.setAttribute('aria-hidden','true');
    rail.append(bubble);
    function paintValue() {
      const min=Number(input.min || 0), max=Number(input.max || 100);
      rail.style.setProperty('--position',(Number(input.value)-min)*100/(max-min)+'%');
      bubble.textContent=input.value;
    }
    paintValue();
    input.addEventListener('input',paintValue);
    if(output)new MutationObserver(paintValue).observe(output,{childList:true,characterData:true,subtree:true});
    let last=+input.value;
    input.addEventListener('input',()=>{const change=input.value-last;last=+input.value;if(output && !still())output.animate([{transform:'rotate('+Math.sign(change)*7+'deg) scale(1.12)'},{transform:'none'}],220)});
  });
  const mail=$('#contact a[href^="mailto:"]');
  if(mail && navigator.clipboard){
    const copy=document.createElement('button');copy.textContent='メールアドレスをコピー';mail.after(copy);
    let timer;copy.onclick=async()=>{try{await navigator.clipboard.writeText(mail.href.slice(7));copy.textContent='✓ コピーしました';if(!still())copy.animate([{transform:'scale(.94)'},{transform:'none'}],230)}catch{copy.textContent=mail.href.slice(7)}clearTimeout(timer);timer=setTimeout(()=>copy.textContent='メールアドレスをコピー',2200)};
  }
})();

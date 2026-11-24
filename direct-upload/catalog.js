(() => {
  const motion = document.querySelector('#motion');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  let paused = false;
  try { paused = localStorage.catalogMotion === 'off'; } catch {}
  function sync() {
    const quiet = paused || reduce.matches;
    document.body.classList.toggle('quiet', quiet);
    document.body.classList.toggle('n-paused', quiet);
    motion.setAttribute('aria-pressed', String(quiet));
    motion.textContent = reduce.matches ? '動きを軽減中' : quiet ? '動きを再開' : '動きを止める';
    motion.disabled = reduce.matches;
    window.dispatchEvent(new CustomEvent('enadorry-motion',{detail:!quiet}));
  }
  motion.onclick = () => {
    paused = !paused;
    try { localStorage.catalogMotion = paused ? 'off' : 'on'; } catch {}
    sync();
  };
  reduce.addEventListener('change',sync);
  sync();
  function stamp(node) {
    if (!node || document.body.classList.contains('quiet')) return;
    node.classList.remove('stamp');
    void node.offsetWidth;
    node.classList.add('stamp');
  }
  const input = document.querySelector('#find');
  const cards = [...document.querySelectorAll('.record')];
  const output = document.querySelector('#matches');
  input?.addEventListener('input', () => {
    const words = input.value.normalize('NFKC').toLowerCase().trim().split(/\s+/);
    let count = 0;
    for (const card of cards) {
      const text = card.textContent.normalize('NFKC').toLowerCase();
      card.hidden = !words.every(w => text.includes(w));
      card.classList.toggle('arrive', !card.hidden);
      if (!card.hidden) count++;
    }
    output.textContent = count ? count+'件' : '該当する作品はありません';
    stamp(output);
  });
  const vol = document.querySelector('#sound-volume');
  vol?.addEventListener('input',()=>stamp(document.querySelector('#sound-volume-out')));
  document.querySelectorAll('[data-project]').forEach(b => b.addEventListener('click',()=>stamp(document.querySelector('#linear-project-title'))));
  const mail = document.querySelector('.socials a[href^="mailto:"]');
  if (mail && navigator.clipboard) {
    const button = document.createElement('button');
    button.textContent = 'メールアドレスをコピー';
    const status = document.createElement('output');
    mail.after(button,status);
    button.onclick = async () => {
      try { await navigator.clipboard.writeText(mail.href.slice(7)); status.textContent='コピーしました';stamp(button); }
      catch { status.textContent='アドレスを選択してコピーしてください'; }
    };
  }
})();

(() => {
  const range = document.querySelector('#sound-volume');
  if (range) {
    const meter = document.createElement('meter');
    meter.min=0; meter.max=Number(range.max); meter.setAttribute('aria-label','音量');
    range.after(meter);
    const update=()=>{meter.value=Number(range.value)};
    range.addEventListener('input',update);
    update();
  }
  const image=document.querySelector('#linear-project-image');
  if (image) {
    const switches=[...document.querySelectorAll('[data-project]')];
    let origin;
    image.draggable=false;
    image.onpointerdown=e=>{
      if(!e.isPrimary || e.button!==0)return;
      origin=[e.clientX,e.clientY];image.setPointerCapture(e.pointerId);
    };
    image.onpointerup=e=>{
      if(!origin)return;
      const dx=e.clientX-origin[0],dy=e.clientY-origin[1];origin=null;
      if(Math.abs(dx)<40 || Math.abs(dx)<Math.abs(dy))return;
      const active=switches.findIndex(b=>b.getAttribute('aria-pressed')==='true');
      switches[(active+switches.length+(dx<0?1:-1))%switches.length].click();
    };
    image.onlostpointercapture=()=>{origin=null};
  }
  const rule=document.createElement('progress');
  rule.className='page-progress';rule.max=1;rule.setAttribute('aria-label','読書の進み具合');document.body.append(rule);
  function progress(){rule.value=Math.min(1,Math.max(0,scrollY/Math.max(1,document.documentElement.scrollHeight-innerHeight)))}
  addEventListener('scroll',progress,{passive:true});new ResizeObserver(progress).observe(document.body);progress();
})();

(() => {
  const prefersStill = () => document.body.classList.contains('quiet');
  const links = document.querySelectorAll('.record h3 a,.next-work');
  for(const link of links){
    link.addEventListener('pointermove',e=>{
      if(e.pointerType!=='mouse'||prefersStill())return;
      const box=link.getBoundingClientRect();
      link.style.translate=(e.clientX-box.left-box.width/2)*.06+'px '+(e.clientY-box.top-box.height/2)*.12+'px';
    });
    link.addEventListener('pointerleave',()=>link.style.removeProperty('translate'));
  }
  const title=document.querySelector('#linear-project-title');
  if(title){
    new MutationObserver(()=>{
      if(prefersStill())return;
      title.classList.remove('word-in');
      void title.offsetWidth;
      title.classList.add('word-in');
    }).observe(title,{childList:true});
  }
})();

(() => {
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  const control = document.querySelector('#motion');
  let stopped = false;
  try { stopped = localStorage.screeningMotion === 'stop'; } catch {}
  function applyMotion() {
    const off = stopped || media.matches;
    document.body.classList.toggle('still', off);
    document.body.classList.toggle('n-paused', off);
    control.disabled = media.matches;
    control.setAttribute('aria-pressed', String(off));
    control.textContent = media.matches ? '動きを軽減中' : off ? '動きを再開' : '動きを止める';
    if (off) { for (const active of effects.values()) active.cancel(); effects.clear(); }
    window.dispatchEvent(new CustomEvent('enadorry-motion', {detail:!off}));
  }
  const effects = new Map();
  function animate(node, frames, duration = 360) {
    if (!node || media.matches || stopped) return;
    effects.get(node)?.cancel();
    const animation = node.animate(frames, {duration, easing:'cubic-bezier(.22,.88,.3,1)'});
    effects.set(node, animation);
    animation.onfinish = () => { if(effects.get(node)===animation)effects.delete(node); };
  }
  control.onclick = () => {
    stopped = !stopped;
    try { localStorage.screeningMotion = stopped ? 'stop' : 'play'; } catch {}
    applyMotion();
  };
  media.addEventListener('change',applyMotion);
  applyMotion();

  const buttons = [...document.querySelectorAll('[data-project]')];
  const frame = document.querySelector('.frame');
  if (frame) {
    const image = frame.querySelector('img');
    const bar = document.querySelector('.switches');
    const line = document.createElement('i');
    line.setAttribute('aria-hidden','true');bar.append(line);
    let index=0, start;
    function position(glide) {
      const previous = line.getBoundingClientRect();
      const target = buttons[index];
      line.style.left = target.offsetLeft+'px';line.style.width=target.offsetWidth+'px';
      if (glide) {
        const dx=previous.left-target.getBoundingClientRect().left;
        animate(line,[{transform:'translateX('+dx+'px)'},{transform:'translateX('+dx*.35+'px) scaleX(1.18)'},{transform:'none'}]);
      }
    }
    new ResizeObserver(()=>position(false)).observe(bar);position(false);
    buttons.forEach((b,i)=>{
      b.onclick=()=>{
        const sign=Math.sign(i-index);index=i;position(true);
        animate(image,[{opacity:.4,transform:'translateX('+sign*28+'px)'},{opacity:1,transform:'none'}]);
        animate(document.querySelector('#linear-project-title'),[{transform:'translateY(.5em)',opacity:.3},{transform:'none',opacity:1}]);
      };
      b.onkeydown=e=>{
        const next = e.key==='ArrowRight' ? (i+1)%buttons.length : e.key==='ArrowLeft' ? (i+buttons.length-1)%buttons.length : null;
        if(next!==null){e.preventDefault();buttons[next].focus();buttons[next].click();}
      };
    });
    image.draggable=false;
    frame.onpointerdown=e=>{
      if(e.button===0&&e.isPrimary){start=[e.clientX,e.clientY];frame.setPointerCapture(e.pointerId);}
    };
    frame.onpointerup=e=>{
      if(!start)return;
      const dx=e.clientX-start[0],dy=e.clientY-start[1];start=null;
      if(Math.abs(dx)>40&&Math.abs(dx)>Math.abs(dy))buttons[(index+(dx<0?1:-1)+buttons.length)%buttons.length].click();
    };
    frame.onlostpointercapture=()=>{start=null;};
  }

  const progress=document.createElement('progress');
  progress.setAttribute('aria-label','ページ内の位置');progress.className='position';progress.max=1;
  document.body.append(progress);
  function update(){progress.value=Math.max(0,Math.min(1,scrollY/Math.max(1,document.documentElement.scrollHeight-innerHeight)));}
  addEventListener('scroll',update,{passive:true});new ResizeObserver(update).observe(document.body);
  const volume=document.querySelector('#sound-volume');
  let previous=Number(volume?.value);
  volume?.addEventListener('input',()=>{
    const value=Number(volume.value), stretch=Math.min(.4,Math.abs(value-previous)*.04);previous=value;
    animate(document.querySelector('#sound-volume-out'),[{transform:'translateY(-3px) scale('+(1+stretch)+',.85)'},{transform:'none'}],280);
  });
  const mail=document.querySelector('.socials a[href^="mailto:"]');
  if (mail && navigator.clipboard) {
    const copy=document.createElement('button'), message=document.createElement('output');
    copy.type='button';copy.textContent='メールアドレスをコピー';mail.after(copy,message);
    copy.onclick=async()=>{
      try{await navigator.clipboard.writeText(mail.href.slice(7));message.textContent='コピーしました ✓';animate(copy,[{scale:'.94'},{scale:'1.04'},{scale:'1'}]);}
      catch{message.textContent='メールアドレスを選択してコピーしてください';}
    };
  }
})();

(() => {
  const one = s => document.querySelector(s);
  const all = s => Array.from(document.querySelectorAll(s));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const motion = one('#motion');
  const stopped = () => document.documentElement.hasAttribute('data-still');
  function sync() {
    const pause = reduced.matches || (localStorage.getItem('projection-stop') ?? localStorage.getItem('transit-pause')) === '1';
    document.documentElement.toggleAttribute('data-still', pause);
    motion.disabled = reduced.matches;
    motion.textContent = reduced.matches ? '動き軽減中' : pause ? '動きを再開' : '動きを止める';
    motion.setAttribute('aria-pressed', String(pause));
    if (pause) document.getAnimations().forEach(a => a.cancel());
    const garden = one('#garden-pause');
    if (garden && !reduced.matches && (garden.getAttribute('aria-pressed') === 'true') !== pause) garden.click();
  }
  sync(); reduced.addEventListener('change',sync);
  motion.onclick = () => {localStorage.setItem('projection-stop', stopped()?'0':'1');sync()};
  function animate(el,frames,timing) {if(el && !stopped()) el.animate(frames,timing)}
  const slides=all('.frame'), picks=all('[data-frame]'), screen=one('.screen');
  let current=0;
  function show(index,initial=false) {
    current=(index+slides.length)%slides.length;
    slides.forEach((s,i)=>s.hidden=i!==current);
    picks.forEach((b,i)=>b.setAttribute('aria-current',String(i===current)));
    one('#position').value=(current+1)+' / '+slides.length;
    one('.progress').style.setProperty('--fraction',(current+1)/slides.length);
    if(!initial){
      animate(slides[current],[{opacity:.4,transform:'translateX(14px) rotate(.7deg)'},{opacity:1,transform:'none'}],270);
      animate(slides[current].querySelector('h2'),[{transform:'translateY(.6em)',opacity:.2},{transform:'none',opacity:1}],340);
    }
  }
  if(screen){
    show(0,true);one('#prev').onclick=()=>show(current-1);one('#next').onclick=()=>show(current+1);
    picks.forEach((b,i)=>b.onclick=()=>show(i));
    one('#works').onkeydown=e=>{if(['ArrowRight','ArrowLeft'].includes(e.key)){e.preventDefault();show(current+(e.key==='ArrowRight'?1:-1))}};
    let start=null;
    screen.onpointerdown=e=>{if(e.button!==0||e.target.closest('a,button'))return;start=[e.clientX,e.clientY];screen.setPointerCapture(e.pointerId)};
    screen.onpointermove=e=>{if(start&&!stopped()){const dx=e.clientX-start[0];slides[current].style.transform='translateX('+Math.max(-48,Math.min(48,dx*.23))+'px) rotate('+Math.max(-3,Math.min(3,dx*.012))+'deg)'}};
    function release(e,accept){if(!start)return;const dx=e.clientX-start[0],dy=e.clientY-start[1];start=null;slides[current].style.transform='';if(accept&&Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy))show(current+(dx<0?1:-1))}
    screen.onpointerup=e=>release(e,true);screen.onpointercancel=e=>release(e,false);
  }
  for(const b of all('.transport button,.spine nav a')){
    b.onpointermove=e=>{if(e.pointerType!=='mouse'||stopped())return;const box=b.getBoundingClientRect();b.style.translate=(e.clientX-box.left-box.width/2)*.15+'px '+(e.clientY-box.top-box.height/2)*.15+'px'};
    b.onpointerleave=()=>b.style.translate='';
  }
  for(const r of all('input[type=range]')){
    const out=document.getElementById(r.id+'Out') || document.getElementById(r.id+'-out');
    let previous=+r.value;
    r.addEventListener('input',()=>{const direction=Math.sign(r.value-previous);previous=+r.value;animate(out,[{transform:'translateY(-3px) skewX('+direction*10+'deg) scaleX(1.15)'},{transform:'none'}],240)});
  }
})();

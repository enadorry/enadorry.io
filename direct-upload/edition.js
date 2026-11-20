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

// Movement references: https://designbookmark.com/motion
// Sample the unit-mass spring used by the demos into interruptible browser keyframes.
const spring = (stiffness, damping) => {
  let position = 0, velocity = 0;
  const samples = [];
  for (let frame = 0; frame < 120; frame++) {
    samples.push(position);
    for (let step = 0; step < 4; step++) {
      velocity += (stiffness * (1 - position) - damping * velocity) / 240;
      position += velocity / 240;
    }
    if (Math.abs(1 - position) < .001 && Math.abs(velocity) < .01) break;
  }
  return [...samples, 1];
};
const settle = spring(280, 22), pop = spring(520, 16), soft = spring(260, 24);
const running = new Map();
const moving = () => !document.body.classList.contains('n-paused') && !preference.matches;
function play(node, samples, style) {
  if (!moving() || !node || !node.animate) return;
  running.get(node)?.cancel();
  const effect = node.animate(samples.map(style), {duration: samples.length * 1000 / 60});
  running.set(node, effect);
  effect.onfinish = () => { if (running.get(node) === effect) running.delete(node); };
}
window.addEventListener('enadorry-motion', e => {
  if (!e.detail) { for (const effect of running.values()) effect.cancel(); running.clear(); }
});

const title = document.querySelector('.nameplate h1');
const titleText = title.textContent;
title.setAttribute('aria-label', titleText);
title.replaceChildren(...Array.from(titleText, (letter, index) => {
  const span = document.createElement('span');
  span.setAttribute('aria-hidden', 'true');
  span.textContent = letter;
  span.style.setProperty('--beat', index);
  return span;
}));

// Roll each index link by one line. The duplicate is purely visual.
for (const link of document.querySelectorAll('.mast nav a')) {
  const inner = document.createElement('span');
  inner.textContent = link.textContent;
  const twin = inner.cloneNode(true);
  twin.setAttribute('aria-hidden','true');
  link.replaceChildren(inner,twin);
  link.classList.add('roll-link');
}

const projects = [...document.querySelectorAll('.selector [data-project]')];
const tabs = document.querySelector('.selector');
const marker = document.createElement('i');
marker.className = 'project-marker';
marker.setAttribute('aria-hidden','true');
tabs.prepend(marker);
function placeMarker(animate) {
  const button = projects.find(item => item.getAttribute('aria-pressed') === 'true');
  const previous = marker.getBoundingClientRect();
  const target = button.getBoundingClientRect();
  marker.style.cssText = 'left:'+button.offsetLeft+'px;top:'+button.offsetTop+'px;width:'+button.offsetWidth+'px;height:'+button.offsetHeight+'px';
  if (animate && target.width) play(marker, settle, t => ({
    transform: 'translate('+((previous.left-target.left)*(1-t))+'px,'+((previous.top-target.top)*(1-t))+'px) scaleX('+(1+(previous.width/target.width-1)*(1-t))+')'
  }));
}
new ResizeObserver(() => placeMarker(false)).observe(tabs);
placeMarker(false);

const cover = document.querySelector('#linear-project-image');
const caption = document.querySelector('.feature figcaption');
let last = projects.findIndex(p => p.getAttribute('aria-pressed') === 'true');
projects.forEach((button, index) => button.addEventListener('click', () => {
  placeMarker(true);
  if (index === last) return;
  const direction = Math.sign(index - last);
  last = index;
  play(cover, soft, t => ({transform:'translateX('+(1-t)*direction*38+'px) rotate('+(1-t)*direction*2+'deg)',opacity:Math.min(1,.5+t*.5)}));
  play(caption, settle, t => ({transform:'translateY('+(1-t)*10+'px)',opacity:Math.min(1,.45+t*.55)}));
}));
let finger;
cover.draggable = false;
cover.addEventListener('pointerdown', e => {
  if (!e.isPrimary || e.button !== 0) return;
  finger = {id:e.pointerId,x:e.clientX,y:e.clientY};
  cover.setPointerCapture(e.pointerId);
});
cover.addEventListener('pointermove', e => {
  if (finger?.id === e.pointerId && moving()) cover.style.translate = Math.max(-45,Math.min(45,(e.clientX-finger.x)*.4))+'px 0';
});
cover.addEventListener('pointerup', e => {
  if (finger?.id !== e.pointerId) return;
  const dx=e.clientX-finger.x, dy=e.clientY-finger.y;
  if (Math.abs(dx)>38 && Math.abs(dx)>Math.abs(dy)) projects[(last+(dx<0?1:-1)+projects.length)%projects.length].click();
  finger=null;cover.style.translate='';
});
cover.addEventListener('lostpointercapture', () => {finger=null;cover.style.translate='';});

for (const detail of document.querySelectorAll('.work,.n-faq details')) {
  detail.addEventListener('toggle', () => {
    if (detail.open) play(detail.querySelector('summary + *'), soft, t => ({
      clipPath:'inset(0 0 '+Math.max(0,(1-t)*100)+'% 0)',transform:'translateY('+((t-1)*10)+'px)'
    }));
  });
}

const finePointer = matchMedia('(hover:hover) and (pointer:fine)');
for (const node of document.querySelectorAll('#linear-project-link,.profile-photo,.sound-dock button,.lead>a')) {
  node.addEventListener('pointermove', e => {
    if (!moving() || !finePointer.matches) return;
    const box = node.getBoundingClientRect();
    const x=(e.clientX-box.left)/box.width-.5, y=(e.clientY-box.top)/box.height-.5;
    if (node.matches('.profile-photo')) node.style.transform='perspective(450px) rotateY('+x*20+'deg) rotateX('+(-y*20)+'deg)';
    else if(node.closest('.sound-dock')) node.style.transform='scale('+(1.14-.19*Math.abs(x))+')';
    else node.style.transform='translate('+x*12+'px,'+y*9+'px)';
  });
  node.addEventListener('pointerleave', () => {node.style.transform='';});
}

const volume = document.querySelector('#sound-volume');
volume.addEventListener('input', () => play(document.querySelector('#sound-volume-out'),pop,t=>({
  transform:'scale('+(.76+.24*t)+','+(1.22-.22*t)+')'
})));
const email = document.querySelector('.socials a[href^="mailto:"]');
if (navigator.clipboard?.writeText) {
  const copy = document.createElement('button');
  copy.type='button';copy.className='copy-mail';copy.textContent='メールアドレスをコピー';
  const status = document.createElement('span');
  status.setAttribute('role','status');
  email.after(copy,status);
  let timer;
  copy.addEventListener('click',async()=>{
    clearTimeout(timer);
    try {
      await navigator.clipboard.writeText(email.getAttribute('href').slice(7));
      status.textContent=' コピーしました ✓';
      play(status,pop,t=>({transform:'scale('+(.75+.25*t)+')'}));
    } catch { status.textContent=' メールアドレスを選択してコピーしてください'; }
    timer=setTimeout(()=>status.textContent='',2400);
  });
}

// Use scrolling even when there is no animation: the rule always reports actual progress.
const progress = document.createElement('div');
progress.className='reading-rule';progress.setAttribute('aria-hidden','true');document.body.append(progress);
let pending=false;
function updateReadout(){
  pending=false;
  const distance=document.documentElement.scrollHeight-innerHeight;
  progress.style.transform='scaleX('+(distance>0?Math.min(1,Math.max(0,scrollY/distance)):0)+')';
}
function scheduleReadout(){if(!pending){pending=true;requestAnimationFrame(updateReadout);}}
addEventListener('scroll',scheduleReadout,{passive:true});
new ResizeObserver(scheduleReadout).observe(document.body);
const appear = new IntersectionObserver(entries=>{
  for (const entry of entries) if(entry.isIntersecting){
    appear.unobserve(entry.target);
    play(entry.target,soft,t=>({transform:'translateY('+(1-t)*18+'px)',opacity:Math.min(1,.45+t*.55)}));
  }
});
document.querySelectorAll('.journal section,.tools-panel,.mutual-links,.profile-copy,.visit-counter').forEach(el=>appear.observe(el));

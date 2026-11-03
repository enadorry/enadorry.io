(()=>{'use strict';
 const nav=document.querySelector('.n-nav'),menu=document.querySelector('.n-menu');
 const setMenu=open=>{nav.classList.toggle('open',open);menu.setAttribute('aria-expanded',String(open));menu.innerHTML=open?'CLOSE <span>−</span>':'MENU <span>＋</span>';if(open)requestAnimationFrame(()=>nav.querySelector('a')?.focus());};
 menu?.addEventListener('click',()=>setMenu(menu.getAttribute('aria-expanded')!=='true'));
 nav?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>setMenu(false)));
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&nav?.classList.contains('open')){setMenu(false);menu.focus();}});
 matchMedia('(min-width:901px)').addEventListener('change',e=>{if(e.matches)setMenu(false);});
 const progress=document.querySelector('.n-progress');let ticking=false;
 const scroll=()=>{if(ticking)return;ticking=true;requestAnimationFrame(()=>{const max=document.documentElement.scrollHeight-innerHeight;progress.style.transform=`scaleX(${max>0?scrollY/max:0})`;ticking=false;});};addEventListener('scroll',scroll,{passive:true});scroll();
 const links=[...nav.querySelectorAll('a')];const targets=links.map(a=>document.querySelector(a.hash)).filter(Boolean);
 const activeObserver=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)links.forEach(a=>a.classList.toggle('active',a.hash==='#'+e.target.id));}),{rootMargin:'-15% 0px -65% 0px'});targets.forEach(n=>activeObserver.observe(n));
 if(!matchMedia('(prefers-reduced-motion:reduce)').matches){document.documentElement.classList.add('n-js');const reveal=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');reveal.unobserve(e.target);}}),{threshold:.08});document.querySelectorAll('.n-reveal').forEach(n=>reveal.observe(n));}
 const tabs=[...document.querySelectorAll('[role=tab][data-room]')];
 function selectRoom(value){document.querySelectorAll('[data-room]').forEach(b=>{const selected=b.dataset.room===value;b.classList.toggle('active',selected);if(b.role==='tab'){b.setAttribute('aria-selected',String(selected));b.tabIndex=selected?0:-1;}});document.querySelectorAll('.n-room').forEach(p=>p.hidden=p.id!=='room-'+value);}
 document.querySelectorAll('[data-room]').forEach(b=>b.addEventListener('click',()=>selectRoom(b.dataset.room)));
 tabs.forEach((b,i)=>b.addEventListener('keydown',e=>{let next=i;if(e.key==='ArrowRight')next=(i+1)%tabs.length;else if(e.key==='ArrowLeft')next=(i+tabs.length-1)%tabs.length;else if(e.key==='Home')next=0;else if(e.key==='End')next=tabs.length-1;else return;e.preventDefault();selectRoom(tabs[next].dataset.room);tabs[next].focus();}));
 const motion=document.getElementById('n-motion');let paused=matchMedia('(prefers-reduced-motion:reduce)').matches;const apply=()=>{document.body.classList.toggle('n-paused',paused);motion.setAttribute('aria-pressed',String(paused));motion.textContent=paused?'MOTION ON':'MOTION OFF';window.dispatchEvent(new CustomEvent('enadorry-motion',{detail:!paused}));};motion.addEventListener('click',()=>{paused=!paused;apply();});matchMedia('(prefers-reduced-motion:reduce)').addEventListener('change',e=>{paused=e.matches;apply();});apply();
})();

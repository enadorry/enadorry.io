/* Shared navigation and discovery for the portfolio library. No music is faked. */
(()=>{'use strict';
 const menu=document.querySelector('.n-menu'),nav=document.querySelector('.n-nav');
 function closeMenu(){nav?.classList.remove('open');menu?.setAttribute('aria-expanded','false');menu?.setAttribute('aria-label','メニューを開く');}
 menu?.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';nav.classList.toggle('open',open);menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'メニューを閉じる':'メニューを開く');if(open)nav.querySelector('a')?.focus();});
 nav?.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&nav?.classList.contains('open')){closeMenu();menu?.focus();}});
 matchMedia('(min-width:601px)').addEventListener('change',e=>{if(e.matches)closeMenu();});
 document.addEventListener('click',e=>{if(!e.target.closest('.n-header'))closeMenu();});

 const tabs=[...document.querySelectorAll('[role=tab][data-room]')];
 function selectRoom(value){document.querySelectorAll('[data-room]').forEach(b=>{const selected=b.dataset.room===value;b.classList.toggle('active',selected);if(b.getAttribute('role')==='tab'){b.setAttribute('aria-selected',String(selected));b.tabIndex=selected?0:-1;}});document.querySelectorAll('.n-room').forEach(p=>{p.hidden=p.id!=='room-'+value;});}
 document.querySelectorAll('[data-room]').forEach(b=>b.addEventListener('click',()=>selectRoom(b.dataset.room)));
 tabs.forEach((b,i)=>b.addEventListener('keydown',e=>{let next=i;if(e.key==='ArrowRight')next=(i+1)%tabs.length;else if(e.key==='ArrowLeft')next=(i+tabs.length-1)%tabs.length;else if(e.key==='Home')next=0;else if(e.key==='End')next=tabs.length-1;else return;e.preventDefault();selectRoom(tabs[next].dataset.room);tabs[next].focus();}));
 const reduced=matchMedia('(prefers-reduced-motion:reduce)'),motion=document.getElementById('n-motion');
 let paused=reduced.matches;
 function applyMotion(){document.body.classList.toggle('n-paused',paused);if(motion){motion.setAttribute('aria-pressed',String(paused));motion.textContent=paused?'動きを再開':'動きを止める';motion.setAttribute('aria-label',paused?'ペットの動きを再開':'ペットの動きを停止');}window.dispatchEvent(new CustomEvent('enadorry-motion',{detail:!paused}));}
 motion?.addEventListener('click',()=>{paused=!paused;applyMotion();});reduced.addEventListener('change',e=>{paused=e.matches;applyMotion();});applyMotion();

 // All content remains visible without JavaScript. Reveal effects never gate access.
 document.querySelectorAll('.n-reveal').forEach(el=>el.classList.add('visible'));
 const search=document.getElementById('studio-search'),results=document.getElementById('studio-search-results');
 const home=document.body.classList.contains('nexus-home'),prefix=home?'':'/index.html';
 const catalog=[
  {title:'H2OROBOT',hint:'水中ロボット · Unity / ESP32 / UDP',href:'/h2orobot.html',image:'/assets/heroes/01.webp'},
  {title:'Interaction',hint:'ゲーム · Unity / C# / インタラクション',href:'/interactive.html',image:'/assets/gallery/signal.svg'},
  {title:'Companions',hint:'うちの子 · ペット / Shizuku / Sora / 庭',href:'/companions.html',image:'/assets/companion-art/sora-anime.webp'},
  {title:'Local AI',hint:'ローカルAI · Python / Ollama / Discord',href:'/local-ai.html',image:'/assets/heroes/07.webp'},
  {title:'音の庭',hint:'水音 / 集中音 / EVERFLOW / サウンド',href:prefix+'#soundscape',image:'/assets/heroes/03.webp'},
  {title:'考えごとの記録',hint:'note / ノート / 文章',href:prefix+'#notes',image:'/assets/heroes/19.webp'},
  {title:'えなどりについて',hint:'egawa shuuhei / 自己紹介 / プロフィール',href:prefix+'#about',image:'/assets/enadorry-icon.jpg'},
  {title:'連絡先',hint:'メール / X / Instagram / GitHub / Discord / 相互リンク',href:prefix+'#contact',image:'/assets/enadorry-icon.jpg'}
 ];
 function closeSearch(){if(!results)return;results.hidden=true;search.setAttribute('aria-expanded','false');}
 function showSearch(){if(!search||!results)return;const query=search.value.trim().toLocaleLowerCase();if(!query){closeSearch();return;}const terms=query.split(/\s+/);const matches=catalog.filter(item=>terms.every(term=>(item.title+' '+item.hint).toLocaleLowerCase().includes(term)));const ul=results.querySelector('ul');ul.replaceChildren();for(const item of matches){const li=document.createElement('li'),a=document.createElement('a'),img=document.createElement('img'),span=document.createElement('span'),small=document.createElement('small');a.href=item.href;img.src=item.image;img.alt='';img.width=img.height=38;span.textContent=item.title;small.textContent=item.hint;span.append(small);a.append(img,span);li.append(a);ul.append(li);a.addEventListener('click',closeSearch);}results.querySelector('[role=status]').textContent=matches.length?matches.length+'件のページが見つかりました':'見つかりませんでした。別の言葉で探してみてください。';results.hidden=false;search.setAttribute('aria-expanded','true');}
 search?.addEventListener('input',showSearch);search?.addEventListener('focus',showSearch);
 search?.addEventListener('keydown',e=>{if(e.key==='Escape'){closeSearch();}if((e.key==='ArrowDown'||e.key==='Enter')&&!results.hidden){const first=results.querySelector('a');if(first){e.preventDefault();if(e.key==='Enter')first.click();else first.focus();}}});
 results?.addEventListener('keydown',e=>{const links=[...results.querySelectorAll('a')],i=links.indexOf(document.activeElement);if(e.key==='Escape'){closeSearch();search.focus();}else if(e.key==='ArrowDown'){e.preventDefault();links[(i+1)%links.length]?.focus();}else if(e.key==='ArrowUp'){e.preventDefault();if(i<=0)search.focus();else links[i-1]?.focus();}});
 document.addEventListener('click',e=>{if(!e.target.closest('.studio-search'))closeSearch();});
 document.addEventListener('focusin',e=>{if(!e.target.closest('.studio-search'))closeSearch();});

 const path=location.pathname.replace(/\.html$/,'').replace(/\/$/,'')||'/';
 const navlinks=[...document.querySelectorAll('.studio-nav a,.studio-bottom-nav a')];
 function setActive(hash){for(const a of navlinks){const u=new URL(a.href,location.href);let active=false;if(path==='/companions')active=u.pathname.replace(/\.html$/,'')==='/companions';else if(home){active=u.hash===hash;if(hash==='#journey')active=u.hash==='#featured';}else active=u.hash==='#featured';a.classList.toggle('active',active);if(active)a.setAttribute('aria-current',home?'location':'page');else a.removeAttribute('aria-current');}}
 if(home){let current='#home';const observer=new IntersectionObserver(entries=>{const candidates=entries.filter(e=>e.isIntersecting);if(candidates.length){current='#'+candidates[candidates.length-1].target.id;setActive(current);}},{rootMargin:'-15% 0px -60% 0px',threshold:0});['home','featured','journey','notes','contact'].forEach(id=>{const node=document.getElementById(id);if(node)observer.observe(node);});setActive(current);}else setActive('');

 // Mirror the existing Web Audio engine instead of adding a second player.
 const volume=document.getElementById('sound-volume'),dockVolume=document.getElementById('studio-dock-volume');
 if(volume&&dockVolume){dockVolume.value=volume.value;dockVolume.addEventListener('input',()=>{volume.value=dockVolume.value;volume.dispatchEvent(new Event('input',{bubbles:true}));});volume.addEventListener('input',()=>{dockVolume.value=volume.value;});}
 const mode=document.getElementById('sound-mode');
 function paintMode(){document.querySelectorAll('[data-sound-mode]').forEach(b=>{const selected=b.dataset.soundMode===mode?.value;b.setAttribute('aria-pressed',String(selected));});}
 document.querySelectorAll('[data-sound-mode]').forEach(button=>button.addEventListener('click',()=>{if(!mode||mode.disabled)return;mode.value=button.dataset.soundMode;mode.dispatchEvent(new Event('change',{bubbles:true}));paintMode();}));mode?.addEventListener('change',paintMode);paintMode();
 const play=document.getElementById('sound-play'),state=document.getElementById('studio-player-state');
 function paintPlayer(){if(!play)return;const playing=play.getAttribute('aria-pressed')==='true';play.setAttribute('aria-label',playing?'環境音を停止':'環境音を再生');if(state)state.textContent=playing?'再生中 · Web Audio':'環境音 · Web Audio';document.querySelectorAll('[data-sound-mode]').forEach(b=>{b.disabled=play.disabled;});}
 if(play){new MutationObserver(paintPlayer).observe(play,{attributes:true,attributeFilter:['aria-pressed','disabled']});paintPlayer();}
})();

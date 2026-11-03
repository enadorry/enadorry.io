/* Short, reversible text scramble. Original DOM and accessible text stay intact. */
(()=>{'use strict';
const media=matchMedia('(prefers-reduced-motion: reduce)');
let paused=media.matches||document.body.classList.contains('n-paused'),frame=0,last=0;
const running=new Map(),records=new Map();
const latin='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/<>+*';
const japanese='光影空夢水鏡形響界無零森宙波◇□△＋';
const selector='.n-hero h1,.n-signature,.n-section h2,.n-section h3,.n-label,.n-room h2,.n-room h3,.detail-main h1,.detail-main h2';
function finish(record){record.el.classList.remove('n-scrambling');record.layer?.remove();record.layer=null;running.delete(record.el);}
function stop(){cancelAnimationFrame(frame);frame=0;[...running.values()].forEach(finish);}
function start(record){if(paused||document.hidden||running.has(record.el)||performance.now()-record.ended<1400)return;
 const el=record.el;if(!el.getClientRects().length)return;
 // Keep real text for selection, screen readers, layout and no-JS fallback.
 const layer=document.createElement('span');layer.className='n-scramble-layer';layer.setAttribute('aria-hidden','true');
 const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
 const box=el.getBoundingClientRect();const chars=[];let order=0;
 for(const node of nodes){if(node.parentElement.closest('script,style,[aria-hidden="true"]'))continue;let offset=0;
 for(const character of Array.from(node.textContent)){const end=offset+character.length;if(!character.trim()){offset=end;continue;}
 const range=document.createRange();range.setStart(node,offset);range.setEnd(node,end);const r=range.getBoundingClientRect();offset=end;if(!r.width||!r.height)continue;
 const glyph=document.createElement('span');glyph.className='n-scramble-glyph';glyph.textContent=character;
 const style=getComputedStyle(node.parentElement);Object.assign(glyph.style,{left:`${r.left-box.left-el.clientLeft}px`,top:`${r.top-box.top-el.clientTop}px`,width:`${r.width}px`,height:`${r.height}px`,font:style.font,letterSpacing:style.letterSpacing,lineHeight:`${r.height}px`});layer.append(glyph);
 chars.push({glyph,original:character,pool:/[^\x00-\x7f]/.test(character)?japanese:latin,index:order++});}}
 if(!chars.length)return;record.layer=layer;record.chars=chars;record.start=performance.now();record.ended=record.start;el.append(layer);el.classList.add('n-scrambling');running.set(el,record);if(!frame)frame=requestAnimationFrame(tick);
}
function tick(now){frame=0;if(paused||document.hidden){stop();return;}if(now-last>=48){last=now;for(const record of [...running.values()]){const age=now-record.start;if(age>=900){finish(record);record.ended=now;continue;}
 for(const c of record.chars){const settle=190+(c.index/Math.max(1,record.chars.length-1))*560;const done=age>=settle;c.glyph.textContent=done?c.original:c.pool[Math.floor(Math.random()*c.pool.length)];c.glyph.classList.toggle('unresolved',!done);}}}if(running.size)frame=requestAnimationFrame(tick);}
const observer=new IntersectionObserver(entries=>{for(const entry of entries){const record=records.get(entry.target);if(entry.isIntersecting){if(!record.visible)start(record);record.visible=true;}else{record.visible=false;finish(record);}}},{threshold:.55});
document.querySelectorAll(selector).forEach(el=>{if(el.closest('dialog')||el.querySelector('a,button,input'))return;el.classList.add('n-scramble-target');const record={el,visible:false,ended:-Infinity,layer:null};records.set(el,record);observer.observe(el);el.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse')start(record);});});
media.addEventListener('change',e=>{paused=e.matches||document.body.classList.contains('n-paused');if(paused)stop();});
addEventListener('enadorry-motion',e=>{paused=!e.detail||media.matches;if(paused)stop();});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});addEventListener('resize',stop,{passive:true});
// Loaded fonts can alter glyph bounds; discard overlays rather than shift real text.
document.fonts?.addEventListener('loadingdone',stop);
})();

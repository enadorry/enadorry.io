/* Native HTML-in-Canvas; the existing semantic panel is the fallback, never a clone. */
(()=>{'use strict';
const source=document.querySelector('.linear-project-preview');if(!source)return;
const canvas=document.createElement('canvas');canvas.setAttribute('content','drawable');
const ctx=canvas.getContext('2d');
if(canvas.content!=='drawable'||typeof ctx?.drawElementImage!=='function'||typeof canvas.requestPaint!=='function'){source.dataset.renderer='html';return;}
const host=document.createElement('div');host.className='hic-host';canvas.className='hic-canvas';
const initialWidth=source.offsetWidth,initialHeight=source.offsetHeight;
if(!initialWidth||!initialHeight)return;
host.style.height=initialHeight+'px';source.before(host);host.append(canvas);source.setAttribute('drawable','');source.style.width=initialWidth+'px';canvas.append(source);source.dataset.renderer='pending';
let disposed=false,visible=true,scheduled=0,painted=false,watchdog=0,width=initialWidth,height=initialHeight;
let pointer=null;const reduced=matchMedia('(prefers-reduced-motion:reduce)');let paused=reduced.matches||document.body.classList.contains('n-paused');
function request(){if(!disposed&&visible&&!document.hidden&&!scheduled)scheduled=requestAnimationFrame(()=>{scheduled=0;try{canvas.requestPaint();}catch{fallback();}});}
function fallback(){if(disposed)return;disposed=true;clearTimeout(watchdog);cancelAnimationFrame(scheduled);resizeObserver.disconnect();intersection.disconnect();document.removeEventListener('visibilitychange',visibility);window.removeEventListener('enadorry-motion',motion);reduced.removeEventListener('change',preference);source.removeAttribute('drawable');source.style.removeProperty('width');source.dataset.renderer='html';host.replaceWith(source);}
function size(){if(disposed)return;const w=host.clientWidth;if(!w)return;source.style.width=w+'px';const h=source.offsetHeight;if(!h)return;width=w;height=h;host.style.height=h+'px';const dpr=window.devicePixelRatio||1;const bw=Math.round(w*dpr),bh=Math.round(h*dpr);if(canvas.width!==bw)canvas.width=bw;if(canvas.height!==bh)canvas.height=bh;request();}
canvas.addEventListener('paint',()=>{if(disposed)return;try{
 ctx.reset();ctx.drawElementImage(source,0,0,canvas.width,canvas.height);
 // A quiet reflection lives in the same pixel composition as the HTML.
 if(pointer&&!paused){const sx=canvas.width/width,sy=canvas.height/height;const x=pointer.x*sx,y=pointer.y*sy;const radius=180*sx;const light=ctx.createRadialGradient(x,y,0,x,y,radius);light.addColorStop(0,'rgba(230,240,255,0.055)');light.addColorStop(1,'rgba(230,240,255,0)');ctx.fillStyle=light;ctx.fillRect(0,0,canvas.width,canvas.height);}
 if(!painted){painted=true;clearTimeout(watchdog);source.dataset.renderer='native';}
 }catch{fallback();}});
const resizeObserver=new ResizeObserver(size);resizeObserver.observe(host);resizeObserver.observe(source);
const intersection=new IntersectionObserver(es=>{visible=es[0].isIntersecting;if(visible){size();request();}});intersection.observe(host);
host.addEventListener('pointermove',e=>{if(paused||e.pointerType==='touch')return;const r=host.getBoundingClientRect();pointer={x:e.clientX-r.left,y:e.clientY-r.top};request();},{passive:true});host.addEventListener('pointerleave',()=>{pointer=null;request();});
function visibility(){pointer=null;if(document.hidden){cancelAnimationFrame(scheduled);scheduled=0;}else{size();request();}}
function motion(e){paused=!e.detail||reduced.matches;pointer=null;request();}
function preference(){paused=reduced.matches||document.body.classList.contains('n-paused');pointer=null;request();}
document.addEventListener('visibilitychange',visibility);window.addEventListener('enadorry-motion',motion);reduced.addEventListener('change',preference);
canvas.addEventListener('contextlost',fallback);source.addEventListener('load',request,true);source.addEventListener('error',request,true);source.addEventListener('focusin',request);source.addEventListener('focusout',request);
document.fonts?.ready.then(()=>{if(!disposed){size();request();}});
// A partially implemented API must never leave a blank project panel.
watchdog=setTimeout(()=>{if(!painted)fallback();},1800);size();request();
})();

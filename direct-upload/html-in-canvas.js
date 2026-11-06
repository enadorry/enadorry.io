/* Page-wide native HTML-in-Canvas. One semantic subtree per visible section;
   no giant document texture, no duplicate controls, no screenshot library. */
(() => {
  'use strict';
  if (!document.querySelector('main')) return;
  const reduced=matchMedia('(prefers-reduced-motion:reduce)'), coarse=matchMedia('(pointer:coarse)'), mobile=matchMedia('(max-width:900px)');
  let paused=reduced.matches||document.body.classList.contains('n-paused');
  let pointer=null, pointerUntil=0, tick=0, lastFrame=0, resizing=0;
  const units=[], byCanvas=new WeakMap();
  const atmosphere=document.createElement('canvas');atmosphere.className='lg-atmosphere';atmosphere.setAttribute('aria-hidden','true');document.body.prepend(atmosphere);
  const ambient=atmosphere.getContext('2d',{alpha:false});
  function ambientSize(){
    const ratio=Math.min(devicePixelRatio||1,1.25);
    atmosphere.width=Math.round(innerWidth*ratio);atmosphere.height=Math.round(innerHeight*ratio);
  }
  function drawAtmosphere(now){
    if(!ambient)return;
    const w=atmosphere.width,h=atmosphere.height,t=paused?1:now/11000;
    ambient.fillStyle='#000';ambient.fillRect(0,0,w,h);
    // Silver membranes stay in the dark; their fine colored edges provide depth behind glass.
    for(let layer=0;layer<3;layer++){
      const cx=w*(.72+Math.sin(t*.36+layer*1.7)*.15),cy=h*(.42+Math.cos(t*.31+layer*2)*.32);
      const a=w*(.23+layer*.04),b=h*(.15+layer*.055),angle=t*.05+layer*.8;
      ambient.save();ambient.translate(cx,cy);ambient.rotate(angle);
      const glow=ambient.createRadialGradient(0,0,0,0,0,a*1.15);
      glow.addColorStop(0,layer===1?'rgba(95,135,156,.095)':'rgba(126,137,168,.075)');glow.addColorStop(1,'rgba(0,0,0,0)');
      ambient.fillStyle=glow;ambient.fillRect(-a*1.2,-a*1.2,a*2.4,a*2.4);
      for(let i=0;i<14;i++){
        const f=i/13,phase=t*.16+layer;
        ambient.beginPath();
        ambient.moveTo(-a,Math.sin(phase)*b*.2);
        ambient.bezierCurveTo(-a*.5,-b*(1.+f*.5),a*.45,b*(.8-f*.5),a,Math.sin(phase+1)*b*.35);
        ambient.bezierCurveTo(a*.4,b*(1.1+f*.35),-a*.5,-b*(.9-f*.4),-a,Math.sin(phase)*b*.2);
        const g=ambient.createLinearGradient(-a,-b,a,b);
        g.addColorStop(0,'rgba(115,157,183,0)');g.addColorStop(.3,`rgba(141,188,206,${.035+(1-f)*.035})`);g.addColorStop(.5,`rgba(239,245,255,${.06+(1-f)*.055})`);g.addColorStop(.65,`rgba(160,142,202,${.04+(1-f)*.025})`);g.addColorStop(1,'rgba(155,176,202,0)');
        ambient.strokeStyle=g;ambient.lineWidth=i===0?1.5:.65;ambient.stroke();
      }
      ambient.restore();
    }
  }
  function schedule(){if(!tick&&!document.hidden)tick=requestAnimationFrame(frame);}
  function frame(now){
    tick=0;if(document.hidden)return;
    if(pointer&&now>=pointerUntil){pointer=null;units.forEach(u=>{if(u.visible)u.request();});}
    const active=pointer&&!paused;
    // No animation loop runs while stopped or hidden. The atmosphere is capped at 24 fps.
    if(now-lastFrame>1000/24){drawAtmosphere(now);lastFrame=now;if(active)units.forEach(u=>{if(u.visible)u.request();});}
    if(!paused)schedule();
  }
  function placeDock(){
    const dock=document.querySelector('.lg-canvas-shell[data-layout=dock]')||document.querySelector('body>.sound-dock');if(!dock)return;
    const box=dock.getBoundingClientRect(),margin=innerWidth<=600?12:24,y=innerHeight-box.height-(innerWidth<=600?12:20);
    const controls=[...document.querySelectorAll('main a,main button,main input,main select,main summary')].map(el=>el.getBoundingClientRect()).filter(r=>r.bottom>y-8&&r.top<y+box.height+8);
    const candidates=[innerWidth-box.width-margin,margin];
    const score=x=>controls.reduce((sum,r)=>sum+Math.max(0,Math.min(x+box.width,r.right+8)-Math.max(x,r.left-8))*Math.max(0,Math.min(y+box.height,r.bottom+8)-Math.max(y,r.top-8)),0);
    const x=score(candidates[1])<score(candidates[0])?candidates[1]:candidates[0];
    dock.style.left=Math.max(margin,x)+'px';dock.style.right='auto';dock.style.transform='none';
  }
  let dockFrame=0;
  function scheduleDock(){if(!dockFrame)dockFrame=requestAnimationFrame(()=>{dockFrame=0;placeDock();});}
  addEventListener('scroll',scheduleDock,{passive:true});addEventListener('resize',scheduleDock,{passive:true});
  ambientSize();drawAtmosphere(0);schedule();scheduleDock();
  const probe=document.createElement('canvas');probe.setAttribute('content','drawable');
  const probeContext=probe.getContext('2d');
  const supported=probe.content==='drawable'&&typeof probeContext?.drawElementImage==='function'&&typeof probe.requestPaint==='function';
  document.documentElement.dataset.pageCanvas=supported?'native':'html';
  function updateMotion(){
    paused=reduced.matches||document.body.classList.contains('n-paused');pointer=null;
    cancelAnimationFrame(tick);tick=0;drawAtmosphere(0);units.forEach(u=>u.request());if(!paused)schedule();
  }
  reduced.addEventListener('change',updateMotion);window.addEventListener('enadorry-motion',updateMotion);
  document.addEventListener('visibilitychange',()=>{pointer=null;cancelAnimationFrame(tick);tick=0;if(!document.hidden){drawAtmosphere(0);units.forEach(u=>u.request());schedule();}});
  window.addEventListener('pointermove',e=>{
    if(paused||coarse.matches||e.pointerType==='touch')return;
    const control=e.target.closest?.('a,button,input,select,textarea,summary,label,[role=tab],dialog');
    pointer=control||window.getSelection()?.toString()?null:{x:e.clientX,y:e.clientY};pointerUntil=performance.now()+900;
    units.forEach(u=>{if(u.visible&&u.lens)u.request();});schedule();
  },{passive:true});
  document.documentElement.addEventListener('pointerleave',()=>{pointer=null;units.forEach(u=>{if(u.visible)u.request();});});
  window.addEventListener('scroll',()=>{pointer=null;units.forEach(u=>{if(u.visible)u.request();});},{passive:true});
  if(!supported){window.addEventListener('resize',()=>{ambientSize();drawAtmosphere(0);},{passive:true});return;}
  // Native fallback descendants can be reported twice by browser hash scrolling.
  // Use the ordinary layout shell for anchor positions, rather than painted DOM geometry.
  const initialHash=location.hash;
  if(initialHash)history.replaceState(null,'',location.pathname+location.search);
  function anchorPosition(target){
    const source=target.closest('[drawable]'),host=source?.closest('.lg-canvas-shell');
    if(!host)return scrollY+target.getBoundingClientRect().top;
    let offset=0,node=target;
    while(node&&node!==source){offset+=node.offsetTop;node=node.offsetParent;}
    return scrollY+host.getBoundingClientRect().top+offset;
  }
  function alignAnchor(hash,push=false){
    let id;try{id=decodeURIComponent(hash.slice(1));}catch{return;}
    const target=document.getElementById(id);if(!target)return;
    if(push)history.pushState(null,'',hash);else history.replaceState(null,'',hash);
    window.scrollTo({top:Math.max(0,anchorPosition(target)-86),behavior:'instant'});
    units.forEach(u=>{if(u.visible)u.request();});
  }
  document.addEventListener('click',e=>{
    const a=e.target.closest?.('a[href^="#"]');if(!a||e.defaultPrevented||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;
    if(!document.getElementById(a.hash.slice(1)))return;
    e.preventDefault();alignAnchor(a.hash,true);
  });
  window.addEventListener('popstate',()=>{if(location.hash)alignAnchor(location.hash);});
  const intersection=new IntersectionObserver(entries=>entries.forEach(e=>{
    const u=byCanvas.get(e.target);if(!u)return;u.visible=e.isIntersecting;
    if(u.visible){u.size();u.request();}else u.release();
  }),{rootMargin:'120px'});
  function layout(source){
    if(source.matches('.n-header'))return 'header';if(source.matches('.sound-dock'))return 'dock';
    if(source.matches('.n-hero'))return 'hero';if(source.matches('.linear-showcase'))return 'showcase';
    if(source.matches('.n-section'))return 'section';if(source.matches('.footer'))return 'footer';
    if(source.matches('.pixel-companions'))return 'pets';if(source.parentElement?.matches('.detail-main'))return 'detail';return 'full';
  }
  function enhance(source){
    if(source.dataset.pageRenderer||source.closest('canvas')||source.matches('.n-statement')||source.offsetHeight<2||getComputedStyle(source).display==='none')return;
    // Mobile dropdowns stay in normal HTML, outside the canvas clipping box.
    if(source.matches('.n-header'))return;
    const kind=layout(source),rect=source.getBoundingClientRect(),style=getComputedStyle(source);
    const canvas=document.createElement('canvas');canvas.setAttribute('content','drawable');canvas.className='lg-page-canvas';
    const ctx=canvas.getContext('2d');if(!ctx?.drawElementImage)return;
    const host=document.createElement('div');host.className='lg-canvas-shell';host.dataset.layout=kind;
    host.style.marginTop=style.marginTop;host.style.marginBottom=style.marginBottom;
    if(kind==='dock')host.style.width=rect.width+'px';
    host.style.height=source.offsetHeight+'px';
    // Keep hash navigation on the original, semantic section. It remains in the accessibility tree.
    source.before(host);host.append(canvas);source.setAttribute('drawable','');canvas.append(source);source.dataset.pageRenderer='pending';
    let dead=false,raf=0,width=rect.width,height=source.offsetHeight,painted=false,watchdog=0,lastLens=false;
    const u={source,host,canvas,visible:rect.bottom>-120&&rect.top<innerHeight+120,lens:!['header','dock'].includes(kind),request,size,release};
    units.push(u);byCanvas.set(host,u);
    function request(){if(dead||!u.visible||document.hidden||raf)return;if(!painted&&!watchdog)watchdog=setTimeout(()=>{if(!painted)fallback();},2400);raf=requestAnimationFrame(()=>{raf=0;try{canvas.requestPaint();}catch{fallback();}});}
    function size(){
      if(dead)return;width=host.clientWidth;if(!width)return;
      height=source.offsetHeight;if(!height)return;host.style.height=height+'px';
      const dpr=Math.min(devicePixelRatio||1,coarse.matches?1:1.5);
      // Bound each backing store; offscreen stores are released on scrolling.
      const ratio=Math.min(dpr,Math.sqrt(5e6/(width*height)));
      const bw=Math.max(1,Math.round(width*ratio)),bh=Math.max(1,Math.round(height*ratio));
      if(u.visible){if(canvas.width!==bw)canvas.width=bw;if(canvas.height!==bh)canvas.height=bh;}
      request();
    }
    function release(){cancelAnimationFrame(raf);raf=0;clearTimeout(watchdog);watchdog=0;if(canvas.width>1)canvas.width=1;if(canvas.height>1)canvas.height=1;}
    function fallback(){
      if(dead)return;dead=true;release();resize.disconnect();intersection.unobserve(host);
      source.removeAttribute('drawable');source.dataset.pageRenderer='html';host.replaceWith(source);
      document.documentElement.dataset.pageCanvas='mixed';
    }
    canvas.addEventListener('paint',()=>{
      if(dead||!u.visible||document.hidden)return;
      try{
        ctx.reset();ctx.drawElementImage(source,0,0,width,height,0,0,canvas.width,canvas.height,{preserveElementGeometry:true});
        canvas.updateElementGeometry(source,{canvasTransform:new DOMMatrix()});
        lastLens=false;
        const r=host.getBoundingClientRect();
        if(u.lens&&pointer&&!paused&&!source.contains(document.activeElement)&&!window.getSelection()?.toString()&&performance.now()<pointerUntil){
          const x=pointer.x-r.left,y=pointer.y-r.top;
          if(x>0&&x<width&&y>0&&y<height){
            const scale=canvas.width/width,cx=x*scale,cy=y*scale,radius=Math.min(112,width*.23)*scale,zoom=1.075;
            ctx.save();ctx.beginPath();ctx.arc(cx,cy,radius,0,Math.PI*2);ctx.clip();
            // The second draw bends pixels while preserving the original link and focus geometry.
            ctx.drawElementImage(source,(x-radius/scale/zoom),(y-radius/scale/zoom),radius*2/scale/zoom,radius*2/scale/zoom,cx-radius,cy-radius,radius*2,radius*2,{preserveElementGeometry:true});
            const light=ctx.createLinearGradient(cx-radius,cy-radius,cx+radius,cy+radius);
            light.addColorStop(0,'rgba(226,248,255,.18)');light.addColorStop(.25,'rgba(221,243,255,.012)');light.addColorStop(.7,'rgba(208,216,255,.012)');light.addColorStop(1,'rgba(205,217,255,.07)');
            ctx.fillStyle=light;ctx.fillRect(cx-radius,cy-radius,radius*2,radius*2);ctx.restore();
            ctx.beginPath();ctx.arc(cx,cy,radius,0,Math.PI*2);ctx.strokeStyle='rgba(225,241,255,.19)';ctx.lineWidth=scale*.75;ctx.stroke();lastLens=true;
          }
        }
        if(!painted){source.dataset.pageRenderer='native';painted=true;clearTimeout(watchdog);}
      }catch(error){console.warn('[Page Canvas] Restoring accessible HTML',error);fallback();}
    });
    const resize=new ResizeObserver(()=>{if(u.visible)size();else{height=source.offsetHeight;host.style.height=height+'px';}});resize.observe(source);resize.observe(host);
    source.addEventListener('load',request,true);source.addEventListener('error',request,true);
    source.addEventListener('focusin',request);source.addEventListener('focusout',request);
    canvas.addEventListener('contextlost',fallback);
    u.restore=fallback;
    intersection.observe(host);size();

  }
  // Split only at normal document-flow boundaries; each grid and every form stays intact.
  function sources(){return [...document.querySelectorAll('main>section, .detail-main>header, .detail-main>figure, .detail-main>div:not(#home), .detail-main>section, .detail-main>a.next-work, body>.n-header, body>.footer, body>.pixel-companions, body>.sound-dock')];}
  sources().forEach(enhance);
  if(initialHash)requestAnimationFrame(()=>requestAnimationFrame(()=>alignAnchor(initialHash)));
  mobile.addEventListener('change',()=>{
    if(mobile.matches)units.filter(u=>u.source.matches('.n-header')).forEach(u=>u.restore());
    else{const h=document.querySelector('body>.n-header');if(h){delete h.dataset.pageRenderer;enhance(h);}}
  });
  window.addEventListener('resize',()=>{clearTimeout(resizing);resizing=setTimeout(()=>{ambientSize();drawAtmosphere(0);units.forEach(u=>{if(u.visible)u.size();});},80);},{passive:true});
  document.fonts?.ready.then(()=>units.forEach(u=>{if(u.visible)u.size();}));
})();

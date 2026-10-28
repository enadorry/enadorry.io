(() => {
  const garden = document.getElementById('pet-garden');
  if (!garden) return;
  const pauseButton = document.getElementById('garden-pause');
  const resetButton = document.getElementById('garden-reset');
  const status = document.getElementById('garden-status');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const states = {
    idle: {strip:'idle', frames:6, step:190, line:'のんびりしてるよ。'},
    walk: {strip:'walk-right', frames:8, step:125, line:'お庭をおさんぽ！'},
    sleep: {strip:'idle', frames:6, still:2, line:'すやすや…'},
    greet: {strip:'greet', frames:4, step:180, line:'やっほー！'},
    jump: {strip:'jump', frames:5, step:170, line:'ぴょんっ！'},
    failed: {strip:'failed', frames:8, step:160, line:'むぅ…もう一回！'},
    waiting: {strip:'waiting', frames:6, step:200, line:'次は何して遊ぶ？'},
    working: {strip:'working', frames:6, step:160, line:'ちょっと作業中！'},
    review: {strip:'review', frames:6, step:190, line:'ふむふむ、確認中…。'},
    look: {strip:'look', frames:16, step:230, line:'きょろきょろ…'}
  };
  const clickOrder = ['jump','greet','sleep','working','look','walk','review','waiting','idle','failed'];
  const periods = {
    morning: {label:'MORNING / おはよう', choices:['greet','walk','walk','idle','look','working'], sleep:0.08},
    day: {label:'DAYTIME / あそぶ時間', choices:['walk','walk','jump','greet','working','review','look','idle'], sleep:0.05},
    evening: {label:'EVENING / のんびり', choices:['idle','look','waiting','walk','review'], sleep:0.25},
    night: {label:'NIGHT / おやすみ', choices:['idle','look','waiting'], sleep:0.90}
  };
  let period = null;
  const timeLabel = document.getElementById('garden-time');
  function periodAt(hour) {
    return hour>=6 && hour<10 ? 'morning' : hour>=10 && hour<18 ? 'day' : hour>=18 && hour<22 ? 'evening' : 'night';
  }
  function chooseBehavior(pet, initial=false) {
    const profile=periods[period];
    const nightOwl=['oto','noise'].includes(pet.slug);
    const sleepChance=period==='night' && nightOwl ? 0.45 : profile.sleep;
    if(initial && period==='night') return nightOwl?'look':'sleep';
    if(Math.random()<sleepChance) return 'sleep';
    return profile.choices[Math.floor(Math.random()*profile.choices.length)];
  }
  function refreshTime() {
    const date=new Date();
    const next=periodAt(date.getHours());
    if(timeLabel) timeLabel.textContent=String(date.getHours()).padStart(2,'0')+':'+String(date.getMinutes()).padStart(2,'0')+' / '+periods[next].label;
    garden.dataset.period=next;
    if(next!==period) {
      period=next;
      pets.forEach(pet=>{if(!pet.locked && !pet.dragging){setState(pet,chooseBehavior(pet,true));paint(pet);}});
    }
  }
  const initial = [.42,.50,.58,.66,.74,.82,.90].flatMap(y => [.12,.31,.50,.69,.88].map(x => [x,y]))
    .filter(([x,y]) => ((x-.69)/.18)**2 + ((y-.69)/.135)**2 > 1);

  const images = new Map();
  let width = 1, height = 1, petSize = 70;
  let visible = false, paused = reduced.matches, raf = 0, previousTime = 0, clock = 0;
  const random = (a,b) => a + Math.random() * (b-a);
  // Feet stay within the lawn; the pond is an obstacle, not a walkable area.
  function inLawn(x,y) {
    const margin = (petSize/2 + 8) / width;
    return x >= margin && x <= 1-margin && y >= .40 && y <= .92 &&
      ((x-.69)/.18)**2 + ((y-.69)/.135)**2 > 1;
  }
  const pets = [...garden.querySelectorAll('.garden-pet')].map((button,i) => ({
    button, ctx:button.querySelector('canvas').getContext('2d'),
    slug:button.dataset.character, name:button.dataset.name,
    x:initial[i % initial.length][0], y:initial[i % initial.length][1], target:null, facing:1,
    speed:random(17,27), state:null, started:0, next:0,
    locked:false, dragging:false, drag:null, suppressClick:false, landingTimer:null, clickIndex:0, bubbleTimer:null, painted:'', lastPosition:''
  }));
  function getImage(pet,strip) {
    const src = `/assets/room/${pet.slug}-${strip}.webp`;
    if (!images.has(src)) {
      const image = new Image();
      images.set(src,image);
      image.onload = () => { paint(pet); start(); };
      image.onerror = () => { pet.button.dataset.assetError = 'true'; };
      image.src = src;
    }
    return images.get(src);
  }
  function targetFor(pet) {
    for (let attempt=0; attempt<60; attempt++) {
      const x=random(.09,.91), y=random(.43,.90);
      if (!inLawn(x,y)) continue;
      // Check the entire line segment so a path cannot cut through the pond.
      let safe=true;
      for (let j=1;j<=20;j++) {
        const t=j/20;
        if (!inLawn(pet.x+(x-pet.x)*t,pet.y+(y-pet.y)*t)) {safe=false;break;}
      }
      if (safe && Math.hypot((x-pet.x)*width,(y-pet.y)*height)>35) return {x,y};
    }
    return null;
  }
  function setState(pet,state) {
    pet.state=state; pet.started=clock;
    pet.next=clock+(state==='sleep' ? (period==='night'?random(90000,180000):random(18000,35000)) : state==='walk'?random(7000,14000):random(4000,8500));
    pet.target=state==='walk'?targetFor(pet):null;
    pet.button.dataset.behavior=state;
    pet.painted='';
    getImage(pet,states[state].strip);
    if(state==='walk') getImage(pet,'walk-left');
  }
  function place(pet) {
    const position=`translate3d(${(pet.x*width).toFixed(1)}px,${(pet.y*height).toFixed(1)}px,0) translate(-50%,-100%)`;
    if (position!==pet.lastPosition) {
      pet.button.style.transform=position;
      pet.button.style.zIndex=pet.dragging?'2000':String(Math.round(pet.y*1000));
      pet.lastPosition=position;
    }
  }
  function paint(pet) {
    if (!pet.state) return;
    const state=pet.dragging?states.greet:states[pet.state];
    const strip=pet.dragging?'greet':pet.state==='walk' && pet.facing<0?'walk-left':state.strip;
    let image=getImage(pet,strip), frame;
    if (!image.complete || !image.naturalWidth) {
      image=getImage(pet,'idle');
      if (!image.complete || !image.naturalWidth) return;
      frame=0;
    } else {
      frame=pet.dragging?1:state.still ?? (reduced.matches ? 0 : Math.floor((clock-pet.started)/(state.step||200))%state.frames);
    }
    // Never redraw a sleeping/static character until the source frame changes.
    const key=image.src+':'+frame;
    if (key===pet.painted) return;
    pet.painted=key;
    pet.ctx.clearRect(0,0,192,208);
    const frameHeight=image.naturalHeight, frameWidth=frameHeight*192/208;
    pet.ctx.drawImage(image,frame*frameWidth,0,frameWidth,frameHeight,0,0,192,208);
  }
  function step(pet,dt) {
    if(pet.dragging) {place(pet);paint(pet);return;}
    if (!pet.locked && clock>=pet.next) {
      let next=chooseBehavior(pet);
      if (next===pet.state && next!=='sleep' && next!=='walk') next=period==='night'?'sleep':'walk';
      setState(pet,next);
    }
    if(pet.state==='walk') {
      if(!pet.target) pet.target=targetFor(pet);
      if(pet.target) {
        const dx=(pet.target.x-pet.x)*width, dy=(pet.target.y-pet.y)*height;
        const distance=Math.hypot(dx,dy);
        if(distance<4) {
          pet.target=null;
          if(!pet.locked) setState(pet,chooseBehavior(pet));
        } else {
          const amount=Math.min(distance,pet.speed*dt);
          let x=pet.x+dx/distance*amount/width, y=pet.y+dy/distance*amount/height;
          const nearby=pets.find(other=>other!==pet && Math.hypot((x-other.x)*width,(y-other.y)*height)<petSize*.62);
          if(nearby) {
            pet.target=null;
            if(!pet.locked) setState(pet,period==='night'?'sleep':'idle');
          } else if(inLawn(x,y)) {
            pet.x=x; pet.y=y;
            if(Math.abs(dx)>1) pet.facing=dx<0?-1:1;
          } else pet.target=null;
        }
      }
    }
    place(pet);paint(pet);
  }
  function running() {return visible && !document.hidden && !paused && !reduced.matches;}
  function tick(now) {
    raf=0;
    if(!running()) {previousTime=0;return;}
    if(!previousTime) previousTime=now;
    const elapsed=now-previousTime;
    // One scheduler for all residents, capped at 20 fps. Hidden time never catches up.
    if(elapsed>=50) {
      const dt=Math.min(elapsed,100)/1000;
      clock+=dt*1000;previousTime=now;
      pets.forEach(pet=>step(pet,dt));
    }
    raf=requestAnimationFrame(tick);
  }
  function start() {
    garden.classList.toggle('garden-running',running());
    if(running() && !raf) {previousTime=0;raf=requestAnimationFrame(tick);}
    if(!running() && raf) {cancelAnimationFrame(raf);raf=0;previousTime=0;}
  }
  function syncPause() {
    pauseButton.setAttribute('aria-pressed',String(paused||reduced.matches));
    pauseButton.textContent=(paused||reduced.matches)?'動きを再開する':'動きを止める';
    if(reduced.matches) pauseButton.textContent='動きを減らす設定を使用中';
    pauseButton.disabled=reduced.matches;
  }
  function layout() {
    width=garden.clientWidth; height=garden.clientHeight;
    petSize=Math.max(44,Math.min(80,width/9));
    garden.style.setProperty('--pet-size',petSize+'px');
    pets.forEach(pet=>{
      const margin=(petSize/2+8)/width;
      pet.x=Math.max(margin,Math.min(1-margin,pet.x));
      pet.target=null;place(pet);paint(pet);
    });
  }
  // Pointer capture keeps mouse/touch drags working outside the character.
  let activeDrag = null;
  function safeDrop(x,y) {
    const margin=(petSize/2+8)/width;
    x=Math.max(margin,Math.min(1-margin,x));y=Math.max(.40,Math.min(.92,y));
    if(inLawn(x,y)) return {x,y};
    // Choose the closest dry spot when the pointer ends over the pond.
    let best=null, distance=Infinity;
    for(let yy=.40;yy<=.92001;yy+=.01) for(let xx=margin;xx<=1-margin;xx+=.01) {
      if(!inLawn(xx,yy)) continue;
      const d=((xx-x)*width)**2+((yy-y)*height)**2;
      if(d<distance) {distance=d;best={x:xx,y:yy};}
    }
    return best || {x:margin,y:.42};
  }
  function finishDrag(pet,cancel=false) {
    const drag=pet.drag;if(!drag) return;
    pet.drag=null;activeDrag=null;
    if(pet.dragging) {
      const drop=cancel?drag.original:safeDrop(pet.x,pet.y);
      pet.x=drop.x;pet.y=drop.y;pet.dragging=false;pet.suppressClick=true;
      pet.button.classList.remove('is-dragging');
      pet.lastPosition='';pet.painted='';pet.target=null;
      // Resume the existing perpetual selection or autonomous daily routine.
      place(pet);paint(pet);
      if(!cancel) {
        clearTimeout(pet.landingTimer);pet.button.classList.add('is-landing');
        pet.landingTimer=setTimeout(()=>pet.button.classList.remove('is-landing'),380);
        status.textContent=pet.name+'を移動しました。';
      }
    }
    if(pet.button.hasPointerCapture?.(drag.id)) pet.button.releasePointerCapture(drag.id);
    start();
  }
  function wireDrag(pet) {
    const button=pet.button;
    button.addEventListener('pointerdown',event=>{
      if(event.button!==0 || event.isPrimary===false || activeDrag) return;
      const rect=garden.getBoundingClientRect();
      pet.suppressClick=false;
      pet.drag={id:event.pointerId,startX:event.clientX,startY:event.clientY,
        offsetX:event.clientX-rect.left-pet.x*width,offsetY:event.clientY-rect.top-pet.y*height,
        original:{x:pet.x,y:pet.y}};
      activeDrag=pet;button.setPointerCapture(event.pointerId);
    });
    button.addEventListener('pointermove',event=>{
      const drag=pet.drag;if(!drag || drag.id!==event.pointerId) return;
      if(!pet.dragging && Math.hypot(event.clientX-drag.startX,event.clientY-drag.startY)<6) return;
      event.preventDefault();
      if(!pet.dragging) {
        pet.dragging=true;pet.target=null;pet.painted='';
        clearTimeout(pet.landingTimer);clearTimeout(pet.bubbleTimer);
        button.classList.remove('is-landing','is-chatting');button.classList.add('is-dragging');
        getImage(pet,'greet');status.textContent=pet.name+'を持ち上げました。';
      }
      const rect=garden.getBoundingClientRect(),margin=(petSize/2+8)/width;
      pet.x=Math.max(margin,Math.min(1-margin,(event.clientX-rect.left-drag.offsetX)/width));
      pet.y=Math.max(.40,Math.min(.92,(event.clientY-rect.top-drag.offsetY)/height));
      pet.lastPosition='';place(pet);paint(pet);
    });
    button.addEventListener('pointerup',event=>{if(pet.drag?.id===event.pointerId) finishDrag(pet);});
    button.addEventListener('pointercancel',event=>{if(pet.drag?.id===event.pointerId) finishDrag(pet,true);});
    button.addEventListener('lostpointercapture',()=>finishDrag(pet,true));
    button.addEventListener('keydown',event=>{
      const delta={ArrowLeft:[-24,0],ArrowRight:[24,0],ArrowUp:[0,-24],ArrowDown:[0,24]}[event.key];
      if(!delta || pet.drag) return;
      event.preventDefault();const drop=safeDrop(pet.x+delta[0]/width,pet.y+delta[1]/height);
      pet.x=drop.x;pet.y=drop.y;pet.target=null;place(pet);status.textContent=pet.name+'を移動しました。';
    });
  }
  pets.forEach((pet,i)=>{
    wireDrag(pet);
    pet.button.addEventListener('click',event=>{
      if(pet.suppressClick && event?.detail!==0) {pet.suppressClick=false;return;}
      pet.locked=true;
      const state=clickOrder[pet.clickIndex++%clickOrder.length];
      setState(pet,state);paint(pet);start();
      const speech=pet.button.querySelector('.garden-speech');
      speech.textContent=states[state].line;
      // Clamp the bubble to the garden on narrow screens.
      const shift=Math.max(75-pet.x*width,Math.min(0,width-pet.x*width-75));
      speech.style.marginLeft=shift+'px';
      pet.button.classList.add('is-chatting');
      status.textContent=pet.name+'：'+states[state].line;
      clearTimeout(pet.bubbleTimer);
      pet.bubbleTimer=setTimeout(()=>pet.button.classList.remove('is-chatting'),2400);
    });
  });
  pauseButton.addEventListener('click',()=>{paused=!paused;syncPause();start();});
  resetButton.addEventListener('click',()=>{
    refreshTime();
    pets.forEach(pet=>{pet.locked=false;setState(pet,chooseBehavior(pet,true));paint(pet);});
    status.textContent='みんな自由に過ごしはじめました。';start();
  });
  layout();
  pets.forEach(pet=>getImage(pet,'idle'));
  refreshTime();
  new ResizeObserver(layout).observe(garden);
  const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;start();},{rootMargin:'80px'});
  observer.observe(garden);
  document.addEventListener('visibilitychange',()=>{if(document.hidden && activeDrag) finishDrag(activeDrag,true);if(!document.hidden) refreshTime();start();});
  // Minute updates use wall-clock time; animation stays on the existing visible-only scheduler.
  setInterval(()=>{if(!document.hidden){refreshTime();start();}},60000);
  reduced.addEventListener('change',()=>{syncPause();pets.forEach(paint);start();});
  syncPause();
})();

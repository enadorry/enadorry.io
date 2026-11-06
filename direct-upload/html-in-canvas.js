/* Live semantic HTML → native GPU texture. No DOM screenshot library or duplicate links. */
(() => {
  'use strict';
  const source = document.querySelector('.linear-project-preview');
  if (!source) return;
  const canvas = document.createElement('canvas');
  canvas.setAttribute('content', 'drawable');
  const gl = canvas.getContext('webgl2', {alpha: false, antialias: true, powerPreference: 'low-power'});
  if (canvas.content !== 'drawable' || !gl || typeof gl.texElementSubImage2D !== 'function' || typeof canvas.updateElementGeometry !== 'function') {
    source.dataset.renderer = 'html'; return;
  }
  const vertex = `#version 300 es
  precision highp float;
  in vec2 position;
  out vec2 uv;
  out float shade;
  uniform float mode, time, strength, aspect, turn;
  uniform vec2 pointer;
  void main(){
    uv=position; shade=1.;
    vec2 p=position*2.-1.; p.y=-p.y;
    if(mode==2.){
      float pin=sin(position.x*3.141593)*smoothstep(0.,.18,position.y);
      float wave=sin(position.x*12.-time*2.+position.y*4.);
      float pull=exp(-length((position-pointer)*vec2(aspect,1.))*9.);
      p.y+=pin*(wave*.045+sin(position.x*21.+time*1.3)*.015)*strength;
      p.x+=pin*sin(position.y*10.+time)*.015*strength;
      p.y+=pull*.12*strength;
      shade=1.+wave*pin*.16*strength;
    }
    if(mode==5.){
      float y=(pointer.x-.5)*.22*strength;
      float x=(pointer.y-.5)*.10*strength;
      float z=p.x*sin(y)+p.y*sin(x);
      p*=1./(1.+z*.16);
      p.x*=cos(y); p.y*=cos(x);
      p*=1.-.035*strength;
    }
    gl_Position=vec4(p,0.,1.);
  }`;
  const fragment = `#version 300 es
  precision highp float;
  in vec2 uv; in float shade; out vec4 outputColor;
  uniform sampler2D current, previous;
  uniform vec2 pointer, resolution;
  uniform float mode, time, strength, aspect, turn;
  vec4 samplePage(vec2 p){
    if(any(lessThan(p,vec2(0.)))||any(greaterThan(p,vec2(1.))))return vec4(0.,0.,0.,1.);
    return texture(current,p);
  }
  float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  void main(){
    vec2 p=uv;
    vec2 d=(uv-pointer)*vec2(aspect,1.);
    float r=length(d), lens=1.-smoothstep(.10,.27,r);
    float envelope=sin(turn*3.141593);
    float chroma=0.;
    float light=0.;
    if(mode==1.){
      vec2 direction=d/max(r,.001)/vec2(aspect,1.);
      float wave=sin(r*32.-time*5.)*exp(-r*5.)*.021*strength;
      p+=direction*wave;
      p.x+=sin(uv.y*15.+turn*10.)*.045*envelope;
      chroma=.003*strength*exp(-r*4.)+.006*envelope;
    }
    if(mode==4.||mode==5.){
      vec2 c=uv*2.-1.;
      p=.5+c*(1.+.065*dot(c,c)*strength)*.5;
      chroma=.0018*strength;
    }
    if(mode==6.){
      p=pointer+(uv-pointer)*(1.-lens*.17*strength);
      chroma=.005*lens*strength;
      float rim=exp(-pow((r-.205)/.004,2.));
      light=(rim*.25+exp(-pow((r-.192)/.012,2.))*.06)*strength;
    }
    if(mode==7.){
      float cut=uv.x*.80+uv.y*.20-pointer.x;
      float edge=1.-smoothstep(0.,.003,abs(cut));
      p.y+=sign(cut)*.025*strength;
      light=edge*.6*strength;
    }
    vec4 col=samplePage(p);
    col.r=samplePage(p+vec2(chroma,0.)).r;
    col.b=samplePage(p-vec2(chroma,0.)).b;
    if(mode==3. && turn>0. && turn<1.){
      float fold=1.25-turn*1.5;
      float dist=uv.x-fold;
      if(dist<0.) col=texture(previous,uv);
      else if(dist<.17){
        vec2 back=vec2(fold-dist*.8,uv.y+sin(dist/.17*3.141593)*.025);
        vec3 paper=texture(previous,clamp(back,0.,1.)).rgb;
        col=vec4(mix(vec3(.14),paper,.25)*( .5+.5*sin(dist/.17*3.141593)),1.);
      } else {col.rgb*=1.-.6*exp(-(dist-.17)*30.);}
    } else if(mode==8. && turn>0. && turn<1.){
      vec2 grid=vec2(10.,6.); vec2 cell=floor(uv*grid);
      float delay=(cell.x+cell.y)*.018;
      float t=clamp((turn-delay)/.70,0.,1.);
      float face=cos(t*3.141593);
      vec2 local=fract(uv*grid)-.5;
      if(abs(local.x)>abs(face)*.5){col=vec4(0.,0.,0.,1.);}
      else{
        vec2 q=(cell+vec2(local.x/max(abs(face),.001)+.5,local.y+.5))/grid;
        col=t<.5?texture(previous,q):texture(current,q);
        col.rgb*=.45+.55*abs(face);
      }
    } else if(mode==7. && turn>0. && turn<1.){
      float edge=turn*1.4-.2;
      float diag=uv.x*.8+uv.y*.2;
      col=mix(texture(previous,uv),col,1.-smoothstep(edge-.005,edge+.005,diag));
      light+=(1.-smoothstep(0.,.005,abs(diag-edge)))*.8;
    } else if(turn>0. && turn<1.){
      float reveal=smoothstep(0.,.65,turn);
      col=mix(texture(previous,uv),col,reveal);
    }
    if(mode==4.||mode==5.){
      float scan=.94+.06*sin(uv.y*resolution.y*3.141593);
      vec2 c=uv*2.-1.;
      float vignette=1.-.22*dot(c,c);
      col.rgb*=mix(1.,scan*vignette,strength);
      col.rgb+= (hash(floor(uv*resolution))-.5)*.012*strength;
    }
    col.rgb=col.rgb*shade+light;
    outputColor=vec4(col.rgb,1.);
  }`;
  let program, buffer, index, textures = [], disposed = false;
  function shader(type, code) {
    const s = gl.createShader(type); gl.shaderSource(s, code); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {const info=gl.getShaderInfoLog(s);gl.deleteShader(s);throw Error('shader: '+info);}
    return s;
  }
  function texture() {
    const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  }
  const uniforms = {};
  let count = 0;
  try {
    program = gl.createProgram();
    const vs = shader(gl.VERTEX_SHADER, vertex), fs = shader(gl.FRAGMENT_SHADER, fragment);
    gl.attachShader(program, vs); gl.attachShader(program, fs); gl.linkProgram(program);
    gl.deleteShader(vs); gl.deleteShader(fs);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw Error('program');
    gl.useProgram(program);
    for (const name of ['current','previous','pointer','resolution','mode','time','strength','aspect','turn']) uniforms[name]=gl.getUniformLocation(program,name);
    const cols = 64, rows = 40, points = [], indices = [];
    for(let y=0;y<=rows;y++)for(let x=0;x<=cols;x++)points.push(x/cols,y/rows);
    for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
      const a=y*(cols+1)+x;indices.push(a,a+1,a+cols+1,a+1,a+cols+2,a+cols+1);
    }
    count=indices.length;
    buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(points),gl.STATIC_DRAW);
    const pos=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);
    index=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,index);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(indices),gl.STATIC_DRAW);
    textures=[texture(),texture()];gl.uniform1i(uniforms.current,0);gl.uniform1i(uniforms.previous,1);
  } catch (error) {
    console.warn('[HTML-in-Canvas] GPU initialization failed',error);
    cleanupGPU(); source.dataset.renderer='html'; return;
  }
  const host = document.createElement('div'); host.className='hic-host';canvas.className='hic-canvas';
  const initialWidth=source.offsetWidth, initialHeight=source.offsetHeight;
  if (!initialWidth || !initialHeight) {cleanupGPU();return;}
  host.style.height=initialHeight+'px';source.before(host);host.append(canvas);
  source.setAttribute('drawable','');source.style.width=initialWidth+'px';canvas.append(source);source.dataset.renderer='pending';
  const bar=document.createElement('div');bar.className='hic-effects';bar.setAttribute('role','group');bar.setAttribute('aria-label','作品パネルのエフェクト');
  const modes=[['ゆがみ',1],['布',2],['ページ',3],['CRT',4],['CRT 3D',5],['ガラス',6],['レーザー',7],['タイル',8],['OFF',0]];
  let mode=1;
  for(const [label,id] of modes){
    const b=document.createElement('button');b.type='button';b.textContent=label;b.dataset.effect=id;b.setAttribute('aria-pressed',String(id===mode));
    b.addEventListener('click',()=>{
      mode=id;host.dataset.effect=String(id);bar.querySelectorAll('button').forEach(el=>el.setAttribute('aria-pressed',String(el===b)));
      target=id===0?0:.7;activeUntil=performance.now()+1100;
      if(id===0){power=0;turning=false;pendingTurn=false;}else startTurn();request();
    });bar.append(b);
  }
  document.querySelector('.linear-toolbar').after(bar);host.dataset.effect=String(mode);
  let visible=true, frame=0, watchdog=0, painted=false, w=initialWidth, h=initialHeight, tw=0, th=0;
  let dirty=true, pendingTurn=false, turnStart=0, turning=false, pointer={x:.5,y:.4}, target=0, power=0, activeUntil=0, dragging=false, focus=false, last=0;
  const reduced=matchMedia('(prefers-reduced-motion:reduce)');
  let paused=reduced.matches||document.body.classList.contains('n-paused');
  const listeners=[];
  function listen(node,event,fn,options){node.addEventListener(event,fn,options);listeners.push(()=>node.removeEventListener(event,fn,options));}
  function cleanupGPU(){textures.forEach(t=>gl.deleteTexture(t));if(buffer)gl.deleteBuffer(buffer);if(index)gl.deleteBuffer(index);if(program)gl.deleteProgram(program);}
  function fallback(){
    if(disposed)return;disposed=true;clearTimeout(watchdog);cancelAnimationFrame(frame);resize.disconnect();intersection.disconnect();mutations.disconnect();listeners.forEach(remove=>remove());
    cleanupGPU();bar.remove();source.removeAttribute('drawable');source.style.removeProperty('width');source.dataset.renderer='html';host.replaceWith(source);
  }
  function request(){
    if(disposed||!visible||document.hidden||frame)return;
    frame=requestAnimationFrame(()=>{frame=0;try{canvas.requestPaint();}catch{fallback();}});
  }
  function size(){
    if(disposed)return;const width=host.clientWidth;if(!width)return;
    source.style.width=width+'px';const height=source.offsetHeight;if(!height)return;
    w=width;h=height;host.style.height=h+'px';
    const dpr=Math.min(window.devicePixelRatio||1,2);
    canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
    // Texture size follows the browser's native DOM raster size; framebuffer DPR is capped separately.
    tw=0;dirty=true;turning=false;pendingTurn=false;request();
  }
  function upload(unit){
    gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,textures[unit]);
    gl.texElementSubImage2D(gl.TEXTURE_2D,0,0,0,source);
    if(gl.getError()!==gl.NO_ERROR)throw Error('upload');
  }
  function startTurn(){
    if(paused||focus||mode===0||!painted)return;
    // Swap the cached textures in paint, before uploading the next live DOM snapshot.
    pendingTurn=true;dirty=true;
  }
  listen(canvas,'paint',()=>{
    if(disposed)return;
    try{
      const natural=canvas.getElementImageDefaultSize(source);
      const nw=Math.ceil(natural.width),nh=Math.ceil(natural.height);
      if(!nw||!nh)return;
      if(tw!==nw||th!==nh){
        tw=nw;th=nh;
        textures.forEach((t,i)=>{gl.activeTexture(gl.TEXTURE0+i);gl.bindTexture(gl.TEXTURE_2D,t);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA8,tw,th,0,gl.RGBA,gl.UNSIGNED_BYTE,null);});
        dirty=true;pendingTurn=false;turning=false;upload(1);
      }
      if(pendingTurn)[textures[0],textures[1]]=[textures[1],textures[0]];
      if(dirty){upload(0);dirty=false;}
      if(pendingTurn){turnStart=performance.now();turning=true;pendingTurn=false;}
      const now=performance.now();const dt=Math.min((now-last)||16,64);last=now;
      if(now>activeUntil&&!dragging)target=0;
      const desired=paused||focus||mode===0?0:target;
      power+=(desired-power)*(1.-Math.exp(-dt/130));
      if(Math.abs(power-desired)<.001)power=desired;
      const turn=turning&&!paused&&!focus&&mode!==0?Math.min((now-turnStart)/1000,1):1;
      if(turn===1)turning=false;
      gl.viewport(0,0,canvas.width,canvas.height);gl.clearColor(0,0,0,1);gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(program);textures.forEach((t,i)=>{gl.activeTexture(gl.TEXTURE0+i);gl.bindTexture(gl.TEXTURE_2D,t);});
      gl.uniform2f(uniforms.pointer,pointer.x,pointer.y);gl.uniform2f(uniforms.resolution,canvas.width,canvas.height);
      gl.uniform1f(uniforms.mode,paused||focus?0:mode);gl.uniform1f(uniforms.time,now/1000);gl.uniform1f(uniforms.strength,power);
      gl.uniform1f(uniforms.aspect,w/h);gl.uniform1f(uniforms.turn,turn);
      gl.drawElements(gl.TRIANGLES,count,gl.UNSIGNED_SHORT,0);
      // Keep the actual HTML link's keyboard and pointer bounds in CSS pixels.
      canvas.updateElementGeometry(source,{canvasTransform:new DOMMatrix()});
      if(!painted){painted=true;source.dataset.renderer='native-webgl';clearTimeout(watchdog);}
      if(!paused&&(turning||power>.001||desired>0))request();
    }catch(error){console.warn('[HTML-in-Canvas] Restoring HTML',error);fallback();}
  });
  const resize=new ResizeObserver(size);resize.observe(host);resize.observe(source);
  const intersection=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible){dirty=true;request();}else{cancelAnimationFrame(frame);frame=0;target=0;}});intersection.observe(host);
  const mutations=new MutationObserver(()=>{dirty=true;request();});mutations.observe(source,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['src','alt','href','class']});
  function point(e){
    if(paused||focus)return;
    const rect=host.getBoundingClientRect();pointer={x:Math.max(0,Math.min(1,(e.clientX-rect.left)/w)),y:Math.max(0,Math.min(1,(e.clientY-rect.top)/h))};
    // The description and real link settle to their original geometry immediately.
    if(e.target.closest?.('a,button')||pointer.y>.70){target=0;power=0;turning=false;}else{target=dragging?1:.85;activeUntil=performance.now()+850;}
    request();
  }
  listen(host,'pointermove',point,{passive:true});
  listen(host,'pointerdown',e=>{
    if(e.target.closest?.('a,button'))return;
    dragging=true;point(e);
    // Vertical touch scrolling remains native; no preventDefault or pointer capture.
  },{passive:true});
  listen(window,'pointerup',()=>{dragging=false;target=0;request();},{passive:true});
  listen(window,'pointercancel',()=>{dragging=false;target=0;request();},{passive:true});
  listen(host,'pointerleave',()=>{dragging=false;target=0;request();});
  listen(source,'pointerover',()=>{dirty=true;request();});
  listen(source,'pointerout',()=>{dirty=true;request();});
  listen(source,'focusin',()=>{focus=true;target=0;power=0;turning=false;dirty=true;request();});
  listen(source,'focusout',()=>{focus=false;dirty=true;request();});
  listen(source,'load',()=>{dirty=true;request();},true);listen(source,'error',()=>{dirty=true;request();},true);
  // Capture phase preserves the outgoing page before linear-showcase.js updates its contents.
  document.querySelectorAll('[data-project]').forEach(b=>listen(b,'click',()=>{if(b.getAttribute('aria-pressed')!=='true')startTurn();},true));
  function preference(){paused=reduced.matches||document.body.classList.contains('n-paused');target=0;power=0;turning=false;dirty=true;request();}
  listen(reduced,'change',preference);listen(window,'enadorry-motion',preference);
  listen(document,'visibilitychange',()=>{target=0;power=0;dragging=false;turning=false;if(document.hidden){cancelAnimationFrame(frame);frame=0;}else{dirty=true;request();}});
  listen(canvas,'webglcontextlost',fallback);
  document.fonts?.ready.then(()=>{if(!disposed)size();});
  watchdog=setTimeout(()=>{if(!painted)fallback();},2200);size();request();
})();

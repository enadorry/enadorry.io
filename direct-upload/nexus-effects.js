/* Pointer optics: decorative only; native cursor and all hit targets are retained. */
(()=>{'use strict';
const reduced=matchMedia('(prefers-reduced-motion: reduce)'),fine=matchMedia('(hover: hover) and (pointer: fine)');
let manual=document.body.classList.contains('n-paused'),enabled=false,raf=0,last=0,px=0,py=0,sx=0,sy=0,inside=false,hover=false,particles=[],rings=[],heroVisible=false,lens=null;
const canvas=document.createElement('canvas');canvas.className='n-pointer-optics';canvas.setAttribute('aria-hidden','true');document.body.append(canvas);const ctx=canvas.getContext('2d');if(!ctx){canvas.remove();return;}
let width=0,height=0;function resize(){width=innerWidth;height=innerHeight;const d=Math.min(devicePixelRatio||1,1.5);canvas.width=width*d;canvas.height=height*d;ctx.setTransform(d,0,0,d,0,0);lens?.resize();}resize();addEventListener('resize',resize,{passive:true});
const hero=document.querySelector('.n-hero');
function makeLens(){if(!hero||lens)return;const c=document.createElement('canvas');c.className='n-lens';c.setAttribute('aria-hidden','true');hero.insertBefore(c,hero.querySelector('.n-hero-shade'));const gl=c.getContext('webgl',{alpha:false,antialias:false,depth:false,powerPreference:'low-power'});if(!gl){c.remove();return;}
try{const compile=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error('shader');return s;};
const vs=compile(gl.VERTEX_SHADER,'attribute vec2 p; varying vec2 uv; void main(){uv=(p+1.)*.5;gl_Position=vec4(p,0.,1.);}');
const fs=compile(gl.FRAGMENT_SHADER,`precision mediump float;
varying vec2 uv;uniform sampler2D photo;uniform vec2 size,img,mouse;uniform float time,power;
vec2 cover(vec2 p){float a=size.x/size.y,b=img.x/img.y;vec2 crop=a>b?vec2(1.,b/a):vec2(a/b,1.);return (p-.5)*crop*.92+vec2(.5,.5);}
void main(){vec2 p=uv;vec2 d=p-mouse;d.x*=size.x/size.y;float r=length(d);float fall=1.-smoothstep(0.,.38,r);vec2 bent=p-(p-mouse)*fall*fall*.34*power;
vec2 center=bent-.5; bent=.5+center*(.94+.12*dot(center,center));
bent+=vec2(sin(time*.15),cos(time*.13))*.006;
vec2 q=cover(bent);vec2 chroma=normalize(d+vec2(.001))*.0025*fall*power;
vec3 color=vec3(texture2D(photo,q+chroma).r,texture2D(photo,q).g,texture2D(photo,q-chroma).b);
float gray=dot(color,vec3(.299,.587,.114));color=mix(vec3(gray),color,.85);color=(color-.5)*1.12+.5;
color+=vec3(.025,.05,.048)*fall*power;gl_FragColor=vec4(color,1.);}`);
const program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('program');gl.useProgram(program);
const buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);const loc=gl.getAttribLocation(program,'p');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
const uniforms=Object.fromEntries(['size','img','mouse','time','power'].map(n=>[n,gl.getUniformLocation(program,n)]));const tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tex);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
let ready=false,power=0;const photo=new Image();photo.onload=()=>{gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,photo);gl.uniform2f(uniforms.img,photo.width,photo.height);ready=true;wake();};photo.src='/assets/heroes/10.webp';
lens={resize(){const r=hero.getBoundingClientRect();const scale=Math.min(1.25,1400/r.width);c.width=Math.round(r.width*scale);c.height=Math.round(r.height*scale);gl.viewport(0,0,c.width,c.height);gl.uniform2f(uniforms.size,r.width,r.height);},draw(now){if(!ready)return;const r=hero.getBoundingClientRect();power+=((inside&&py>r.top&&py<r.bottom?1:0)-power)*.1;gl.uniform2f(uniforms.mouse,sx/r.width,1-(sy-r.top)/r.height);gl.uniform1f(uniforms.time,now*.001);gl.uniform1f(uniforms.power,power);gl.drawArrays(gl.TRIANGLES,0,6);c.classList.add('ready');},show(on){c.hidden=!on;}};lens.resize();
c.addEventListener('webglcontextlost',e=>{e.preventDefault();c.remove();lens=null;});
}catch{c.remove();}}
function wake(){if(enabled&&!document.hidden&&!raf)raf=requestAnimationFrame(tick);}
function tick(now){raf=0;if(!enabled||document.hidden)return;const dt=Math.min((now-last)||16,40);last=now;sx+=(px-sx)*.18;sy+=(py-sy)*.18;ctx.clearRect(0,0,width,height);
particles=particles.filter(p=>p.life>0);for(const p of particles){p.life-=dt;p.x+=p.vx*dt/16;p.y+=p.vy*dt/16;const a=Math.max(0,p.life/p.max);const s=p.s*a;ctx.strokeStyle=`rgba(200,243,237,${a*.7})`;ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(p.x-s,p.y);ctx.lineTo(p.x+s,p.y);ctx.moveTo(p.x,p.y-s);ctx.lineTo(p.x,p.y+s);ctx.stroke();}
rings=rings.filter(r=>r.life>0);for(const r of rings){r.life-=dt;ctx.strokeStyle=`rgba(150,226,217,${Math.max(0,r.life/650)*.4})`;ctx.beginPath();ctx.arc(r.x,r.y,8+(650-r.life)*.07,0,Math.PI*2);ctx.stroke();}
if(inside){ctx.strokeStyle='rgba(198,235,229,.5)';ctx.lineWidth=.6;ctx.beginPath();ctx.arc(sx,sy,hover?22:13,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#e0fff5';ctx.beginPath();ctx.arc(px,py,1.5,0,Math.PI*2);ctx.fill();}
if(heroVisible)lens?.draw(now);if(heroVisible||particles.length||rings.length||(inside&&(Math.abs(px-sx)+Math.abs(py-sy)>.2)))wake();}
let emitted=0;document.addEventListener('pointermove',e=>{if(!enabled||e.pointerType==='touch')return;px=e.clientX;py=e.clientY;if(!inside){sx=px;sy=py;}inside=true;hover=!!e.target.closest('a,button,summary,[role=tab]');if(e.timeStamp-emitted>28){emitted=e.timeStamp;const life=450+Math.random()*400;particles.push({x:px+(Math.random()-.5)*14,y:py+(Math.random()-.5)*14,vx:(Math.random()-.5)*.7,vy:.25+Math.random()*.6,life,max:life,s:1+Math.random()*3});if(particles.length>48)particles.shift();}wake();},{passive:true});
document.addEventListener('pointerdown',e=>{if(!enabled||e.pointerType==='touch')return;rings.push({x:e.clientX,y:e.clientY,life:650});rings=rings.slice(-4);wake();},{passive:true});
function leave(){inside=false;wake();}document.documentElement.addEventListener('pointerleave',leave);addEventListener('blur',leave);
const magnetic=[...document.querySelectorAll('.n-header-cta,.n-button')];magnetic.forEach(el=>{el.addEventListener('pointermove',e=>{if(!enabled)return;const r=el.getBoundingClientRect();el.style.translate=`${(e.clientX-r.left-r.width/2)*.08}px ${(e.clientY-r.top-r.height/2)*.1}px`;});el.addEventListener('pointerleave',()=>el.style.translate='');});
function sync(){enabled=fine.matches&&!reduced.matches&&!manual;canvas.hidden=!enabled;if(enabled)makeLens();lens?.show(enabled);cancelAnimationFrame(raf);raf=0;last=0;if(!enabled){particles=[];rings=[];inside=false;ctx.clearRect(0,0,width,height);magnetic.forEach(el=>el.style.translate='');}else wake();}
if(hero)new IntersectionObserver(es=>{heroVisible=es[0].isIntersecting;wake();}).observe(hero);
window.addEventListener('enadorry-motion',e=>{manual=!e.detail;sync();});reduced.addEventListener('change',sync);fine.addEventListener('change',sync);document.addEventListener('visibilitychange',()=>{cancelAnimationFrame(raf);raf=0;inside=false;particles=[];rings=[];wake();});sync();
})();

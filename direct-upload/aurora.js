(()=>{'use strict';
 const canvas=document.getElementById('aurora-canvas'),scene=canvas?.parentElement,button=document.getElementById('visual-toggle');if(!canvas)return;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');let gl;try{gl=canvas.getContext('webgl',{alpha:false,antialias:false,powerPreference:'low-power',preserveDrawingBuffer:false});}catch{}if(!gl){button.hidden=true;return;}
 const vs='attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
 const fs=`precision mediump float;
 uniform vec2 res;uniform float time;uniform vec2 mouse;uniform vec3 ripple;
 mat2 rot(float a){return mat2(cos(a),-sin(a),sin(a),cos(a));}
 // Large fluid motion, a fine surface wave, and one fading cursor impulse.
 float field(vec3 p){vec2 center=ripple.xy*vec2(res.x/res.y,1.)*1.91;float age=max(0.,time-ripple.z);float radius=length(p.xy-center);
 float ring=sin(radius*27.-age*7.)*.018*exp(-radius*2.3)*exp(-age*.75)*step(0.,ripple.z)*smoothstep(0.,.15,age);
 p.xy=rot(-.35+sin(time*.12)*.08)*p.xy;p.xz=rot(sin(time*.16)*.22)*p.xz;vec3 q=p/vec3(1.7,.85,.75);
 float wave=sin(p.x*3.+time*.5)*sin(p.y*3.5-time*.3)*sin(p.z*3.+time*.35);
 float micro=sin(p.x*23.+time*1.1)*sin(p.y*26.-time*.8)*sin(p.z*19.+time*.5)*.0035;
 return (length(q)-1.)*.65+wave*.11+micro+ring;}
 vec3 normal(vec3 p){vec2 e=vec2(.006,0.);return normalize(vec3(field(p+e.xyy)-field(p-e.xyy),field(p+e.yxy)-field(p-e.yxy),field(p+e.yyx)-field(p-e.yyx)));}
 // Broad iridescent reflections, with white streaks retaining the metallic surface.
 vec3 spectrum(float phase){return .06+.94*pow(.5+.5*cos(phase+vec3(0.,2.094,4.188)),vec3(1.35));}
 vec3 env(vec3 r){float f=atan(r.z,r.x);float phase=f*2.3+r.y*4.8+time*.18;
 float stripe=pow(.5+.5*sin(f*4.+r.y*5.),18.);float band=pow(.5+.5*cos(r.y*6.+f*2.-time*.22),28.);
 vec3 color=spectrum(phase);vec3 second=spectrum(phase+2.4);
 float ribbon=exp(-pow((r.y-.18-sin(f*2.+time*.15)*.35)*2.8,2.));
 vec3 col=color*(.24+stripe*1.15)+second*ribbon*.95;
 col+=vec3(.82,.9,1.)*band*1.15+vec3(1.)*stripe*.22;
 float sweep=pow(.5+.5*sin(f*2.2+r.y*3.8-time*.24),42.);col+=mix(vec3(.85,.94,1.),color,.25)*sweep*.65;
 return col;}
 void main(){vec2 uv=(gl_FragCoord.xy-.5*res)/res.y;vec3 ro=vec3(mouse.x*.16,mouse.y*.1,4.4);vec3 rd=normalize(vec3(uv,-2.3));float t=0.;float d=0.;for(int i=0;i<64;i++){d=field(ro+rd*t);if(abs(d)<.003||t>8.)break;t+=d*.72;}
 float depth=8.;vec3 col=vec3(0.);if(t<8.&&abs(d)<.018){depth=t;vec3 p=ro+rd*t;vec3 n=normal(p);vec3 r=reflect(rd,n);float fr=pow(1.-max(dot(-rd,n),0.),3.);col=env(r)*(.4+.78*fr);col+=spectrum(atan(n.y,n.x)+time*.15)*fr*.18;float spec=pow(max(dot(r,normalize(vec3(-.4,.8,1.))),0.),80.);col+=vec3(spec*1.8);col*=.8+.2*sin(p.y*5.+p.x*3.);}
 else{float a=exp(-pow((uv.y-.08-sin(uv.x*2.+time*.1)*.24)*5.,2.));vec3 hue=.5+.5*cos(vec3(0.,2.,4.)+uv.x*2.+time*.13);col=pow(hue,vec3(1.4))*a*.14;}
 float vign=1.-smoothstep(.35,1.3,length(uv*vec2(.65,1.)));col*=vign;gl_FragColor=vec4(pow(col,vec3(.85)),depth/8.);}`;
 function shader(type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error('shader');return s;}
 let program;try{program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vs));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fs));gl.bindAttribLocation(program,0,'p');gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error();}catch{button.hidden=true;return;}
 // Render metal once; split RGB in a cheap texture pass, without tripling ray marching.
 // Depth of field, restrained bloom and fine grain share the RGB-split pass.
 const postSource=`precision mediump float;
 uniform sampler2D sceneTexture;uniform vec2 res;uniform float time;uniform float motion;uniform float mirrorMode;
 vec3 bright(vec3 c){return c*smoothstep(.58,.95,max(c.r,max(c.g,c.b)));}
 void main(){vec2 uv=gl_FragCoord.xy/res;
 if(mirrorMode>.5){vec2 p=uv-.5;float radius=max(abs(p.x)*2.,abs(p.y)*2.);float depth=-log(max(radius,.045));
 vec2 reflected=p*(1.+depth*1.4)+.5+vec2(sin(time*.08),cos(time*.06))*.035*motion;
 uv=1.-abs(mod(reflected,2.)-1.);}
 vec2 center=uv-.5;vec2 px=1./res;
 vec4 centerSample=texture2D(sceneTexture,uv);
 float drift=sin(time*.23)*.5+.5;float edge=smoothstep(.05,.62,length(center));
 float pixels=1.5+edge*3.0+drift*1.5*motion;vec2 delta=center+vec2(.45,.12);vec2 direction=delta/max(length(delta),.001);vec2 offset=direction*pixels/res;
 vec3 color=vec3(texture2D(sceneTexture,clamp(uv+offset,vec2(0.),vec2(1.))).r,centerSample.g,texture2D(sceneTexture,clamp(uv-offset,vec2(0.),vec2(1.))).b);
 // Focus on the foremost central folds, lightly soften receding metal only.
 float coc=smoothstep(.12,.95,abs(centerSample.a*8.-3.75))*step(centerSample.a,.98);
 vec2 radius=px*(1.+coc*2.2);
 vec3 soft=(texture2D(sceneTexture,uv+vec2(radius.x,0.)).rgb+texture2D(sceneTexture,uv-vec2(radius.x,0.)).rgb+texture2D(sceneTexture,uv+vec2(0.,radius.y)).rgb+texture2D(sceneTexture,uv-vec2(0.,radius.y)).rgb)*.25;
 color=mix(color,soft,coc*.32);
 vec2 halo=px*7.;vec3 glow=bright(centerSample.rgb)*.12;
 glow+=(bright(texture2D(sceneTexture,uv+vec2(halo.x,0.)).rgb)+bright(texture2D(sceneTexture,uv-vec2(halo.x,0.)).rgb)+bright(texture2D(sceneTexture,uv+vec2(0.,halo.y)).rgb)+bright(texture2D(sceneTexture,uv-vec2(0.,halo.y)).rgb))*.12;
 glow+=(bright(texture2D(sceneTexture,uv+halo*1.7).rgb)+bright(texture2D(sceneTexture,uv-halo*1.7).rgb)+bright(texture2D(sceneTexture,uv+vec2(halo.x,-halo.y)*1.7).rgb)+bright(texture2D(sceneTexture,uv+vec2(-halo.x,halo.y)*1.7).rgb))*.10;
 color+=glow*.22;
 vec3 grainSeed=fract(vec3(gl_FragCoord.xyx)*.1031+mod(floor(time*12.),256.)*motion*.013);grainSeed+=dot(grainSeed,grainSeed.yzx+33.33);float grain=fract((grainSeed.x+grainSeed.y)*grainSeed.z);
 float luminance=dot(color,vec3(.2126,.7152,.0722));color+=(grain-.5)*.012*smoothstep(.005,.12,luminance);
 gl_FragColor=vec4(max(color,vec3(0.)),1.);}`;
 let post;try{post=gl.createProgram();gl.attachShader(post,shader(gl.VERTEX_SHADER,vs));gl.attachShader(post,shader(gl.FRAGMENT_SHADER,postSource));gl.bindAttribLocation(post,0,'p');gl.linkProgram(post);if(!gl.getProgramParameter(post,gl.LINK_STATUS))throw Error();}catch{button.hidden=true;return;}
 const texture=gl.createTexture(),target=gl.createFramebuffer();
 gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
 const postRes=gl.getUniformLocation(post,'res'),postTime=gl.getUniformLocation(post,'time'),postMotion=gl.getUniformLocation(post,'motion'),postTexture=gl.getUniformLocation(post,'sceneTexture'),postMirror=gl.getUniformLocation(post,'mirrorMode');
 gl.useProgram(program);let buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);let a=gl.getAttribLocation(program,'p');gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0);let ures=gl.getUniformLocation(program,'res'),utime=gl.getUniformLocation(program,'time'),umouse=gl.getUniformLocation(program,'mouse'),uripple=gl.getUniformLocation(program,'ripple');
 let paused=reduced.matches,visible=true,frame=0,last=0,elapsed=0,x=0,y=0,rippleX=0,rippleY=0,rippleAt=-100,lastImpulse=-100,mirrorMode=0;
 function resize(){const r=canvas.getBoundingClientRect(),scale=Math.min(1,900/Math.max(r.width,r.height));canvas.width=Math.max(1,Math.round(r.width*scale));canvas.height=Math.max(1,Math.round(r.height*scale));gl.viewport(0,0,canvas.width,canvas.height);gl.bindTexture(gl.TEXTURE_2D,texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,canvas.width,canvas.height,0,gl.RGBA,gl.UNSIGNED_BYTE,null);gl.bindFramebuffer(gl.FRAMEBUFFER,target);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,texture,0);gl.bindFramebuffer(gl.FRAMEBUFFER,null);draw();}
 function draw(){gl.bindFramebuffer(gl.FRAMEBUFFER,target);gl.useProgram(program);gl.uniform2f(ures,canvas.width,canvas.height);gl.uniform1f(utime,elapsed);gl.uniform2f(umouse,x,y);gl.uniform3f(uripple,rippleX,rippleY,rippleAt);gl.drawArrays(gl.TRIANGLES,0,6);
 gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.useProgram(post);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);gl.uniform1i(postTexture,0);gl.uniform2f(postRes,canvas.width,canvas.height);gl.uniform1f(postTime,elapsed);gl.uniform1f(postMotion,reduced.matches?0:1);gl.uniform1f(postMirror,mirrorMode);gl.drawArrays(gl.TRIANGLES,0,6);scene.classList.add('ready');}
 function tick(now){frame=0;if(paused||!visible||document.hidden)return;if(now-last>40){elapsed+=Math.min((now-last)/1000,.07);last=now;draw();}frame=requestAnimationFrame(tick);}
 function sync(){cancelAnimationFrame(frame);frame=0;last=performance.now();if(!paused&&visible&&!document.hidden)frame=requestAnimationFrame(tick);button.textContent=paused?'動かす ▷':'動きを止める Ⅱ';button.setAttribute('aria-pressed',String(paused));}
 button.addEventListener('click',()=>{paused=!paused;sync();});reduced.addEventListener('change',()=>{paused=reduced.matches;sync();});document.addEventListener('visibilitychange',sync);new IntersectionObserver(es=>{visible=es[0].isIntersecting;sync();},{threshold:0}).observe(scene);new ResizeObserver(resize).observe(canvas);
 function impulse(e,force=false){if(paused||reduced.matches)return;const r=scene.getBoundingClientRect();x=(e.clientX-r.left)/r.width-.5;y=.5-(e.clientY-r.top)/r.height;if(force||elapsed-lastImpulse>.45){rippleX=x;rippleY=y;rippleAt=elapsed;lastImpulse=elapsed;}}
 scene.addEventListener('pointermove',e=>{if(e.pointerType==='mouse')impulse(e);});
 scene.addEventListener('pointerdown',e=>impulse(e,true),{passive:true});
 window.addEventListener('enadorry-mirror-mode',e=>{mirrorMode=e.detail===true?1:0;resize();});
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();cancelAnimationFrame(frame);scene.classList.remove('ready');button.hidden=true;});resize();sync();
})();

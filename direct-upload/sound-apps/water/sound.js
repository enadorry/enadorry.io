class GardenSound extends AudioWorkletProcessor {
 constructor(){super();this.p={water:.7,chime:.55,ice:.4,variation:.35,scene:0};this.voices=[];this.low=[0,0];this.mid=[0,0];this.deep=[0,0];this.t=0;this.nextDrop=0;this.nextBell=sampleRate*1.8;this.nextIce=sampleRate*.6;this.iceCluster=0;this.bellCluster=0;this.hits=[];this.echoL=new Float32Array(Math.ceil(sampleRate*.079));this.echoR=new Float32Array(Math.ceil(sampleRate*.107));this.echoIndexL=0;this.echoIndexR=0;this.nextEvolve=0;this.color=800;this.colorTarget=800;this.flow=.5;this.flowTarget=.5;this.bellBase=2650;this.wave=0;this.deadline=Infinity;this.ended=false;this.bubbles=[];this.spray=[0,0];this.sprayEnvelope=0;this.cluster=0;this.referenceMix=0;this.port.onmessage=({data:d})=>{if(d.type==='params'){Object.assign(this.p,d.p);if(d.p.scene!==undefined)this.nextEvolve=0;}if(d.type==='refresh')this.nextEvolve=0;if(d.type==='timer'){this.deadline=d.minutes?this.t+d.minutes*60*sampleRate:Infinity;this.ended=false;}};}
 rand(a,b){return a+Math.random()*(b-a)}
 evolve(){this.colorTarget=this.p.scene===3?this.rand(550,1100):this.rand(350,2300);this.flowTarget=this.rand(.22,.86);this.bellBase=this.rand(2250,3100);this.nextEvolve=this.t+this.rand(12,65)*sampleRate/(.6+this.p.variation*1.5);}
 ring(freq,amp,decay,pan,kind='drop'){if(this.voices.length>=80)this.voices.shift();const r=Math.exp(-1/(decay*sampleRate));const w=2*Math.PI*freq/sampleRate;this.voices.push({a:2*r*Math.cos(w),b:r*r,y1:amp*Math.sin(w),y2:0,life:Math.ceil(decay*8*sampleRate),l:Math.sqrt((1-pan)/2),r:Math.sqrt((1+pan)/2),kind,age:0});}
 drop(){const s=this.p.scene;
 if(s===3){
  // Each tiny air cavity has a different size, pitch rise and lifetime.
  const freq=this.rand(850,3400),amp=this.rand(.025,.095);
  if(this.bubbles.length>=24)this.bubbles.shift();
  const pan=this.rand(-.7,.7),life=this.rand(.025,.12)*sampleRate;
  this.bubbles.push({phase:0,freq,rise:this.rand(1.000012,1.000065),env:amp,damp:Math.exp(-6/life),age:0,life:Math.ceil(life),l:Math.sqrt((1-pan)/2),r:Math.sqrt((1+pan)/2)});
  this.sprayEnvelope=Math.min(.045,this.sprayEnvelope+amp*.25);
  if(this.cluster<=0&&Math.random()<.3)this.cluster=Math.floor(this.rand(2,6));
  this.nextDrop=this.t+(this.cluster-->0?this.rand(.065,.19):this.rand(.25,1.25))*sampleRate/(.65+this.flow);
  return;
 }
 const base=this.rand(s===1?1100:450,s===1?2900:1600);const amp=this.rand(.015,.09)*(s===2?.5:1);const pan=this.rand(-.9,.9);this.ring(base,amp,this.rand(.025,.16),pan);this.ring(base*1.48,amp*.22,.035,pan);this.nextDrop=this.t+this.rand(.045,s===1?.28:.75)*sampleRate/(.5+this.flow);}

 hit(kind,amp,pan,seconds){if(this.hits.length>=12)this.hits.shift();this.hits.push({kind,amp,low:0,age:0,life:Math.ceil(seconds*sampleRate*7),damp:Math.exp(-1/(seconds*sampleRate)),l:Math.sqrt((1-pan)/2),r:Math.sqrt((1+pan)/2)});}
 ice(){
  // Ice contacts are high, irregular resonances with a lingering crystalline tail.
  const pan=this.rand(-.8,.8),scale=this.rand(.94,1.07),strength=this.rand(.085,.17);
  [3900,5300,6500,7900,9600].forEach((f,i)=>this.ring(Math.min(f*scale*this.rand(.985,1.015),sampleRate*.43),strength*[1,.55,.36,.22,.13][i],[.48,.35,.24,.14,.09][i]*this.rand(.85,1.2),pan,'ice'));
  this.hit('ice',strength*.6,pan,this.rand(.0015,.004));
  // A complete phrase has exactly 2–5 strikes, with space for each tail.
  if(this.iceCluster<=0)this.iceCluster=Math.floor(this.rand(2,6));
  this.iceCluster--;
  this.nextIce=this.t+(this.iceCluster>0?this.rand(1.2,2.4):this.rand(12,24))*sampleRate;
 }
 bell(){
  // Glass: a bright body resonance, non-harmonic modes, a tiny strike, and faint beating.
  const pan=this.rand(-.65,.65),base=this.bellBase*this.rand(.975,1.025),strength=this.rand(.16,.24);
  const ratios=[1,1.457,1.932,2.617],levels=[1,.38,.20,.09],decays=[.82,.30,.12,.045];
  ratios.forEach((ratio,i)=>{const f=Math.min(base*ratio*this.rand(.996,1.004),sampleRate*.43);this.ring(f,strength*levels[i],decays[i]*this.rand(.85,1.2),pan,'bell');if(i===0)this.ring(f*this.rand(1.002,1.006),strength*.18,.53,pan,'bell');});
  this.hit('bell',strength*.12,pan,.0018);
  if(this.bellCluster<=0&&Math.random()<.5)this.bellCluster=Math.floor(this.rand(1,3));
  this.nextBell=this.t+(this.bellCluster-->0?this.rand(.55,1.4):this.rand(3.5,12))*sampleRate/(.85+this.p.variation*.35);
 }

 process(inputs,outputs){const out=outputs[0];if(!out?.[0])return true;const n=out[0].length;if(this.t>=this.nextEvolve)this.evolve();this.color+=(this.colorTarget-this.color)*.0009;this.flow+=(this.flowTarget-this.flow)*.0009;const c=1-Math.exp(-2*Math.PI*this.color/sampleRate),m=1-Math.exp(-2*Math.PI*190/sampleRate),d=1-Math.exp(-2*Math.PI*35/sampleRate);
 for(let i=0;i<n;i++){if(this.t>=this.nextDrop)this.drop();if(this.t>=this.nextBell)this.bell();if(this.t>=this.nextIce)this.ice();this.wave+=2*Math.PI*(.035+this.flow*.04)/sampleRate;const swell=.6+.4*Math.sin(this.wave);const fade=Math.max(0,Math.min(1,(this.deadline-this.t)/(5*sampleRate)));let l=0,r=0,glassL=0,glassR=0;const common=Math.random()*2-1;this.referenceMix+=((this.p.scene===3?1:0)-this.referenceMix)/sampleRate;this.sprayEnvelope*=Math.exp(-1/(.009*sampleRate));
 for(let ch=0;ch<2;ch++){const w=common*.55+(Math.random()*2-1)*.45;this.low[ch]+=c*(w-this.low[ch]);this.mid[ch]+=m*(w-this.mid[ch]);this.deep[ch]+=d*(w-this.deep[ch]);let water=this.low[ch]*.45+this.mid[ch]*.9+this.deep[ch]*.6;if(this.p.scene===1)water=water*.7+(w-this.low[ch])*.018;if(this.p.scene===2)water*=.25+.95*swell;else water*=.8+.2*swell;// A softer continuous bed leaves room for individual liquid transients.
 const trickle=(this.low[ch]*.13+this.mid[ch]*.22+this.deep[ch]*.1)*( .75+.25*swell);
 this.spray[ch]+=.3*(w-this.spray[ch]);
 water=water*(1-this.referenceMix)+(trickle+(w-this.spray[ch])*this.sprayEnvelope)*this.referenceMix;
 if(ch===0)l=water*this.p.water;else r=water*this.p.water;}
 for(let j=this.voices.length-1;j>=0;j--){const v=this.voices[j];const y=v.a*v.y1-v.b*v.y2;v.y2=v.y1;v.y1=y;const vol=v.kind==='bell'?this.p.chime:v.kind==='ice'?this.p.ice:this.p.water;const attack=Math.min(1,++v.age/(sampleRate*.0006));if(v.kind==='drop'){l+=y*v.l*vol*attack;r+=y*v.r*vol*attack;}else{glassL+=y*v.l*vol*attack;glassR+=y*v.r*vol*attack;}if(--v.life<=0)this.voices.splice(j,1);}
 for(let j=this.bubbles.length-1;j>=0;j--){const v=this.bubbles[j];v.phase+=2*Math.PI*v.freq/sampleRate;v.freq=Math.min(v.freq*v.rise,6000);v.env*=v.damp;const attack=Math.min(1,v.age/(sampleRate*.002));const y=Math.sin(v.phase)*v.env*attack*this.p.water;l+=y*v.l;r+=y*v.r;if(++v.age>=v.life)this.bubbles.splice(j,1);}
 for(let j=this.hits.length-1;j>=0;j--){const h=this.hits[j],w=Math.random()*2-1;h.low+=.22*(w-h.low);h.amp*=h.damp;const y=(w-h.low)*h.amp*(h.kind==='ice'?this.p.ice:this.p.chime)*Math.min(1,++h.age/(sampleRate*.0003));glassL+=y*h.l;glassR+=y*h.r;if(h.age>=h.life)this.hits.splice(j,1);}
 const eL=this.echoL[this.echoIndexL],eR=this.echoR[this.echoIndexR];this.echoL[this.echoIndexL]=glassL+eR*.22;this.echoR[this.echoIndexR]=glassR+eL*.22;this.echoIndexL=(this.echoIndexL+1)%this.echoL.length;this.echoIndexR=(this.echoIndexR+1)%this.echoR.length;l+=glassL+eL*.16;r+=glassR+eR*.16;
 out[0][i]=Math.tanh(l)*fade;if(out[1])out[1][i]=Math.tanh(r)*fade;this.t++;if(this.t>=this.deadline&&!this.ended){this.ended=true;this.port.postMessage({type:'ended'});}}
 return true;
 }
}
registerProcessor('garden-sound',GardenSound);

(async()=>{
 const canvas=document.getElementById('aurora-canvas'),scene=canvas?.parentElement,pause=document.getElementById('visual-toggle');if(!scene)return;
 if(pause)pause.hidden=true;
 scene.classList.add('image-mode');
 const image=document.createElement('img');image.className='hero-art';image.width=1672;image.height=941;image.fetchPriority='high';image.decoding='async';
 image.addEventListener('load',async()=>{try{await image.decode();}catch{}scene.classList.add('image-ready');requestAnimationFrame(()=>requestAnimationFrame(()=>window.dispatchEvent(new Event('enadorry-hero-ready'))));},{once:true});
 const use=item=>{image.alt=item.alt;image.srcset=`${item.small} 960w, ${item.src} 1672w`;image.sizes='100vw';image.src=item.src;};
 let items=[];
 image.addEventListener('error',()=>{if(items.length){const next=items.pop();use(next);}else{image.remove();window.dispatchEvent(new Event('enadorry-hero-ready'));}});
 scene.append(image);
 try{
  const response=await fetch('/hero-images.json');if(!response.ok)throw Error();items=await response.json();if(items.length!==20)throw Error();
  // Shuffle once per page visit; only the selected image is downloaded.
  for(let i=items.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[items[i],items[j]]=[items[j],items[i]];}
  use(items.pop());
 }catch{use({src:'/assets/heroes/01.webp',small:'/assets/heroes/01-small.webp',alt:'液体金属の生命体'});}
 let started=false;
 window.addEventListener('enadorry-mirror-mode',e=>{
  scene.classList.toggle('in-mirror',e.detail===true);
  if(pause)pause.hidden=e.detail!==true;
  if(e.detail!==true||started)return;started=true;
  const script=document.createElement('script');script.src='/aurora.js';script.onload=()=>{if(pause)pause.hidden=false;window.dispatchEvent(new CustomEvent('enadorry-mirror-mode',{detail:scene.classList.contains('in-mirror')}));};document.head.append(script);
 });
})();

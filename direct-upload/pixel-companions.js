(() => {
  const section=document.querySelector('.pixel-companions');
  if(!section) return;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let visible=false,loaded=false;
  function load(){
    if(loaded) return;loaded=true;
    section.querySelectorAll('canvas').forEach(canvas=>{
      const image=new Image();
      image.onload=()=>{
        const ctx=canvas.getContext('2d');
        // Render an existing sprite as a native low-resolution, 64-color canvas.
        ctx.imageSmoothingEnabled=false;
        ctx.drawImage(image,0,0,image.naturalHeight*192/208,image.naturalHeight,0,0,24,26);
        const pixels=ctx.getImageData(0,0,24,26);
        for(let i=0;i<pixels.data.length;i+=4){
          for(let c=0;c<3;c++) pixels.data[i+c]=Math.round(pixels.data[i+c]/85)*85;
          pixels.data[i+3]=pixels.data[i+3]>=96?255:0;
        }
        ctx.putImageData(pixels,0,0);
      };
      image.src='/assets/room/'+canvas.dataset.character+'-idle.webp';
    });
  }
  function update(){section.classList.toggle('is-running',visible&&!document.hidden&&!reduced.matches);}
  if('IntersectionObserver' in window){
    const observer=new IntersectionObserver(entries=>{
      visible=entries[0].isIntersecting;
      if(visible) load();update();
    });observer.observe(section);
  }else{visible=true;load();update();}
  document.addEventListener('visibilitychange',update);
  reduced.addEventListener('change',update);
})();

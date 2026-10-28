(()=>{
 const loader=document.getElementById('site-loader');if(!loader)return;
 const started=performance.now();let finished=false,scheduled=false;
 const release=(immediate=false)=>{if(finished||scheduled)return;scheduled=true;setTimeout(()=>{finished=true;loader.classList.add('is-finished');setTimeout(()=>loader.remove(),500);},immediate?0:Math.max(0,1000-(performance.now()-started)));};
 window.addEventListener('enadorry-hero-ready',()=>release(),{once:true});
 // The selected artwork, rather than unrelated feeds or audio, controls entry.
 setTimeout(()=>release(),8000);
 window.addEventListener('pageshow',e=>{if(e.persisted)release(true);});
 document.addEventListener('keydown',e=>{if(e.key==='Tab'||e.key==='Escape')release(true);},{capture:true});
})();

(()=>{
 const list=document.getElementById('note-list'),status=document.getElementById('note-status'),dialog=document.getElementById('note-reader');if(!list||!dialog)return;let items=[],expanded=false,previous;
 const text=(tag,value,cls)=>{const n=document.createElement(tag);n.textContent=value;if(cls)n.className=cls;return n;};
 function render(){list.replaceChildren();for(const item of items.slice(0,expanded?25:6)){const row=text('li','','note-entry');const button=text('button','','note-open');button.type='button';button.append(text('span',item.date?new Date(item.date).toLocaleDateString('ja-JP'): 'NOTE','note-date'),text('span',item.title,'note-title'),text('span',item.excerpt,'note-excerpt'),text('span','読む ↗','note-read'));button.addEventListener('click',()=>{previous=button;document.getElementById('note-reader-title').textContent=item.title;document.getElementById('note-reader-body').textContent=item.body;document.getElementById('note-reader-notice').textContent=item.full?'':'noteで公開されている記事の冒頭です。全文はnoteで読めます。';document.getElementById('note-reader-source').href=item.url;dialog.showModal();document.getElementById('note-reader-close').focus();});row.append(button);list.append(row);}document.getElementById('note-more').hidden=items.length<=6;}
 document.getElementById('note-more').addEventListener('click',e=>{expanded=!expanded;render();e.currentTarget.textContent=expanded?'表示を少なくする':'記事をもっと読む ↗';});
 document.getElementById('note-reader-close').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});dialog.addEventListener('close',()=>previous?.focus());
 let endpoint,loading=false,lastCheck=0,signature='';
 async function refresh(){
  if(loading||document.hidden||Date.now()-lastCheck<15000)return;
  loading=true;lastCheck=Date.now();
  try{
   if(!endpoint){const c=await fetch('/notes-config.json',{cache:'no-store'}).then(r=>r.json());endpoint=c.endpoint;}
   const r=await fetch(endpoint,{cache:'no-store',signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error();
   const data=await r.json();if(!Array.isArray(data.items))throw Error();
   const next=data.items.slice().sort((a,b)=>(Date.parse(b.date)||0)-(Date.parse(a.date)||0));
   const nextSignature=JSON.stringify(next);
   if(nextSignature!==signature){
    // Avoid moving the focused article while someone is reading or navigating it.
    if(dialog.open||list.contains(document.activeElement))return;
    items=next;signature=nextSignature;render();
   }
   status.textContent=items.length?'':'公開中の記事はまだありません。';
  }catch{if(!items.length)status.textContent='記事を取得できませんでした。noteからお読みいただけます。';}
  finally{loading=false;}
 }
 refresh();
 setInterval(refresh,60000);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
 window.addEventListener('online',refresh);
})();

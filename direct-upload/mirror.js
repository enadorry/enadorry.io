(()=>{'use strict';const open=document.getElementById('mirror-open'),dialog=document.getElementById('mirror-dialog'),stage=document.getElementById('mirror-stage'),scene=document.querySelector('.aurora-scene'),pause=document.getElementById('visual-toggle');if(!open||!dialog||!scene||!pause)return;
let anchors=[];
open.addEventListener('click',()=>{if(dialog.open)return;anchors=[scene,pause].map(node=>{const marker=document.createComment('mirror-return');node.before(marker);return {node,marker};});stage.append(scene);dialog.append(pause);dialog.showModal();document.documentElement.classList.add('mirror-active');window.dispatchEvent(new CustomEvent('enadorry-mirror-mode',{detail:true}));document.getElementById('mirror-close').focus();});
document.getElementById('mirror-close').addEventListener('click',()=>dialog.close());
dialog.addEventListener('close',()=>{for(const {node,marker}of anchors){marker.replaceWith(node);}anchors=[];document.documentElement.classList.remove('mirror-active');window.dispatchEvent(new CustomEvent('enadorry-mirror-mode',{detail:false}));open.focus();});
})();

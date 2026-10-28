(()=>{
 const themes=['kasuterura-4','booru-jaypee','booru-touhoulat'];
 // Assign just one URL, so theme selection does not issue two counting requests.
 const theme=themes[Math.floor(Math.random()*themes.length)];
 document.querySelectorAll('.moe-counter-image[data-counter-src]').forEach(image=>{
  const url=new URL(image.dataset.counterSrc);url.searchParams.set('theme',theme);image.src=url.href;
  image.addEventListener('error',()=>{image.alt='アクセスカウンターを読み込めませんでした';},{once:true});
 });
})();

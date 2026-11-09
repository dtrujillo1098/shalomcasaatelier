// Descripciones adaptadas a la foto realmente mostrada en cada pantalla.
(function(){
 document.querySelectorAll('picture source[data-image-alt]').forEach(source=>{
  const img=source.parentElement.querySelector('img');if(!img)return;
  const media=matchMedia(source.media||'all');
  const update=()=>{img.alt=media.matches?source.dataset.imageAlt:img.dataset.fallbackAlt};
  media.addEventListener('change',update);update();
 });
})();

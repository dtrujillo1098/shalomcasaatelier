(function(){
const hero=document.querySelector('[data-product-film]');if(!hero)return;
const frames=[...hero.querySelectorAll('.hero-slide')];
const allowed=matchMedia('(min-width:961px) and (prefers-reduced-motion:no-preference)');
let video;
function select(index){frames.forEach((frame,i)=>{const on=i===index;frame.classList.toggle('is-banner-active',on);frame.inert=!on;frame.setAttribute('aria-hidden',String(!on));});}
function sync(){
 if(!allowed.matches){if(video){video.pause();video.remove();video=null;}hero.classList.remove('film-ready');select(0);return;}
 if(video)return;
 video=document.createElement('video');video.className='product-film';video.muted=true;video.autoplay=true;video.loop=true;video.playsInline=true;video.preload='auto';video.setAttribute('aria-hidden','true');video.src='./assets/banner-productos-original-12s.mp4';
 video.addEventListener('playing',()=>hero.classList.add('film-ready'));
 video.addEventListener('timeupdate',()=>select(Math.min(2,Math.floor(video.currentTime/4))));
 video.addEventListener('error',()=>{hero.classList.remove('film-ready');select(0);});
 hero.prepend(video);select(0);video.play().catch(()=>{});
}
document.addEventListener('visibilitychange',()=>{if(!video)return;if(document.hidden)video.pause();else video.play().catch(()=>{});});
allowed.addEventListener('change',sync);sync();
})();
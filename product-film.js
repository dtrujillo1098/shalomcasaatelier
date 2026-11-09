(function(){
const hero=document.querySelector('[data-product-film]');if(!hero)return;
const frames=[...hero.querySelectorAll('.hero-slide')];
const desktop=matchMedia('(min-width:961px)'),reduced=matchMedia('(prefers-reduced-motion:reduce)');
let video,timer,active=0;
const controls=document.createElement('div');controls.className='mobile-banner-controls';controls.setAttribute('role','group');controls.setAttribute('aria-label','Cambiar ambiente del banner');
['Comedor','Cama','Sala'].forEach((name,index)=>{const button=document.createElement('button');button.type='button';button.textContent=name;button.setAttribute('aria-label','Mostrar ambiente: '+name);button.addEventListener('click',()=>{clearInterval(timer);select(index);});controls.append(button);});hero.append(controls);
function select(index){active=index;frames.forEach((frame,i)=>{const on=i===index;frame.classList.toggle('is-banner-active',on);frame.inert=!on;frame.setAttribute('aria-hidden',String(!on));});[...controls.children].forEach((button,i)=>button.setAttribute('aria-pressed',String(i===index)));}
function sync(){
 clearInterval(timer);controls.hidden=desktop.matches;
 if(video){video.pause();video.remove();video=null;}hero.classList.remove('film-ready');select(0);
 if(!desktop.matches){if(!reduced.matches&&!document.hidden)timer=setInterval(()=>select((active+1)%frames.length),6000);return;}
 if(reduced.matches)return;
 video=document.createElement('video');video.className='product-film';video.muted=true;video.autoplay=true;video.loop=true;video.playsInline=true;video.preload='auto';video.setAttribute('aria-hidden','true');video.src='./assets/banner-productos-12s.mp4';
 video.addEventListener('playing',()=>hero.classList.add('film-ready'));
 video.addEventListener('timeupdate',()=>select(Math.min(2,Math.floor(video.currentTime/4))));
 video.addEventListener('error',()=>{hero.classList.remove('film-ready');select(0);});
 hero.prepend(video);video.play().catch(()=>{});
}
let touchX;
hero.addEventListener('touchstart',e=>{if(!desktop.matches)touchX=e.changedTouches[0].clientX;},{passive:true});
hero.addEventListener('touchend',e=>{if(touchX===undefined||desktop.matches)return;const delta=e.changedTouches[0].clientX-touchX;if(Math.abs(delta)>50){clearInterval(timer);select((active+(delta<0?1:-1)+frames.length)%frames.length);}touchX=undefined;},{passive:true});
document.addEventListener('visibilitychange',()=>{clearInterval(timer);if(video){if(document.hidden)video.pause();else video.play().catch(()=>{});}else if(!desktop.matches&&!reduced.matches&&!document.hidden)timer=setInterval(()=>select((active+1)%frames.length),6000);});
desktop.addEventListener('change',sync);reduced.addEventListener('change',sync);sync();
})();

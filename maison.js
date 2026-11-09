// Tarjetas de producto de la portada: una pieza destacada por categoría, leída del catálogo de Shopify.
(function () {
  const grid = document.querySelector('[data-maison-grid]');
  if (!grid) return;

  const orden = ['salas', 'comedores', 'camas', 'aparadores'];
  const cop = n => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
  const precio = p => {
    const valores = (p.variants || []).map(v => Number(v.price && v.price.amount)).filter(n => n > 0);
    const min = valores.length ? Math.min(...valores) : NaN;
    // Los valores provisionales de Shopify (100 COP, 0 COP o cifras absurdas) no se muestran.
    return isFinite(min) && min >= 100000 && min <= 30000000 ? 'Desde ' + cop(min) : 'Consultar precio';
  };
  const resumen = texto => {
    const limpio = (texto || '').replace(/\s+/g, ' ').trim();
    const frase = limpio.split(/(?<=[.!?])\s/)[0] || limpio;
    return frase.length > 96 ? frase.slice(0, 93).replace(/\s+\S*$/, '') + '…' : frase;
  };
  const foto = (p, ancho) => {
    const curados = ['sala-modular-agora', 'juego-comedor-ocre', 'dormitorio-bellizi', 'aparador-soul'];
    if (matchMedia('(min-width:961px)').matches && curados.includes(p.handle)) return './assets/' + p.handle + '-ambientado.webp';
    if (p.handle === 'dormitorio-jamaica' || p.localId === 'dormitorio-jamaica') return './assets/dormitorio-jamaica-ambientado.webp';
    if (p.handle === 'aparador-jamaica' || p.localId === 'aparador-jamaica') return './assets/aparador-jamaica-ambientado.webp';
    const url = (p.photos && p.photos[0] && p.photos[0].url) || p.image;
    if (!url) return '';
    try {
      const u = new URL(url);
      if (u.hostname === 'cdn.shopify.com') u.searchParams.set('width', ancho);
      return u.toString();
    } catch (e) { return url; }
  };
  const el = (tag, clase, texto) => { const n = document.createElement(tag); if (clase) n.className = clase; if (texto) n.textContent = texto; return n; };

  // Las fotos de estudio tienen fondo blanco: se detectan por sus esquinas para fundirlas con el fondo crema.
  const esFotoDeEstudio = img => {
    try {
      const c = document.createElement('canvas');
      c.width = 24; c.height = 24;
      const ctx = c.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0, 24, 24);
      return [[1, 1], [22, 1], [1, 22], [22, 22]].every(([x, y]) => {
        const [r, g, bl] = ctx.getImageData(x, y, 1, 1).data;
        return r > 238 && g > 238 && bl > 238;
      });
    } catch (e) { return false; }
  };

  function pintar() {
    const catalogo = typeof shopifyLiveProducts !== 'undefined' ? shopifyLiveProducts : [];
    if (!catalogo.length) return;
    const seleccion = ['sala-modular-agora', 'juego-comedor-ocre', 'dormitorio-bellizi', 'aparador-soul'];
    const excluidos = new Set(['sala-luna','comedor-medusa','comedor-nube','sofa-cama-nova','dormitorio-lux','cama-chevron','mesa-esfera']);
    const elegidos = matchMedia('(min-width:961px)').matches
      ? seleccion.map(handle => catalogo.find(p => p.handle === handle && !excluidos.has(p.handle))).filter(Boolean)
      : orden.map(linea => catalogo.find(p => p.line === linea && (p.photos && p.photos.length || p.image))).filter(Boolean);
    if (!elegidos.length) return;
    grid.replaceChildren();
    elegidos.forEach(p => {
      const a = el('a', 'maison-card');
      a.href = './' + p.line + '.html?producto=' + encodeURIComponent(p.localId || p.handle);
      const marco = el('div', 'maison-card-img');
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = foto(p, 640);
      img.alt = p.title;
      img.loading = 'lazy';
      img.width = 640; img.height = 800;
      img.addEventListener('load', () => { if (esFotoDeEstudio(img)) marco.classList.add('estudio'); });
      marco.append(img, el('span', 'maison-tag', p.lineName || p.line));
      a.append(marco, el('p', 'maison-card-cat', p.productType || p.lineName || ''), el('h3', '', p.title));
      const desc = resumen(p.description);
      if (desc) a.append(el('p', 'maison-card-desc', desc));
      a.append(el('p', 'maison-card-precio', precio(p)));
      grid.append(a);
      if (matchMedia('(min-width:961px) and (prefers-reduced-motion:no-preference)').matches && 'IntersectionObserver' in window) {
        marco.classList.add('piece-photo-reveal');
        marco.style.setProperty('--piece-delay', (grid.children.length - 1) * 100 + 'ms');
        const reveal = new IntersectionObserver(entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add('piece-photo-visible');
              reveal.unobserve(entry.target);
            }
          });
        }, {threshold:0.08});
        reveal.observe(marco);
      }
    });
  }

  grid.append(el('p', 'maison-cargando', 'Cargando piezas de la tienda…'));
  addEventListener('shopify:updated', pintar);
  matchMedia('(min-width:961px)').addEventListener('change', pintar);
  pintar();
})();

// Divisores entre secciones: las dos líneas se dibujan al entrar en pantalla.
(function () {
  const divisores = [...document.querySelectorAll('.m-divisor')];
  if (!divisores.length || matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  document.documentElement.classList.add('m-anim');
  const vigia = new IntersectionObserver(entradas => entradas.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('visible'); vigia.unobserve(e.target); }
  }), { threshold: 0.9 });
  divisores.forEach(d => vigia.observe(d));
})();

// Menú flotante de escritorio: el desplegable "Colección" se abre con clic, con el cursor o con el teclado.
(function () {
  const item = document.querySelector('.pill-item');
  if (!item) return;
  const boton = item.querySelector('.pill-parent');
  const poner = abierto => { item.classList.toggle('is-open', abierto); boton.setAttribute('aria-expanded', String(abierto)); };
  boton.addEventListener('click', e => { e.stopPropagation(); poner(!item.classList.contains('is-open')); });
  document.addEventListener('click', e => { if (!e.target.closest('.pill-item')) poner(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { poner(false); } });
})();

// Aparición progresiva de las fotografías de las colecciones.
(function () {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  const photos = document.querySelectorAll('.maison-destacada, .category-tile');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('coleccion-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.08 });
  photos.forEach(photo => {
    photo.classList.add('coleccion-reveal');
    observer.observe(photo);
  });
})();
// Carrusel manual, accesible con botones, teclado y gesto táctil.
(function () {
  const carousel = document.querySelector('.sofa-carousel');
  if (!carousel) return;
  const frames = [...carousel.querySelectorAll('.sofa-frame')];
  const dots = [...carousel.querySelectorAll('.sofa-dots button')];
  let current = 0;
  const show = index => {
    current = (index + frames.length) % frames.length;
    frames.forEach((frame, i) => {
      frame.classList.toggle('is-current', i === current);
      frame.setAttribute('aria-hidden', String(i !== current));
    });
    dots.forEach((dot, i) => {
      if (i === current) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    });
    carousel.querySelector('.sofa-status').textContent = `Foto ${current + 1} de ${frames.length}`;
  };
  carousel.querySelector('.sofa-prev').addEventListener('click', () => show(current - 1));
  carousel.querySelector('.sofa-next').addEventListener('click', () => show(current + 1));
  dots.forEach((dot, i) => dot.addEventListener('click', () => show(i)));
  carousel.addEventListener('keydown', event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    show(current + (event.key === 'ArrowRight' ? 1 : -1));
  });
  let touchStart;
  carousel.addEventListener('touchstart', event => { touchStart = event.changedTouches[0].clientX; }, { passive:true });
  carousel.addEventListener('touchend', event => {
    if (touchStart === undefined) return;
    const delta = event.changedTouches[0].clientX - touchStart;
    if (Math.abs(delta) > 50) show(current + (delta < 0 ? 1 : -1));
    touchStart = undefined;
  }, { passive:true });
})();
// La tarjeta elegida ocupa el centro; las otras permanecen a los lados.
(function () {
  const gallery = document.querySelector('.sofa-gallery');
  if (!gallery) return;
  const cards = [...gallery.querySelectorAll('.sofa-panel')];
  const activate = selected => {
    gallery.classList.add('is-interacting');
    const others = cards.filter(card => card !== selected);
    cards.forEach(card => card.classList.toggle('is-front', card === selected));
    others.forEach((card, i) => {
      card.style.setProperty('--card-offset', i === 0 ? '-65%' : '65%');
      card.style.setProperty('--card-angle', i === 0 ? '16deg' : '-16deg');
    });
  };
  cards.forEach(card => {
    card.addEventListener('pointerenter', event => { if (event.pointerType !== 'touch') activate(card); });
    card.addEventListener('focus', () => activate(card));
    card.addEventListener('click', event => {
      if (matchMedia('(hover: none)').matches && !card.classList.contains('is-front')) {
        event.preventDefault();activate(card);
      }
    });
  });
  gallery.addEventListener('pointerleave', () => gallery.classList.remove('is-interacting'));
  gallery.addEventListener('focusout', event => {
    if (!gallery.contains(event.relatedTarget)) gallery.classList.remove('is-interacting');
  });
})();
// El video se descarga y reproduce solo en PC sin movimiento reducido.
(function () {
  const slide = document.querySelector('body.site-home .hero-slide');
  if (!slide || slide.closest('[data-static-banner]')) return;
  const allowed = matchMedia('(min-width:961px) and (prefers-reduced-motion:no-preference)');
  let video, toggle;
  function sync() {
    if (!allowed.matches) {
      if (video) { video.pause(); video.remove(); toggle.remove(); video = null; }
      return;
    }
    if (video) return;
    video = document.createElement('video');
    video.className = 'hero-banner-video';
    video.muted = true; video.autoplay = true; video.loop = true; video.playsInline = true;
    video.setAttribute('aria-hidden', 'true');
    video.poster = './assets/hero-bogota-editorial-optimized.webp';
    video.src = './assets/hero-bogota-fullhd.mp4';
    toggle = document.createElement('button');
    toggle.type = 'button'; toggle.className = 'hero-video-toggle';
    toggle.textContent = 'Pausar video'; toggle.hidden = true;
    video.addEventListener('playing', () => {
      video.classList.add('is-ready'); toggle.hidden = false; toggle.textContent = 'Pausar video';
    });
    video.addEventListener('pause', () => { toggle.textContent = 'Reproducir video'; });
    video.addEventListener('error', () => { video.classList.remove('is-ready'); toggle.hidden = true; });
    toggle.addEventListener('click', () => {
      if (video.paused) video.play().catch(() => {}); else video.pause();
    });
    slide.insertBefore(video, slide.querySelector('.hero-shade'));
    slide.append(toggle);
    video.play().catch(() => { toggle.hidden = false; toggle.textContent = 'Reproducir video'; });
  }
  allowed.addEventListener('change', sync);
  sync();
})();
// Cambio de portada cada seis segundos en escritorio.
(function(){
 const hero=document.querySelector('.hero-with-medusa');if(!hero || hero.hasAttribute('data-product-film'))return;
 const frames=[...hero.querySelectorAll('.hero-slide')];
 const desktop=matchMedia('(min-width:961px)');
 const reduced=matchMedia('(prefers-reduced-motion:reduce)');
 let active=0,timer;
 function show(index){
  active=index;
  frames.forEach((frame,i)=>{
   const selected=i===active;
   frame.classList.toggle('is-banner-active',selected);
   frame.setAttribute('aria-hidden',String(!selected));frame.inert=!selected;
   const video=frame.querySelector('video');
   if(video){if(selected&&!document.hidden)video.play().catch(()=>{});else video.pause();}
  });
 }
 function sync(){
  clearInterval(timer);show(0);
  if(desktop.matches&&!reduced.matches&&!document.hidden)timer=setInterval(()=>show((active+1)%frames.length),6000);
 }
 desktop.addEventListener('change',sync);reduced.addEventListener('change',sync);
 document.addEventListener('visibilitychange',sync);sync();
})();
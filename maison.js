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
    const elegidos = orden.map(linea => catalogo.find(p => p.line === linea && (p.photos && p.photos.length || p.image))).filter(Boolean);
    if (!elegidos.length) return;
    grid.replaceChildren();
    elegidos.forEach(p => {
      const a = el('a', 'maison-card');
      a.href = './' + p.line + '.html';
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
    });
  }

  grid.append(el('p', 'maison-cargando', 'Cargando piezas de la tienda…'));
  addEventListener('shopify:updated', pintar);
  pintar();
})();

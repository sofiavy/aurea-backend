// ═══════════════════════════════════════════════════════════════════════════
//  AUREA — Configuración de imágenes
//  Este es el ÚNICO archivo que necesitas editar para cambiar imágenes.
//  Cambia la URL y listo — se actualiza en toda la tienda automáticamente.
// ═══════════════════════════════════════════════════════════════════════════

const AUREA_IMAGES = {

  // ── HERO (banner principal) ───────────────────────────────────────────────
  // Imagen grande que aparece en la sección de inicio
  // Tamaño recomendado: 1600x900px
  hero: '/images/hero/hero.jpg',

  // ── PRODUCTOS ─────────────────────────────────────────────────────────────
  // Cada número corresponde al id del producto en el array PRODUCTS
  // Tamaño recomendado: 800x800px, fondo oscuro
  productos: {
    1: '/images/productos/solar.jpg',           // Pulsera Solar
    2: '/images/productos/oceano.jpg',          // Océano Profundo
    3: '/images/productos/rosa-desierto.jpg',   // Rosa del Desierto
    4: '/images/productos/tierra-viva.jpg',     // Tierra Viva
    5: '/https://i.imgur.com/8yE8LCZ.jpeg',    // Luna de Cristal
    6: '/images/productos/fuego-interior.jpg',  // Fuego Interior
    7: '/images/productos/amanecer-set.jpg',    // Amanecer Set
    8: '/images/productos/mar-montana.jpg',     // Mar y Montaña
  },

  // ── GALERÍA por producto ───────────────────────────────────────────────────
  // Fotos adicionales que aparecen en el modal al hacer clic en un producto
  // Puedes poner 1, 2 o 3 fotos por producto
  // Si no tienes fotos extra, deja el array vacío []
  galeria: {
    1: ['/images/productos/solar-detalle.jpg', '/images/productos/solar-muneca.jpg'],
    2: ['/images/productos/oceano-detalle.jpg'],
    3: [],
    4: [],
    5: ['/images/productos/luna-detalle.jpg'],
    6: [],
    7: ['/images/productos/amanecer-set-caja.jpg'],
    8: [],
  },

  // ── LOGO ──────────────────────────────────────────────────────────────────
  // Si quieres usar un logo en imagen en vez del texto "AUREA"
  // Déjalo en null para seguir usando el texto
  logo: null,
  // logo: '/images/logo.png',

};

// ═══════════════════════════════════════════════════════════════════════════
//  APLICAR IMÁGENES AUTOMÁTICAMENTE
//  No necesitas tocar nada de aquí para abajo
// ═══════════════════════════════════════════════════════════════════════════

(function aplicarImagenes() {

  // Esperar a que PRODUCTS esté definido
  function esperarProductos(intentos) {
    if (intentos > 20) return;
    if (typeof PRODUCTS === 'undefined') {
      setTimeout(function(){ esperarProductos(intentos + 1); }, 200);
      return;
    }
    inyectarImagenes();
  }

  function inyectarImagenes() {

    // 1. Parchear el array PRODUCTS para incluir la imagen de cada producto
    PRODUCTS.forEach(function(p) {
      var img = AUREA_IMAGES.productos[p.id];
      if (img) p.img = img;

      var gal = AUREA_IMAGES.galeria[p.id];
      if (gal && gal.length) p.imagenes = gal;
    });

    // 2. Observar cuando se renderiza una tarjeta de producto y ponerle la foto
    var catGrid = document.getElementById('cat-grid') || document.querySelector('.cat-grid');
    if (catGrid) {
      var obs = new MutationObserver(function() {
        reemplazarSVGs();
      });
      obs.observe(catGrid, { childList: true, subtree: true });
      // Aplicar a las que ya están renderizadas
      setTimeout(reemplazarSVGs, 400);
    }

    // 3. Observar el modal de producto para reemplazar el SVG de la galería
    var galMain = document.getElementById('gal-main');
    if (galMain) {
      var galObs = new MutationObserver(function() {
        reemplazarGaleria();
      });
      galObs.observe(galMain, { childList: true, subtree: true });
    }
  }

  // Reemplaza el SVG de cada tarjeta por la foto real si existe
  function reemplazarSVGs() {
    if (typeof PRODUCTS === 'undefined') return;

    PRODUCTS.forEach(function(p) {
      if (!p.img) return;

      // Buscar la tarjeta de este producto por data-id o por posición
      var cards = document.querySelectorAll('.pcard');
      cards.forEach(function(card) {
        // Detectar si esta card es de este producto
        var onclick = card.getAttribute('onclick') || '';
        if (onclick.indexOf('openModal(' + p.id + ')') === -1 &&
            onclick.indexOf('openModal(' + p.id + ',') === -1) return;

        var imgArea = card.querySelector('.pcard-img');
        if (!imgArea) return;

        // Si ya tiene una foto real, no hacer nada
        if (imgArea.querySelector('img.foto-real')) return;

        // Verificar si la imagen existe antes de mostrarla
        var testImg = new Image();
        testImg.onload = function() {
          // Ocultar el SVG
          var svg = imgArea.querySelector('svg, .pcard-svg');
          if (svg) svg.style.display = 'none';

          // Crear la imagen
          var foto = document.createElement('img');
          foto.className = 'foto-real pcard-photo';
          foto.src = p.img;
          foto.alt = p.name;
          foto.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;';
          imgArea.style.position = 'relative';
          imgArea.appendChild(foto);
        };
        testImg.src = p.img;
      });
    });
  }

  // Reemplaza el SVG del modal de producto por la foto real
  function reemplazarGaleria() {
    var galMain = document.getElementById('gal-main');
    if (!galMain) return;
    if (galMain.querySelector('img.foto-real-modal')) return;

    // Detectar qué producto está abierto
    var modalInfo = document.getElementById('modal-info');
    if (!modalInfo) return;
    var pid = parseInt(modalInfo.getAttribute('data-id') || '0');
    if (!pid) return;

    var p = (typeof PRODUCTS !== 'undefined') ? PRODUCTS.find(function(x){ return x.id === pid; }) : null;
    if (!p || !p.img) return;

    var testImg = new Image();
    testImg.onload = function() {
      var svg = galMain.querySelector('svg');
      if (svg) svg.style.display = 'none';

      var foto = document.createElement('img');
      foto.className = 'foto-real-modal';
      foto.src = p.img;
      foto.alt = p.name;
      foto.style.cssText = 'max-width:100%;max-height:100%;object-fit:contain;border-radius:4px;';
      galMain.appendChild(foto);
    };
    testImg.src = p.img;
  }

  // Iniciar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function(){ esperarProductos(0); });
  } else {
    esperarProductos(0);
  }

})();

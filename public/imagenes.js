// ═══════════════════════════════════════════════════════════════════════════
//  AUREA — Configuración de imágenes
//  Este es el ÚNICO archivo que necesitas editar para cambiar imágenes.
//  Cambia la URL y listo — se actualiza en toda la tienda automáticamente.
// ═══════════════════════════════════════════════════════════════════════════

const AUREA_IMAGES = {
  hero: null,
  productos: {
    1: 'https://i.imgur.com/9WhqgNC.jpeg',   // Eternal      — Mujer · Plata 925
    2: 'https://i.imgur.com/zcJIlww.jpeg',   // Impulse      — Hombre · Acero
    3: 'https://i.imgur.com/oRRfw4v.jpeg',   // Lumière      — Mujer · Oro 18K
    4: 'https://i.imgur.com/Cv9j2CG.jpeg',   // Forte        — Hombre · Acero
    5: 'https://i.imgur.com/eI5e5kd.jpeg',   // Céleste      — Mujer · Plata 925
    6: 'https://i.imgur.com/pRc27Ze.jpeg',   // Soleil       — Unisex · Oro 18K
    7: 'https://i.imgur.com/p3gFE9i.jpeg',   // Set Aurora   — Set pareja
    8: 'https://i.imgur.com/syBcLKF.jpeg',   // Set Alma     — Set pareja
  },
  galeria: {
    1: [], 2: [], 3: [], 4: [],
    5: [], 6: [], 7: [], 8: [],
  },
};

// ── Definir variables IMG1..IMG8 que usa el index.html ────────────────────
// El modal y las tarjetas las leen directamente desde aquí
var IMG1 = AUREA_IMAGES.productos[1];
var IMG2 = AUREA_IMAGES.productos[2];
var IMG3 = AUREA_IMAGES.productos[3];
var IMG4 = AUREA_IMAGES.productos[4];
var IMG5 = AUREA_IMAGES.productos[5];
var IMG6 = AUREA_IMAGES.productos[6];
var IMG7 = AUREA_IMAGES.productos[7];
var IMG8 = AUREA_IMAGES.productos[8];

// ═══════════════════════════════════════════════════════════════════════════
//  No tocar nada de aquí para abajo
// ═══════════════════════════════════════════════════════════════════════════

(function aplicarImagenes() {

  function esperarProductos(intentos) {
    if (intentos > 20) return;
    if (typeof PRODUCTS === 'undefined') {
      setTimeout(function(){ esperarProductos(intentos + 1); }, 200);
      return;
    }
    inyectarImagenes();
  }

  function inyectarImagenes() {
    PRODUCTS.forEach(function(p) {
      var img = AUREA_IMAGES.productos[p.id];
      if (img) p.img = img;
      var gal = AUREA_IMAGES.galeria[p.id];
      if (gal && gal.length) p.imagenes = gal;
    });

    // Observar el grid de productos para reaplicar al filtrar
    var catGrid = document.querySelector('.cat-grid');
    if (catGrid) {
      new MutationObserver(function(){ setTimeout(reemplazarSVGs, 100); })
        .observe(catGrid, { childList: true });
      setTimeout(reemplazarSVGs, 400);
    }

    // Observar el modal para reemplazar imagen al abrirlo
    var galMain = document.getElementById('gal-main');
    if (galMain) {
      new MutationObserver(function(){ setTimeout(reemplazarGaleria, 80); })
        .observe(galMain, { childList: true, subtree: true });
    }
  }

  function reemplazarSVGs() {
    if (typeof PRODUCTS === 'undefined') return;
    document.querySelectorAll('.pcard').forEach(function(card) {
      var id = parseInt(card.getAttribute('data-id'));
      if (!id) return;
      var p = PRODUCTS.find(function(x){ return x.id === id; });
      if (!p || !p.img) return;
      var imgArea = card.querySelector('.pcard-img');
      if (!imgArea) return;
      if (imgArea.querySelector('.foto-real')) return;

      var test = new Image();
      test.onload = function() {
        var svg = imgArea.querySelector('svg');
        if (svg) svg.style.display = 'none';
        var existing = imgArea.querySelector('img:not(.foto-real)');
        if (existing) existing.style.display = 'none';
        var img = document.createElement('img');
        img.className = 'foto-real';
        img.src = p.img;
        img.alt = p.name;
        img.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:2;';
        imgArea.style.position = 'relative';
        imgArea.appendChild(img);
      };
      test.src = p.img;
    });
  }

  function reemplazarGaleria() {
    var galMain = document.getElementById('gal-main');
    if (!galMain) return;
    if (galMain.querySelector('.foto-real-modal')) return;

    // Detectar qué producto está abierto leyendo el modal-info
    var modalInfo = document.getElementById('modal-info');
    if (!modalInfo) return;

    // Buscar el nombre del producto en el modal para identificarlo
    var nameEl = modalInfo.querySelector('.m-name');
    if (!nameEl) return;
    var nombre = nameEl.textContent.trim();
    var p = typeof PRODUCTS !== 'undefined'
      ? PRODUCTS.find(function(x){ return x.name === nombre; })
      : null;
    if (!p || !p.img) return;

    var test = new Image();
    test.onload = function() {
      var svg = galMain.querySelector('svg');
      if (svg) svg.style.display = 'none';
      var existing = galMain.querySelector('img:not(.foto-real-modal)');
      if (existing) existing.style.display = 'none';
      var img = document.createElement('img');
      img.className = 'foto-real-modal';
      img.src = p.img;
      img.alt = p.name;
      img.style.cssText = 'max-width:100%;max-height:320px;object-fit:contain;border-radius:6px;display:block;margin:auto;';
      galMain.innerHTML = '';
      galMain.appendChild(img);
    };
    test.src = p.img;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function(){ esperarProductos(0); });
  } else {
    esperarProductos(0);
  }

})();

// ═══════════════════════════════════════════════════════════════════════════
//  AUREA — Módulo de autenticación y compras
//  Requiere que el backend esté corriendo en http://localhost:3000
// ═══════════════════════════════════════════════════════════════════════════

(function() {
  'use strict';

  const API = 'https://aurea-backend-production-d168.up.railway.app/api';

  // ── Sesión ────────────────────────────────────────────────────────────────
  const Session = {
    getToken: () => localStorage.getItem('aurea_token'),
    getUser:  () => { try { return JSON.parse(localStorage.getItem('aurea_user')); } catch { return null; } },
    set: (token, user) => {
      localStorage.setItem('aurea_token', token);
      localStorage.setItem('aurea_user', JSON.stringify(user));
    },
    clear: () => {
      localStorage.removeItem('aurea_token');
      localStorage.removeItem('aurea_user');
    },
    isLoggedIn: () => !!localStorage.getItem('aurea_token')
  };

  // ── Inyectar UI de auth en la navegación ─────────────────────────────────
  function injectAuthNav() {
    var navR = document.querySelector('.nav-r');
    if (!navR) return;

    var loginBtn = document.createElement('a');
    loginBtn.id = 'nav-login-btn';
    loginBtn.href = '/login';
    loginBtn.style.cssText = 'text-decoration:none;color:var(--gray);font-size:.7rem;letter-spacing:.18em;text-transform:uppercase;transition:color .2s;padding:.45rem .6rem;';
    loginBtn.onmouseover = function(){ this.style.color='var(--gold)'; };
    loginBtn.onmouseout  = function(){ this.style.color='var(--gray)'; };
    loginBtn.textContent = 'Iniciar sesion';

    var userMenu = document.createElement('div');
    userMenu.id = 'nav-user-menu';
    userMenu.style.cssText = 'display:none;align-items:center;gap:.6rem;';
    userMenu.innerHTML =
      '<a href="/historial" style="text-decoration:none;color:var(--gray);font-size:.7rem;letter-spacing:.15em;text-transform:uppercase;transition:color .2s;padding:.4rem .5rem;border:.5px solid rgba(201,168,76,.2);border-radius:2px;" '
      + 'onmouseover="this.style.color=\'var(--gold)\';this.style.borderColor=\'rgba(201,168,76,.5)\';" '
      + 'onmouseout="this.style.color=\'var(--gray)\';this.style.borderColor=\'rgba(201,168,76,.2)\';">'
      + 'Mis compras'
      + '</a>'
      + '<span id="nav-user-name" style="font-size:.72rem;color:var(--gray2);max-width:100px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"></span>'
      + '<button onclick="AureaAuth.logout()" style="background:transparent;border:none;color:var(--gray2);font-size:.68rem;letter-spacing:.13em;text-transform:uppercase;cursor:pointer;padding:.4rem .5rem;transition:color .2s;" '
      + 'onmouseover="this.style.color=\'var(--gold)\';" onmouseout="this.style.color=\'var(--gray2)\';">Salir</button>';

    var cartBtn = navR.querySelector('.cart-btn');
    if (cartBtn) {
      navR.insertBefore(loginBtn, cartBtn);
      navR.insertBefore(userMenu, cartBtn);
    } else {
      navR.appendChild(loginBtn);
      navR.appendChild(userMenu);
    }

    updateNavUI();
  }

  function updateNavUI() {
    var user     = Session.getUser();
    var loginBtn = document.getElementById('nav-login-btn');
    var userMenu = document.getElementById('nav-user-menu');
    var userName = document.getElementById('nav-user-name');

    if (Session.isLoggedIn() && user) {
      if (loginBtn) loginBtn.style.display = 'none';
      if (userMenu) userMenu.style.display = 'flex';
      if (userName) userName.textContent   = user.name.split(' ')[0];
    } else {
      if (loginBtn) loginBtn.style.display = '';
      if (userMenu) userMenu.style.display = 'none';
    }
  }

  // ── Construir el botón ────────────────────────────────────────────────────
  function buildBtn() {
    var btn = document.createElement('button');
    btn.id = 'aurea-checkout-btn';
    btn.innerHTML = 'Registrar compra';
    btn.style.cssText = [
      'width:100%',
      'background:#C9A84C',
      'color:#080806',
      'border:none',
      'padding:.85rem 1rem',
      'font-family:"DM Sans",sans-serif',
      'font-size:.74rem',
      'font-weight:500',
      'letter-spacing:.22em',
      'text-transform:uppercase',
      'cursor:pointer',
      'border-radius:4px',
      'margin-top:.8rem',
      'display:block',
      'box-sizing:border-box'
    ].join(';');
    btn.onmouseover = function(){ this.style.background='#E8D49A'; };
    btn.onmouseout  = function(){ this.style.background='#C9A84C'; };
    btn.onclick = handleCheckout;
    return btn;
  }

  // ── Inyectar botón en el carrito ──────────────────────────────────────────
  function injectCheckoutBtn() {
    if (document.getElementById('aurea-checkout-btn')) return;

    var cartFt = document.getElementById('cart-ft');
    if (!cartFt || cartFt.style.display === 'none') {
      setTimeout(injectCheckoutBtn, 300);
      return;
    }

    var btn = buildBtn();

    // Buscar el div de padding que tiene el botón "Continuar"
    var divs = cartFt.querySelectorAll('div');
    var inserted = false;
    for (var i = 0; i < divs.length; i++) {
      var d = divs[i];
      if (d.style.padding && d.querySelector('button')) {
        d.appendChild(btn);
        inserted = true;
        break;
      }
    }
    if (!inserted) cartFt.appendChild(btn);
  }

  // ── Manejar la compra ─────────────────────────────────────────────────────
  async function handleCheckout() {
    if (typeof cart === 'undefined' || !cart || !cart.length) {
      showGlobalToast('Tu carrito esta vacio');
      return;
    }

    if (!Session.isLoggedIn()) {
      window.location.href = '/login?redirect=/&checkout=1';
      return;
    }

    var btn = document.getElementById('aurea-checkout-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Guardando...'; }

    try {
      var items = cart.map(function(item) {
        return {
          product_id:   item.id,
          product_name: item.name,
          size:         item.size || 'S',
          price:        item.price,
          qty:          item.qty,
          engraving:    item.engraveText || null
        };
      });

      var res = await fetch(API + '/purchases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + Session.getToken()
        },
        body: JSON.stringify({ items: items })
      });
      var data = await res.json();

      if (!res.ok) {
        showGlobalToast('Error: ' + (data.error || 'No se pudo registrar'));
        if (btn) { btn.disabled = false; btn.textContent = 'Registrar compra'; }
        return;
      }

      showGlobalToast('Compra registrada correctamente');
      if (btn) { btn.disabled = false; btn.textContent = 'Registrar compra'; }

    } catch (err) {
      showGlobalToast('Error de conexion con el servidor');
      if (btn) { btn.disabled = false; btn.textContent = 'Registrar compra'; }
    }
  }

  // ── Toast ─────────────────────────────────────────────────────────────────
  function showGlobalToast(msg) {
    if (typeof showToast === 'function') { showToast(msg); return; }
    var old = document.getElementById('aurea-toast');
    if (old) old.remove();
    var t = document.createElement('div');
    t.id = 'aurea-toast';
    t.style.cssText = 'position:fixed;bottom:2rem;left:50%;transform:translateX(-50%);'
      + 'background:#1E1E1B;border:.5px solid rgba(201,168,76,.35);color:#F2EDE4;'
      + 'padding:.75rem 1.5rem;border-radius:6px;font-size:.78rem;z-index:9999;'
      + 'letter-spacing:.05em;box-shadow:0 8px 32px rgba(0,0,0,.4);white-space:nowrap;';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function(){ t.style.opacity='0'; t.style.transition='opacity .4s'; }, 2800);
    setTimeout(function(){ if(t.parentNode) t.remove(); }, 3300);
  }

  // ── Logout global ─────────────────────────────────────────────────────────
  window.AureaAuth = {
    logout: function() {
      Session.clear();
      updateNavUI();
      showGlobalToast('Sesion cerrada');
    },
    isLoggedIn: Session.isLoggedIn,
    getUser: Session.getUser
  };

  // ── Observar apertura y cambios del carrito ───────────────────────────────
  function watchCart() {
    var cartSb = document.getElementById('cart-sb');
    if (!cartSb) return;

    var observer = new MutationObserver(function() {
      if (cartSb.classList.contains('on')) {
        setTimeout(injectCheckoutBtn, 200);
      } else {
        // Limpiar botón al cerrar para reinyectar fresco al abrir
        var old = document.getElementById('aurea-checkout-btn');
        if (old) old.remove();
      }
    });
    observer.observe(cartSb, { attributes: true, attributeFilter: ['class'] });

    var cartBd = document.getElementById('cart-bd');
    if (cartBd) {
      var contentObs = new MutationObserver(function() {
        if (cartSb.classList.contains('on')) {
          var old = document.getElementById('aurea-checkout-btn');
          if (old) old.remove();
          setTimeout(injectCheckoutBtn, 250);
        }
      });
      contentObs.observe(cartBd, { childList: true });
    }
  }

  // ── Post-login con checkout pendiente ─────────────────────────────────────
  function checkPostLoginCheckout() {
    var params = new URLSearchParams(window.location.search);
    if (params.get('checkout') && Session.isLoggedIn()) {
      setTimeout(function() {
        if (typeof toggleCart === 'function') toggleCart();
      }, 700);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }

  // ── Init ──────────────────────────────────────────────────────────────────
  function init() {
    injectAuthNav();
    watchCart();
    checkPostLoginCheckout();
    console.log('%c AUREA Auth cargado', 'color:#C9A84C;font-style:italic;');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

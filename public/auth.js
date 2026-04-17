// auth.js — Módulo de autenticación compartido (incluir en todas las páginas)
// Maneja: login, registro, logout, sesión persistente con JWT

const API = 'http://localhost:3000/api';

// ── Helpers de almacenamiento ────────────────────────────────────────────────
const Auth = {
  getToken: () => localStorage.getItem('aurea_token'),
  getUser:  () => { try { return JSON.parse(localStorage.getItem('aurea_user')); } catch { return null; } },
  setSession: (token, user) => {
    localStorage.setItem('aurea_token', token);
    localStorage.setItem('aurea_user', JSON.stringify(user));
  },
  clearSession: () => {
    localStorage.removeItem('aurea_token');
    localStorage.removeItem('aurea_user');
  },
  isLoggedIn: () => !!localStorage.getItem('aurea_token'),

  // Petición autenticada
  fetchAuth: async (endpoint, options = {}) => {
    const token = Auth.getToken();
    const res = await fetch(API + endpoint, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
        ...(options.headers || {})
      }
    });
    const data = await res.json();
    if (res.status === 401) {
      Auth.clearSession();
      window.location.href = '/login?expired=1';
      return null;
    }
    return { ok: res.ok, status: res.status, data };
  },

  // Cerrar sesión
  logout: () => {
    Auth.clearSession();
    window.location.href = '/login';
  }
};

// ── Actualizar UI de navegación según estado de sesión ───────────────────────
function updateNavAuth() {
  const user = Auth.getUser();
  const loginBtn  = document.getElementById('nav-login-btn');
  const userMenu  = document.getElementById('nav-user-menu');
  const userName  = document.getElementById('nav-user-name');

  if (!loginBtn && !userMenu) return;  // nav no presente

  if (user && Auth.isLoggedIn()) {
    if (loginBtn)  loginBtn.style.display  = 'none';
    if (userMenu)  userMenu.style.display  = 'flex';
    if (userName)  userName.textContent    = user.name.split(' ')[0];
  } else {
    if (loginBtn)  loginBtn.style.display  = '';
    if (userMenu)  userMenu.style.display  = 'none';
  }
}

// Ejecutar al cargar
document.addEventListener('DOMContentLoaded', updateNavAuth);

// server.js — Servidor principal AUREA (compatible con Node 24+)
require('dotenv').config(); // Carga variables del archivo .env
const express   = require('express');
const cors      = require('cors');
const bcrypt    = require('bcryptjs');
const jwt       = require('jsonwebtoken');
const path      = require('path');
const { initDB, stmts } = require('./db');

const app    = express();
const PORT   = 3000;
const SECRET = 'aurea_jwt_secret_2024_cambiar_en_produccion';
const SALT_ROUNDS = 12;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── Middleware: verificar JWT ──────────────────────────────────────────────────
function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer '))
    return res.status(401).json({ error: 'Token requerido' });
  try {
    req.user = jwt.verify(header.slice(7), SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

// ── RUTAS DE AUTENTICACIÓN ────────────────────────────────────────────────────

// POST /api/register
app.post('/api/register', (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password)
    return res.status(400).json({ error: 'Nombre, email y contraseña son obligatorios' });

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ error: 'Email inválido' });

  if (password.length < 6)
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });

  const existing = stmts.getUserByEmail(email.toLowerCase().trim());
  if (existing)
    return res.status(409).json({ error: 'Ya existe una cuenta con ese email' });

  const hash   = bcrypt.hashSync(password, SALT_ROUNDS);
  const result = stmts.createUser(name.trim(), email.toLowerCase().trim(), hash);
  const token  = jwt.sign({ id: result.lastInsertRowid, email }, SECRET, { expiresIn: '7d' });

  res.status(201).json({
    message: 'Cuenta creada exitosamente',
    token,
    user: { id: result.lastInsertRowid, name: name.trim(), email: email.toLowerCase().trim() }
  });
});

// POST /api/login
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: 'Email y contraseña son obligatorios' });

  const user = stmts.getUserByEmail(email.toLowerCase().trim());
  if (!user)
    return res.status(401).json({ error: 'Credenciales incorrectas' });

  if (!bcrypt.compareSync(password, user.password))
    return res.status(401).json({ error: 'Credenciales incorrectas' });

  const token = jwt.sign({ id: user.id, email: user.email }, SECRET, { expiresIn: '7d' });
  res.json({
    message: 'Bienvenido de nuevo',
    token,
    user: { id: user.id, name: user.name, email: user.email }
  });
});

// GET /api/me
app.get('/api/me', auth, (req, res) => {
  const user = stmts.getUserById(req.user.id);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json({ user });
});

// ── RUTAS DE COMPRAS ──────────────────────────────────────────────────────────

// POST /api/purchases
app.post('/api/purchases', auth, (req, res) => {
  const { items } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0)
    return res.status(400).json({ error: 'Se requiere al menos un producto' });

  const inserted = [];
  for (const item of items) {
    const { product_id, product_name, size, price, qty, engraving } = item;
    if (!product_id || !product_name || !price || !qty)
      return res.status(400).json({ error: 'Datos de producto incompletos' });

    const result = stmts.createPurchase(
      req.user.id,
      String(product_id),
      String(product_name),
      String(size || 'S'),
      Number(price),
      Number(qty),
      engraving ? String(engraving) : null
    );
    inserted.push({ id: result.lastInsertRowid, ...item });
  }

  res.status(201).json({ message: 'Compra registrada', purchases: inserted });
});

// GET /api/purchases
app.get('/api/purchases', auth, (req, res) => {
  const purchases = stmts.getPurchasesByUser(req.user.id);
  res.json({ purchases });
});

// ── PROXY → Google Translate (gratis, sin API key) ───────────────────────────
// Recibe: { texts: string[], target: string }
// Devuelve: { translations: string[] }
app.post('/api/translate', async (req, res) => {
  const { texts, target } = req.body;

  if (!texts || !Array.isArray(texts) || !target)
    return res.status(400).json({ error: 'Faltan parámetros: texts[] y target' });

  try {
    const results = [];

    // Traducir de uno en uno usando el endpoint más confiable de Google
    for (const text of texts) {
      if (!text || text.trim().length === 0) {
        results.push(text);
        continue;
      }

      const url = 'https://translate.googleapis.com/translate_a/single'
        + '?client=gtx'
        + '&sl=es'
        + '&tl=' + encodeURIComponent(target)
        + '&dt=t'
        + '&q=' + encodeURIComponent(text);

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        console.warn('Google Translate error para texto:', text.slice(0,30), '→', response.status);
        results.push(text); // devolver original si falla
        continue;
      }

      const data = await response.json();

      // Respuesta: [[[traduccion, original, ...], ...], ...]
      let translated = text;
      if (Array.isArray(data) && Array.isArray(data[0])) {
        translated = data[0]
          .filter(item => Array.isArray(item) && item[0])
          .map(item => item[0])
          .join('');
      }
      results.push(translated || text);
    }

    res.json({ translations: results });
  } catch (err) {
    console.error('Error en Google Translate:', err.message);
    res.status(502).json({ error: 'Error al traducir: ' + err.message });
  }
});

// ── SPA fallback ──────────────────────────────────────────────────────────────
app.get('/login',    (_, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));
app.get('/register', (_, res) => res.sendFile(path.join(__dirname, 'public', 'register.html')));
app.get('/historial',(_, res) => res.sendFile(path.join(__dirname, 'public', 'historial.html')));

// ── Arrancar (esperar a que la BD esté lista) ────────────────────────────────
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`\n✦ AUREA Backend corriendo en http://localhost:${PORT}`);
    console.log(`  ◆ API disponible en http://localhost:${PORT}/api\n`);
  });
}).catch(err => {
  console.error('Error iniciando la base de datos:', err);
  process.exit(1);
});

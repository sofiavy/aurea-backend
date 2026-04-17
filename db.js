// db.js — Base de datos SQLite usando sql.js (compatible con Node 24+)
const path = require('path');
const fs   = require('fs');
const initSqlJs = require('sql.js');

const DB_PATH = path.join(__dirname, 'aurea.db');

let db;  // instancia de la BD

// ── Guardar BD en disco cada vez que hay un cambio ───────────────────────────
function saveToDisk() {
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

// ── Inicializar BD (async porque sql.js lo requiere) ─────────────────────────
async function initDB() {
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    // Cargar BD existente desde archivo
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    // Crear BD nueva
    db = new SQL.Database();
  }

  // Crear tablas si no existen
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT    NOT NULL,
      email      TEXT    NOT NULL UNIQUE,
      password   TEXT    NOT NULL,
      created_at TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS purchases (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id      INTEGER NOT NULL,
      product_id   TEXT    NOT NULL,
      product_name TEXT    NOT NULL,
      size         TEXT    NOT NULL DEFAULT 'S',
      price        INTEGER NOT NULL,
      qty          INTEGER NOT NULL DEFAULT 1,
      engraving    TEXT,
      status       TEXT    NOT NULL DEFAULT 'pendiente',
      created_at   TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  saveToDisk();
  console.log('  ◆ Base de datos lista:', DB_PATH);
  return db;
}

// ── Helpers que imitan la API de better-sqlite3 ───────────────────────────────

// Ejecuta una query que modifica datos (INSERT, UPDATE, DELETE)
// Devuelve { lastInsertRowid, changes }
function run(sql, params = []) {
  db.run(sql, params);
  saveToDisk();
  const row = db.exec('SELECT last_insert_rowid() as id, changes() as ch')[0];
  const lastInsertRowid = row ? row.values[0][0] : null;
  const changes         = row ? row.values[0][1] : 0;
  return { lastInsertRowid, changes };
}

// Devuelve UNA fila o undefined
function get(sql, params = []) {
  const result = db.exec(sql, params);
  if (!result.length || !result[0].values.length) return undefined;
  const cols = result[0].columns;
  const vals = result[0].values[0];
  const obj  = {};
  cols.forEach((c, i) => { obj[c] = vals[i]; });
  return obj;
}

// Devuelve TODAS las filas como array de objetos
function all(sql, params = []) {
  const result = db.exec(sql, params);
  if (!result.length) return [];
  const cols = result[0].columns;
  return result[0].values.map(vals => {
    const obj = {};
    cols.forEach((c, i) => { obj[c] = vals[i]; });
    return obj;
  });
}

// ── Queries ──────────────────────────────────────────────────────────────────
const stmts = {
  createUser:         (name, email, password) =>
    run('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name, email, password]),

  getUserByEmail:     (email) =>
    get('SELECT * FROM users WHERE email = ?', [email]),

  getUserById:        (id) =>
    get('SELECT id, name, email, created_at FROM users WHERE id = ?', [id]),

  createPurchase:     (user_id, product_id, product_name, size, price, qty, engraving) =>
    run(
      'INSERT INTO purchases (user_id, product_id, product_name, size, price, qty, engraving) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [user_id, product_id, product_name, size, price, qty, engraving]
    ),

  getPurchasesByUser: (user_id) =>
    all('SELECT * FROM purchases WHERE user_id = ? ORDER BY created_at DESC', [user_id]),

  getPurchaseById:    (id, user_id) =>
    get('SELECT * FROM purchases WHERE id = ? AND user_id = ?', [id, user_id]),
};

module.exports = { initDB, stmts };

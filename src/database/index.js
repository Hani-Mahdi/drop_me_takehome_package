const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

let db = null;
const databasePath = './data/dropme.db';
const databaseDirectory = path.dirname(databasePath);

if (!fs.existsSync(databaseDirectory)) {
  fs.mkdirSync(databaseDirectory, { recursive: true });
}

function initDatabase() {
  return initSqlJs().then(function(SQL) {
    if (fs.existsSync(databasePath)) {
      const fileBuffer = fs.readFileSync(databasePath);
      db = new SQL.Database(fileBuffer);
    } else {
      db = new SQL.Database();
    }
    
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        phone_number TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        total_points INTEGER DEFAULT 0,
        created_at TEXT,
        updated_at TEXT
      )
    `);
    
    db.run(`
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        item_type TEXT NOT NULL,
        item_barcode TEXT,
        points_earned INTEGER NOT NULL,
        machine_id TEXT NOT NULL,
        created_at TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
    
    db.run('CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id)');
    db.run('CREATE INDEX IF NOT EXISTS idx_transactions_barcode ON transactions(item_barcode)');
    
    saveDatabase();
    console.log('Database initialized successfully');
    return db;
  });
}

function saveDatabase() {
  if (db !== null) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(databasePath, buffer);
  }
}

function getOne(sql, params) {
  if (params == null) { params = []; }
  const stmt = db.prepare(sql);
  stmt.bind(params);
  if (stmt.step()) {
    const result = stmt.getAsObject();
    stmt.free();
    return result;
  }
  stmt.free();
  return null;
}

function getAll(sql, params) {
  if (params == null) { params = []; }
  const results = [];
  const stmt = db.prepare(sql);
  stmt.bind(params);
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

function run(sql, params) {
  if (params == null) { params = []; }
  db.run(sql, params);
  saveDatabase();
}

module.exports = {
  init: initDatabase,
  getOne: getOne,
  getAll: getAll,
  run: run,
  save: saveDatabase
};

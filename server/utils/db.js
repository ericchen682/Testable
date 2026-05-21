const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, '..', 'data', 'testable.db');
const schemaPath = path.join(__dirname, '..', 'data', 'schema.sql');

const db = new Database(dbPath);
db.pragma('foreign_keys = ON');
db.exec(fs.readFileSync(schemaPath, 'utf8'));

module.exports = db;
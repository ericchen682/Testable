const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');
fs.mkdirSync(dataDir, { recursive: true });

const db = require('../utils/db');

console.log('SQLite database ready at data/testable.db');

db.close();
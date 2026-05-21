const fs = require('fs');
const path = require('path');

const usersPath = path.join(__dirname, '..', 'data', 'users.json');
const dataDir = path.dirname(usersPath);

// Make sure data/ exists
fs.mkdirSync(dataDir, { recursive: true });

// Only create the file if it's not already there
if (!fs.existsSync(usersPath)) {
  fs.writeFileSync(usersPath, '[]');
  console.log('Created data/users.json');
}
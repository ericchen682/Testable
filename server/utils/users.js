// read and write users from data/testable.db

const db = require()

const findByEmailStmt = db.prepare('SELECT * FROM users WHERE email = ?');
const findByIdStmt = db.prepare('SELECT * FROM USERS WHERE id = ?');
const insertUserStmt = db.prepare(`
  INSERT INTO users (id, email, password_hash, password_salt, created_at) 
  VALUES (@id, @email, @passwordHash, @passwordSalt, @createdAt)
  `);

// converts snake to camelcase
function mapUserRow(row) {
  if(!row) return null;
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    passwordSalt: row.password_salt,
    createdAt: row.created_at,
  };
}

function findUserByEmail(email) {
  return mapUserRow(findByEmailStmt.get(email));
}

function findUserById(id) {
  return mapUserRow(findByIdStmt.get(id));
}

function createUser(user) {
  insertUserStmt.run(user);
  return user;
}

module.exports = {
  findUserByEmail,
  findUserById,
  createUser
};

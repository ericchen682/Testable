// read and write users from data/testable.db

const db = require()

const findByEmailStmt = db.prepare('SELECT * FROM users WHERE email = ?');
const findByIdStmt = db.prepare('SELECT * FROM USERS WHERE id = ?');
const insertUserStmt = db.prepare('INSERT INTO users (id, email, password_hash, password_salt, created_at) VALUES (@id, @email, @passwordHash, @passwordSalt, @createdAt)');

async function findUserByEmail(email) {
  
}

async function findUserById(id) {

}

function createUser(user) {
  
}

module.exports = {
  findUserByEmail,
  findUserById,
  createUser
};

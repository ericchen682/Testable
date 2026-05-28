const crypto = require('crypto');

const db = require('./db');

const insertTokenStmt = db.prepare(`
  INSERT INTO password_reset_tokens (token_hash, user_id, expires_at, created_at)
  VALUES (@tokenHash, @userId, @expiresAt, @createdAt)
`);
const findTokenStmt = db.prepare(`
  SELECT token_hash, user_id, expires_at, created_at
  FROM password_reset_tokens
  WHERE token_hash = ?
`);
const deleteTokenStmt = db.prepare('DELETE FROM password_reset_tokens WHERE token_hash = ?');
const deleteUserTokensStmt = db.prepare('DELETE FROM password_reset_tokens WHERE user_id = ?');
const deleteExpiredTokensStmt = db.prepare('DELETE FROM password_reset_tokens WHERE expires_at <= ?');

function hashResetToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function createPasswordResetToken(userId) {
  deleteUserTokensStmt.run(userId);

  const token = crypto.randomBytes(32).toString('hex');
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 1000 * 60 * 30).toISOString();

  insertTokenStmt.run({
    tokenHash: hashResetToken(token),
    userId,
    expiresAt,
    createdAt: now.toISOString(),
  });

  return { token, expiresAt };
}

function findPasswordResetToken(token) {
  const row = findTokenStmt.get(hashResetToken(token));
  if (!row) return null;

  return {
    tokenHash: row.token_hash,
    userId: row.user_id,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  };
}

function deletePasswordResetToken(tokenHash) {
  deleteTokenStmt.run(tokenHash);
}

function deleteExpiredPasswordResetTokens() {
  deleteExpiredTokensStmt.run(new Date().toISOString());
}

module.exports = {
  createPasswordResetToken,
  findPasswordResetToken,
  deletePasswordResetToken,
  deleteExpiredPasswordResetTokens,
};

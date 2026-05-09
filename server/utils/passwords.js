// password hashing

const crypto = require('crypto');

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const passwordHash = crypto.scryptSync(password, salt, 64).toString('hex');

  return {
    passwordHash,
    passwordSalt: salt,
  };
}

function comparePassword(password, user) {
  const { passwordHash } = hashPassword(password, user.passwordSalt);
  return passwordHash === user.passwordHash;
}

module.exports = {
  hashPassword,
  comparePassword,
};

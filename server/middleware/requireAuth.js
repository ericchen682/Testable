// protects routes from unauthenticated users
// verifies JWT before allowing access

const { verifyToken } = require('../utils/tokens');
const { findUserById } = require('../utils/users');

async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'You must be logged in.' });
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const decoded = verifyToken(token);
    const user = await findUserById(decoded.userId);

    if (!user) {
      return res.status(401).json({ error: 'You must be logged in.' });
    }

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

module.exports = requireAuth;

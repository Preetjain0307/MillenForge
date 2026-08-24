const { verifyToken, parseCookies } = require('../utils/token');
const User = require('../models/User');
const { getConnectionStatus } = require('../services/db');

function isDbReady() {
  const status = getConnectionStatus();
  return Boolean(status.connected && status.state === 1);
}

// In-memory fallback user cache for no-DB mode
const memoryUsers = new Map();

/**
 * Helper to fetch user by id either from MongoDB or memory store.
 */
async function findUserById(id) {
  if (isDbReady()) {
    try {
      const user = await User.findById(id);
      if (user) return user.toPublicJSON ? user.toPublicJSON() : user;
    } catch (_) {
      // Fallback to memory store
    }
  }
  return memoryUsers.get(id) || null;
}

/**
 * Save user to memory store (for no-DB dev testing).
 */
function saveMemoryUser(userData) {
  memoryUsers.set(userData.id || userData._id, userData);
  return userData;
}

/**
 * Extracts and verifies token from request (Cookies or Authorization header).
 */
function extractToken(req) {
  const cookies = parseCookies(req);
  if (cookies.nm_auth) {
    return cookies.nm_auth;
  }

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }

  return null;
}

/**
 * Middleware: Requires an authenticated session.
 * Returns 401 if missing or invalid.
 */
const requireAuth = async (req, res, next) => {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({
      success: false,
      code: 'UNAUTHENTICATED',
      error: 'Authentication required. Please log in.',
    });
  }

  const decoded = verifyToken(token);
  if (!decoded || !decoded.id) {
    return res.status(401).json({
      success: false,
      code: 'INVALID_TOKEN',
      error: 'Session expired or invalid. Please log in again.',
    });
  }

  const user = await findUserById(decoded.id);
  if (!user) {
    // If user object was stored directly in JWT payload
    if (decoded.email) {
      req.user = {
        id: decoded.id,
        _id: decoded.id,
        email: decoded.email,
        name: decoded.name || decoded.email.split('@')[0],
        avatar: decoded.avatar || '',
        provider: decoded.provider || 'email',
        emailVerified: decoded.emailVerified !== false,
      };
      return next();
    }
    return res.status(401).json({
      success: false,
      code: 'USER_NOT_FOUND',
      error: 'User account not found. Please log in again.',
    });
  }

  req.user = user;
  next();
};

/**
 * Middleware: Optional authentication.
 * Attaches req.user if token present, but does NOT reject unauthenticated requests.
 */
const optionalAuth = async (req, _res, next) => {
  const token = extractToken(req);
  if (token) {
    const decoded = verifyToken(token);
    if (decoded && decoded.id) {
      const user = await findUserById(decoded.id);
      req.user = user || {
        id: decoded.id,
        _id: decoded.id,
        email: decoded.email,
        name: decoded.name || decoded.email.split('@')[0],
        avatar: decoded.avatar || '',
        provider: decoded.provider || 'email',
      };
    }
  }
  next();
};

module.exports = {
  requireAuth,
  optionalAuth,
  findUserById,
  saveMemoryUser,
};

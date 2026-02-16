const jwt = require('jsonwebtoken');
require('dotenv').config();

// Fail fast if JWT_SECRET is not set
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is required');
  process.exit(1);
}

// JWT Error types for specific error messages
const JWT_ERRORS = {
  TokenExpiredError: 'Token has expired',
  JsonWebTokenError: 'Invalid token',
  NotBeforeError: 'Token not active'
};

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      error: 'Access token required',
      code: 'TOKEN_MISSING'
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      const message = JWT_ERRORS[err.name] || 'Invalid token';
      const code = err.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'TOKEN_INVALID';
      return res.status(403).json({ error: message, code });
    }
    req.user = user;
    next();
  });
};

// Optional auth middleware - doesn't fail if no token, but attaches user if valid
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (!err) {
      req.user = user;
    }
    next();
  });
};

module.exports = { authenticateToken, optionalAuth, JWT_SECRET };

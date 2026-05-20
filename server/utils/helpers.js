import jwt from 'jsonwebtoken';

/**
 * Generate a JWT token for a given user ID
 */
export const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

/**
 * Generate a refresh token for a given user ID
 */
export const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d',
  });
};

/**
 * Verify a JWT token and return the decoded payload
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

/**
 * Format a consistent API response
 */
export const formatResponse = (data = null, message = 'Success') => {
  return {
    success: true,
    message,
    data,
  };
};

/**
 * Format a consistent error response
 */
export const formatError = (message = 'An error occurred', statusCode = 500) => {
  return {
    success: false,
    message,
    statusCode,
  };
};

/**
 * Paginate query helper
 */
export const paginate = (page = 1, limit = 10) => {
  const p = Math.max(1, parseInt(page, 10) || 1);
  const l = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (p - 1) * l;
  return { page: p, limit: l, skip };
};

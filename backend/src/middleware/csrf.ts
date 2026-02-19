import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { ApiError } from './errorHandler';
import redisClient from '../config/redis';
import logger from '../config/logger';

const CSRF_TOKEN_HEADER = 'x-csrf-token';
const CSRF_TOKEN_COOKIE = 'csrf-token';
const CSRF_TOKEN_EXPIRY = 3600; // 1 hour in seconds

// Paths excluded from CSRF verification (pre-authentication endpoints)
// Note: middleware is mounted at /api/, so req.path is relative (no /api/ prefix)
const CSRF_EXEMPT_PATHS = ['/auth/login', '/auth/register', '/auth/refresh'];

/**
 * Generate a CSRF token
 */
export const generateCsrfToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Middleware to generate and send CSRF token to client
 */
export const provideCsrfToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = generateCsrfToken();

    // Store token in Redis with expiry
    const sessionId = req.sessionID || req.ip || 'unknown';
    await redisClient.setEx(`csrf:${sessionId}`, CSRF_TOKEN_EXPIRY, token);

    // Send token in cookie (HttpOnly, Secure in production)
    res.cookie(CSRF_TOKEN_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: CSRF_TOKEN_EXPIRY * 1000,
    });

    // Also send in response header for SPA convenience
    res.setHeader(CSRF_TOKEN_HEADER, token);

    next();
  } catch (error) {
    logger.error('Failed to generate CSRF token', { error });
    next(error);
  }
};

/**
 * Middleware to verify CSRF token for state-changing operations
 */
export const verifyCsrfToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Skip verification for safe methods
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return next();
    }

    // Skip verification for exempt paths (pre-authentication endpoints)
    if (CSRF_EXEMPT_PATHS.includes(req.path)) {
      return next();
    }

    // Get token from header
    const tokenFromHeader = req.get(CSRF_TOKEN_HEADER);
    // Get token from cookie
    const tokenFromCookie = req.cookies[CSRF_TOKEN_COOKIE];

    if (!tokenFromHeader) {
      throw new ApiError(403, 'CSRF token missing from request headers');
    }

    if (!tokenFromCookie) {
      throw new ApiError(403, 'CSRF token missing from cookies');
    }

    // Tokens must match (double-submit cookie pattern)
    if (tokenFromHeader !== tokenFromCookie) {
      logger.warn('CSRF token mismatch', {
        ip: req.ip,
        path: req.path,
        method: req.method,
      });
      throw new ApiError(403, 'CSRF token validation failed');
    }

    // Verify token exists in Redis
    const sessionId = req.sessionID || req.ip || 'unknown';
    const storedToken = await redisClient.get(`csrf:${sessionId}`);

    if (!storedToken) {
      throw new ApiError(403, 'CSRF token expired or invalid');
    }

    if (storedToken !== tokenFromHeader) {
      logger.warn('CSRF token does not match stored token', {
        ip: req.ip,
        path: req.path,
      });
      throw new ApiError(403, 'CSRF token validation failed');
    }

    next();
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
    } else {
      logger.error('CSRF verification error', { error });
      next(new ApiError(403, 'CSRF validation failed'));
    }
  }
};

/**
 * Endpoint to get a new CSRF token
 */
export const getCsrfToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = generateCsrfToken();
    const sessionId = req.sessionID || req.ip || 'unknown';

    await redisClient.setEx(`csrf:${sessionId}`, CSRF_TOKEN_EXPIRY, token);

    res.cookie(CSRF_TOKEN_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: CSRF_TOKEN_EXPIRY * 1000,
    });

    res.json({
      success: true,
      data: {
        csrfToken: token,
      },
    });
  } catch (error) {
    next(error);
  }
};

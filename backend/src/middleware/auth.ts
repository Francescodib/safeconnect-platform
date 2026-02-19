import { Request, Response, NextFunction } from 'express';
import authService from '../services/authService';
import { User } from '../models';
import { ApiError } from './errorHandler';
import auditService from '../services/auditService';

// Extend Express Request to include user
export interface AuthRequest extends Request {
  user?: User;
  userId?: string;
}

/**
 * Middleware to verify JWT token and attach user to request
 */
export const authenticate = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'No token provided');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const payload = authService.verifyAccessToken(token);

    // Get user from database
    const user = await User.findByPk(payload.userId);
    if (!user) {
      throw new ApiError(401, 'User not found');
    }

    if (!user.isActive) {
      throw new ApiError(403, 'Account is deactivated');
    }

    if (user.isLocked()) {
      throw new ApiError(403, 'Account is temporarily locked due to failed login attempts');
    }

    // Attach user to request
    req.user = user;
    req.userId = user.id;

    next();
  } catch (error) {
    if (error instanceof ApiError) {
      // Log invalid token event
      await auditService.logInvalidTokenEvent((req as AuthRequest).userId, req.ip || 'unknown');
      next(error);
    } else {
      next(new ApiError(401, 'Authentication failed'));
    }
  }
};

/**
 * Middleware to check if user has required role
 */
export const authorize = (...roles: Array<'admin' | 'user' | 'guest'>) => {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required'));
    }

    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, 'You do not have permission to access this resource'));
    }

    next();
  };
};

/**
 * Middleware to check if user is admin
 */
export const requireAdmin = authorize('admin');

/**
 * Middleware to check if user is at least a regular user (not guest)
 */
export const requireUser = authorize('admin', 'user');

/**
 * Optional authentication - doesn't fail if no token provided
 */
export const optionalAuth = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = authService.verifyAccessToken(token);
      const user = await User.findByPk(payload.userId);

      if (user && user.isActive && !user.isLocked()) {
        req.user = user;
        req.userId = user.id;
      }
    }
  } catch {
    // Silently fail for optional auth
  }

  next();
};

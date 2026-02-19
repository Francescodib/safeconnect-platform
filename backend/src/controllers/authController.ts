import { Response, NextFunction } from 'express';
import { User } from '../models';
import authService from '../services/authService';
import auditService from '../services/auditService';
import { ApiError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import logger from '../config/logger';

class AuthController {
  /**
   * Register a new user
   */
  async register(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, firstName, lastName } = req.body;
      const ip = req.ip || 'unknown';
      const userAgent = req.get('user-agent');

      // Check if user already exists
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        throw new ApiError(400, 'Email already registered');
      }

      // Create new user
      const user = await User.create({
        email,
        password, // Will be hashed by User model hook
        firstName,
        lastName,
        role: 'user',
        isActive: true,
        failedLoginAttempts: 0,
        lockedUntil: null,
      });

      // Generate tokens
      const tokens = await authService.generateTokenPair(user);

      // Log registration
      await auditService.logRegistration(user.id, ip, userAgent);

      logger.info('User registered successfully', { userId: user.id, email });

      res.status(201).json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            createdAt: user.createdAt,
          },
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        },
        message: 'Registration successful',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Login user
   */
  async login(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const ip = req.ip || 'unknown';
      const userAgent = req.get('user-agent');

      // Find user
      const user = await User.findOne({ where: { email } });
      if (!user) {
        await auditService.logFailedLogin(email, ip, 'User not found');
        await auditService.logFailedLoginEvent(undefined, ip, email);
        await auditService.checkFailedLoginThreshold(ip);
        throw new ApiError(401, 'Invalid credentials');
      }

      // Check if account is locked
      if (user.isLocked()) {
        await auditService.logFailedLoginEvent(user.id, ip, email);
        await auditService.checkFailedLoginThreshold(ip);
        throw new ApiError(
          403,
          'Account is temporarily locked due to too many failed login attempts'
        );
      }

      // Check if account is active
      if (!user.isActive) {
        throw new ApiError(403, 'Account is deactivated');
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        await user.incrementFailedAttempts();
        await auditService.logFailedLogin(email, ip, 'Invalid password');
        await auditService.logFailedLoginEvent(user.id, ip, email);
        await auditService.checkFailedLoginThreshold(ip);
        throw new ApiError(401, 'Invalid credentials');
      }

      // Reset failed attempts on successful login
      await user.resetFailedAttempts();

      // Generate tokens
      const tokens = await authService.generateTokenPair(user);

      // Log successful login
      await auditService.logLogin(user.id, ip, userAgent);

      logger.info('User logged in successfully', { userId: user.id, email });

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            createdAt: user.createdAt,
          },
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        },
        message: 'Login successful',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout user
   */
  async logout(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;
      const ip = req.ip || 'unknown';
      const userAgent = req.get('user-agent');

      if (refreshToken) {
        await authService.revokeRefreshToken(refreshToken);
      }

      if (req.userId) {
        await auditService.logLogout(req.userId, ip, userAgent);
      }

      logger.info('User logged out', { userId: req.userId });

      res.json({
        success: true,
        message: 'Logout successful',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Refresh access token
   */
  async refresh(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        throw new ApiError(400, 'Refresh token is required');
      }

      // Generate new token pair (old refresh token is revoked)
      const tokens = await authService.refreshAccessToken(refreshToken);

      res.json({
        success: true,
        data: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        },
        message: 'Token refreshed successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user
   */
  async me(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Not authenticated');
      }

      res.json({
        success: true,
        data: {
          id: req.user.id,
          email: req.user.email,
          firstName: req.user.firstName,
          lastName: req.user.lastName,
          role: req.user.role,
          createdAt: req.user.createdAt,
          updatedAt: req.user.updatedAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();

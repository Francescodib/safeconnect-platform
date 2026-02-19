import jwt, { SignOptions } from 'jsonwebtoken';
import { Op } from 'sequelize';
import config from '../config';
import { User, RefreshToken } from '../models';
import { ApiError } from '../middleware/errorHandler';
import logger from '../config/logger';

interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

class AuthService {
  /**
   * Generate JWT access token
   */
  generateAccessToken(user: User): string {
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    return jwt.sign(payload, config.jwt.accessSecret, {
      expiresIn: config.jwt.accessExpiry,
      issuer: config.app.name,
      audience: config.app.frontendUrl,
    } as SignOptions);
  }

  /**
   * Generate JWT refresh token
   */
  generateRefreshToken(user: User): string {
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    return jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiry,
      issuer: config.app.name,
      audience: config.app.frontendUrl,
    } as SignOptions);
  }

  /**
   * Generate both access and refresh tokens
   */
  async generateTokenPair(user: User): Promise<TokenPair> {
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    // Calculate expiry date (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Store refresh token in database
    await RefreshToken.create({
      token: refreshToken,
      userId: user.id,
      expiresAt,
      isRevoked: false,
    });

    return { accessToken, refreshToken };
  }

  /**
   * Verify access token
   */
  verifyAccessToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, config.jwt.accessSecret, {
        issuer: config.app.name,
        audience: config.app.frontendUrl,
      }) as JwtPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new ApiError(401, 'Access token expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new ApiError(401, 'Invalid access token');
      }
      throw new ApiError(401, 'Token verification failed');
    }
  }

  /**
   * Verify refresh token
   */
  verifyRefreshToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, config.jwt.refreshSecret, {
        issuer: config.app.name,
        audience: config.app.frontendUrl,
      }) as JwtPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new ApiError(401, 'Refresh token expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new ApiError(401, 'Invalid refresh token');
      }
      throw new ApiError(401, 'Token verification failed');
    }
  }

  /**
   * Refresh access token using refresh token (with token rotation)
   */
  async refreshAccessToken(refreshTokenString: string): Promise<TokenPair> {
    // Verify token signature
    const payload = this.verifyRefreshToken(refreshTokenString);

    // Check if refresh token exists and is valid in database
    const storedToken = await RefreshToken.findOne({
      where: { token: refreshTokenString },
    });

    if (!storedToken) {
      throw new ApiError(401, 'Refresh token not found');
    }

    if (!storedToken.isValid()) {
      await storedToken.destroy();
      throw new ApiError(401, 'Refresh token is invalid or expired');
    }

    // Get user
    const user = await User.findByPk(payload.userId);
    if (!user || !user.isActive) {
      throw new ApiError(401, 'User not found or inactive');
    }

    // Revoke the old refresh token (rotation)
    storedToken.isRevoked = true;
    await storedToken.save();

    // Generate new token pair
    return this.generateTokenPair(user);
  }

  /**
   * Revoke refresh token (logout)
   */
  async revokeRefreshToken(token: string): Promise<void> {
    const storedToken = await RefreshToken.findOne({ where: { token } });

    if (storedToken) {
      storedToken.isRevoked = true;
      await storedToken.save();
      logger.info('Refresh token revoked', { tokenId: storedToken.id });
    }
  }

  /**
   * Revoke all user refresh tokens
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    await RefreshToken.update({ isRevoked: true }, { where: { userId, isRevoked: false } });
    logger.info('All user refresh tokens revoked', { userId });
  }

  /**
   * Clean up expired tokens (should be run periodically)
   */
  async cleanupExpiredTokens(): Promise<number> {
    const result = await RefreshToken.destroy({
      where: {
        expiresAt: {
          [Op.lt]: new Date(),
        },
      },
    });

    logger.info('Cleaned up expired refresh tokens', { count: result });
    return result;
  }
}

export default new AuthService();

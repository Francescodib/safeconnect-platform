import jwt from 'jsonwebtoken';
import authService from '../../services/authService';
import { ApiError } from '../../middleware/errorHandler';

jest.mock('../../config/logger', () => ({
  __esModule: true,
  default: { error: jest.fn(), warn: jest.fn(), info: jest.fn() },
}));

jest.mock('../../models', () => ({
  User: { findByPk: jest.fn() },
  RefreshToken: {
    create: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
  },
}));

import { User, RefreshToken } from '../../models';

const mockRefreshToken = RefreshToken as jest.Mocked<typeof RefreshToken>;
const mockUser = User as jest.Mocked<typeof User>;

const fakeUser = {
  id: 'user-uuid',
  email: 'user@example.com',
  role: 'user' as const,
  isActive: true,
};

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateAccessToken', () => {
    it('returns a signed JWT string', () => {
      const token = authService.generateAccessToken(fakeUser as any);
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // valid JWT structure
    });

    it('encodes userId, email and role in the payload', () => {
      const token = authService.generateAccessToken(fakeUser as any);
      const decoded = jwt.decode(token) as Record<string, unknown>;
      expect(decoded.userId).toBe(fakeUser.id);
      expect(decoded.email).toBe(fakeUser.email);
      expect(decoded.role).toBe(fakeUser.role);
    });
  });

  describe('generateRefreshToken', () => {
    it('returns a signed JWT string', () => {
      const token = authService.generateRefreshToken(fakeUser as any);
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3);
    });
  });

  describe('generateTokenPair', () => {
    it('stores the refresh token in the database and returns both tokens', async () => {
      mockRefreshToken.create = jest.fn().mockResolvedValue({});

      const result = await authService.generateTokenPair(fakeUser as any);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(mockRefreshToken.create).toHaveBeenCalledTimes(1);
      expect(mockRefreshToken.create).toHaveBeenCalledWith(
        expect.objectContaining({
          token: result.refreshToken,
          userId: fakeUser.id,
          isRevoked: false,
        })
      );
    });
  });

  describe('verifyAccessToken', () => {
    it('returns the payload for a valid token', () => {
      const token = authService.generateAccessToken(fakeUser as any);
      const payload = authService.verifyAccessToken(token);
      expect(payload.userId).toBe(fakeUser.id);
      expect(payload.email).toBe(fakeUser.email);
    });

    it('throws ApiError 401 for an invalid token', () => {
      expect(() => authService.verifyAccessToken('invalid.token.here')).toThrow(ApiError);
      expect(() => authService.verifyAccessToken('invalid.token.here')).toThrow(
        expect.objectContaining({ statusCode: 401 })
      );
    });

    it('throws ApiError 401 for an expired token', () => {
      // Sign a token that expired 1 second ago
      const expiredToken = jwt.sign(
        { userId: 'id', email: 'e@e.com', role: 'user' },
        process.env.JWT_SECRET as string,
        {
          expiresIn: -1,
          issuer: 'SafeConnect Solutions',
          audience: 'http://localhost:3000',
        }
      );

      expect(() => authService.verifyAccessToken(expiredToken)).toThrow(
        expect.objectContaining({ statusCode: 401 })
      );
    });
  });

  describe('verifyRefreshToken', () => {
    it('returns the payload for a valid refresh token', () => {
      const token = authService.generateRefreshToken(fakeUser as any);
      const payload = authService.verifyRefreshToken(token);
      expect(payload.userId).toBe(fakeUser.id);
    });

    it('throws ApiError 401 for an invalid refresh token', () => {
      expect(() => authService.verifyRefreshToken('bad-token')).toThrow(
        expect.objectContaining({ statusCode: 401 })
      );
    });
  });

  describe('refreshAccessToken', () => {
    it('returns a new token pair and revokes the old refresh token', async () => {
      const originalToken = authService.generateRefreshToken(fakeUser as any);

      const storedToken = {
        id: 'token-id',
        token: originalToken,
        isRevoked: false,
        isValid: jest.fn().mockReturnValue(true),
        save: jest.fn().mockResolvedValue(undefined),
      };

      mockRefreshToken.findOne = jest.fn().mockResolvedValue(storedToken);
      mockUser.findByPk = jest.fn().mockResolvedValue(fakeUser);
      mockRefreshToken.create = jest.fn().mockResolvedValue({});

      const result = await authService.refreshAccessToken(originalToken);

      expect(storedToken.isRevoked).toBe(true);
      expect(storedToken.save).toHaveBeenCalledTimes(1);
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('throws ApiError 401 when refresh token is not found in the database', async () => {
      const originalToken = authService.generateRefreshToken(fakeUser as any);
      mockRefreshToken.findOne = jest.fn().mockResolvedValue(null);

      await expect(authService.refreshAccessToken(originalToken)).rejects.toThrow(
        expect.objectContaining({ statusCode: 401, message: 'Refresh token not found' })
      );
    });

    it('throws ApiError 401 when the stored token is invalid', async () => {
      const originalToken = authService.generateRefreshToken(fakeUser as any);

      const storedToken = {
        isValid: jest.fn().mockReturnValue(false),
        destroy: jest.fn().mockResolvedValue(undefined),
      };

      mockRefreshToken.findOne = jest.fn().mockResolvedValue(storedToken);

      await expect(authService.refreshAccessToken(originalToken)).rejects.toThrow(
        expect.objectContaining({ statusCode: 401 })
      );
      expect(storedToken.destroy).toHaveBeenCalledTimes(1);
    });

    it('throws ApiError 401 when the user is not found or inactive', async () => {
      const originalToken = authService.generateRefreshToken(fakeUser as any);

      const storedToken = {
        isValid: jest.fn().mockReturnValue(true),
        save: jest.fn().mockResolvedValue(undefined),
      };

      mockRefreshToken.findOne = jest.fn().mockResolvedValue(storedToken);
      mockUser.findByPk = jest.fn().mockResolvedValue(null);

      await expect(authService.refreshAccessToken(originalToken)).rejects.toThrow(
        expect.objectContaining({ statusCode: 401 })
      );
    });
  });

  describe('revokeRefreshToken', () => {
    it('marks the stored token as revoked', async () => {
      const storedToken = {
        id: 'token-id',
        isRevoked: false,
        save: jest.fn().mockResolvedValue(undefined),
      };
      mockRefreshToken.findOne = jest.fn().mockResolvedValue(storedToken);

      await authService.revokeRefreshToken('some-token');

      expect(storedToken.isRevoked).toBe(true);
      expect(storedToken.save).toHaveBeenCalledTimes(1);
    });

    it('does nothing when the token does not exist', async () => {
      mockRefreshToken.findOne = jest.fn().mockResolvedValue(null);

      await expect(authService.revokeRefreshToken('nonexistent')).resolves.toBeUndefined();
    });
  });

  describe('revokeAllUserTokens', () => {
    it('calls RefreshToken.update to revoke all tokens for a user', async () => {
      mockRefreshToken.update = jest.fn().mockResolvedValue([1]);

      await authService.revokeAllUserTokens('user-uuid');

      expect(mockRefreshToken.update).toHaveBeenCalledWith(
        { isRevoked: true },
        expect.objectContaining({ where: expect.objectContaining({ userId: 'user-uuid' }) })
      );
    });
  });

  describe('cleanupExpiredTokens', () => {
    it('destroys expired tokens and returns the count', async () => {
      mockRefreshToken.destroy = jest.fn().mockResolvedValue(3);

      const count = await authService.cleanupExpiredTokens();

      expect(count).toBe(3);
      expect(mockRefreshToken.destroy).toHaveBeenCalledTimes(1);
    });
  });
});

import { Response, NextFunction } from 'express';
import authController from '../../controllers/authController';
import { AuthRequest } from '../../middleware/auth';
import { ApiError } from '../../middleware/errorHandler';

jest.mock('../../config/logger', () => ({
  __esModule: true,
  default: { error: jest.fn(), warn: jest.fn(), info: jest.fn() },
}));

jest.mock('../../models', () => ({
  User: {
    findOne: jest.fn(),
    create: jest.fn(),
  },
}));

jest.mock('../../services/authService', () => ({
  __esModule: true,
  default: {
    generateTokenPair: jest.fn(),
    revokeRefreshToken: jest.fn(),
    refreshAccessToken: jest.fn(),
  },
}));

jest.mock('../../services/auditService', () => ({
  __esModule: true,
  default: {
    logRegistration: jest.fn().mockResolvedValue(undefined),
    logLogin: jest.fn().mockResolvedValue(undefined),
    logLogout: jest.fn().mockResolvedValue(undefined),
    logFailedLogin: jest.fn().mockResolvedValue(undefined),
    logFailedLoginEvent: jest.fn().mockResolvedValue(undefined),
    checkFailedLoginThreshold: jest.fn().mockResolvedValue(undefined),
  },
}));

import { User } from '../../models';
import authService from '../../services/authService';

const mockUser = User as jest.Mocked<typeof User>;
const mockAuthService = authService as jest.Mocked<typeof authService>;

const makeRes = () => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
};

const makeReq = (overrides: Partial<AuthRequest> = {}): AuthRequest =>
  ({
    body: {},
    ip: '127.0.0.1',
    get: jest.fn().mockReturnValue('Mozilla/5.0'),
    headers: {},
    ...overrides,
  }) as unknown as AuthRequest;

const fakeUser = {
  id: 'user-uuid',
  email: 'user@example.com',
  firstName: 'John',
  lastName: 'Doe',
  role: 'user' as const,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  isLocked: jest.fn().mockReturnValue(false),
  comparePassword: jest.fn(),
  incrementFailedAttempts: jest.fn().mockResolvedValue(undefined),
  resetFailedAttempts: jest.fn().mockResolvedValue(undefined),
};

const fakeTokens = { accessToken: 'access-token', refreshToken: 'refresh-token' };

describe('AuthController', () => {
  let next: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    next = jest.fn();
    jest.clearAllMocks();
  });

  // ─── register ─────────────────────────────────────────────────────────────

  describe('register', () => {
    const registerBody = {
      email: 'new@example.com',
      password: 'Password1!',
      firstName: 'Jane',
      lastName: 'Doe',
    };

    it('returns 201 with user data and tokens on success', async () => {
      mockUser.findOne = jest.fn().mockResolvedValue(null);
      mockUser.create = jest.fn().mockResolvedValue(fakeUser);
      mockAuthService.generateTokenPair = jest.fn().mockResolvedValue(fakeTokens);

      const req = makeReq({ body: registerBody });
      const res = makeRes();

      await authController.register(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            accessToken: 'access-token',
            refreshToken: 'refresh-token',
          }),
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('calls next with ApiError 400 when email is already registered', async () => {
      mockUser.findOne = jest.fn().mockResolvedValue(fakeUser);

      const req = makeReq({ body: registerBody });
      await authController.register(req, makeRes(), next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 400, message: 'Email already registered' })
      );
    });
  });

  // ─── login ────────────────────────────────────────────────────────────────

  describe('login', () => {
    const loginBody = { email: 'user@example.com', password: 'Password1!' };

    it('returns 200 with user data and tokens on successful login', async () => {
      mockUser.findOne = jest.fn().mockResolvedValue(fakeUser);
      fakeUser.comparePassword = jest.fn().mockResolvedValue(true);
      mockAuthService.generateTokenPair = jest.fn().mockResolvedValue(fakeTokens);

      const req = makeReq({ body: loginBody });
      const res = makeRes();

      await authController.login(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ accessToken: 'access-token' }),
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('calls next with ApiError 401 when user is not found', async () => {
      mockUser.findOne = jest.fn().mockResolvedValue(null);

      await authController.login(makeReq({ body: loginBody }), makeRes(), next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 401, message: 'Invalid credentials' })
      );
    });

    it('calls next with ApiError 403 when the account is locked', async () => {
      const lockedUser = { ...fakeUser, isLocked: jest.fn().mockReturnValue(true) };
      mockUser.findOne = jest.fn().mockResolvedValue(lockedUser);

      await authController.login(makeReq({ body: loginBody }), makeRes(), next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
    });

    it('calls next with ApiError 403 when the account is deactivated', async () => {
      const inactiveUser = {
        ...fakeUser,
        isActive: false,
        isLocked: jest.fn().mockReturnValue(false),
      };
      mockUser.findOne = jest.fn().mockResolvedValue(inactiveUser);

      await authController.login(makeReq({ body: loginBody }), makeRes(), next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
    });

    it('increments failed attempts and returns 401 when password is wrong', async () => {
      const user = { ...fakeUser, comparePassword: jest.fn().mockResolvedValue(false) };
      mockUser.findOne = jest.fn().mockResolvedValue(user);

      await authController.login(makeReq({ body: loginBody }), makeRes(), next);

      expect(user.incrementFailedAttempts).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 401, message: 'Invalid credentials' })
      );
    });
  });

  // ─── logout ───────────────────────────────────────────────────────────────

  describe('logout', () => {
    it('returns 200 and revokes the refresh token', async () => {
      mockAuthService.revokeRefreshToken = jest.fn().mockResolvedValue(undefined);

      const req = makeReq({ body: { refreshToken: 'refresh-token' }, userId: 'user-uuid' });
      const res = makeRes();

      await authController.logout(req, res, next);

      expect(mockAuthService.revokeRefreshToken).toHaveBeenCalledWith('refresh-token');
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, message: 'Logout successful' })
      );
    });

    it('returns 200 even when no refresh token is provided', async () => {
      const req = makeReq({ body: {} });
      const res = makeRes();

      await authController.logout(req, res, next);

      expect(mockAuthService.revokeRefreshToken).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });

  // ─── refresh ──────────────────────────────────────────────────────────────

  describe('refresh', () => {
    it('returns 200 with new tokens on success', async () => {
      mockAuthService.refreshAccessToken = jest.fn().mockResolvedValue(fakeTokens);

      const req = makeReq({ body: { refreshToken: 'old-refresh-token' } });
      const res = makeRes();

      await authController.refresh(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ accessToken: 'access-token' }),
        })
      );
    });

    it('calls next with ApiError 400 when no refresh token is provided', async () => {
      const req = makeReq({ body: {} });

      await authController.refresh(req, makeRes(), next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 400 })
      );
    });
  });

  // ─── me ───────────────────────────────────────────────────────────────────

  describe('me', () => {
    it('returns 200 with the current user data', async () => {
      const req = makeReq({ user: fakeUser as any });
      const res = makeRes();

      await authController.me(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ email: fakeUser.email }),
        })
      );
    });

    it('calls next with ApiError 401 when user is not attached to the request', async () => {
      const req = makeReq({ user: undefined });

      await authController.me(req, makeRes(), next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });
  });
});

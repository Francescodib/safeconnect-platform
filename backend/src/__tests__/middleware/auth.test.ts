import { Response, NextFunction } from 'express';
import { authenticate, authorize, optionalAuth, AuthRequest } from '../../middleware/auth';
import { ApiError } from '../../middleware/errorHandler';

jest.mock('../../config/logger', () => ({
  __esModule: true,
  default: { error: jest.fn(), warn: jest.fn(), info: jest.fn() },
}));

jest.mock('../../services/authService', () => ({
  __esModule: true,
  default: {
    verifyAccessToken: jest.fn(),
  },
}));

jest.mock('../../models', () => ({
  User: {
    findByPk: jest.fn(),
  },
}));

jest.mock('../../services/auditService', () => ({
  __esModule: true,
  default: {
    logInvalidTokenEvent: jest.fn().mockResolvedValue(undefined),
  },
}));

import authService from '../../services/authService';
import { User } from '../../models';
import auditService from '../../services/auditService';

const mockAuthService = authService as jest.Mocked<typeof authService>;
const mockUser = User as jest.Mocked<typeof User>;

const makeReq = (overrides: Partial<AuthRequest> = {}): AuthRequest =>
  ({
    headers: {},
    ip: '127.0.0.1',
    ...overrides,
  }) as AuthRequest;

const makeRes = (): Partial<Response> => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
});

const fakeUser = {
  id: 'user-uuid',
  email: 'test@example.com',
  role: 'user' as const,
  isActive: true,
  isLocked: jest.fn().mockReturnValue(false),
};

describe('authenticate middleware', () => {
  let next: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('throws 401 when Authorization header is missing', async () => {
    const req = makeReq({ headers: {} });

    await authenticate(req, makeRes() as Response, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('throws 401 when Authorization header does not start with Bearer', async () => {
    const req = makeReq({ headers: { authorization: 'Basic abc123' } });

    await authenticate(req, makeRes() as Response, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('throws 401 when user is not found in the database', async () => {
    mockAuthService.verifyAccessToken.mockReturnValue({
      userId: 'unknown-id',
      email: 'x@x.com',
      role: 'user',
    });
    mockUser.findByPk = jest.fn().mockResolvedValue(null);

    const req = makeReq({ headers: { authorization: 'Bearer valid-token' } });
    await authenticate(req, makeRes() as Response, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('throws 403 when account is deactivated', async () => {
    mockAuthService.verifyAccessToken.mockReturnValue({
      userId: 'user-id',
      email: 'test@example.com',
      role: 'user',
    });
    mockUser.findByPk = jest.fn().mockResolvedValue({ ...fakeUser, isActive: false });

    const req = makeReq({ headers: { authorization: 'Bearer valid-token' } });
    await authenticate(req, makeRes() as Response, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
  });

  it('throws 403 when account is locked', async () => {
    mockAuthService.verifyAccessToken.mockReturnValue({
      userId: 'user-id',
      email: 'test@example.com',
      role: 'user',
    });
    const lockedUser = { ...fakeUser, isLocked: jest.fn().mockReturnValue(true) };
    mockUser.findByPk = jest.fn().mockResolvedValue(lockedUser);

    const req = makeReq({ headers: { authorization: 'Bearer valid-token' } });
    await authenticate(req, makeRes() as Response, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
  });

  it('attaches user and userId to request on success and calls next()', async () => {
    mockAuthService.verifyAccessToken.mockReturnValue({
      userId: 'user-uuid',
      email: 'test@example.com',
      role: 'user',
    });
    mockUser.findByPk = jest.fn().mockResolvedValue(fakeUser);

    const req = makeReq({ headers: { authorization: 'Bearer valid-token' } });
    await authenticate(req, makeRes() as Response, next);

    expect(req.user).toBe(fakeUser);
    expect(req.userId).toBe('user-uuid');
    expect(next).toHaveBeenCalledWith();
  });
});

describe('authorize middleware', () => {
  let next: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    next = jest.fn();
  });

  it('throws 401 when request has no user attached', () => {
    const middleware = authorize('admin');
    const req = makeReq();

    middleware(req, makeRes() as Response, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('throws 403 when user role is not in the allowed list', () => {
    const middleware = authorize('admin');
    const req = makeReq({ user: { ...fakeUser, role: 'user' } as any });

    middleware(req, makeRes() as Response, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
  });

  it('calls next() when user has the required role', () => {
    const middleware = authorize('admin', 'user');
    const req = makeReq({ user: { ...fakeUser, role: 'user' } as any });

    middleware(req, makeRes() as Response, next);

    expect(next).toHaveBeenCalledWith();
  });
});

describe('optionalAuth middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls next() without error when no Authorization header is present', async () => {
    const next = jest.fn();
    const req = makeReq({ headers: {} });

    await optionalAuth(req, makeRes() as Response, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.user).toBeUndefined();
  });

  it('attaches user to request when a valid token is provided', async () => {
    mockAuthService.verifyAccessToken.mockReturnValue({
      userId: 'user-uuid',
      email: 'test@example.com',
      role: 'user',
    });
    mockUser.findByPk = jest.fn().mockResolvedValue(fakeUser);

    const next = jest.fn();
    const req = makeReq({ headers: { authorization: 'Bearer valid-token' } });

    await optionalAuth(req, makeRes() as Response, next);

    expect(req.user).toBe(fakeUser);
    expect(next).toHaveBeenCalledWith();
  });

  it('calls next() without error when token verification fails', async () => {
    mockAuthService.verifyAccessToken.mockImplementation(() => {
      throw new ApiError(401, 'Invalid token');
    });

    const next = jest.fn();
    const req = makeReq({ headers: { authorization: 'Bearer bad-token' } });

    await optionalAuth(req, makeRes() as Response, next);

    expect(req.user).toBeUndefined();
    expect(next).toHaveBeenCalledWith();
  });
});

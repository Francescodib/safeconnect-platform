import { Request, Response, NextFunction } from 'express';
import { ApiError, errorHandler, notFoundHandler } from '../../middleware/errorHandler';

jest.mock('../../config/logger', () => ({
  __esModule: true,
  default: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

const mockReq = (overrides: Partial<Request> = {}): Partial<Request> => ({
  originalUrl: '/api/test',
  method: 'GET',
  ip: '127.0.0.1',
  ...overrides,
});

const mockRes = (): Partial<Response> => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('ApiError', () => {
  it('creates an error with the correct statusCode and message', () => {
    const error = new ApiError(404, 'Not found');
    expect(error.statusCode).toBe(404);
    expect(error.message).toBe('Not found');
    expect(error.isOperational).toBe(true);
  });

  it('is an instance of Error', () => {
    const error = new ApiError(500, 'Server error');
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ApiError);
  });

  it('defaults isOperational to true', () => {
    const error = new ApiError(401, 'Unauthorized');
    expect(error.isOperational).toBe(true);
  });

  it('accepts isOperational = false', () => {
    const error = new ApiError(500, 'Critical', false);
    expect(error.isOperational).toBe(false);
  });

  it('uses a custom stack trace when provided', () => {
    const error = new ApiError(400, 'Bad request', true, 'custom stack');
    expect(error.stack).toBe('custom stack');
  });

  it('generates a stack trace automatically when none is provided', () => {
    const error = new ApiError(400, 'Bad request');
    expect(error.stack).toBeDefined();
    expect(error.stack).toContain('Bad request');
  });
});

describe('errorHandler', () => {
  const next: NextFunction = jest.fn();

  it('responds with the error statusCode and message', () => {
    const req = mockReq() as Request;
    const res = mockRes() as Response;
    const error = new ApiError(404, 'Not found');

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ message: 'Not found' }),
      })
    );
  });

  it('defaults to status 500 when no statusCode is present', () => {
    const req = mockReq() as Request;
    const res = mockRes() as Response;
    const error = new Error('Generic error') as any;

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('does not expose stack trace outside development', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const req = mockReq() as Request;
    const res = mockRes() as Response;
    const error = new ApiError(500, 'Internal error');

    errorHandler(error, req, res, next);

    const jsonCall = (res.json as jest.Mock).mock.calls[0][0];
    expect(jsonCall.error.stack).toBeUndefined();

    process.env.NODE_ENV = originalEnv;
  });
});

describe('notFoundHandler', () => {
  it('responds with 404 and the missing route in the message', () => {
    const req = mockReq({ originalUrl: '/api/missing' }) as Request;
    const res = mockRes() as Response;
    const next: NextFunction = jest.fn();

    notFoundHandler(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ message: expect.stringContaining('/api/missing') }),
      })
    );
  });
});

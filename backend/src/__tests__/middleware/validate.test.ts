import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { validate } from '../../middleware/validate';
import { ApiError } from '../../middleware/errorHandler';

jest.mock('express-validator', () => ({
  validationResult: jest.fn(),
}));

const mockedValidationResult = validationResult as jest.MockedFunction<typeof validationResult>;

const mockRes = (): Partial<Response> => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
});

describe('validate middleware', () => {
  let next: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    next = jest.fn();
  });

  it('calls next() with no arguments when there are no validation errors', () => {
    mockedValidationResult.mockReturnValue({
      isEmpty: () => true,
      array: () => [],
    } as any);

    validate({} as Request, mockRes() as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
  });

  it('calls next() with an ApiError when validation errors exist', () => {
    mockedValidationResult.mockReturnValue({
      isEmpty: () => false,
      array: () => [{ path: 'email', msg: 'Invalid email address' }],
    } as any);

    validate({} as Request, mockRes() as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
    const error = next.mock.calls[0][0] as unknown as ApiError;
    expect(error).toBeInstanceOf(ApiError);
    expect(error.statusCode).toBe(400);
    expect(error.message).toContain('Validation failed');
    expect(error.message).toContain('Invalid email address');
  });

  it('includes all error messages in the ApiError when multiple errors exist', () => {
    mockedValidationResult.mockReturnValue({
      isEmpty: () => false,
      array: () => [
        { path: 'email', msg: 'Invalid email address' },
        { path: 'password', msg: 'Password is required' },
      ],
    } as any);

    validate({} as Request, mockRes() as Response, next);

    const error = next.mock.calls[0][0] as unknown as ApiError;
    expect(error.message).toContain('Invalid email address');
    expect(error.message).toContain('Password is required');
  });
});

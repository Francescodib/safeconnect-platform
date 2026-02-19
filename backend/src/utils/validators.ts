import { body, ValidationChain } from 'express-validator';
import sanitizeHtml from 'sanitize-html';

/**
 * Custom sanitizer to remove HTML tags
 */
const sanitizeInput = (value: string): string => {
  return sanitizeHtml(value, {
    allowedTags: [],
    allowedAttributes: {},
  }).trim();
};

/**
 * Registration validation rules
 */
export const registerValidation: ValidationChain[] = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Invalid email address')
    .normalizeEmail()
    .customSanitizer(sanitizeInput),

  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number')
    .matches(/[!@#$%^&*]/)
    .withMessage('Password must contain at least one special character (!@#$%^&*)'),

  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters')
    .customSanitizer(sanitizeInput),

  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters')
    .customSanitizer(sanitizeInput),
];

/**
 * Login validation rules
 */
export const loginValidation: ValidationChain[] = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Invalid email address')
    .normalizeEmail()
    .customSanitizer(sanitizeInput),

  body('password').notEmpty().withMessage('Password is required'),
];

/**
 * Refresh token validation rules
 */
export const refreshTokenValidation: ValidationChain[] = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required')
    .isString()
    .withMessage('Refresh token must be a string'),
];

/**
 * Document creation validation rules
 */
export const createDocumentValidation: ValidationChain[] = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters')
    .customSanitizer(sanitizeInput),

  body('content')
    .trim()
    .notEmpty()
    .withMessage('Content is required')
    .isLength({ max: 100000 })
    .withMessage('Content must not exceed 100,000 characters')
    .customSanitizer((value: string) =>
      sanitizeHtml(value, {
        allowedTags: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
        allowedAttributes: {
          a: ['href', 'target', 'rel'],
        },
      })
    ),

  body('shared').optional().isBoolean().withMessage('Shared must be a boolean').toBoolean(),
];

/**
 * Document update validation rules
 */
export const updateDocumentValidation: ValidationChain[] = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters')
    .customSanitizer(sanitizeInput),

  body('content')
    .optional()
    .trim()
    .isLength({ max: 100000 })
    .withMessage('Content must not exceed 100,000 characters')
    .customSanitizer((value: string) =>
      sanitizeHtml(value, {
        allowedTags: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
        allowedAttributes: {
          a: ['href', 'target', 'rel'],
        },
      })
    ),

  body('shared').optional().isBoolean().withMessage('Shared must be a boolean').toBoolean(),
];

import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { Request, Response, NextFunction } from 'express';
import config from '../config';
import logger from '../config/logger';
import redisClient from '../config/redis';

// Redis store is created lazily on first request, after Redis is connected
const makeStore = (prefix: string) =>
  new RedisStore({
    sendCommand: (...args: string[]) => redisClient.sendCommand(args),
    prefix,
  });

// Lazy-initialized rate limiters (created on first request, Redis is connected by then)
let _general: RateLimitRequestHandler | null = null;
let _login: RateLimitRequestHandler | null = null;
let _register: RateLimitRequestHandler | null = null;

const getGeneral = () => {
  if (!_general) {
    _general = rateLimit({
      windowMs: config.rateLimit.windowMs,
      limit: config.rateLimit.maxRequests,
      standardHeaders: true,
      legacyHeaders: false,
      store: makeStore('rl:general:'),
      handler: (req, res) => {
        logger.warn({
          message: 'Rate limit exceeded',
          ip: req.ip,
          path: req.path,
          method: req.method,
        });
        res.status(429).json({
          success: false,
          error: { message: 'Too many requests, please try again later' },
        });
      },
    });
  }
  return _general;
};

const getLogin = () => {
  if (!_login) {
    _login = rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: config.rateLimit.login.max,
      skipSuccessfulRequests: true,
      standardHeaders: true,
      legacyHeaders: false,
      store: makeStore('rl:login:'),
      handler: (req, res) => {
        logger.warn({
          message: 'Login rate limit exceeded',
          ip: req.ip,
          email: req.body.email,
        });
        res.status(429).json({
          success: false,
          error: { message: 'Too many login attempts, please try again after 15 minutes' },
        });
      },
    });
  }
  return _login;
};

const getRegister = () => {
  if (!_register) {
    _register = rateLimit({
      windowMs: 60 * 60 * 1000,
      limit: config.rateLimit.register.max,
      standardHeaders: true,
      legacyHeaders: false,
      store: makeStore('rl:register:'),
      handler: (req, res) => {
        logger.warn({
          message: 'Registration rate limit exceeded',
          ip: req.ip,
          email: req.body.email,
        });
        res.status(429).json({
          success: false,
          error: { message: 'Too many registration attempts, please try again after 1 hour' },
        });
      },
    });
  }
  return _register;
};

export const generalRateLimiter = (req: Request, res: Response, next: NextFunction) =>
  getGeneral()(req, res, next);

export const loginRateLimiter = (req: Request, res: Response, next: NextFunction) =>
  getLogin()(req, res, next);

export const registerRateLimiter = (req: Request, res: Response, next: NextFunction) =>
  getRegister()(req, res, next);

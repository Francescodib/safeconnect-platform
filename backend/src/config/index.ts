import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

interface Config {
  app: {
    name: string;
    env: string;
    port: number;
    frontendUrl: string;
  };
  database: {
    host: string;
    port: number;
    name: string;
    user: string;
    password: string;
    pool: {
      min: number;
      max: number;
    };
  };
  redis: {
    host: string;
    port: number;
    password?: string;
    db: number;
  };
  jwt: {
    accessSecret: string;
    accessExpiry: string;
    refreshSecret: string;
    refreshExpiry: string;
  };
  bcrypt: {
    saltRounds: number;
  };
  cors: {
    origin: string;
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
    login: {
      max: number;
    };
    register: {
      max: number;
    };
  };
  upload: {
    maxFileSize: number;
    allowedTypes: string[];
  };
  email: {
    host: string;
    port: number;
    user: string;
    password: string;
    from: string;
  };
  logging: {
    level: string;
    filePath: string;
  };
  security: {
    csrfSecret: string;
    sessionSecret: string;
    cookieSecure: boolean;
    cookieSameSite: 'strict' | 'lax' | 'none';
  };
  monitoring: {
    enableSecurityAlerts: boolean;
    alertEmail: string;
    failedLoginThreshold: number;
    suspiciousActivityThreshold: number;
  };
}

const config: Config = {
  app: {
    name: process.env.APP_NAME || 'SafeConnect Solutions',
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.APP_PORT || '5000', 10),
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  },
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    name: process.env.DB_NAME || 'safeconnect_db',
    user: process.env.DB_USER || 'safeconnect_user',
    password: process.env.DB_PASSWORD || '',
    pool: {
      min: parseInt(process.env.DB_POOL_MIN || '2', 10),
      max: parseInt(process.env.DB_POOL_MAX || '10', 10),
    },
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0', 10),
  },
  jwt: {
    accessSecret: process.env.JWT_SECRET || 'change-this-secret',
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'change-this-refresh-secret',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },
  bcrypt: {
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10),
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    login: {
      max: parseInt(process.env.RATE_LIMIT_LOGIN_MAX || '5', 10),
    },
    register: {
      max: parseInt(process.env.RATE_LIMIT_REGISTER_MAX || '3', 10),
    },
  },
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10),
    allowedTypes: (process.env.ALLOWED_FILE_TYPES || 'pdf,doc,docx,txt,jpg,jpeg,png').split(','),
  },
  email: {
    host: process.env.EMAIL_HOST || 'smtp.example.com',
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    user: process.env.EMAIL_USER || '',
    password: process.env.EMAIL_PASSWORD || '',
    from: process.env.EMAIL_FROM || 'SafeConnect Security <noreply@safeconnect.com>',
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    filePath: process.env.LOG_FILE_PATH || './logs',
  },
  security: {
    csrfSecret: process.env.CSRF_SECRET || 'change-this-csrf-secret',
    sessionSecret: process.env.SESSION_SECRET || 'change-this-session-secret',
    cookieSecure: process.env.COOKIE_SECURE === 'true',
    cookieSameSite: (process.env.COOKIE_SAME_SITE as 'strict' | 'lax' | 'none') || 'strict',
  },
  monitoring: {
    enableSecurityAlerts: process.env.ENABLE_SECURITY_ALERTS === 'true',
    alertEmail: process.env.ALERT_EMAIL || 'security@safeconnect.com',
    failedLoginThreshold: parseInt(process.env.FAILED_LOGIN_THRESHOLD || '5', 10),
    suspiciousActivityThreshold: parseInt(process.env.SUSPICIOUS_ACTIVITY_THRESHOLD || '10', 10),
  },
};

export default config;

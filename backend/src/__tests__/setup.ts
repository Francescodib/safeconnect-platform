// Global test environment variables
// Must be set before any module imports
process.env.NODE_ENV = 'test';
process.env.APP_NAME = 'SafeConnect Solutions';
process.env.FRONTEND_URL = 'http://localhost:3000';
process.env.JWT_SECRET = 'test-jwt-access-secret-for-unit-tests-only';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-for-unit-tests-only';
process.env.JWT_ACCESS_EXPIRY = '15m';
process.env.JWT_REFRESH_EXPIRY = '7d';
process.env.BCRYPT_SALT_ROUNDS = '10';
process.env.ENABLE_SECURITY_ALERTS = 'false';
process.env.FAILED_LOGIN_THRESHOLD = '5';
process.env.LOG_LEVEL = 'silent';

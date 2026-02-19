# SafeConnect Solutions - Secure Data Management Platform

**Author:** Francesco di Biase
**Version:** 1.0
**Date:** February 2026

## Overview

SafeConnect Solutions is a full-stack security-focused platform for managing sensitive business data. The project implements industry-standard security measures to protect against common web vulnerabilities including SQL Injection, XSS, CSRF, and DDoS attacks.

The platform is built as a portfolio and educational project demonstrating secure software development practices across the entire stack, from database queries to frontend rendering.

## Key Security Features

- **SQL Injection Prevention**: Parameterized queries via Sequelize ORM — no raw SQL
- **XSS Protection**: Backend sanitization with sanitize-html, frontend with DOMPurify, CSP headers via Helmet
- **CSRF Protection**: Double-submit cookie pattern with Redis-backed token storage
- **DDoS Mitigation**: Redis-backed distributed rate limiting at both application and Nginx level
- **Secure Authentication**: JWT with 15-minute access tokens, 7-day revocable refresh tokens
- **Password Security**: bcrypt with 12 salt rounds, mandatory complexity requirements
- **Role-Based Access Control (RBAC)**: Admin, User, and Guest roles with middleware enforcement
- **Account Lockout**: Automatic lockout after 5 failed login attempts (15-minute window)
- **Audit Logging**: Full audit trail for authentication events and document operations
- **Security Monitoring**: Admin dashboard for real-time security event tracking
- **Unit Tested**: 109 automated tests covering all security-critical components

## Technology Stack

### Backend

| Technology | Version | Purpose |
|-----------|---------|---------|
| Node.js | 20 LTS | Runtime |
| Express.js | 5.2.x | Web framework |
| TypeScript | 5.3.x | Type safety |
| PostgreSQL | 15 | Primary database |
| Sequelize | 6.35.x | ORM (SQL injection protection) |
| Redis | 7 | Rate limiting, CSRF token storage |
| jsonwebtoken | 9.0.x | JWT authentication |
| bcrypt | 6.0.x | Password hashing (12 rounds) |
| Helmet | 8.1.x | Security headers (CSP, HSTS, etc.) |
| express-rate-limit | 8.2.x | Request rate limiting |
| rate-limit-redis | 4.3.x | Distributed rate limit store |
| sanitize-html | 2.11.x | Input sanitization |
| express-validator | 7.0.x | Input validation |
| Winston | 3.11.x | Structured logging |
| Morgan | 1.10.x | HTTP access logging |

### Frontend

| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 19.2.x | UI framework |
| TypeScript | 5.3.x | Type safety |
| Vite | 7.3.x | Build tool |
| React Router | 7.13.x | Client-side routing |
| Axios | 1.6.x | HTTP client |
| Tailwind CSS | 4.2.x | Utility-first CSS |
| DOMPurify | 3.0.x | Frontend XSS sanitization |

### Infrastructure

| Technology | Version | Purpose |
|-----------|---------|---------|
| Docker | Latest | Containerization |
| Docker Compose | Latest | Multi-container orchestration |
| Nginx | Latest | Reverse proxy, rate limiting |
| PostgreSQL | 15-alpine | Database container |
| Redis | 7-alpine | Cache container |

### Testing

| Technology | Version | Purpose |
|-----------|---------|---------|
| Jest | 30.x | Test framework |
| ts-jest | 29.x | TypeScript Jest transformer |
| supertest | 7.x | HTTP integration testing |

---

## Project Structure

```
safeconnect-platform/
├── backend/                    # Node.js/Express API server
│   ├── src/
│   │   ├── config/             # DB, Redis, logger, Swagger setup
│   │   ├── controllers/        # Request handlers (auth, document, admin)
│   │   ├── middleware/         # Auth, CSRF, rate limiter, validation, error handler
│   │   ├── models/             # Sequelize models (User, Document, AuditLog, etc.)
│   │   ├── routes/             # Express route definitions
│   │   ├── services/           # Business logic (authService, auditService)
│   │   ├── utils/              # Validators, seed data
│   │   └── __tests__/          # Unit tests (109 tests)
│   ├── jest.config.ts
│   ├── tsconfig.json
│   └── package.json
├── frontend/                   # React/Vite SPA
│   ├── src/
│   │   ├── pages/              # Login, Register, Dashboard, Documents, Monitoring
│   │   ├── components/         # ProtectedRoute and shared components
│   │   ├── context/            # AuthContext (global auth state)
│   │   ├── services/           # API client, auth service
│   │   └── utils/              # Sanitization, validation utilities
│   ├── vite.config.ts
│   └── package.json
├── docs/                       # Documentation
│   ├── SECURITY_GUIDE.md
│   ├── API_DOCUMENTATION.md
│   ├── ARCHITECTURE.md
│   ├── SETUP_GUIDE.md
│   └── PENETRATION_TEST_REPORT.md
├── penetration-testing/        # Security testing scripts and reports
│   └── RESULTS.md
├── nginx/                      # Nginx reverse proxy configuration
├── database/                   # PostgreSQL initialization scripts
└── docker-compose.yml          # Multi-container orchestration
```

---

## Quick Start

### Prerequisites

- Node.js 20+
- Docker and Docker Compose
- Git

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd safeconnect-platform
```

2. Copy environment configuration:
```bash
cp .env.example .env
```

3. Start all services:
```bash
docker-compose up -d
```

4. Access the application:

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5000 |
| API Documentation | http://localhost:5000/api-docs |

### Default Development Credentials

These accounts are automatically seeded when `NODE_ENV=development`:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@safeconnect.com | Admin123!@# |
| User | user@safeconnect.com | User123!@# |

> **Warning:** Change all credentials and secrets before any production deployment.

---

## Documentation

| Document | Description |
|----------|-------------|
| [Security Guide](docs/SECURITY_GUIDE.md) | Detailed security implementation guide |
| [API Documentation](docs/API_DOCUMENTATION.md) | REST API endpoint reference |
| [Architecture](docs/ARCHITECTURE.md) | System design and component diagrams |
| [Setup Guide](docs/SETUP_GUIDE.md) | Detailed installation and configuration guide |
| [Penetration Test Report](docs/PENETRATION_TEST_REPORT.md) | Full OWASP Top 10 security assessment |

---

## Configuration

All settings are managed via environment variables in the `.env` file.

### Environment Variables Reference

Copy `.env.example` to `.env` and customize:

```bash
cp .env.example .env
```

#### Core Application

| Variable | Purpose | Default | Required |
|----------|---------|---------|----------|
| `NODE_ENV` | Environment mode | `development` | Yes |
| `APP_PORT` | Express server port | `5000` | No |
| `APP_NAME` | Application name | `SafeConnect` | No |
| `LOG_LEVEL` | Logging verbosity | `info` | No |

#### Database

| Variable | Purpose | Default | Required |
|----------|---------|---------|----------|
| `DB_HOST` | PostgreSQL hostname | `postgres` | Yes |
| `DB_PORT` | PostgreSQL port | `5432` | No |
| `DB_NAME` | Database name | `safeconnect_db` | Yes |
| `DB_USER` | Database user | `safeconnect_user` | Yes |
| `DB_PASSWORD` | Database password | None | **YES** |
| `DB_POOL_MIN` | Min pool connections | `2` | No |
| `DB_POOL_MAX` | Max pool connections | `10` | No |

#### JWT Authentication

| Variable | Purpose | Default | Required |
|----------|---------|---------|----------|
| `JWT_SECRET` | Access token signing key | None | **YES** |
| `JWT_REFRESH_SECRET` | Refresh token signing key | None | **YES** |
| `JWT_ACCESS_EXPIRY` | Access token lifetime | `15m` | No |
| `JWT_REFRESH_EXPIRY` | Refresh token lifetime | `7d` | No |

**Generating secure secrets:**

```bash
# Linux/macOS
openssl rand -base64 32

# Windows (PowerShell)
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

#### Security

| Variable | Purpose | Default | Required |
|----------|---------|---------|----------|
| `CSRF_SECRET` | CSRF token signing key | None | **YES** |
| `CORS_ORIGIN` | Allowed CORS origin | `http://localhost:3000` | Yes |
| `FRONTEND_URL` | Frontend URL for redirects | `http://localhost:3000` | Yes |
| `BCRYPT_SALT_ROUNDS` | Password hashing rounds | `12` | No |
| `COOKIE_SECURE` | Secure cookie flag | `false` | No |
| `COOKIE_SAME_SITE` | SameSite cookie policy | `strict` | No |

#### Redis

| Variable | Purpose | Default | Required |
|----------|---------|---------|----------|
| `REDIS_HOST` | Redis hostname | `redis` | Yes |
| `REDIS_PORT` | Redis port | `6379` | No |
| `REDIS_PASSWORD` | Redis password | None | Optional |

#### Rate Limiting

| Variable | Purpose | Default | Required |
|----------|---------|---------|----------|
| `RATE_LIMIT_WINDOW_MS` | Rate limit window (ms) | `900000` | No |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` | No |
| `RATE_LIMIT_LOGIN_MAX` | Login attempts per window | `5` | No |
| `RATE_LIMIT_REGISTER_MAX` | Registrations per hour | `3` | No |

#### Monitoring

| Variable | Purpose | Default | Required |
|----------|---------|---------|----------|
| `ENABLE_SECURITY_ALERTS` | Enable security alerts | `true` | No |
| `ALERT_EMAIL` | Alert notification email | None | Optional |
| `FAILED_LOGIN_THRESHOLD` | Failed login alert threshold | `5` | No |

### Configuration Examples

**Development:**
```env
NODE_ENV=development
APP_PORT=5000
DB_HOST=localhost
DB_USER=safeconnect_user
DB_PASSWORD=dev-password
JWT_SECRET=dev-secret-change-this-in-production
JWT_REFRESH_SECRET=dev-refresh-secret-change-this
CORS_ORIGIN=http://localhost:3000
```

**Production:**
```env
NODE_ENV=production
APP_PORT=5000
DB_HOST=db.prod.internal
DB_USER=safeconnect_user
DB_PASSWORD=[USE-SECURE-GENERATOR]
JWT_SECRET=[USE-SECURE-GENERATOR]
JWT_REFRESH_SECRET=[USE-SECURE-GENERATOR]
CSRF_SECRET=[USE-SECURE-GENERATOR]
CORS_ORIGIN=https://yourdomain.com
FRONTEND_URL=https://yourdomain.com
COOKIE_SECURE=true
```

---

## Development

### Backend

```bash
cd backend
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Running Tests

```bash
# Backend unit tests (109 tests)
cd backend
npm test

# Backend tests with coverage report
npm test -- --coverage

# Watch mode during development
npm run test:watch

# Security penetration tests
cd penetration-testing
npm install
node scripts/run-all-tests.js
```

The unit test suite covers:

| Area | Tests |
|------|-------|
| Authentication controller | Login, register, logout, refresh, me |
| Document controller | CRUD with ownership and sharing logic |
| Auth middleware | JWT validation, role authorization, optional auth |
| Error handler middleware | ApiError, stack trace exposure, 404 handling |
| Validate middleware | express-validator integration |
| Auth service | Token generation, verification, rotation, revocation |
| Audit service | Log events, security event creation, threshold alerts |
| User model logic | isLocked, incrementFailedAttempts, resetFailedAttempts |
| RefreshToken model logic | isExpired, isValid |

---

## Deployment

### Production Deployment with Docker Compose

#### 1. Clone and Prepare

```bash
git clone <repository-url>
cd safeconnect-platform
cp .env.example .env
```

#### 2. Configure Environment Variables

Generate secure secrets:

```bash
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
DB_PASSWORD=$(openssl rand -base64 16)
CSRF_SECRET=$(openssl rand -base64 32)
```

Update `.env` with production values:

```env
NODE_ENV=production
APP_PORT=5000
DB_HOST=<your-postgres-host>
DB_USER=safeconnect_user
DB_PASSWORD=<generated-above>
JWT_SECRET=<generated-above>
JWT_REFRESH_SECRET=<generated-above>
CSRF_SECRET=<generated-above>
CORS_ORIGIN=https://yourdomain.com
FRONTEND_URL=https://yourdomain.com
REDIS_HOST=<your-redis-host>
COOKIE_SECURE=true
```

#### 3. Build and Start

```bash
docker-compose build
docker-compose up -d
```

#### 4. Verify Deployment

```bash
# Check all containers are running
docker-compose ps

# Test API health endpoint
curl -I http://localhost:5000/health

# View startup logs
docker-compose logs backend
```

#### 5. Enable HTTPS with Nginx

Update `nginx/nginx.conf`:

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    add_header Strict-Transport-Security "max-age=31536000" always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-Frame-Options DENY always;
}

server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

Then restart Nginx:

```bash
docker-compose restart nginx
```

#### 6. Database Setup (First Run)

```bash
# Run migrations
docker-compose exec backend npm run migrate

# Seed initial admin account (optional)
docker-compose exec backend npm run seed
```

#### 7. Monitoring and Backups

```bash
# Daily database backup
docker-compose exec postgres pg_dump -U safeconnect_user \
  safeconnect_db > backup-$(date +%Y%m%d).sql

# Monitor logs
docker-compose logs -f backend

# Container resource usage
docker stats
```

### Production Deployment Checklist

- [ ] All environment variable secrets are unique and randomly generated
- [ ] `NODE_ENV=production` is set
- [ ] HTTPS enabled with valid TLS certificate
- [ ] `COOKIE_SECURE=true` is set
- [ ] Database user has restricted privileges (no superuser)
- [ ] Firewall configured to expose only ports 80 and 443
- [ ] Database backups scheduled and tested
- [ ] Monitoring and alerting configured
- [ ] Default seeded accounts changed or removed
- [ ] `CORS_ORIGIN` set to exact production domain

---

## Security

This platform implements defense in depth across all layers:

| Layer | Control |
|-------|---------|
| Input | express-validator (all endpoints), sanitize-html (backend), DOMPurify (frontend) |
| Authentication | JWT access + refresh tokens, bcrypt password hashing, account lockout |
| Authorization | RBAC middleware, per-resource ownership checks |
| Transport | CORS policy, security headers via Helmet, SameSite cookies |
| Infrastructure | Redis rate limiting, Nginx proxy, CSRF double-submit cookies |
| Monitoring | Audit logs, security event tracking, admin dashboard |

For the full security assessment, see [PENETRATION_TEST_REPORT.md](docs/PENETRATION_TEST_REPORT.md).
For implementation details, see [SECURITY_GUIDE.md](docs/SECURITY_GUIDE.md).

---

## Troubleshooting

### Port Already in Use

**Problem:** `Error: listen EADDRINUSE: address already in use :::5000`

Find and kill the process:

```bash
# macOS/Linux
lsof -i :5000 && kill -9 <PID>

# Windows PowerShell
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

Or change the port in `docker-compose.yml`:
```yaml
backend:
  ports:
    - "5001:5000"
```

### Database Connection Errors

**Problem:** `connect ECONNREFUSED 127.0.0.1:5432`

```bash
# Check if PostgreSQL container is running
docker-compose ps | grep postgres

# Start it if not running
docker-compose up -d postgres

# Check logs
docker-compose logs postgres
```

Full reset (loses all data):
```bash
docker-compose down -v && docker-compose up -d
```

### Frontend Cannot Reach Backend

**Problem:** Network requests to `http://localhost:5000/api` fail

1. Verify backend is running: `curl http://localhost:5000/health`
2. Check `CORS_ORIGIN` in `.env` matches the frontend URL exactly
3. Verify `VITE_API_URL` in frontend `.env` is set correctly
4. Rebuild frontend after env changes: `npm run dev`

### Authentication Not Working

1. Verify Redis is running: `docker-compose ps | grep redis`
2. Check JWT secrets are set: `docker-compose exec backend printenv | grep JWT`
3. Clear browser storage: DevTools > Application > Clear Site Data
4. Check cookies in DevTools — `accessToken` and `refreshToken` should be present with `HttpOnly` flag

### Rate Limiting Issues

**Problem:** `429 Too Many Requests` during development

Clear rate limit counters in Redis:
```bash
docker-compose exec redis redis-cli FLUSHALL
docker-compose restart backend
```

Adjust limits in `.env`:
```env
RATE_LIMIT_WINDOW_MS=1800000    # 30 minutes
RATE_LIMIT_MAX_REQUESTS=200
RATE_LIMIT_LOGIN_MAX=10
```

### Docker Build Fails

Clean cache and rebuild:
```bash
docker system prune -a
docker-compose build --no-cache backend
```

View detailed build output:
```bash
docker-compose build backend --progress=plain
```

### Database Migration Errors

**Problem:** "Migration failed" or "table already exists"

```bash
# Undo all migrations and reapply
docker-compose exec backend npm run migrate:undo:all
docker-compose exec backend npm run migrate
```

Or full reset:
```bash
docker-compose down -v && docker-compose up -d
```

### Debug Mode

Enable verbose logging:
```bash
# In .env
LOG_LEVEL=debug

# Restart
docker-compose restart backend

# View filtered logs
docker-compose logs backend -f | grep -i error
```

---

## License

This project is developed for educational and portfolio purposes.

## Author

Francesco di Biase - 2026

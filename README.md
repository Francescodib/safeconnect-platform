# SafeConnect Solutions - Secure Data Management Platform

**Author:** Francesco di Biase
**Version:** 1.0
**Date:** February 2026

## Overview

SafeConnect Solutions is a comprehensive security-focused platform for managing sensitive business data. This project implements industry-standard security measures to protect against common web vulnerabilities including SQL Injection, XSS, CSRF, and DDoS attacks.

## Key Security Features

- **SQL Injection Prevention**: Parameterized queries with Sequelize ORM
- **XSS Protection**: Input sanitization with DOMPurify and CSP headers
- **CSRF Protection**: Token-based validation for state-changing operations
- **DDoS Mitigation**: Rate limiting with Redis and Nginx
- **Secure Authentication**: JWT with refresh tokens and bcrypt password hashing
- **Comprehensive Logging**: Audit trails and security event monitoring
- **Penetration Tested**: Validated against OWASP Top 10 vulnerabilities

## Technology Stack

### Backend
- Node.js 20+ with TypeScript
- Express.js framework
- PostgreSQL database with Sequelize ORM
- Redis for session and rate limit storage
- JWT authentication with refresh tokens
- bcrypt for password hashing

### Frontend
- React 18+ with TypeScript
- Vite 5+ build tool
- React Router v6
- Axios for HTTP requests
- DOMPurify for XSS prevention
- Material-UI / Tailwind CSS

### DevOps
- Docker and Docker Compose
- Nginx reverse proxy
- Automated security testing
- OWASP ZAP integration

## Project Structure

```
safeconnect-platform/
├── backend/              # Node.js/Express API server
├── frontend/             # React/Vite SPA application
├── database/             # PostgreSQL initialization scripts
├── nginx/                # Reverse proxy configuration
├── docs/                 # Comprehensive documentation
├── penetration-testing/  # Security testing scripts and reports
└── docker-compose.yml    # Multi-container orchestration
```

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

2. Copy environment files:
```bash
cp .env.example .env
```

3. Start all services with Docker Compose:
```bash
docker-compose up -d
```

4. Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- API Documentation: http://localhost:5000/api-docs

## Documentation

- [Security Guide](docs/SECURITY_GUIDE.md) - Comprehensive security measures
- [API Documentation](docs/API_DOCUMENTATION.md) - REST API reference
- [Architecture](docs/ARCHITECTURE.md) - System design and diagrams
- [Setup Guide](docs/SETUP_GUIDE.md) - Detailed installation instructions
- [Penetration Test Report](docs/PENETRATION_TEST_REPORT.md) - Security assessment

## Configuration

All settings are configured via environment variables in the `.env` file.

### Environment Variables Reference

Copy `.env.example` to `.env` and customize:

```bash
cp .env.example .env
```

#### Core Application Settings

| Variable | Purpose | Default | Required | Example |
|----------|---------|---------|----------|---------|
| `NODE_ENV` | Environment mode | `development` | Yes | `production` |
| `APP_PORT` | Express server port | `5000` | No | `5000` |
| `APP_NAME` | Application name | `SafeConnect` | No | `SafeConnect` |
| `LOG_LEVEL` | Logging verbosity | `info` | No | `debug` |
| `LOG_FILE_PATH` | Log file path | `logs/app.log` | No | `logs/app.log` |

#### Database Configuration

| Variable | Purpose | Default | Required | Example |
|----------|---------|---------|----------|---------|
| `DB_HOST` | PostgreSQL hostname | `postgres` | Yes | `db.example.com` |
| `DB_PORT` | PostgreSQL port | `5432` | No | `5432` |
| `DB_NAME` | Database name | `safeconnect_db` | Yes | `safeconnect_db` |
| `DB_USER` | Database user | `safeconnect_user` | Yes | `safeconnect_user` |
| `DB_PASSWORD` | Database password | None | **YES - CHANGE** | `[secure-password]` |
| `DB_POOL_MIN` | Min pool connections | `2` | No | `2` |
| `DB_POOL_MAX` | Max pool connections | `10` | No | `10` |

#### JWT Authentication

| Variable | Purpose | Default | Required | Example |
|----------|---------|---------|----------|---------|
| `JWT_SECRET` | Access token signing key | None | **YES - GENERATE** | `[32+ random chars]` |
| `JWT_REFRESH_SECRET` | Refresh token signing key | None | **YES - GENERATE** | `[32+ random chars]` |
| `JWT_ACCESS_EXPIRY` | Access token lifetime | `15m` | No | `15m` |
| `JWT_REFRESH_EXPIRY` | Refresh token lifetime | `7d` | No | `7d` |

**How to Generate Secure Secrets:**

```bash
# Linux/Mac
openssl rand -base64 32

# Windows (PowerShell)
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

#### Security Configuration

| Variable | Purpose | Default | Required | Example |
|----------|---------|---------|----------|---------|
| `CSRF_SECRET` | CSRF token signing key | None | **YES - GENERATE** | `[32+ random chars]` |
| `SESSION_SECRET` | Session encryption key | None | **YES - GENERATE** | `[32+ random chars]` |
| `CORS_ORIGIN` | Allowed CORS origin | `http://localhost:3000` | Yes | `https://app.example.com` |
| `FRONTEND_URL` | Frontend URL for redirects | `http://localhost:3000` | Yes | `https://app.example.com` |
| `BCRYPT_SALT_ROUNDS` | Password hashing rounds | `12` | No | `12` |
| `COOKIE_SECURE` | Secure cookie flag | `false` | No | `true` |
| `COOKIE_SAME_SITE` | SameSite cookie policy | `strict` | No | `strict` |

#### Redis Configuration

| Variable | Purpose | Default | Required | Example |
|----------|---------|---------|----------|---------|
| `REDIS_HOST` | Redis hostname | `redis` | Yes | `redis.example.com` |
| `REDIS_PORT` | Redis port | `6379` | No | `6379` |
| `REDIS_PASSWORD` | Redis password | None | Optional | `[if-required]` |
| `REDIS_DB` | Redis database number | `0` | No | `0` |

#### Rate Limiting

| Variable | Purpose | Default | Required | Example |
|----------|---------|---------|----------|---------|
| `RATE_LIMIT_WINDOW_MS` | Rate limit window (ms) | `900000` | No | `900000` |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` | No | `100` |
| `RATE_LIMIT_LOGIN_MAX` | Login attempts per window | `5` | No | `5` |
| `RATE_LIMIT_REGISTER_MAX` | Registration per hour | `3` | No | `3` |

#### File Upload

| Variable | Purpose | Default | Required | Example |
|----------|---------|---------|----------|---------|
| `MAX_FILE_SIZE` | Maximum file size | `5242880` | No | `5242880` |
| `ALLOWED_FILE_TYPES` | Allowed MIME types | `pdf,doc,docx,txt` | No | `pdf,doc,docx,txt` |

#### Monitoring

| Variable | Purpose | Default | Required | Example |
|----------|---------|---------|----------|---------|
| `ENABLE_SECURITY_ALERTS` | Enable security alerts | `true` | No | `true` |
| `ALERT_EMAIL` | Alert notification email | None | Optional | `admin@example.com` |
| `FAILED_LOGIN_THRESHOLD` | Failed login alert threshold | `5` | No | `5` |
| `SUSPICIOUS_ACTIVITY_THRESHOLD` | Suspicious activity threshold | `10` | No | `10` |

### Configuration Examples

#### Development Setup

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

#### Production Setup

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

### Changing Configuration After Deployment

Some settings can be changed by updating `.env` and restarting:

```bash
# Edit .env
nano .env

# Restart affected services
docker-compose restart backend
# or
docker-compose restart backend redis
```

**Note:** Database configuration changes require data migration.

### Security Configuration Details

#### JWT Configuration

The application uses JWT for stateless authentication:

- **Access Tokens:** Short-lived (15 minutes default)
  - Used for: All API requests
  - Storage: Memory + HttpOnly cookie
  - Refresh: Automatic via refresh endpoint

- **Refresh Tokens:** Long-lived (7 days default)
  - Used for: Obtaining new access tokens
  - Storage: Database + Secure cookie
  - Expiry: Hard limit (cannot refresh after 7 days)

#### Password Policy

- Minimum length: 8 characters
- Hashing: bcrypt with 12 salt rounds
- Storage: Never plaintext
- Validation: Must include uppercase, lowercase, number

#### CORS Configuration

Only requests from `CORS_ORIGIN` will have access. Be specific:

```env
# Correct (specific domain)
CORS_ORIGIN=https://app.example.com

# Wrong (too permissive)
CORS_ORIGIN=*
```

### Environment Variable Validation

The application validates all required variables on startup. If any are missing, it will refuse to start with a clear error message indicating which variables are required.

Test validation:

```bash
# Missing required variable will show error
docker-compose up backend
# Error: Required environment variable JWT_SECRET not set
```

## Development

### Backend Development
```bash
cd backend
npm install
npm run dev
```

### Frontend Development
```bash
cd frontend
npm install
npm run dev
```

### Run Tests
```bash
# Backend tests
cd backend
npm test

# Security tests
cd penetration-testing
npm run test:security
```

## Deployment

### Production Deployment with Docker Compose

For production deployments, follow these steps:

#### 1. Clone and Prepare

```bash
git clone <repository-url>
cd safeconnect-platform
cp .env.example .env
```

#### 2. Configure Environment Variables

Edit `.env` with production values:

```bash
# Generate secure random values (minimum 32 characters)
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
DB_PASSWORD=$(openssl rand -base64 16)
CSRF_SECRET=$(openssl rand -base64 32)

# Update .env file with these secure values
nano .env
```

**Critical Environment Variables:**

```env
NODE_ENV=production
APP_PORT=5000
DB_HOST=<your-postgres-host>
DB_USER=safeconnect_user
DB_PASSWORD=<generate-secure-value>
JWT_SECRET=<generate-secure-value>
JWT_REFRESH_SECRET=<generate-secure-value>
CORS_ORIGIN=https://yourdomain.com
FRONTEND_URL=https://yourdomain.com
REDIS_HOST=<your-redis-host>
COOKIE_SECURE=true
```

#### 3. Build Docker Images

```bash
docker-compose -f docker-compose.yml build
```

#### 4. Start Services

```bash
docker-compose -f docker-compose.yml up -d
```

#### 5. Verify Deployment

```bash
# Check all containers are healthy
docker-compose ps

# Test API health endpoint
curl -I https://yourdomain.com/health

# View logs for any issues
docker-compose logs backend
```

#### 6. Enable HTTPS with Let's Encrypt

Update `nginx/nginx.conf`:

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Security headers
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

#### 7. Database Setup (First Time Only)

```bash
# Run migrations
docker-compose exec backend npm run migrate

# Seed initial data (optional)
docker-compose exec backend npm run seed
```

#### 8. Monitoring and Backups

**Daily Database Backup:**
```bash
docker-compose exec postgres pg_dump -U safeconnect_user \
  safeconnect_db > backup-$(date +%Y%m%d).sql
```

**Monitor Application:**
```bash
# Check container resource usage
docker stats

# View recent logs
docker-compose logs -f backend
```

### Production Deployment Checklist

- [ ] All environment variables are secure (no defaults in production)
- [ ] Database backups scheduled daily
- [ ] HTTPS enabled with valid certificate
- [ ] Firewall configured to allow only 80 and 443
- [ ] Database user has restricted privileges
- [ ] Monitoring/alerting configured
- [ ] Incident response plan documented
- [ ] Regular security updates scheduled

### Troubleshooting Production Deployment

**Issue: "Cannot connect to database"**
- Verify `DB_HOST` is accessible from container
- Check PostgreSQL is running and accepting connections
- Confirm firewall allows port 5432

**Issue: "CORS errors on frontend"**
- Verify `CORS_ORIGIN` matches frontend domain exactly
- Check frontend URL does not have trailing slash

**Issue: "SSL certificate errors"**
- Verify certificate path is correct
- Check certificate is not expired: `openssl x509 -in cert.pem -noout -dates`
- Ensure full chain certificate is used, not just server cert

## Security

This platform implements multiple layers of security:

1. **Input Validation**: All inputs validated and sanitized
2. **Authentication**: JWT-based with secure token management
3. **Authorization**: Role-based access control (RBAC)
4. **Encryption**: Passwords hashed with bcrypt, data encrypted at rest
5. **Rate Limiting**: Protection against brute force and DDoS
6. **Monitoring**: Real-time security event logging and alerting

For detailed security information, see [SECURITY_GUIDE.md](docs/SECURITY_GUIDE.md).

## Troubleshooting

### Common Issues and Solutions

#### Port Already in Use

**Problem:** `Error: listen EADDRINUSE: address already in use :::5000`

**Solution:**

Find which process is using the port:

```bash
# macOS/Linux
lsof -i :5000

# Windows
netstat -ano | findstr :5000
```

Then choose one:

**Option 1: Change the port in docker-compose.yml**
```yaml
backend:
  ports:
    - "5001:5000"  # Change 5000 to 5001
```

**Option 2: Kill the process (if it is yours)**
```bash
# macOS/Linux
kill -9 <PID>

# Windows PowerShell
taskkill /PID <PID> /F
```

**Option 3: Use different compose project**
```bash
docker-compose -p safeconnect-alt up -d
```

#### Database Connection Errors

**Problem:** `Error: connect ECONNREFUSED 127.0.0.1:5432` or `Connection timeout`

**Solution:**

Check if PostgreSQL is running:

```bash
# See all running containers
docker ps | grep postgres

# If not running, start it
docker-compose up -d postgres

# Check logs
docker-compose logs postgres
```

If using external database, verify connection:

```bash
# Test connection
docker run -it --rm postgres:15-alpine \
  psql -h your-db-host -U safeconnect_user -d safeconnect_db -c "SELECT 1"
```

Reset database completely:

```bash
# Remove volumes and restart (loses all data)
docker-compose down -v
docker-compose up -d postgres
docker-compose exec postgres psql -U safeconnect_user -c "CREATE DATABASE safeconnect_db;"
```

#### Frontend Cannot Connect to Backend API

**Problem:** Network tab shows failed requests to `http://localhost:5000/api`

**Solution:**

1. **Verify backend is running:**
   ```bash
   curl http://localhost:5000/health
   # Should return 200 OK
   ```

2. **Check CORS configuration:**
   - Backend logs should show CORS checks
   - Verify `.env` has correct `CORS_ORIGIN`
   - Frontend URL must match exactly (including https/http)

3. **Verify API URL in frontend:**
   - Check `.env` in frontend: `VITE_API_URL=http://localhost:5000/api`
   - Rebuild if changed: `npm run dev`

4. **Check browser console:**
   - CORS error message usually tells you what is wrong
   - Common: `Access-Control-Allow-Origin` mismatch

5. **Network troubleshooting:**
   ```bash
   # Test from container
   docker-compose exec frontend curl http://backend:5000/health
   ```

#### Authentication Not Working

**Problem:** Login fails or tokens not being saved

**Solution:**

1. **Clear browser storage:**
   - DevTools -> Application -> Clear Site Data
   - Or use an Incognito window

2. **Verify Redis is running:**
   ```bash
   docker ps | grep redis
   docker-compose logs redis
   ```

3. **Check JWT secrets are set:**
   ```bash
   docker-compose exec backend printenv | grep JWT
   # Should show non-empty JWT_SECRET and JWT_REFRESH_SECRET
   ```

4. **Verify cookies are being saved:**
   - DevTools -> Application -> Cookies
   - Look for `accessToken` and `refreshToken` cookies
   - Should have HttpOnly flag set

5. **Check server logs:**
   ```bash
   docker-compose logs backend | grep -i auth
   ```

#### Docker Build Fails

**Problem:** `error building image` or `step X failed`

**Solution:**

Clean Docker cache:

```bash
docker system prune -a
docker-compose build --no-cache backend
```

Check Node version compatibility:

```bash
docker run node:20 node --version
# Should be v20.x.x
```

Check for common issues:

```bash
# View full build output
docker-compose build backend --progress=plain

# Check Dockerfile exists
ls backend/Dockerfile
```

#### Rate Limiting Too Strict

**Problem:** Getting `429 Too Many Requests` errors

**Solution:**

1. **Check rate limit configuration:**
   ```bash
   grep RATE_LIMIT .env
   ```

2. **Clear Redis cache:**
   ```bash
   docker-compose exec redis redis-cli FLUSHALL
   ```

3. **Restart backend (clears in-memory limits):**
   ```bash
   docker-compose restart backend
   sleep 5  # Wait for startup
   ```

4. **Check Redis memory:**
   ```bash
   docker-compose exec redis redis-cli INFO memory
   # Check used_memory_human
   ```

5. **Adjust limits in `.env`:**
   ```env
   RATE_LIMIT_WINDOW_MS=1800000         # Increase window to 30min
   RATE_LIMIT_MAX_REQUESTS=200          # Increase limit
   RATE_LIMIT_LOGIN_MAX=10              # Increase login attempts
   ```

   Then restart:
   ```bash
   docker-compose restart backend
   ```

#### Password Issues

**Problem:** "Password must include uppercase, lowercase, number, special char" or login fails

**Solution:**

Use a strong password:

```
Example: Secure@Pass123

Required:
- At least 8 characters
- One uppercase letter
- One lowercase letter
- One number
- One special character (!@#$%^&*)
```

For testing, use provided defaults:
- Admin: admin@safeconnect.com / Admin123!@#
- User: user@safeconnect.com / User123!@#

#### Database Migrations Failed

**Problem:** "Migration failed" or "table already exists"

**Solution:**

Reset and remigrate:

```bash
# Undo all migrations
docker-compose exec backend npm run migrate:undo:all

# Run migrations again
docker-compose exec backend npm run migrate

# Seed data (optional)
docker-compose exec backend npm run seed
```

Or full reset:

```bash
docker-compose down -v
docker-compose up -d
# Database will auto-initialize
```

### Debug Mode

Enable detailed logging for troubleshooting:

```bash
# Set debug logging in .env
LOG_LEVEL=debug

# Restart backend
docker-compose restart backend

# View logs with filtering
docker-compose logs backend -f | grep -i error
```

### Performance Issues

**Problem:** Application is slow or unresponsive

**Solutions:**

Check container resource limits:
```bash
docker stats
# Look for high CPU/memory usage
```

Clear Redis cache:
```bash
docker-compose exec redis redis-cli FLUSHDB
```

Check database connections:
```bash
docker-compose exec postgres psql -U safeconnect_user \
  -c "SELECT count(*) FROM pg_stat_activity;"
```

Monitor logs for errors:
```bash
docker-compose logs -f backend
```

### Getting More Help

If the above does not solve your issue:

1. **Check all containers are healthy:**
   ```bash
   docker-compose ps
   # Status should show "healthy" or "running" for all
   ```

2. **Review all logs:**
   ```bash
   docker-compose logs
   ```

3. **Verify .env file:**
   ```bash
   cat .env
   # Compare with .env.example
   ```

4. **Try full reset:**
   ```bash
   docker-compose down -v
   docker-compose up -d
   # This takes 30-60 seconds
   ```

5. **Check Docker resources:**
   ```bash
   docker stats
   # Ensure Docker has enough CPU and memory
   ```

## License

This project is developed for educational and demonstration purposes.

## Author

Francesco di Biase - 2026

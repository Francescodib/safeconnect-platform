# SafeConnect Solutions - Setup Guide

**Author:** Francesco di Biase
**Version:** 1.0

## Prerequisites

- Node.js 20+ and npm 10+
- Docker and Docker Compose
- Git
- 8GB RAM minimum
- 10GB free disk space

## Quick Start with Docker Compose

The fastest way to get the entire platform running:

```bash
# Clone the repository
git clone <repository-url>
cd safeconnect-platform

# Copy environment file
cp .env.example .env

# Edit .env and set secure values for:
# - JWT_SECRET
# - JWT_REFRESH_SECRET
# - DB_PASSWORD
# - CSRF_SECRET
# - SESSION_SECRET

# Start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f
```

Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- API Documentation: http://localhost:5000/api-docs
- Nginx Proxy: http://localhost (optional)

## Manual Setup (Development)

### 1. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp ../.env.example .env

# Edit .env with your database credentials

# Run database migrations (if using external PostgreSQL)
npm run migrate

# Start development server
npm run dev
```

Backend will start on http://localhost:5000

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Start development server
npm run dev
```

Frontend will start on http://localhost:3000

### 3. Database Setup

#### Using Docker

```bash
docker run --name safeconnect-postgres \
  -e POSTGRES_DB=safeconnect_db \
  -e POSTGRES_USER=safeconnect_user \
  -e POSTGRES_PASSWORD=your_password \
  -p 5432:5432 \
  -d postgres:15-alpine
```

#### Using Local PostgreSQL

```sql
CREATE DATABASE safeconnect_db;
CREATE USER safeconnect_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE safeconnect_db TO safeconnect_user;
```

### 4. Redis Setup

```bash
docker run --name safeconnect-redis \
  -p 6379:6379 \
  -d redis:7-alpine
```

## Environment Variables

### Backend (.env)

```bash
# Application
NODE_ENV=development
APP_NAME=SafeConnect Solutions
APP_PORT=5000
FRONTEND_URL=http://localhost:3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=safeconnect_db
DB_USER=safeconnect_user
DB_PASSWORD=change_this_secure_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT (MUST CHANGE IN PRODUCTION)
JWT_SECRET=change_this_to_a_very_long_random_secret_key_min_32_chars
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_SECRET=change_this_to_another_very_long_random_secret_key_min_32_chars
JWT_REFRESH_EXPIRY=7d

# Security
BCRYPT_SALT_ROUNDS=12
CSRF_SECRET=change_this_csrf_secret_key_min_32_chars
SESSION_SECRET=change_this_session_secret_key_min_32_chars
COOKIE_SECURE=false
COOKIE_SAME_SITE=strict

# CORS
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_LOGIN_MAX=5
RATE_LIMIT_REGISTER_MAX=3
```

### Frontend (.env)

```bash
VITE_API_URL=http://localhost:5000/api
```

## Building for Production

### Backend

```bash
cd backend
npm run build
npm start
```

### Frontend

```bash
cd frontend
npm run build
npm run preview
```

### Docker Production Build

```bash
docker-compose -f docker-compose.yml up -d --build
```

## Testing

### Backend Tests

```bash
cd backend
npm test
npm run test:watch
```

### Frontend Tests

```bash
cd frontend
npm test
```

### Security Tests

```bash
cd penetration-testing
npm run test:security
```

## Database Migrations

### Create Migration

```bash
cd backend
npx sequelize-cli migration:generate --name migration-name
```

### Run Migrations

```bash
npm run migrate
```

### Rollback Migration

```bash
npm run migrate:undo
```

## Common Issues

### Port Already in Use

```bash
# Find process using port
lsof -i :5000  # Backend
lsof -i :3000  # Frontend

# Kill process
kill -9 <PID>
```

### Database Connection Error

- Check PostgreSQL is running
- Verify credentials in .env
- Check network connectivity
- Ensure database exists

### Redis Connection Error

- Check Redis is running
- Verify port 6379 is accessible
- Check Redis logs: `docker logs safeconnect-redis`

### CORS Errors

- Ensure `CORS_ORIGIN` in backend .env matches frontend URL
- Check `VITE_API_URL` in frontend .env points to backend

## Security Configuration

### Generate Secure Secrets

```bash
# Generate JWT secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate CSRF secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### SSL/TLS Setup (Production)

1. Obtain SSL certificate (Let's Encrypt)
2. Update nginx configuration
3. Set `COOKIE_SECURE=true` in .env
4. Use HTTPS URLs in environment variables

## Monitoring and Logs

### View Application Logs

```bash
# Backend logs
docker-compose logs -f backend

# Frontend logs
docker-compose logs -f frontend

# All services
docker-compose logs -f
```

### Access Log Files

```bash
# Backend logs directory
cd backend/logs

# View error log
tail -f error.log

# View security log
tail -f security.log
```

## Backup and Restore

### Backup Database

```bash
docker exec safeconnect-postgres pg_dump \
  -U safeconnect_user safeconnect_db > backup.sql
```

### Restore Database

```bash
docker exec -i safeconnect-postgres psql \
  -U safeconnect_user safeconnect_db < backup.sql
```

## Development Workflow

1. Create feature branch
2. Make changes
3. Run tests
4. Test security features
5. Run linter: `npm run lint`
6. Format code: `npm run format`
7. Commit changes
8. Create pull request

## IDE Setup

### VSCode Recommended Extensions

- ESLint
- Prettier
- TypeScript
- Docker
- GitLens

### VSCode Settings

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

## Performance Optimization

### Production Checklist

- [ ] Enable production mode (NODE_ENV=production)
- [ ] Build optimized bundles
- [ ] Enable gzip compression
- [ ] Configure CDN for static assets
- [ ] Enable database connection pooling
- [ ] Set up caching (Redis)
- [ ] Optimize images
- [ ] Minify JavaScript/CSS

## Troubleshooting

### Clear All Data and Restart

```bash
docker-compose down -v
docker-compose up -d
```

### Reset Database

```bash
cd backend
npm run db:reset
```

### Check Service Health

```bash
# Backend health
curl http://localhost:5000/health

# Database
docker exec safeconnect-postgres pg_isready

# Redis
docker exec safeconnect-redis redis-cli ping
```

## Support

For issues or questions:
- Check documentation in `/docs`
- Review logs for error messages
- Check GitHub issues
- Contact: support@safeconnect.com

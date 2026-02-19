# SafeConnect Solutions - API Documentation

**Author:** Francesco di Biase
**Version:** 1.0
**Base URL:** `http://localhost:5000/api`

## Interactive Documentation

Visit [http://localhost:5000/api-docs](http://localhost:5000/api-docs) for interactive Swagger UI documentation.

## Authentication

All protected endpoints require a JWT access token in the Authorization header:

```
Authorization: Bearer <access_token>
```

## Endpoints Summary

### Authentication

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/auth/register` | Public | Register new user |
| POST | `/auth/login` | Public | Login user |
| POST | `/auth/logout` | Private | Logout user |
| POST | `/auth/refresh` | Public | Refresh access token |
| GET | `/auth/me` | Private | Get current user |

### Documents

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/documents` | Private | Create document |
| GET | `/documents` | Private | List all accessible documents |
| GET | `/documents/:id` | Private | Get single document |
| PUT | `/documents/:id` | Private (Owner) | Update document |
| DELETE | `/documents/:id` | Private (Owner) | Delete document |

### Admin

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/admin/logs` | Admin | Get audit logs |
| GET | `/admin/security-events` | Admin | Get security events |
| GET | `/admin/failed-logins` | Admin | Get failed login attempts |
| GET | `/admin/active-sessions` | Admin | Get active user sessions |
| GET | `/admin/stats` | Admin | Get security statistics |
| PATCH | `/admin/security-events/:id/resolve` | Admin | Resolve security event |

## Detailed Endpoints

### POST /auth/register

Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user",
      "createdAt": "2026-02-17T10:30:00Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  },
  "message": "Registration successful"
}
```

### POST /auth/login

Authenticate user and receive tokens.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### POST /auth/refresh

Refresh expired access token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### POST /documents

Create a new document (requires authentication).

**Request Body:**
```json
{
  "title": "Document Title",
  "content": "Document content with <b>HTML</b>",
  "shared": false
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Document Title",
    "content": "Document content with <b>HTML</b>",
    "ownerId": "user-uuid",
    "shared": false,
    "createdAt": "2026-02-17T10:30:00Z"
  }
}
```

### GET /documents

List all documents accessible by the authenticated user.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "documents": [
      {
        "id": "uuid",
        "title": "Document Title",
        "content": "...",
        "ownerId": "user-uuid",
        "shared": false,
        "createdAt": "2026-02-17T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "pages": 5
    }
  }
}
```

### GET /admin/stats

Get security statistics (admin only).

**Query Parameters:**
- `hours` (optional): Time window in hours (default: 24)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "period": "Last 24 hours",
    "since": "2026-02-16T10:30:00Z",
    "security": {
      "eventsByType": [
        { "type": "failed_login", "count": 15 },
        { "type": "rate_limit", "count": 8 }
      ],
      "eventsBySeverity": [
        { "severity": "medium", "count": 18 },
        { "severity": "high", "count": 5 }
      ],
      "unresolvedEvents": 3,
      "failedLogins": 15
    },
    "users": {
      "total": 150,
      "active": 148,
      "inactive": 2
    }
  }
}
```

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": {
    "message": "Validation failed: Email is required"
  }
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": {
    "message": "No token provided"
  }
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": {
    "message": "You do not have permission to access this resource"
  }
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": {
    "message": "Resource not found"
  }
}
```

### 429 Too Many Requests
```json
{
  "success": false,
  "error": {
    "message": "Too many requests, please try again later"
  }
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": {
    "message": "Internal server error"
  }
}
```

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| General API | 100 requests / 15 minutes |
| POST /auth/login | 5 requests / 15 minutes |
| POST /auth/register | 3 requests / hour |

## Security Headers

All responses include security headers:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- Content Security Policy

## CORS

CORS is configured to allow requests only from the configured frontend origin.

## Testing with curl

### Register
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"SecurePass123!","firstName":"Test","lastName":"User"}'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"SecurePass123!"}'
```

### Get Current User
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Create Document
```bash
curl -X POST http://localhost:5000/api/documents \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"My Document","content":"Content here","shared":false}'
```

## WebSocket Support

Not currently implemented. Future enhancement planned for real-time notifications.

## Pagination

All list endpoints support pagination:
- `page`: Page number (1-indexed)
- `limit`: Items per page (max 100)

Response includes pagination metadata:
```json
{
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```

## Filtering

Admin endpoints support filtering:
- `/admin/logs?action=user_login&userId=uuid`
- `/admin/security-events?type=failed_login&severity=high`

## For More Information

- Security Guide: See SECURITY_GUIDE.md
- Setup Guide: See SETUP_GUIDE.md
- Swagger UI: http://localhost:5000/api-docs

# SafeConnect Solutions - System Architecture

**Author:** Francesco di Biase
**Version:** 1.0
**Last Updated:** February 2026

## Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [Component Details](#component-details)
5. [Data Flow](#data-flow)
6. [Security Architecture](#security-architecture)
7. [Database Schema](#database-schema)
8. [API Architecture](#api-architecture)
9. [Deployment Architecture](#deployment-architecture)

## Overview

SafeConnect Solutions is a secure data management platform built with a modern microservices-oriented architecture. The system separates frontend and backend concerns, uses industry-standard security practices, and is containerized for easy deployment.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Browser                        │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS
┌──────────────────────────▼──────────────────────────────────┐
│                      Nginx Reverse Proxy                     │
│  - Rate Limiting        - SSL Termination                    │
│  - Load Balancing       - Security Headers                   │
└────────────┬────────────────────────────┬───────────────────┘
             │                            │
             │ /api/*                     │ /*
             │                            │
┌────────────▼────────────┐   ┌──────────▼──────────┐
│   Backend API Server    │   │   Frontend Server   │
│   (Node.js/Express)     │   │   (React/Vite)      │
│   - Authentication      │   │   - SPA             │
│   - Business Logic      │   │   - User Interface  │
│   - Data Access         │   │   - Client Routing  │
└────┬──────────┬─────────┘   └─────────────────────┘
     │          │
     │          │ Redis
┌────▼──────┐  └─────┐
│PostgreSQL │        │
│ Database  │   ┌────▼────┐
│           │   │  Redis  │
│- Users    │   │ - Cache │
│- Documents│   │ - Rates │
│- AuditLogs│   │ - CSRF  │
│- Security │   └─────────┘
└───────────┘
```

## System Architecture

### Layer Architecture

The application follows a layered architecture pattern:

```
┌───────────────────────────────────────────┐
│         Presentation Layer                │
│  (React Components, Pages, UI Logic)      │
└────────────────┬──────────────────────────┘
                 │ API Calls
┌────────────────▼──────────────────────────┐
│          API Gateway Layer                │
│  (Nginx, Rate Limiting, Routing)          │
└────────────────┬──────────────────────────┘
                 │ HTTP/REST
┌────────────────▼──────────────────────────┐
│         Application Layer                 │
│  (Controllers, Business Logic)            │
└────────────────┬──────────────────────────┘
                 │
┌────────────────▼──────────────────────────┐
│          Service Layer                    │
│  (Auth Service, Audit Service)            │
└────────────────┬──────────────────────────┘
                 │
┌────────────────▼──────────────────────────┐
│        Data Access Layer                  │
│  (Sequelize ORM, Models)                  │
└────────────────┬──────────────────────────┘
                 │
┌────────────────▼──────────────────────────┐
│         Data Layer                        │
│  (PostgreSQL, Redis)                      │
└───────────────────────────────────────────┘
```

## Technology Stack

### Frontend Stack

```
React 18 (UI Library)
  ├── TypeScript (Type Safety)
  ├── Vite 5 (Build Tool)
  ├── React Router v6 (Routing)
  ├── Axios (HTTP Client)
  ├── Tailwind CSS (Styling)
  ├── DOMPurify (XSS Prevention)
  └── Zustand/Context (State Management)
```

### Backend Stack

```
Node.js 20 (Runtime)
  ├── Express.js (Web Framework)
  ├── TypeScript (Type Safety)
  ├── Sequelize (ORM)
  │   └── PostgreSQL (Database)
  ├── JWT (Authentication)
  ├── Bcrypt (Password Hashing)
  ├── Redis (Caching & Rate Limiting)
  ├── Winston (Logging)
  ├── Helmet (Security Headers)
  └── Express Validator (Input Validation)
```

### DevOps Stack

```
Docker (Containerization)
  ├── Docker Compose (Orchestration)
  ├── Nginx (Reverse Proxy)
  ├── PostgreSQL 15 (Database)
  └── Redis 7 (Cache/Session Store)
```

## Component Details

### 1. Frontend (React SPA)

**Location:** `/frontend`

**Components:**
- **Pages**: Login, Register, Dashboard, Documents, Monitoring
- **Context**: AuthContext (global auth state)
- **Services**: API client, Auth service
- **Utils**: Validation, Sanitization
- **Hooks**: Custom React hooks

**Key Features:**
- Client-side routing with React Router
- Protected routes with role-based access
- Form validation with react-hook-form
- XSS prevention with DOMPurify
- JWT token management
- Automatic token refresh

### 2. Backend API (Node.js/Express)

**Location:** `/backend`

**Structure:**
```
backend/src/
├── config/          # Configuration (DB, Redis, Logger)
├── controllers/     # Request handlers
│   ├── authController.ts
│   ├── documentController.ts
│   └── adminController.ts
├── middleware/      # Express middleware
│   ├── auth.ts
│   ├── rateLimiter.ts
│   ├── csrf.ts
│   ├── errorHandler.ts
│   └── validate.ts
├── models/          # Sequelize models
│   ├── User.ts
│   ├── Document.ts
│   ├── AuditLog.ts
│   ├── SecurityEvent.ts
│   └── RefreshToken.ts
├── routes/          # API routes
│   ├── authRoutes.ts
│   ├── documentRoutes.ts
│   └── adminRoutes.ts
├── services/        # Business logic
│   ├── authService.ts
│   └── auditService.ts
├── utils/           # Utilities
│   ├── validators.ts
│   └── seed.ts
└── app.ts           # Main application
```

**Key Features:**
- RESTful API design
- JWT authentication with refresh tokens
- Role-based authorization (RBAC)
- Input validation and sanitization
- Comprehensive error handling
- Audit logging
- Security event tracking

### 3. Database (PostgreSQL)

**Location:** PostgreSQL container

**Schema Design:**
- Normalized relational schema
- UUID primary keys
- Timestamps on all tables
- Foreign key constraints
- Indexes on frequently queried fields

**Key Tables:**
- `users` - User accounts and authentication
- `documents` - Document storage
- `audit_logs` - Action audit trail
- `security_events` - Security incident tracking
- `refresh_tokens` - JWT refresh token management

### 4. Cache Layer (Redis)

**Location:** Redis container

**Use Cases:**
- Rate limiting counters
- CSRF token storage
- Session management (future)
- Temporary data caching

**Key Patterns:**
- Key expiration for automatic cleanup
- Atomic operations for rate limiting
- Prefix-based key organization

### 5. Reverse Proxy (Nginx)

**Location:** `/nginx`

**Responsibilities:**
- SSL/TLS termination
- Request routing (/ → frontend, /api → backend)
- Rate limiting at network level
- Static file serving
- Gzip compression
- Security headers

## Data Flow

### Authentication Flow

```
1. User Login Request
   │
   ├─→ Frontend: Collect credentials
   │
   ├─→ Frontend: Validate input (client-side)
   │
   ├─→ Backend: POST /api/auth/login
   │   │
   │   ├─→ Middleware: Rate limiting check
   │   ├─→ Middleware: Input validation
   │   ├─→ Controller: authController.login()
   │   ├─→ Model: User.findOne(email)
   │   ├─→ User: comparePassword()
   │   ├─→ Service: Generate JWT tokens
   │   ├─→ Database: Store refresh token
   │   ├─→ Service: Log audit event
   │   └─→ Response: { user, accessToken, refreshToken }
   │
   └─→ Frontend: Store tokens, redirect to dashboard
```

### Document Create Flow

```
1. Create Document Request
   │
   ├─→ Frontend: User fills form
   │
   ├─→ Frontend: Sanitize input (DOMPurify)
   │
   ├─→ Frontend: POST /api/documents
   │   Headers: { Authorization: Bearer <token> }
   │
   ├─→ Backend: Middleware chain
   │   │
   │   ├─→ Rate limiting
   │   ├─→ JWT verification
   │   ├─→ Input validation
   │   ├─→ Sanitization
   │   └─→ Controller
   │
   ├─→ Controller: documentController.create()
   │   │
   │   ├─→ Model: Document.create()
   │   ├─→ Database: INSERT INTO documents
   │   ├─→ Service: Log audit event
   │   └─→ Response: { document }
   │
   └─→ Frontend: Display success, update UI
```

### Security Event Flow

```
1. Security Event Detected
   │
   ├─→ Trigger: Failed login, Rate limit, Invalid token
   │
   ├─→ Service: auditService.createSecurityEvent()
   │   │
   │   ├─→ Model: SecurityEvent.create()
   │   ├─→ Database: INSERT INTO security_events
   │   ├─→ Logger: Log to security.log
   │   └─→ Alert: Send email if critical/high
   │
   └─→ Admin Dashboard: Display in real-time
```

## Security Architecture

### Defense in Depth

```
┌──────────────────────────────────────────┐
│  Layer 1: Network Security               │
│  - Nginx rate limiting                   │
│  - Firewall rules                        │
│  - DDoS protection                       │
└────────────────┬─────────────────────────┘
                 │
┌────────────────▼─────────────────────────┐
│  Layer 2: Application Security           │
│  - Input validation                      │
│  - Output encoding                       │
│  - CSRF tokens                           │
│  - Security headers                      │
└────────────────┬─────────────────────────┘
                 │
┌────────────────▼─────────────────────────┐
│  Layer 3: Authentication & Authorization │
│  - JWT tokens                            │
│  - Password hashing (bcrypt)             │
│  - Role-based access control             │
│  - Account lockout                       │
└────────────────┬─────────────────────────┘
                 │
┌────────────────▼─────────────────────────┐
│  Layer 4: Data Security                  │
│  - Parameterized queries (SQL injection) │
│  - Encryption at rest                    │
│  - Secure communication (HTTPS)          │
└────────────────┬─────────────────────────┘
                 │
┌────────────────▼─────────────────────────┐
│  Layer 5: Monitoring & Logging           │
│  - Audit logging                         │
│  - Security event tracking               │
│  - Anomaly detection                     │
│  - Incident response                     │
└──────────────────────────────────────────┘
```

### Security Boundaries

```
Internet
   ↓
[Firewall]
   ↓
[Nginx - DMZ]
   ↓
[Backend - App Zone]
   ↓
[Database - Data Zone]
```

## Database Schema

### Entity Relationship Diagram

```
┌─────────────┐         ┌──────────────┐
│    Users    │1       *│  Documents   │
│─────────────│◄────────│──────────────│
│ id (PK)     │         │ id (PK)      │
│ email       │         │ title        │
│ password    │         │ content      │
│ role        │         │ owner_id(FK) │
│ is_active   │         │ shared       │
└─────┬───────┘         └──────────────┘
      │
      │1
      │
      │*
┌─────▼───────────┐
│  RefreshTokens  │
│─────────────────│
│ id (PK)         │
│ token           │
│ user_id (FK)    │
│ expires_at      │
└─────────────────┘

┌─────────────┐
│ AuditLogs   │
│─────────────│
│ id (PK)     │
│ action      │
│ user_id(FK) │
│ ip          │
│ details     │
└─────────────┘

┌──────────────────┐
│ SecurityEvents   │
│──────────────────│
│ id (PK)          │
│ type             │
│ severity         │
│ user_id (FK)     │
│ ip               │
│ details          │
│ resolved         │
└──────────────────┘
```

## API Architecture

### RESTful Design

All endpoints follow REST principles:

- **Resource-based URLs**: `/api/documents/:id`
- **HTTP verbs**: GET, POST, PUT, DELETE
- **Status codes**: 200, 201, 400, 401, 403, 404, 429, 500
- **JSON responses**: Consistent format

### API Response Format

```typescript
// Success Response
{
  success: true,
  data: { /* resource data */ },
  message?: string
}

// Error Response
{
  success: false,
  error: {
    message: string,
    code?: string
  }
}
```

### Middleware Chain

```
Request
  ↓
[Morgan] - HTTP logging
  ↓
[Helmet] - Security headers
  ↓
[CORS] - Cross-origin policy
  ↓
[Body Parser] - Parse JSON
  ↓
[Rate Limiter] - DoS protection
  ↓
[CSRF Verification] - Token validation
  ↓
[JWT Authentication] - Verify user
  ↓
[Authorization] - Check permissions
  ↓
[Input Validation] - Validate request
  ↓
[Controller] - Business logic
  ↓
[Error Handler] - Catch errors
  ↓
Response
```

## Deployment Architecture

### Docker Compose Setup

```
┌─────────────────────────────────────────┐
│         Host Machine                    │
│                                         │
│  ┌────────────────────────────────────┐ │
│  │  Docker Network: safeconnect-net   │ │
│  │                                    │ │
│  │  ┌──────────┐  ┌──────────┐      │ │
│  │  │ Frontend │  │ Backend  │      │ │
│  │  │  :3000   │  │  :5000   │      │ │
│  │  └─────┬────┘  └────┬─────┘      │ │
│  │        │            │            │ │
│  │  ┌─────▼────────────▼─────┐      │ │
│  │  │  Nginx Reverse Proxy   │      │ │
│  │  │        :80, :443       │      │ │
│  │  └────────────────────────┘      │ │
│  │                                    │ │
│  │  ┌──────────┐  ┌──────────┐      │ │
│  │  │PostgreSQL│  │  Redis   │      │ │
│  │  │  :5432   │  │  :6379   │      │ │
│  │  └──────────┘  └──────────┘      │ │
│  │                                    │ │
│  │  Volumes: postgres_data, redis_data│ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### Production Deployment

For production deployment:

1. **Use managed services** for PostgreSQL and Redis
2. **Enable SSL/TLS** with Let's Encrypt
3. **Configure CDN** (Cloudflare/AWS CloudFront)
4. **Set up monitoring** (Prometheus/Grafana)
5. **Implement backup** strategy
6. **Use environment variables** for secrets
7. **Enable logging** aggregation (ELK stack)

## Scalability Considerations

### Horizontal Scaling

```
                    Load Balancer
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
   Backend 1         Backend 2         Backend 3
        │                 │                 │
        └─────────────────┼─────────────────┘
                          │
                    PostgreSQL
                  (Read Replicas)
```

### Caching Strategy

1. **Redis** for session data and rate limiting
2. **CDN** for static assets
3. **Application-level** caching for frequently accessed data
4. **Database query** result caching

## Monitoring Architecture

```
Application Logs
    ↓
Winston Logger
    ↓
┌─────────────────┐
│  Log Files      │
│  - error.log    │
│  - combined.log │
│  - security.log │
└────────┬────────┘
         │
         ↓
  Log Aggregation
  (Future: ELK)
         │
         ↓
    Visualization
    & Alerting
```

## Security Monitoring Flow

```
Security Event
    ↓
auditService.createSecurityEvent()
    ↓
┌─────────────────┐
│ Database        │
│ security_events │
└────────┬────────┘
         │
         ├─→ Logger (security.log)
         │
         ├─→ Severity Check
         │      │
         │      └─→ High/Critical?
         │             │
         │             └─→ Send Alert Email
         │
         └─→ Admin Dashboard
                 (Real-time display)
```

## Conclusion

This architecture provides a secure, scalable, and maintainable foundation for SafeConnect Solutions. The separation of concerns, use of industry standards, and comprehensive security measures ensure the platform can handle sensitive data while remaining resistant to common attack vectors.

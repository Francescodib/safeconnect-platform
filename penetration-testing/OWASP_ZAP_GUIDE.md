# OWASP ZAP Testing Guide for SafeConnect Solutions

**Author:** Francesco di Biase
**Version:** 1.0

## Overview

This guide provides instructions for performing security testing on SafeConnect Solutions using OWASP ZAP (Zed Attack Proxy).

## Prerequisites

- OWASP ZAP installed (https://www.zaproxy.org/download/)
- SafeConnect Solutions running locally or on a test server
- Test credentials for the application

## Installation

### Windows
```bash
Download installer from https://www.zaproxy.org/download/
Run the installer and follow prompts
```

### macOS
```bash
brew install --cask owasp-zap
```

### Linux
```bash
wget https://github.com/zaproxy/zaproxy/releases/download/v2.14.0/ZAP_2_14_0_unix.sh
chmod +x ZAP_2_14_0_unix.sh
./ZAP_2_14_0_unix.sh
```

## Configuration

### 1. Start SafeConnect Solutions

```bash
cd safeconnect-platform
docker-compose up -d
```

Verify the application is running:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

### 2. Launch OWASP ZAP

Start OWASP ZAP and select "Manual Explore" mode.

### 3. Configure Browser Proxy

Configure your browser to use ZAP as a proxy:
- Proxy address: localhost
- Port: 8080

## Automated Scan

### Quick Scan

1. Open ZAP
2. Go to "Quick Start" tab
3. Enter URL: `http://localhost:3000`
4. Click "Attack"
5. Wait for scan to complete
6. Review alerts in the "Alerts" tab

### Full Scan

1. Go to "Sites" tab
2. Right-click on `http://localhost:3000`
3. Select "Attack" → "Active Scan"
4. Configure scan options:
   - Enable all attack strength levels
   - Set threshold to "Low"
5. Click "Start Scan"
6. Monitor progress in "Active Scan" tab

## Manual Testing

### Authentication Testing

1. **Manual Explore**
   - Set URL: `http://localhost:3000`
   - Click "Launch Browser"

2. **Login Flow**
   - Navigate to login page
   - Enter credentials: `admin@safeconnect.com` / `Admin123!@#`
   - Click login
   - ZAP will record all requests

3. **Spider the Application**
   - Right-click on site
   - Select "Attack" → "Spider"
   - This will discover all pages

### Testing Specific Endpoints

1. **SQL Injection**
   - Go to "Active Scan" tab
   - Enable only "SQL Injection" category
   - Run scan
   - Review results

2. **XSS Testing**
   - Enable only "Cross Site Scripting" category
   - Run scan
   - Check for reflected and stored XSS

3. **CSRF Testing**
   - Enable "Cross Site Request Forgery" category
   - Verify CSRF tokens are present
   - Test token validation

## API Testing

### Configure API Testing

1. Import OpenAPI specification:
   - File → Import → Import an OpenAPI definition
   - URL: `http://localhost:5000/api-docs/swagger.json`

2. Generate requests:
   - Right-click imported definition
   - Select "Generate Requests"

3. Configure authentication:
   - Tools → Options → Replacer
   - Add rule to inject JWT token in Authorization header

### Run API Scan

1. Right-click on API endpoints
2. Select "Attack" → "Active Scan"
3. Review results specific to API

## Interpreting Results

### Alert Severity Levels

- **High (Red)**: Critical vulnerabilities, fix immediately
- **Medium (Orange)**: Significant issues, fix soon
- **Low (Yellow)**: Minor issues, fix when possible
- **Informational (Blue)**: No risk, for awareness

### Common Alerts to Review

1. **SQL Injection**
   - Expected: None (protected by ORM)
   - Check: All database queries use Sequelize

2. **Cross-Site Scripting (XSS)**
   - Expected: None (DOMPurify sanitization)
   - Check: Input/output sanitization

3. **Cross-Site Request Forgery (CSRF)**
   - Expected: None (CSRF tokens implemented)
   - Check: Token validation on state-changing requests

4. **Secure Headers**
   - Expected: All present
   - Check: X-Frame-Options, CSP, X-XSS-Protection, etc.

5. **Cookie Security**
   - Expected: HttpOnly, Secure, SameSite
   - Check: Cookie attributes in responses

## Testing Checklist

- [ ] Automated scan completed
- [ ] Manual exploration of all pages
- [ ] Authentication flow tested
- [ ] Authorization tested (different user roles)
- [ ] SQL Injection scan passed
- [ ] XSS scan passed
- [ ] CSRF protection verified
- [ ] Security headers verified
- [ ] Cookie security verified
- [ ] Rate limiting tested
- [ ] API endpoints tested
- [ ] File upload tested (if applicable)
- [ ] Session management reviewed
- [ ] Error handling reviewed

## Generating Reports

### HTML Report

1. Report → Generate HTML Report
2. Select scope (all alerts or specific)
3. Choose location
4. Click "Generate Report"

### PDF Report

1. Report → Generate PDF Report
2. Configure report options
3. Select location
4. Click "Generate Report"

### Markdown Report

1. Report → Export Messages to File
2. Select Markdown format
3. Save file

## Expected Results

### Should Have Zero Alerts For:

- SQL Injection (protected by Sequelize ORM)
- Stored XSS (sanitized with DOMPurify/sanitize-html)
- CSRF (token validation implemented)
- Insecure authentication (JWT with secure storage)

### May Have Low Priority Alerts For:

- Content Security Policy configuration
- Cookie without SameSite Attribute (if not in production)
- Missing Anti-clickjacking Header (already implemented)

### False Positives

Some alerts may be false positives:
- CSP headers (already implemented)
- X-Content-Type-Options (already set)
- Strict-Transport-Security (requires HTTPS in production)

## Advanced Testing

### Fuzzing

1. Select a request
2. Right-click → Fuzz
3. Add payloads to specific parameters
4. Run fuzzer
5. Analyze responses for anomalies

### Breakpoints

1. Set breakpoint on requests/responses
2. Intercept and modify traffic
3. Test application behavior with modified requests

### Scripts

Use ZAP scripting to automate complex tests:
1. Scripts tab
2. Create new script
3. Use JavaScript/Python to automate testing

## Remediation

For each alert found:

1. **Understand the Issue**
   - Read alert description
   - Review affected URLs
   - Check evidence provided

2. **Verify the Vulnerability**
   - Attempt to reproduce manually
   - Confirm it's not a false positive

3. **Fix the Issue**
   - Update code to address vulnerability
   - Follow security best practices

4. **Re-test**
   - Run scan again
   - Verify issue is resolved

## Continuous Testing

Integrate ZAP into CI/CD:

```bash
# Example: Run ZAP baseline scan
docker run -t owasp/zap2docker-stable zap-baseline.py \
  -t http://localhost:3000 \
  -r report.html
```

## Resources

- OWASP ZAP Documentation: https://www.zaproxy.org/docs/
- OWASP ZAP Getting Started: https://www.zaproxy.org/getting-started/
- OWASP Top 10: https://owasp.org/www-project-top-ten/

## Support

For questions about security testing:
- Email: security@safeconnect.com
- Review: SECURITY_GUIDE.md

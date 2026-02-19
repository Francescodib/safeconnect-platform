-- SafeConnect Solutions Database Initialization
-- Author: Francesco di Biase

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create enums
CREATE TYPE user_role AS ENUM ('admin', 'user', 'guest');
CREATE TYPE security_event_type AS ENUM ('failed_login', 'rate_limit', 'invalid_token', 'suspicious_activity');
CREATE TYPE security_event_severity AS ENUM ('low', 'medium', 'high', 'critical');

-- Ensure database is created with proper encoding
ALTER DATABASE safeconnect_db SET timezone TO 'UTC';

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE safeconnect_db TO safeconnect_user;

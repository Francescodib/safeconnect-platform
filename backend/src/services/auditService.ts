import { Op } from 'sequelize';
import { AuditLog, SecurityEvent } from '../models';
import logger from '../config/logger';
import config from '../config';
import emailService from './emailService';

interface AuditLogData {
  action: string;
  userId?: string;
  ip: string;
  userAgent?: string;
  details?: Record<string, unknown>;
}

interface SecurityEventData {
  type: 'failed_login' | 'rate_limit' | 'invalid_token' | 'suspicious_activity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  ip: string;
  details: string;
}

class AuditService {
  /**
   * Create audit log entry
   */
  async log(data: AuditLogData): Promise<void> {
    try {
      await AuditLog.create({
        action: data.action,
        userId: data.userId || null,
        ip: data.ip,
        userAgent: data.userAgent || null,
        details: data.details || {},
      });

      logger.info('Audit log created', {
        action: data.action,
        userId: data.userId,
        ip: data.ip,
      });
    } catch (error) {
      logger.error('Failed to create audit log', { error, data });
    }
  }

  /**
   * Log user login
   */
  async logLogin(userId: string, ip: string, userAgent?: string): Promise<void> {
    await this.log({
      action: 'user_login',
      userId,
      ip,
      userAgent,
      details: { timestamp: new Date() },
    });
  }

  /**
   * Log user logout
   */
  async logLogout(userId: string, ip: string, userAgent?: string): Promise<void> {
    await this.log({
      action: 'user_logout',
      userId,
      ip,
      userAgent,
      details: { timestamp: new Date() },
    });
  }

  /**
   * Log user registration
   */
  async logRegistration(userId: string, ip: string, userAgent?: string): Promise<void> {
    await this.log({
      action: 'user_registration',
      userId,
      ip,
      userAgent,
      details: { timestamp: new Date() },
    });
  }

  /**
   * Log failed login attempt
   */
  async logFailedLogin(email: string, ip: string, reason: string): Promise<void> {
    await this.log({
      action: 'failed_login',
      ip,
      details: { email, reason, timestamp: new Date() },
    });
  }

  /**
   * Create security event
   */
  async createSecurityEvent(data: SecurityEventData): Promise<void> {
    try {
      const event = await SecurityEvent.create({
        type: data.type,
        severity: data.severity,
        userId: data.userId || null,
        ip: data.ip,
        details: data.details,
        resolved: false,
      });

      logger.warn('Security event created', {
        type: data.type,
        severity: data.severity,
        eventId: event.id,
      });

      // Send alert if enabled and severity is high or critical
      if (
        config.monitoring.enableSecurityAlerts &&
        (data.severity === 'high' || data.severity === 'critical')
      ) {
        await this.sendSecurityAlert(event);
      }
    } catch (error) {
      logger.error('Failed to create security event', { error, data });
    }
  }

  /**
   * Log failed login as security event
   */
  async logFailedLoginEvent(userId: string | undefined, ip: string, email: string): Promise<void> {
    await this.createSecurityEvent({
      type: 'failed_login',
      severity: 'medium',
      userId,
      ip,
      details: `Failed login attempt for email: ${email}`,
    });
  }

  /**
   * Log rate limit violation
   */
  async logRateLimitEvent(ip: string, endpoint: string): Promise<void> {
    await this.createSecurityEvent({
      type: 'rate_limit',
      severity: 'medium',
      ip,
      details: `Rate limit exceeded for endpoint: ${endpoint}`,
    });
  }

  /**
   * Log invalid token usage
   */
  async logInvalidTokenEvent(userId: string | undefined, ip: string): Promise<void> {
    await this.createSecurityEvent({
      type: 'invalid_token',
      severity: 'high',
      userId,
      ip,
      details: 'Invalid or expired token used',
    });
  }

  /**
   * Log suspicious activity
   */
  async logSuspiciousActivity(
    userId: string | undefined,
    ip: string,
    details: string
  ): Promise<void> {
    await this.createSecurityEvent({
      type: 'suspicious_activity',
      severity: 'critical',
      userId,
      ip,
      details,
    });
  }

  /**
   * Send security alert via email
   */
  private async sendSecurityAlert(event: SecurityEvent): Promise<void> {
    logger.warn('Security alert triggered', {
      eventId: event.id,
      type: event.type,
      severity: event.severity,
      alertEmail: config.monitoring.alertEmail,
    });

    await emailService.sendSecurityAlert({
      eventId: event.id,
      type: event.type,
      severity: event.severity,
      ip: event.ip,
      details: event.details,
      timestamp: event.createdAt,
    });
  }

  /**
   * Check failed login threshold and escalate to suspicious activity if exceeded
   */
  async checkFailedLoginThreshold(ip: string): Promise<void> {
    try {
      const windowStart = new Date(Date.now() - 15 * 60 * 1000); // last 15 minutes

      const failedLoginCount = await SecurityEvent.count({
        where: {
          type: 'failed_login',
          ip,
          createdAt: { [Op.gte]: windowStart },
        },
      });

      if (failedLoginCount >= config.monitoring.failedLoginThreshold) {
        // Check if we already escalated for this IP recently (avoid duplicate alerts)
        const recentEscalation = await SecurityEvent.count({
          where: {
            type: 'suspicious_activity',
            ip,
            createdAt: { [Op.gte]: windowStart },
          },
        });

        if (recentEscalation === 0) {
          await this.logSuspiciousActivity(
            undefined,
            ip,
            `Multiple failed login attempts detected: ${failedLoginCount} attempts in 15 minutes from IP ${ip}`
          );
        }
      }
    } catch (error) {
      logger.error('Failed to check login threshold', { error, ip });
    }
  }

  /**
   * Get recent security events
   */
  async getRecentSecurityEvents(limit: number = 100): Promise<SecurityEvent[]> {
    return await SecurityEvent.findAll({
      limit,
      order: [['createdAt', 'DESC']],
      include: ['user'],
    });
  }

  /**
   * Get unresolved security events
   */
  async getUnresolvedSecurityEvents(): Promise<SecurityEvent[]> {
    return await SecurityEvent.findAll({
      where: { resolved: false },
      order: [['createdAt', 'DESC']],
      include: ['user'],
    });
  }
}

export default new AuditService();

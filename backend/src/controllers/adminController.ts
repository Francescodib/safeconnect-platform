import { Response, NextFunction } from 'express';
import { AuditLog, SecurityEvent, User } from '../models';
import { ApiError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import auditService from '../services/auditService';
import { Op, fn, col } from 'sequelize';

const safeUserInclude = {
  association: 'user' as const,
  attributes: ['id', 'email', 'firstName', 'lastName', 'role'],
};

class AdminController {
  /**
   * Get all audit logs with pagination and filtering
   */
  async getAuditLogs(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = (page - 1) * limit;
      const action = req.query.action as string;
      const userId = req.query.userId as string;

      const where: Record<string, unknown> = {};
      if (action) where.action = action;
      if (userId) where.userId = userId;

      const { count, rows: logs } = await AuditLog.findAndCountAll({
        where,
        limit,
        offset,
        order: [['createdAt', 'DESC']],
        include: [safeUserInclude],
      });

      res.json({
        success: true,
        data: {
          logs,
          pagination: {
            page,
            limit,
            total: count,
            pages: Math.ceil(count / limit),
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all security events
   */
  async getSecurityEvents(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = (page - 1) * limit;
      const type = req.query.type as string;
      const severity = req.query.severity as string;
      const resolved = req.query.resolved as string;

      const where: Record<string, unknown> = {};
      if (type) where.type = type;
      if (severity) where.severity = severity;
      if (resolved !== undefined) where.resolved = resolved === 'true';

      const { count, rows: events } = await SecurityEvent.findAndCountAll({
        where,
        limit,
        offset,
        order: [['createdAt', 'DESC']],
        include: [safeUserInclude],
      });

      res.json({
        success: true,
        data: {
          events,
          pagination: {
            page,
            limit,
            total: count,
            pages: Math.ceil(count / limit),
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get failed login attempts
   */
  async getFailedLogins(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const hours = parseInt(req.query.hours as string) || 24;
      const since = new Date(Date.now() - hours * 60 * 60 * 1000);

      const failedLogins = await AuditLog.findAll({
        where: {
          action: 'failed_login',
          createdAt: {
            [Op.gte]: since,
          },
        },
        order: [['createdAt', 'DESC']],
        limit: 100,
      });

      // Group by IP
      const byIp: Record<string, number> = {};
      failedLogins.forEach((log) => {
        byIp[log.ip] = (byIp[log.ip] || 0) + 1;
      });

      res.json({
        success: true,
        data: {
          failedLogins,
          summary: {
            total: failedLogins.length,
            byIp,
            since: since.toISOString(),
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get active sessions (users with recent activity)
   */
  async getActiveSessions(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const minutes = parseInt(req.query.minutes as string) || 30;
      const since = new Date(Date.now() - minutes * 60 * 1000);

      const recentActivity = await AuditLog.findAll({
        where: {
          createdAt: {
            [Op.gte]: since,
          },
          userId: {
            [Op.ne]: null,
          },
        },
        attributes: ['userId'],
        group: ['userId', 'user.id', 'user.email', 'user.role', 'user.last_login_at'],
        include: [
          {
            association: 'user',
            attributes: ['id', 'email', 'role', 'lastLoginAt'],
          },
        ],
      });

      res.json({
        success: true,
        data: {
          activeSessions: recentActivity,
          count: recentActivity.length,
          since: since.toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get security statistics
   */
  async getSecurityStats(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const hours = parseInt(req.query.hours as string) || 24;
      const since = new Date(Date.now() - hours * 60 * 60 * 1000);

      // Count security events by type
      const eventsByType = await SecurityEvent.findAll({
        where: {
          createdAt: {
            [Op.gte]: since,
          },
        },
        attributes: ['type', [fn('COUNT', col('id')), 'count']],
        group: ['type'],
      });

      // Count events by severity
      const eventsBySeverity = await SecurityEvent.findAll({
        where: {
          createdAt: {
            [Op.gte]: since,
          },
        },
        attributes: ['severity', [fn('COUNT', col('id')), 'count']],
        group: ['severity'],
      });

      // Count unresolved events
      const unresolvedCount = await SecurityEvent.count({
        where: { resolved: false },
      });

      // Count failed logins
      const failedLoginCount = await AuditLog.count({
        where: {
          action: 'failed_login',
          createdAt: {
            [Op.gte]: since,
          },
        },
      });

      // Count total users
      const totalUsers = await User.count();
      const activeUsers = await User.count({ where: { isActive: true } });

      res.json({
        success: true,
        data: {
          period: `Last ${hours} hours`,
          since: since.toISOString(),
          security: {
            eventsByType,
            eventsBySeverity,
            unresolvedEvents: unresolvedCount,
            failedLogins: failedLoginCount,
          },
          users: {
            total: totalUsers,
            active: activeUsers,
            inactive: totalUsers - activeUsers,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Resolve a security event
   */
  async resolveSecurityEvent(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;

      const event = await SecurityEvent.findByPk(id);
      if (!event) {
        throw new ApiError(404, 'Security event not found');
      }

      event.resolved = true;
      await event.save();

      await auditService.log({
        action: 'security_event_resolved',
        userId: req.userId,
        ip: req.ip || 'unknown',
        details: { eventId: id, type: event.type },
      });

      res.json({
        success: true,
        data: event,
        message: 'Security event resolved',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AdminController();

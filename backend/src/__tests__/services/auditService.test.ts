import auditService from '../../services/auditService';

jest.mock('../../config/logger', () => ({
  __esModule: true,
  default: { error: jest.fn(), warn: jest.fn(), info: jest.fn() },
}));

jest.mock('../../config', () => ({
  __esModule: true,
  default: {
    monitoring: {
      enableSecurityAlerts: false,
      alertEmail: 'security@test.com',
      failedLoginThreshold: 5,
      suspiciousActivityThreshold: 10,
    },
  },
}));

jest.mock('../../models', () => ({
  AuditLog: { create: jest.fn() },
  SecurityEvent: {
    create: jest.fn(),
    count: jest.fn(),
    findAll: jest.fn(),
  },
}));

jest.mock('../../services/emailService', () => ({
  __esModule: true,
  default: { sendSecurityAlert: jest.fn() },
}));

import { AuditLog, SecurityEvent } from '../../models';

const mockAuditLog = AuditLog as jest.Mocked<typeof AuditLog>;
const mockSecurityEvent = SecurityEvent as jest.Mocked<typeof SecurityEvent>;

describe('AuditService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('log', () => {
    it('creates an audit log entry with correct data', async () => {
      mockAuditLog.create = jest.fn().mockResolvedValue({});

      await auditService.log({
        action: 'test_action',
        userId: 'user-uuid',
        ip: '127.0.0.1',
        userAgent: 'Jest/1.0',
        details: { key: 'value' },
      });

      expect(mockAuditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'test_action',
          userId: 'user-uuid',
          ip: '127.0.0.1',
          userAgent: 'Jest/1.0',
        })
      );
    });

    it('does not throw when AuditLog.create fails', async () => {
      mockAuditLog.create = jest.fn().mockRejectedValue(new Error('DB error'));

      await expect(
        auditService.log({ action: 'test', ip: '127.0.0.1' })
      ).resolves.toBeUndefined();
    });

    it('sets userId to null when not provided', async () => {
      mockAuditLog.create = jest.fn().mockResolvedValue({});

      await auditService.log({ action: 'anonymous_action', ip: '1.2.3.4' });

      expect(mockAuditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: null })
      );
    });
  });

  describe('logLogin', () => {
    it('creates an audit log with action user_login', async () => {
      mockAuditLog.create = jest.fn().mockResolvedValue({});

      await auditService.logLogin('user-uuid', '127.0.0.1', 'Mozilla/5.0');

      expect(mockAuditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'user_login', userId: 'user-uuid' })
      );
    });
  });

  describe('logLogout', () => {
    it('creates an audit log with action user_logout', async () => {
      mockAuditLog.create = jest.fn().mockResolvedValue({});

      await auditService.logLogout('user-uuid', '127.0.0.1');

      expect(mockAuditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'user_logout' })
      );
    });
  });

  describe('logRegistration', () => {
    it('creates an audit log with action user_registration', async () => {
      mockAuditLog.create = jest.fn().mockResolvedValue({});

      await auditService.logRegistration('user-uuid', '127.0.0.1');

      expect(mockAuditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'user_registration' })
      );
    });
  });

  describe('logFailedLogin', () => {
    it('creates an audit log with action failed_login and no userId', async () => {
      mockAuditLog.create = jest.fn().mockResolvedValue({});

      await auditService.logFailedLogin('bad@example.com', '127.0.0.1', 'User not found');

      expect(mockAuditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'failed_login',
          userId: null,
        })
      );
    });
  });

  describe('createSecurityEvent', () => {
    it('creates a security event with the provided data', async () => {
      const fakeEvent = {
        id: 'evt-uuid',
        type: 'failed_login',
        severity: 'medium',
        ip: '127.0.0.1',
        details: 'test',
        createdAt: new Date(),
      };
      mockSecurityEvent.create = jest.fn().mockResolvedValue(fakeEvent);

      await auditService.createSecurityEvent({
        type: 'failed_login',
        severity: 'medium',
        ip: '127.0.0.1',
        details: 'test',
      });

      expect(mockSecurityEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'failed_login',
          severity: 'medium',
          resolved: false,
        })
      );
    });

    it('does not throw when SecurityEvent.create fails', async () => {
      mockSecurityEvent.create = jest.fn().mockRejectedValue(new Error('DB error'));

      await expect(
        auditService.createSecurityEvent({
          type: 'rate_limit',
          severity: 'low',
          ip: '1.2.3.4',
          details: 'test',
        })
      ).resolves.toBeUndefined();
    });
  });

  describe('logFailedLoginEvent', () => {
    it('creates a medium-severity failed_login security event', async () => {
      mockSecurityEvent.create = jest.fn().mockResolvedValue({ id: 'evt', createdAt: new Date() });

      await auditService.logFailedLoginEvent('user-id', '127.0.0.1', 'test@example.com');

      expect(mockSecurityEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'failed_login',
          severity: 'medium',
        })
      );
    });
  });

  describe('logRateLimitEvent', () => {
    it('creates a medium-severity rate_limit security event', async () => {
      mockSecurityEvent.create = jest.fn().mockResolvedValue({ id: 'evt', createdAt: new Date() });

      await auditService.logRateLimitEvent('127.0.0.1', '/api/auth/login');

      expect(mockSecurityEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'rate_limit', severity: 'medium' })
      );
    });
  });

  describe('logInvalidTokenEvent', () => {
    it('creates a high-severity invalid_token security event', async () => {
      mockSecurityEvent.create = jest.fn().mockResolvedValue({ id: 'evt', createdAt: new Date() });

      await auditService.logInvalidTokenEvent('user-id', '127.0.0.1');

      expect(mockSecurityEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'invalid_token', severity: 'high' })
      );
    });
  });

  describe('logSuspiciousActivity', () => {
    it('creates a critical suspicious_activity security event', async () => {
      mockSecurityEvent.create = jest.fn().mockResolvedValue({ id: 'evt', createdAt: new Date() });

      await auditService.logSuspiciousActivity('user-id', '127.0.0.1', 'Unusual pattern');

      expect(mockSecurityEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'suspicious_activity', severity: 'critical' })
      );
    });
  });

  describe('checkFailedLoginThreshold', () => {
    it('does not escalate when failed login count is below threshold', async () => {
      mockSecurityEvent.count = jest.fn().mockResolvedValue(3);

      await auditService.checkFailedLoginThreshold('127.0.0.1');

      expect(mockSecurityEvent.count).toHaveBeenCalledTimes(1);
    });

    it('escalates to suspicious_activity when threshold is reached and no prior escalation', async () => {
      mockSecurityEvent.count = jest.fn()
        .mockResolvedValueOnce(5)  // failed login count >= threshold
        .mockResolvedValueOnce(0); // no prior escalation
      mockSecurityEvent.create = jest.fn().mockResolvedValue({ id: 'evt', createdAt: new Date() });

      await auditService.checkFailedLoginThreshold('127.0.0.1');

      expect(mockSecurityEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'suspicious_activity', severity: 'critical' })
      );
    });

    it('does not create a duplicate escalation when one already exists', async () => {
      mockSecurityEvent.count = jest.fn()
        .mockResolvedValueOnce(6)  // failed count >= threshold
        .mockResolvedValueOnce(1); // escalation already exists
      mockSecurityEvent.create = jest.fn();

      await auditService.checkFailedLoginThreshold('127.0.0.1');

      expect(mockSecurityEvent.create).not.toHaveBeenCalled();
    });

    it('does not throw when a database error occurs', async () => {
      mockSecurityEvent.count = jest.fn().mockRejectedValue(new Error('DB error'));

      await expect(
        auditService.checkFailedLoginThreshold('127.0.0.1')
      ).resolves.toBeUndefined();
    });
  });

  describe('getRecentSecurityEvents', () => {
    it('returns a list of recent security events', async () => {
      const events = [{ id: '1' }, { id: '2' }];
      mockSecurityEvent.findAll = jest.fn().mockResolvedValue(events);

      const result = await auditService.getRecentSecurityEvents(50);

      expect(result).toEqual(events);
      expect(mockSecurityEvent.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 50 })
      );
    });
  });

  describe('getUnresolvedSecurityEvents', () => {
    it('returns only unresolved security events', async () => {
      const events = [{ id: '1', resolved: false }];
      mockSecurityEvent.findAll = jest.fn().mockResolvedValue(events);

      const result = await auditService.getUnresolvedSecurityEvents();

      expect(result).toEqual(events);
      expect(mockSecurityEvent.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ where: { resolved: false } })
      );
    });
  });
});

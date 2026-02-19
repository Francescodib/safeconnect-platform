import nodemailer from 'nodemailer';
import config from '../config';
import logger from '../config/logger';

interface AlertEmailData {
  eventId: string;
  type: string;
  severity: string;
  ip: string;
  details: string;
  timestamp: Date;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initTransporter();
  }

  private initTransporter(): void {
    if (!config.email.host || !config.email.user) {
      logger.info('Email service not configured, alerts will be logged only');
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: config.email.host,
        port: config.email.port,
        secure: config.email.port === 465,
        auth: {
          user: config.email.user,
          pass: config.email.password,
        },
      });

      logger.info('Email transporter initialized', {
        host: config.email.host,
        port: config.email.port,
      });
    } catch (error) {
      logger.error('Failed to initialize email transporter', { error });
    }
  }

  async sendSecurityAlert(data: AlertEmailData): Promise<boolean> {
    const alertEmail = config.monitoring.alertEmail;

    if (!this.transporter) {
      logger.warn('Security alert (email not configured)', {
        eventId: data.eventId,
        type: data.type,
        severity: data.severity,
        ip: data.ip,
        alertEmail,
      });
      return false;
    }

    const subject = `[${data.severity.toUpperCase()}] Security Alert - ${data.type}`;

    const html = `
      <h2>Security Alert - SafeConnect Solutions</h2>
      <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Event ID</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${data.eventId}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Type</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${data.type}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Severity</td>
          <td style="padding: 8px; border: 1px solid #ddd; color: ${data.severity === 'critical' ? '#dc3545' : '#fd7e14'};">
            ${data.severity.toUpperCase()}
          </td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Source IP</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${data.ip}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Details</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${data.details}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Timestamp</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${data.timestamp.toISOString()}</td>
        </tr>
      </table>
      <p style="margin-top: 16px; color: #666;">
        This is an automated alert from SafeConnect Solutions security monitoring.
        Review the admin dashboard for more details.
      </p>
    `;

    try {
      await this.transporter.sendMail({
        from: config.email.from,
        to: alertEmail,
        subject,
        html,
      });

      logger.info('Security alert email sent', {
        eventId: data.eventId,
        to: alertEmail,
      });
      return true;
    } catch (error) {
      logger.error('Failed to send security alert email', {
        error,
        eventId: data.eventId,
      });
      return false;
    }
  }
}

export default new EmailService();

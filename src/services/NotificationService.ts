import nodemailer from 'nodemailer';
import axios from 'axios';
import { Alert, AlertSeverity, AlertStatus } from '@/types';
import { config } from '@/config/config';
import logger from '@/utils/logger';

export class NotificationService {
  private static instance: NotificationService;
  private emailTransporter: nodemailer.Transporter | null = null;

  private constructor() {
    this.initializeEmailTransporter();
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Initialize email transporter
   */
  private initializeEmailTransporter(): void {
    if (config.alerts.email.enabled && config.alerts.email.smtp.host) {
      try {
        this.emailTransporter = nodemailer.createTransport({
          host: config.alerts.email.smtp.host,
          port: config.alerts.email.smtp.port,
          secure: false,
          auth: {
            user: config.alerts.email.smtp.user,
            pass: config.alerts.email.smtp.pass,
          },
        });

        logger.info('Email transporter initialized', {
          host: config.alerts.email.smtp.host,
          port: config.alerts.email.smtp.port,
        });
      } catch (error) {
        logger.error('Error initializing email transporter', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  }

  /**
   * Send alert notification
   */
  public async sendAlertNotification(alert: Alert): Promise<void> {
    try {
      const channels = this.getNotificationChannels(alert.severity);
      
      const notificationPromises = channels.map(channel => {
        switch (channel) {
          case 'email':
            return this.sendEmailNotification(alert);
          case 'slack':
            return this.sendSlackNotification(alert);
          case 'pagerduty':
            return this.sendPagerDutyNotification(alert);
          default:
            logger.warn('Unknown notification channel', { channel });
            return Promise.resolve();
        }
      });

      await Promise.allSettled(notificationPromises);

      logger.info('Alert notification sent', {
        alertId: alert.id,
        serviceName: alert.serviceName,
        severity: alert.severity,
        channels,
      });
    } catch (error) {
      logger.error('Error sending alert notification', {
        alertId: alert.id,
        serviceName: alert.serviceName,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get notification channels based on alert severity
   */
  private getNotificationChannels(severity: AlertSeverity): string[] {
    const channels: string[] = [];

    if (config.alerts.email.enabled) {
      channels.push('email');
    }

    if (config.alerts.slack.enabled && severity === AlertSeverity.CRITICAL) {
      channels.push('slack');
    }

    if (config.alerts.pagerduty.enabled && severity === AlertSeverity.CRITICAL) {
      channels.push('pagerduty');
    }

    return channels;
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(alert: Alert): Promise<void> {
    if (!this.emailTransporter || !config.alerts.email.enabled) {
      logger.warn('Email notifications are disabled or not configured');
      return;
    }

    try {
      const subject = `[${alert.severity}] ${alert.title}`;
      const html = this.generateEmailTemplate(alert);

      await this.emailTransporter.sendMail({
        from: config.alerts.email.from,
        to: config.alerts.email.to,
        subject,
        html,
      });

      logger.info('Email notification sent', {
        alertId: alert.id,
        to: config.alerts.email.to,
        subject,
      });
    } catch (error) {
      logger.error('Error sending email notification', {
        alertId: alert.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Send Slack notification
   */
  private async sendSlackNotification(alert: Alert): Promise<void> {
    if (!config.alerts.slack.enabled || !config.alerts.slack.webhookUrl) {
      logger.warn('Slack notifications are disabled or not configured');
      return;
    }

    try {
      const color = this.getSeverityColor(alert.severity);
      const payload = {
        text: `🚨 Alert: ${alert.title}`,
        attachments: [
          {
            color,
            fields: [
              {
                title: 'Service',
                value: alert.serviceName,
                short: true,
              },
              {
                title: 'Severity',
                value: alert.severity,
                short: true,
              },
              {
                title: 'Alert Type',
                value: alert.alertType,
                short: true,
              },
              {
                title: 'Description',
                value: alert.description,
                short: false,
              },
              {
                title: 'Timestamp',
                value: new Date().toISOString(),
                short: true,
              },
            ],
          },
        ],
      };

      await axios.post(config.alerts.slack.webhookUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      logger.info('Slack notification sent', {
        alertId: alert.id,
        severity: alert.severity,
      });
    } catch (error) {
      logger.error('Error sending Slack notification', {
        alertId: alert.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Send PagerDuty notification
   */
  private async sendPagerDutyNotification(alert: Alert): Promise<void> {
    if (!config.alerts.pagerduty.enabled || !config.alerts.pagerduty.integrationKey) {
      logger.warn('PagerDuty notifications are disabled or not configured');
      return;
    }

    try {
      const payload = {
        routing_key: config.alerts.pagerduty.integrationKey,
        event_action: 'trigger',
        dedup_key: `${alert.serviceName}-${alert.alertType}`,
        payload: {
          summary: alert.title,
          source: alert.serviceName,
          severity: this.mapSeverityToPagerDuty(alert.severity),
          custom_details: {
            description: alert.description,
            alertType: alert.alertType,
            value: alert.value,
            threshold: alert.threshold,
            labels: alert.labels,
          },
        },
      };

      await axios.post('https://events.pagerduty.com/v2/enqueue', payload, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      logger.info('PagerDuty notification sent', {
        alertId: alert.id,
        severity: alert.severity,
      });
    } catch (error) {
      logger.error('Error sending PagerDuty notification', {
        alertId: alert.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Generate email template
   */
  private generateEmailTemplate(alert: Alert): string {
    const severityColor = this.getSeverityColor(alert.severity);
    const timestamp = new Date().toISOString();

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .header { background-color: ${severityColor}; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { padding: 20px; }
          .alert-details { background-color: #f8f9fa; padding: 15px; border-radius: 4px; margin: 15px 0; }
          .detail-row { display: flex; margin: 8px 0; }
          .detail-label { font-weight: bold; width: 120px; }
          .detail-value { flex: 1; }
          .footer { padding: 20px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚨 ${alert.title}</h1>
            <p>Service: ${alert.serviceName} | Severity: ${alert.severity}</p>
          </div>
          <div class="content">
            <p>${alert.description}</p>
            <div class="alert-details">
              <div class="detail-row">
                <div class="detail-label">Alert Type:</div>
                <div class="detail-value">${alert.alertType}</div>
              </div>
              <div class="detail-row">
                <div class="detail-label">Service:</div>
                <div class="detail-value">${alert.serviceName}</div>
              </div>
              <div class="detail-row">
                <div class="detail-label">Severity:</div>
                <div class="detail-value">${alert.severity}</div>
              </div>
              ${alert.value ? `
              <div class="detail-row">
                <div class="detail-label">Current Value:</div>
                <div class="detail-value">${alert.value}</div>
              </div>
              ` : ''}
              ${alert.threshold ? `
              <div class="detail-row">
                <div class="detail-label">Threshold:</div>
                <div class="detail-value">${alert.threshold}</div>
              </div>
              ` : ''}
              <div class="detail-row">
                <div class="detail-label">Timestamp:</div>
                <div class="detail-value">${timestamp}</div>
              </div>
            </div>
          </div>
          <div class="footer">
            <p>This alert was generated by ${config.server.serviceName} monitoring system.</p>
            <p>Please investigate and resolve this issue as soon as possible.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Get severity color for UI
   */
  private getSeverityColor(severity: AlertSeverity): string {
    switch (severity) {
      case AlertSeverity.CRITICAL:
        return '#dc3545'; // Red
      case AlertSeverity.HIGH:
        return '#fd7e14'; // Orange
      case AlertSeverity.MEDIUM:
        return '#ffc107'; // Yellow
      case AlertSeverity.LOW:
        return '#28a745'; // Green
      default:
        return '#6c757d'; // Gray
    }
  }

  /**
   * Map severity to PagerDuty severity
   */
  private mapSeverityToPagerDuty(severity: AlertSeverity): string {
    switch (severity) {
      case AlertSeverity.CRITICAL:
        return 'critical';
      case AlertSeverity.HIGH:
        return 'error';
      case AlertSeverity.MEDIUM:
        return 'warning';
      case AlertSeverity.LOW:
        return 'info';
      default:
        return 'info';
    }
  }

  /**
   * Send test notification
   */
  public async sendTestNotification(channel: 'email' | 'slack' | 'pagerduty'): Promise<void> {
    const testAlert: Alert = {
      id: 'test-alert',
      serviceName: config.server.serviceName,
      alertType: 'test_alert',
      severity: AlertSeverity.LOW,
      status: AlertStatus.ACTIVE,
      title: 'Test Alert',
      description: 'This is a test alert to verify notification configuration.',
      value: 100,
      threshold: 90,
      labels: {
        test: true,
        timestamp: new Date().toISOString(),
      },
    };

    try {
      switch (channel) {
        case 'email':
          await this.sendEmailNotification(testAlert);
          break;
        case 'slack':
          await this.sendSlackNotification(testAlert);
          break;
        case 'pagerduty':
          await this.sendPagerDutyNotification(testAlert);
          break;
        default:
          throw new Error(`Unknown notification channel: ${channel}`);
      }

      logger.info('Test notification sent successfully', { channel });
    } catch (error) {
      logger.error('Error sending test notification', {
        channel,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get notification service status
   */
  public getServiceStatus(): {
    emailEnabled: boolean;
    slackEnabled: boolean;
    pagerdutyEnabled: boolean;
  } {
    return {
      emailEnabled: config.alerts.email.enabled && this.emailTransporter !== null,
      slackEnabled: config.alerts.slack.enabled && !!config.alerts.slack.webhookUrl,
      pagerdutyEnabled: config.alerts.pagerduty.enabled && !!config.alerts.pagerduty.integrationKey,
    };
  }
}

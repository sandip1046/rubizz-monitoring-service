"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const axios_1 = __importDefault(require("axios"));
const types_1 = require("@/types");
const config_1 = require("@/config/config");
const logger_1 = __importDefault(require("@/utils/logger"));
class NotificationService {
    constructor() {
        this.emailTransporter = null;
        this.initializeEmailTransporter();
    }
    static getInstance() {
        if (!NotificationService.instance) {
            NotificationService.instance = new NotificationService();
        }
        return NotificationService.instance;
    }
    initializeEmailTransporter() {
        if (config_1.config.alerts.email.enabled && config_1.config.alerts.email.smtp.host) {
            try {
                this.emailTransporter = nodemailer_1.default.createTransport({
                    host: config_1.config.alerts.email.smtp.host,
                    port: config_1.config.alerts.email.smtp.port,
                    secure: false,
                    auth: {
                        user: config_1.config.alerts.email.smtp.user,
                        pass: config_1.config.alerts.email.smtp.pass,
                    },
                });
                logger_1.default.info('Email transporter initialized', {
                    host: config_1.config.alerts.email.smtp.host,
                    port: config_1.config.alerts.email.smtp.port,
                });
            }
            catch (error) {
                logger_1.default.error('Error initializing email transporter', {
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }
    }
    async sendAlertNotification(alert) {
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
                        logger_1.default.warn('Unknown notification channel', { channel });
                        return Promise.resolve();
                }
            });
            await Promise.allSettled(notificationPromises);
            logger_1.default.info('Alert notification sent', {
                alertId: alert.id,
                serviceName: alert.serviceName,
                severity: alert.severity,
                channels,
            });
        }
        catch (error) {
            logger_1.default.error('Error sending alert notification', {
                alertId: alert.id,
                serviceName: alert.serviceName,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    getNotificationChannels(severity) {
        const channels = [];
        if (config_1.config.alerts.email.enabled) {
            channels.push('email');
        }
        if (config_1.config.alerts.slack.enabled && severity === types_1.AlertSeverity.CRITICAL) {
            channels.push('slack');
        }
        if (config_1.config.alerts.pagerduty.enabled && severity === types_1.AlertSeverity.CRITICAL) {
            channels.push('pagerduty');
        }
        return channels;
    }
    async sendEmailNotification(alert) {
        if (!this.emailTransporter || !config_1.config.alerts.email.enabled) {
            logger_1.default.warn('Email notifications are disabled or not configured');
            return;
        }
        try {
            const subject = `[${alert.severity}] ${alert.title}`;
            const html = this.generateEmailTemplate(alert);
            await this.emailTransporter.sendMail({
                from: config_1.config.alerts.email.from,
                to: config_1.config.alerts.email.to,
                subject,
                html,
            });
            logger_1.default.info('Email notification sent', {
                alertId: alert.id,
                to: config_1.config.alerts.email.to,
                subject,
            });
        }
        catch (error) {
            logger_1.default.error('Error sending email notification', {
                alertId: alert.id,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    async sendSlackNotification(alert) {
        if (!config_1.config.alerts.slack.enabled || !config_1.config.alerts.slack.webhookUrl) {
            logger_1.default.warn('Slack notifications are disabled or not configured');
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
            await axios_1.default.post(config_1.config.alerts.slack.webhookUrl, payload, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            logger_1.default.info('Slack notification sent', {
                alertId: alert.id,
                severity: alert.severity,
            });
        }
        catch (error) {
            logger_1.default.error('Error sending Slack notification', {
                alertId: alert.id,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    async sendPagerDutyNotification(alert) {
        if (!config_1.config.alerts.pagerduty.enabled || !config_1.config.alerts.pagerduty.integrationKey) {
            logger_1.default.warn('PagerDuty notifications are disabled or not configured');
            return;
        }
        try {
            const payload = {
                routing_key: config_1.config.alerts.pagerduty.integrationKey,
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
            await axios_1.default.post('https://events.pagerduty.com/v2/enqueue', payload, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            logger_1.default.info('PagerDuty notification sent', {
                alertId: alert.id,
                severity: alert.severity,
            });
        }
        catch (error) {
            logger_1.default.error('Error sending PagerDuty notification', {
                alertId: alert.id,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    generateEmailTemplate(alert) {
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
            <p>This alert was generated by ${config_1.config.server.serviceName} monitoring system.</p>
            <p>Please investigate and resolve this issue as soon as possible.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    }
    getSeverityColor(severity) {
        switch (severity) {
            case types_1.AlertSeverity.CRITICAL:
                return '#dc3545';
            case types_1.AlertSeverity.HIGH:
                return '#fd7e14';
            case types_1.AlertSeverity.MEDIUM:
                return '#ffc107';
            case types_1.AlertSeverity.LOW:
                return '#28a745';
            default:
                return '#6c757d';
        }
    }
    mapSeverityToPagerDuty(severity) {
        switch (severity) {
            case types_1.AlertSeverity.CRITICAL:
                return 'critical';
            case types_1.AlertSeverity.HIGH:
                return 'error';
            case types_1.AlertSeverity.MEDIUM:
                return 'warning';
            case types_1.AlertSeverity.LOW:
                return 'info';
            default:
                return 'info';
        }
    }
    async sendTestNotification(channel) {
        const testAlert = {
            id: 'test-alert',
            serviceName: config_1.config.server.serviceName,
            alertType: 'test_alert',
            severity: types_1.AlertSeverity.LOW,
            status: types_1.AlertStatus.ACTIVE,
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
            logger_1.default.info('Test notification sent successfully', { channel });
        }
        catch (error) {
            logger_1.default.error('Error sending test notification', {
                channel,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    getServiceStatus() {
        return {
            emailEnabled: config_1.config.alerts.email.enabled && this.emailTransporter !== null,
            slackEnabled: config_1.config.alerts.slack.enabled && !!config_1.config.alerts.slack.webhookUrl,
            pagerdutyEnabled: config_1.config.alerts.pagerduty.enabled && !!config_1.config.alerts.pagerduty.integrationKey,
        };
    }
}
exports.NotificationService = NotificationService;
//# sourceMappingURL=NotificationService.js.map
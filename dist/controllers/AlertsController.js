"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlertsController = void 0;
const AlertService_1 = require("@/services/AlertService");
const NotificationService_1 = require("@/services/NotificationService");
const logger_1 = __importDefault(require("@/utils/logger"));
const types_1 = require("@/types");
class AlertsController {
    constructor() {
        this.alertService = AlertService_1.AlertService.getInstance();
        this.notificationService = NotificationService_1.NotificationService.getInstance();
    }
    async getActiveAlerts(req, res) {
        try {
            const { limit = '100', offset = '0' } = req.query;
            const requestId = req.headers['x-request-id'] || 'unknown';
            const limitNumber = parseInt(limit, 10);
            const offsetNumber = parseInt(offset, 10);
            if (isNaN(limitNumber) || limitNumber < 1 || limitNumber > 1000) {
                res.status(400).json({
                    success: false,
                    error: 'Limit must be a number between 1 and 1000',
                    timestamp: new Date(),
                    requestId,
                });
                return;
            }
            if (isNaN(offsetNumber) || offsetNumber < 0) {
                res.status(400).json({
                    success: false,
                    error: 'Offset must be a non-negative number',
                    timestamp: new Date(),
                    requestId,
                });
                return;
            }
            const alerts = await this.alertService.getActiveAlerts(limitNumber, offsetNumber);
            const response = {
                success: true,
                data: alerts,
                timestamp: new Date(),
                requestId,
            };
            res.json(response);
            logger_1.default.info('Active alerts retrieved', {
                requestId,
                count: alerts.length,
                limit: limitNumber,
                offset: offsetNumber,
            });
        }
        catch (error) {
            logger_1.default.error('Error getting active alerts', {
                error: error instanceof Error ? error.message : 'Unknown error',
                query: req.query,
            });
            const errorResponse = {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date(),
                requestId: req.headers['x-request-id'] || 'unknown',
            };
            res.status(500).json(errorResponse);
        }
    }
    async getCriticalAlerts(req, res) {
        try {
            const { limit = '50' } = req.query;
            const requestId = req.headers['x-request-id'] || 'unknown';
            const limitNumber = parseInt(limit, 10);
            if (isNaN(limitNumber) || limitNumber < 1 || limitNumber > 100) {
                res.status(400).json({
                    success: false,
                    error: 'Limit must be a number between 1 and 100',
                    timestamp: new Date(),
                    requestId,
                });
                return;
            }
            const alerts = await this.alertService.getCriticalAlerts(limitNumber);
            const response = {
                success: true,
                data: alerts,
                timestamp: new Date(),
                requestId,
            };
            res.json(response);
            logger_1.default.info('Critical alerts retrieved', {
                requestId,
                count: alerts.length,
                limit: limitNumber,
            });
        }
        catch (error) {
            logger_1.default.error('Error getting critical alerts', {
                error: error instanceof Error ? error.message : 'Unknown error',
                query: req.query,
            });
            const errorResponse = {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date(),
                requestId: req.headers['x-request-id'] || 'unknown',
            };
            res.status(500).json(errorResponse);
        }
    }
    async getAlertsByService(req, res) {
        try {
            const { serviceName } = req.params;
            const { status, limit = '100', offset = '0' } = req.query;
            const requestId = req.headers['x-request-id'] || 'unknown';
            if (!serviceName) {
                res.status(400).json({
                    success: false,
                    error: 'Service name is required',
                    timestamp: new Date(),
                    requestId,
                });
                return;
            }
            const limitNumber = parseInt(limit, 10);
            const offsetNumber = parseInt(offset, 10);
            if (isNaN(limitNumber) || limitNumber < 1 || limitNumber > 1000) {
                res.status(400).json({
                    success: false,
                    error: 'Limit must be a number between 1 and 1000',
                    timestamp: new Date(),
                    requestId,
                });
                return;
            }
            if (isNaN(offsetNumber) || offsetNumber < 0) {
                res.status(400).json({
                    success: false,
                    error: 'Offset must be a non-negative number',
                    timestamp: new Date(),
                    requestId,
                });
                return;
            }
            let alertStatus;
            if (status) {
                const validStatuses = ['ACTIVE', 'RESOLVED', 'ACKNOWLEDGED', 'SUPPRESSED'];
                if (!validStatuses.includes(status)) {
                    res.status(400).json({
                        success: false,
                        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
                        timestamp: new Date(),
                        requestId,
                    });
                    return;
                }
                alertStatus = status;
            }
            const alerts = await this.alertService.getAlertsByService(serviceName, alertStatus, limitNumber, offsetNumber);
            const response = {
                success: true,
                data: alerts,
                timestamp: new Date(),
                requestId,
            };
            res.json(response);
            logger_1.default.info('Alerts by service retrieved', {
                requestId,
                serviceName,
                status,
                count: alerts.length,
                limit: limitNumber,
                offset: offsetNumber,
            });
        }
        catch (error) {
            logger_1.default.error('Error getting alerts by service', {
                serviceName: req.params.serviceName,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            const errorResponse = {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date(),
                requestId: req.headers['x-request-id'] || 'unknown',
            };
            res.status(500).json(errorResponse);
        }
    }
    async getAlertsSummary(req, res) {
        try {
            const { serviceName } = req.query;
            const requestId = req.headers['x-request-id'] || 'unknown';
            const summary = await this.alertService.getAlertsSummary(serviceName);
            const response = {
                success: true,
                data: summary,
                timestamp: new Date(),
                requestId,
            };
            res.json(response);
            logger_1.default.info('Alerts summary retrieved', {
                requestId,
                serviceName,
                total: summary.total,
                active: summary.active,
                critical: summary.critical,
            });
        }
        catch (error) {
            logger_1.default.error('Error getting alerts summary', {
                serviceName: req.query.serviceName,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            const errorResponse = {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date(),
                requestId: req.headers['x-request-id'] || 'unknown',
            };
            res.status(500).json(errorResponse);
        }
    }
    async getAlertTrends(req, res) {
        try {
            const { startTime, endTime, serviceName, groupBy = 'day', } = req.query;
            const requestId = req.headers['x-request-id'] || 'unknown';
            if (!startTime || !endTime) {
                res.status(400).json({
                    success: false,
                    error: 'startTime and endTime are required',
                    timestamp: new Date(),
                    requestId,
                });
                return;
            }
            const start = new Date(startTime);
            const end = new Date(endTime);
            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid startTime or endTime format',
                    timestamp: new Date(),
                    requestId,
                });
                return;
            }
            const validGroupBy = ['hour', 'day', 'week'];
            if (!validGroupBy.includes(groupBy)) {
                res.status(400).json({
                    success: false,
                    error: `Invalid groupBy. Must be one of: ${validGroupBy.join(', ')}`,
                    timestamp: new Date(),
                    requestId,
                });
                return;
            }
            const trends = await this.alertService.getAlertTrends(start, end, serviceName, groupBy);
            const response = {
                success: true,
                data: trends,
                timestamp: new Date(),
                requestId,
            };
            res.json(response);
            logger_1.default.info('Alert trends retrieved', {
                requestId,
                startTime: start.toISOString(),
                endTime: end.toISOString(),
                serviceName,
                groupBy,
                count: trends.length,
            });
        }
        catch (error) {
            logger_1.default.error('Error getting alert trends', {
                error: error instanceof Error ? error.message : 'Unknown error',
                query: req.query,
            });
            const errorResponse = {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date(),
                requestId: req.headers['x-request-id'] || 'unknown',
            };
            res.status(500).json(errorResponse);
        }
    }
    async createAlert(req, res) {
        try {
            const { serviceName, alertType, severity, title, description, value, threshold, labels, } = req.body;
            const requestId = req.headers['x-request-id'] || 'unknown';
            if (!serviceName || !alertType || !severity || !title || !description) {
                res.status(400).json({
                    success: false,
                    error: 'Service name, alert type, severity, title, and description are required',
                    timestamp: new Date(),
                    requestId,
                });
                return;
            }
            const validSeverities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
            if (!validSeverities.includes(severity)) {
                res.status(400).json({
                    success: false,
                    error: `Invalid severity. Must be one of: ${validSeverities.join(', ')}`,
                    timestamp: new Date(),
                    requestId,
                });
                return;
            }
            const alert = await this.alertService.createAlert({
                serviceName,
                alertType,
                severity: severity,
                status: types_1.AlertStatus.ACTIVE,
                title,
                description,
                value,
                threshold,
                labels,
            });
            const response = {
                success: true,
                message: 'Alert created successfully',
                data: alert,
                timestamp: new Date(),
                requestId,
            };
            res.status(201).json(response);
            logger_1.default.info('Alert created', {
                requestId,
                alertId: alert.id,
                serviceName,
                alertType,
                severity,
            });
        }
        catch (error) {
            logger_1.default.error('Error creating alert', {
                error: error instanceof Error ? error.message : 'Unknown error',
                body: req.body,
            });
            const errorResponse = {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date(),
                requestId: req.headers['x-request-id'] || 'unknown',
            };
            res.status(500).json(errorResponse);
        }
    }
    async acknowledgeAlert(req, res) {
        try {
            const { alertId } = req.params;
            const { acknowledgedBy } = req.body;
            const requestId = req.headers['x-request-id'] || 'unknown';
            if (!alertId) {
                res.status(400).json({
                    success: false,
                    error: 'Alert ID is required',
                    timestamp: new Date(),
                    requestId,
                });
                return;
            }
            if (!acknowledgedBy) {
                res.status(400).json({
                    success: false,
                    error: 'Acknowledged by is required',
                    timestamp: new Date(),
                    requestId,
                });
                return;
            }
            const alert = await this.alertService.acknowledgeAlert(alertId, acknowledgedBy);
            const response = {
                success: true,
                message: 'Alert acknowledged successfully',
                data: alert,
                timestamp: new Date(),
                requestId,
            };
            res.json(response);
            logger_1.default.info('Alert acknowledged', {
                requestId,
                alertId,
                acknowledgedBy,
                serviceName: alert.serviceName,
            });
        }
        catch (error) {
            logger_1.default.error('Error acknowledging alert', {
                alertId: req.params.alertId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            const errorResponse = {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date(),
                requestId: req.headers['x-request-id'] || 'unknown',
            };
            res.status(500).json(errorResponse);
        }
    }
    async resolveAlert(req, res) {
        try {
            const { alertId } = req.params;
            const { resolvedBy } = req.body;
            const requestId = req.headers['x-request-id'] || 'unknown';
            if (!alertId) {
                res.status(400).json({
                    success: false,
                    error: 'Alert ID is required',
                    timestamp: new Date(),
                    requestId,
                });
                return;
            }
            const alert = await this.alertService.resolveAlert(alertId, resolvedBy);
            const response = {
                success: true,
                message: 'Alert resolved successfully',
                data: alert,
                timestamp: new Date(),
                requestId,
            };
            res.json(response);
            logger_1.default.info('Alert resolved', {
                requestId,
                alertId,
                resolvedBy,
                serviceName: alert.serviceName,
            });
        }
        catch (error) {
            logger_1.default.error('Error resolving alert', {
                alertId: req.params.alertId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            const errorResponse = {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date(),
                requestId: req.headers['x-request-id'] || 'unknown',
            };
            res.status(500).json(errorResponse);
        }
    }
    async getAlertById(req, res) {
        try {
            const { alertId } = req.params;
            const requestId = req.headers['x-request-id'] || 'unknown';
            if (!alertId) {
                res.status(400).json({
                    success: false,
                    error: 'Alert ID is required',
                    timestamp: new Date(),
                    requestId,
                });
                return;
            }
            const response = {
                success: false,
                error: 'Get alert by ID not implemented yet',
                timestamp: new Date(),
                requestId,
            };
            res.status(501).json(response);
        }
        catch (error) {
            logger_1.default.error('Error getting alert by ID', {
                alertId: req.params.alertId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            const errorResponse = {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date(),
                requestId: req.headers['x-request-id'] || 'unknown',
            };
            res.status(500).json(errorResponse);
        }
    }
    async sendTestNotification(req, res) {
        try {
            const { channel } = req.body;
            const requestId = req.headers['x-request-id'] || 'unknown';
            if (!channel) {
                res.status(400).json({
                    success: false,
                    error: 'Channel is required',
                    timestamp: new Date(),
                    requestId,
                });
                return;
            }
            const validChannels = ['email', 'slack', 'pagerduty'];
            if (!validChannels.includes(channel)) {
                res.status(400).json({
                    success: false,
                    error: `Invalid channel. Must be one of: ${validChannels.join(', ')}`,
                    timestamp: new Date(),
                    requestId,
                });
                return;
            }
            await this.notificationService.sendTestNotification(channel);
            const response = {
                success: true,
                message: `Test notification sent via ${channel}`,
                timestamp: new Date(),
                requestId,
            };
            res.json(response);
            logger_1.default.info('Test notification sent', {
                requestId,
                channel,
            });
        }
        catch (error) {
            logger_1.default.error('Error sending test notification', {
                channel: req.body.channel,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            const errorResponse = {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date(),
                requestId: req.headers['x-request-id'] || 'unknown',
            };
            res.status(500).json(errorResponse);
        }
    }
    async getNotificationStatus(req, res) {
        try {
            const requestId = req.headers['x-request-id'] || 'unknown';
            const status = this.notificationService.getServiceStatus();
            const response = {
                success: true,
                data: status,
                timestamp: new Date(),
                requestId,
            };
            res.json(response);
            logger_1.default.info('Notification status retrieved', {
                requestId,
                status,
            });
        }
        catch (error) {
            logger_1.default.error('Error getting notification status', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            const errorResponse = {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date(),
                requestId: req.headers['x-request-id'] || 'unknown',
            };
            res.status(500).json(errorResponse);
        }
    }
    async startAlertService(req, res) {
        try {
            const requestId = req.headers['x-request-id'] || 'unknown';
            await this.alertService.start();
            const response = {
                success: true,
                message: 'Alert service started successfully',
                data: this.alertService.getServiceStatus(),
                timestamp: new Date(),
                requestId,
            };
            res.json(response);
            logger_1.default.info('Alert service started', {
                requestId,
                status: this.alertService.getServiceStatus(),
            });
        }
        catch (error) {
            logger_1.default.error('Error starting alert service', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            const errorResponse = {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date(),
                requestId: req.headers['x-request-id'] || 'unknown',
            };
            res.status(500).json(errorResponse);
        }
    }
    async stopAlertService(req, res) {
        try {
            const requestId = req.headers['x-request-id'] || 'unknown';
            await this.alertService.stop();
            const response = {
                success: true,
                message: 'Alert service stopped successfully',
                data: this.alertService.getServiceStatus(),
                timestamp: new Date(),
                requestId,
            };
            res.json(response);
            logger_1.default.info('Alert service stopped', {
                requestId,
                status: this.alertService.getServiceStatus(),
            });
        }
        catch (error) {
            logger_1.default.error('Error stopping alert service', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            const errorResponse = {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date(),
                requestId: req.headers['x-request-id'] || 'unknown',
            };
            res.status(500).json(errorResponse);
        }
    }
}
exports.AlertsController = AlertsController;
//# sourceMappingURL=AlertsController.js.map
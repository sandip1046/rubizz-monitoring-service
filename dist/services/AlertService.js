"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlertService = void 0;
const AlertModel_1 = require("@/models/AlertModel");
const SystemMetricsModel_1 = require("@/models/SystemMetricsModel");
const PerformanceMetricsModel_1 = require("@/models/PerformanceMetricsModel");
const ServiceHealthModel_1 = require("@/models/ServiceHealthModel");
const types_1 = require("@/types");
const config_1 = require("@/config/config");
const logger_1 = __importDefault(require("@/utils/logger"));
const NotificationService_1 = require("./NotificationService");
class AlertService {
    constructor() {
        this.isRunning = false;
        this.intervalId = null;
        this.notificationService = NotificationService_1.NotificationService.getInstance();
    }
    static getInstance() {
        if (!AlertService.instance) {
            AlertService.instance = new AlertService();
        }
        return AlertService.instance;
    }
    async start() {
        if (this.isRunning) {
            logger_1.default.warn('Alert service is already running');
            return;
        }
        this.isRunning = true;
        logger_1.default.info('Starting alert service', {
            interval: 60000,
        });
        await this.checkAlerts();
        this.intervalId = setInterval(async () => {
            try {
                await this.checkAlerts();
            }
            catch (error) {
                logger_1.default.error('Error during alert checks', {
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }, 60000);
    }
    async stop() {
        if (!this.isRunning) {
            logger_1.default.warn('Alert service is not running');
            return;
        }
        this.isRunning = false;
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        logger_1.default.info('Alert service stopped');
    }
    async checkAlerts() {
        try {
            await this.checkServiceHealthAlerts();
            await this.checkSystemMetricsAlerts();
            await this.checkPerformanceMetricsAlerts();
            logger_1.default.debug('Alert checks completed');
        }
        catch (error) {
            logger_1.default.error('Error during alert checks', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    async checkServiceHealthAlerts() {
        try {
            const unhealthyServices = await ServiceHealthModel_1.ServiceHealthModel.findByStatus(types_1.ServiceStatus.UNHEALTHY);
            const degradedServices = await ServiceHealthModel_1.ServiceHealthModel.findByStatus(types_1.ServiceStatus.DEGRADED);
            for (const service of unhealthyServices) {
                const existingAlert = await this.findExistingAlert(service.serviceName, 'service_unhealthy', types_1.AlertStatus.ACTIVE);
                if (!existingAlert) {
                    await this.createAlert({
                        serviceName: service.serviceName,
                        alertType: 'service_unhealthy',
                        severity: types_1.AlertSeverity.CRITICAL,
                        status: types_1.AlertStatus.ACTIVE,
                        title: `Service ${service.serviceName} is unhealthy`,
                        description: `Service ${service.serviceName} is currently unhealthy. Last error: ${service.errorMessage || 'Unknown error'}`,
                        value: service.responseTime || 0,
                        threshold: config_1.config.monitoring.alertThresholds.responseTime,
                        labels: {
                            serviceUrl: service.serviceUrl,
                            lastChecked: service.lastChecked?.toISOString() || new Date().toISOString(),
                            errorMessage: service.errorMessage,
                        },
                    });
                }
            }
            for (const service of degradedServices) {
                const existingAlert = await this.findExistingAlert(service.serviceName, 'service_degraded', types_1.AlertStatus.ACTIVE);
                if (!existingAlert) {
                    await this.createAlert({
                        serviceName: service.serviceName,
                        alertType: 'service_degraded',
                        severity: types_1.AlertSeverity.HIGH,
                        status: types_1.AlertStatus.ACTIVE,
                        title: `Service ${service.serviceName} is degraded`,
                        description: `Service ${service.serviceName} is currently degraded but still responding.`,
                        value: service.responseTime || 0,
                        threshold: config_1.config.monitoring.alertThresholds.responseTime,
                        labels: {
                            serviceUrl: service.serviceUrl,
                            lastChecked: service.lastChecked?.toISOString() || new Date().toISOString(),
                        },
                    });
                }
            }
        }
        catch (error) {
            logger_1.default.error('Error checking service health alerts', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    async checkSystemMetricsAlerts() {
        try {
            const serviceName = config_1.config.server.serviceName;
            const now = new Date();
            const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
            const cpuMetric = await SystemMetricsModel_1.SystemMetricsModel.getLatestMetric(serviceName, 'cpu.usage');
            if (cpuMetric && cpuMetric.value > config_1.config.monitoring.alertThresholds.cpu) {
                await this.checkMetricAlert(serviceName, 'cpu_high', 'CPU usage is high', `CPU usage is ${cpuMetric.value.toFixed(2)}%, which exceeds the threshold of ${config_1.config.monitoring.alertThresholds.cpu}%`, cpuMetric.value, config_1.config.monitoring.alertThresholds.cpu, types_1.AlertSeverity.HIGH);
            }
            const memoryMetric = await SystemMetricsModel_1.SystemMetricsModel.getLatestMetric(serviceName, 'memory.usage.percentage');
            if (memoryMetric && memoryMetric.value > config_1.config.monitoring.alertThresholds.memory) {
                await this.checkMetricAlert(serviceName, 'memory_high', 'Memory usage is high', `Memory usage is ${memoryMetric.value.toFixed(2)}%, which exceeds the threshold of ${config_1.config.monitoring.alertThresholds.memory}%`, memoryMetric.value, config_1.config.monitoring.alertThresholds.memory, types_1.AlertSeverity.HIGH);
            }
            const responseTimeMetrics = await SystemMetricsModel_1.SystemMetricsModel.findByTimeRange(fiveMinutesAgo, now, serviceName, 'response_time', 100);
            if (responseTimeMetrics.length > 0) {
                const avgResponseTime = responseTimeMetrics.reduce((sum, m) => sum + m.value, 0) / responseTimeMetrics.length;
                if (avgResponseTime > config_1.config.monitoring.alertThresholds.responseTime) {
                    await this.checkMetricAlert(serviceName, 'response_time_high', 'Response time is high', `Average response time is ${avgResponseTime.toFixed(2)}ms, which exceeds the threshold of ${config_1.config.monitoring.alertThresholds.responseTime}ms`, avgResponseTime, config_1.config.monitoring.alertThresholds.responseTime, types_1.AlertSeverity.MEDIUM);
                }
            }
        }
        catch (error) {
            logger_1.default.error('Error checking system metrics alerts', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    async checkPerformanceMetricsAlerts() {
        try {
            const serviceName = config_1.config.server.serviceName;
            const now = new Date();
            const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
            const performanceSummary = await PerformanceMetricsModel_1.PerformanceMetricsModel.getPerformanceSummary(serviceName, fiveMinutesAgo, now);
            if (performanceSummary.errorRate > 10) {
                await this.checkMetricAlert(serviceName, 'error_rate_high', 'Error rate is high', `Error rate is ${performanceSummary.errorRate.toFixed(2)}%, which exceeds the threshold of 10%`, performanceSummary.errorRate, 10, types_1.AlertSeverity.HIGH);
            }
            if (performanceSummary.averageResponseTime > config_1.config.monitoring.alertThresholds.responseTime) {
                await this.checkMetricAlert(serviceName, 'performance_response_time_high', 'Performance response time is high', `Average response time is ${performanceSummary.averageResponseTime.toFixed(2)}ms, which exceeds the threshold of ${config_1.config.monitoring.alertThresholds.responseTime}ms`, performanceSummary.averageResponseTime, config_1.config.monitoring.alertThresholds.responseTime, types_1.AlertSeverity.MEDIUM);
            }
        }
        catch (error) {
            logger_1.default.error('Error checking performance metrics alerts', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    async checkMetricAlert(serviceName, alertType, title, description, value, threshold, severity) {
        try {
            const existingAlert = await this.findExistingAlert(serviceName, alertType, types_1.AlertStatus.ACTIVE);
            if (!existingAlert) {
                await this.createAlert({
                    serviceName,
                    alertType,
                    severity,
                    status: types_1.AlertStatus.ACTIVE,
                    title,
                    description,
                    value,
                    threshold,
                    labels: {
                        metricValue: value,
                        threshold,
                        timestamp: new Date().toISOString(),
                    },
                });
            }
        }
        catch (error) {
            logger_1.default.error('Error checking metric alert', {
                serviceName,
                alertType,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    async findExistingAlert(serviceName, alertType, status) {
        try {
            const alerts = await AlertModel_1.AlertModel.findByAlertType(alertType, serviceName, status, 1);
            return alerts.length > 0 ? (alerts[0] || null) : null;
        }
        catch (error) {
            logger_1.default.error('Error finding existing alert', {
                serviceName,
                alertType,
                status,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return null;
        }
    }
    async createAlert(alertData) {
        try {
            const alert = await AlertModel_1.AlertModel.create(alertData);
            await this.notificationService.sendAlertNotification(alert);
            logger_1.default.warn('Alert created', {
                alertId: alert.id,
                serviceName: alert.serviceName,
                alertType: alert.alertType,
                severity: alert.severity,
            });
            return alert;
        }
        catch (error) {
            logger_1.default.error('Error creating alert', {
                serviceName: alertData.serviceName,
                alertType: alertData.alertType,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    async acknowledgeAlert(alertId, acknowledgedBy) {
        try {
            const alert = await AlertModel_1.AlertModel.acknowledge(alertId, acknowledgedBy);
            logger_1.default.info('Alert acknowledged', {
                alertId,
                acknowledgedBy,
                serviceName: alert.serviceName,
            });
            return alert;
        }
        catch (error) {
            logger_1.default.error('Error acknowledging alert', {
                alertId,
                acknowledgedBy,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    async resolveAlert(alertId, resolvedBy) {
        try {
            const alert = await AlertModel_1.AlertModel.resolve(alertId, resolvedBy);
            logger_1.default.info('Alert resolved', {
                alertId,
                resolvedBy,
                serviceName: alert.serviceName,
            });
            return alert;
        }
        catch (error) {
            logger_1.default.error('Error resolving alert', {
                alertId,
                resolvedBy,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    async getActiveAlerts(limit = 100, offset = 0) {
        try {
            return await AlertModel_1.AlertModel.findActive(limit, offset);
        }
        catch (error) {
            logger_1.default.error('Error getting active alerts', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    async getCriticalAlerts(limit = 50) {
        try {
            return await AlertModel_1.AlertModel.findCritical(limit);
        }
        catch (error) {
            logger_1.default.error('Error getting critical alerts', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    async getAlertsByService(serviceName, status, limit = 100, offset = 0) {
        try {
            return await AlertModel_1.AlertModel.findByService(serviceName, status, limit, offset);
        }
        catch (error) {
            logger_1.default.error('Error getting alerts by service', {
                serviceName,
                status,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    async getAlertsSummary(serviceName) {
        try {
            return await AlertModel_1.AlertModel.getAlertsSummary(serviceName);
        }
        catch (error) {
            logger_1.default.error('Error getting alerts summary', {
                serviceName,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    async getAlertTrends(startTime, endTime, serviceName, groupBy = 'day') {
        try {
            return await AlertModel_1.AlertModel.getAlertTrends(startTime, endTime, serviceName, groupBy);
        }
        catch (error) {
            logger_1.default.error('Error getting alert trends', {
                startTime,
                endTime,
                serviceName,
                groupBy,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    isAlertServiceRunning() {
        return this.isRunning;
    }
    getServiceStatus() {
        return {
            isRunning: this.isRunning,
            interval: 60000,
        };
    }
    async cleanupOldAlerts(daysToKeep = 30) {
        try {
            return await AlertModel_1.AlertModel.cleanupOldAlerts(daysToKeep);
        }
        catch (error) {
            logger_1.default.error('Error cleaning up old alerts', {
                daysToKeep,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
}
exports.AlertService = AlertService;
//# sourceMappingURL=AlertService.js.map
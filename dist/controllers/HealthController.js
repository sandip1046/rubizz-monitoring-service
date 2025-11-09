"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthController = void 0;
const HealthCheckService_1 = require("@/services/HealthCheckService");
const MetricsCollectionService_1 = require("@/services/MetricsCollectionService");
const AlertService_1 = require("@/services/AlertService");
const NotificationService_1 = require("@/services/NotificationService");
const connection_1 = require("@/database/connection");
const RedisService_1 = require("@/services/RedisService");
const config_1 = require("@/config/config");
const logger_1 = __importDefault(require("@/utils/logger"));
const types_1 = require("@/types");
class HealthController {
    constructor() {
        this.healthCheckService = HealthCheckService_1.HealthCheckService.getInstance();
        this.metricsCollectionService = MetricsCollectionService_1.MetricsCollectionService.getInstance();
        this.alertService = AlertService_1.AlertService.getInstance();
        this.notificationService = NotificationService_1.NotificationService.getInstance();
        this.redisService = new RedisService_1.RedisService();
    }
    async getHealth(req, res) {
        try {
            const startTime = Date.now();
            const requestId = req.headers['x-request-id'] || 'unknown';
            const databaseConnected = await (0, connection_1.databaseHealthCheck)();
            const databaseResponseTime = Date.now() - startTime;
            const redisHealthCheck = await this.redisService.healthCheck();
            const redisConnected = redisHealthCheck.session && redisHealthCheck.cache && redisHealthCheck.queue;
            const redisResponseTime = Date.now() - startTime;
            const healthCheckStatus = this.healthCheckService.getServiceStatus();
            const metricsStatus = this.metricsCollectionService.getServiceStatus();
            const alertStatus = this.alertService.getServiceStatus();
            const notificationStatus = this.notificationService.getServiceStatus();
            const isHealthy = databaseConnected && redisConnected &&
                healthCheckStatus.isRunning && metricsStatus.isRunning;
            const response = {
                status: isHealthy ? types_1.ServiceStatus.HEALTHY : types_1.ServiceStatus.UNHEALTHY,
                serviceName: config_1.config.server.serviceName,
                timestamp: new Date(),
                responseTime: Date.now() - startTime,
                details: {
                    version: config_1.config.server.serviceVersion,
                    uptime: process.uptime(),
                    memory: {
                        used: process.memoryUsage().heapUsed,
                        total: process.memoryUsage().heapTotal,
                        percentage: (process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100,
                    },
                    cpu: {
                        usage: 0,
                        load: require('os').loadavg(),
                    },
                    database: {
                        connected: databaseConnected,
                        responseTime: databaseResponseTime,
                    },
                    redis: {
                        connected: redisConnected,
                        responseTime: redisResponseTime,
                    },
                },
            };
            response.checks = {
                database: databaseConnected,
                redis: redisConnected,
                externalServices: true,
            };
            response.services = {
                healthCheck: healthCheckStatus,
                metricsCollection: metricsStatus,
                alert: alertStatus,
                notification: notificationStatus,
            };
            const statusCode = isHealthy ? 200 : 503;
            res.status(statusCode).json(response);
            logger_1.default.info('Health check completed', {
                requestId,
                status: response.status,
                responseTime: response.responseTime,
                databaseConnected,
                redisConnected,
            });
        }
        catch (error) {
            logger_1.default.error('Error in health check', {
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined,
            });
            const errorResponse = {
                status: types_1.ServiceStatus.UNHEALTHY,
                serviceName: config_1.config.server.serviceName,
                timestamp: new Date(),
                responseTime: 0,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
            res.status(503).json(errorResponse);
        }
    }
    async getDetailedHealth(req, res) {
        try {
            const requestId = req.headers['x-request-id'] || 'unknown';
            const startTime = Date.now();
            const allServicesHealth = await this.healthCheckService.getAllServicesHealth();
            const systemMetrics = await this.metricsCollectionService.getMetricsSummary(config_1.config.server.serviceName, 1);
            const activeAlerts = await this.alertService.getActiveAlerts(10);
            const alertsSummary = await this.alertService.getAlertsSummary();
            const response = {
                success: true,
                data: {
                    service: {
                        name: config_1.config.server.serviceName,
                        version: config_1.config.server.serviceVersion,
                        uptime: process.uptime(),
                        memory: process.memoryUsage(),
                        cpu: require('os').loadavg(),
                    },
                    services: allServicesHealth,
                    metrics: systemMetrics,
                    alerts: {
                        active: activeAlerts,
                        summary: alertsSummary,
                    },
                    timestamp: new Date(),
                },
                timestamp: new Date(),
                requestId,
            };
            res.json(response);
            logger_1.default.info('Detailed health check completed', {
                requestId,
                responseTime: Date.now() - startTime,
                servicesCount: allServicesHealth.length,
                activeAlertsCount: activeAlerts.length,
            });
        }
        catch (error) {
            logger_1.default.error('Error in detailed health check', {
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined,
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
    async getServiceHealth(req, res) {
        try {
            const { serviceName } = req.params;
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
            const serviceHealth = await this.healthCheckService.getServiceHealth(serviceName);
            if (!serviceHealth) {
                res.status(404).json({
                    success: false,
                    error: 'Service not found',
                    timestamp: new Date(),
                    requestId,
                });
                return;
            }
            const response = {
                success: true,
                data: serviceHealth,
                timestamp: new Date(),
                requestId,
            };
            res.json(response);
            logger_1.default.info('Service health retrieved', {
                requestId,
                serviceName,
                status: serviceHealth.status,
            });
        }
        catch (error) {
            logger_1.default.error('Error getting service health', {
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
    async getServiceHealthSummary(req, res) {
        try {
            const { serviceName } = req.params;
            const { hours = '24' } = req.query;
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
            const hoursNumber = parseInt(hours, 10);
            if (isNaN(hoursNumber) || hoursNumber < 1 || hoursNumber > 168) {
                res.status(400).json({
                    success: false,
                    error: 'Hours must be a number between 1 and 168',
                    timestamp: new Date(),
                    requestId,
                });
                return;
            }
            const summary = await this.healthCheckService.getServiceHealthSummary(serviceName, hoursNumber);
            const response = {
                success: true,
                data: summary,
                timestamp: new Date(),
                requestId,
            };
            res.json(response);
            logger_1.default.info('Service health summary retrieved', {
                requestId,
                serviceName,
                hours: hoursNumber,
                totalChecks: summary.totalChecks,
                uptime: summary.uptime,
            });
        }
        catch (error) {
            logger_1.default.error('Error getting service health summary', {
                serviceName: req.params.serviceName,
                hours: req.query.hours,
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
    async getServicesByStatus(req, res) {
        try {
            const { status } = req.params;
            const requestId = req.headers['x-request-id'] || 'unknown';
            if (!status) {
                res.status(400).json({
                    success: false,
                    error: 'Status is required',
                    timestamp: new Date(),
                    requestId,
                });
                return;
            }
            const validStatuses = ['HEALTHY', 'UNHEALTHY', 'DEGRADED', 'UNKNOWN', 'MAINTENANCE'];
            if (!validStatuses.includes(status.toUpperCase())) {
                res.status(400).json({
                    success: false,
                    error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
                    timestamp: new Date(),
                    requestId,
                });
                return;
            }
            const services = await this.healthCheckService.getServicesByStatus(status.toUpperCase());
            const response = {
                success: true,
                data: services,
                timestamp: new Date(),
                requestId,
            };
            res.json(response);
            logger_1.default.info('Services by status retrieved', {
                requestId,
                status,
                count: services.length,
            });
        }
        catch (error) {
            logger_1.default.error('Error getting services by status', {
                status: req.params.status,
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
    async checkCustomServiceHealth(req, res) {
        try {
            const { serviceName, serviceUrl, timeout = '10000' } = req.body;
            const requestId = req.headers['x-request-id'] || 'unknown';
            if (!serviceName || !serviceUrl) {
                res.status(400).json({
                    success: false,
                    error: 'Service name and URL are required',
                    timestamp: new Date(),
                    requestId,
                });
                return;
            }
            const timeoutNumber = parseInt(timeout, 10);
            if (isNaN(timeoutNumber) || timeoutNumber < 1000 || timeoutNumber > 30000) {
                res.status(400).json({
                    success: false,
                    error: 'Timeout must be a number between 1000 and 30000 milliseconds',
                    timestamp: new Date(),
                    requestId,
                });
                return;
            }
            const healthRecord = await this.healthCheckService.checkCustomServiceHealth(serviceName, serviceUrl, timeoutNumber);
            const response = {
                success: true,
                data: healthRecord,
                timestamp: new Date(),
                requestId,
            };
            res.json(response);
            logger_1.default.info('Custom service health check completed', {
                requestId,
                serviceName,
                serviceUrl,
                status: healthRecord.status,
                responseTime: healthRecord.responseTime,
            });
        }
        catch (error) {
            logger_1.default.error('Error checking custom service health', {
                serviceName: req.body.serviceName,
                serviceUrl: req.body.serviceUrl,
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
    async startHealthCheckService(req, res) {
        try {
            const requestId = req.headers['x-request-id'] || 'unknown';
            await this.healthCheckService.start();
            const response = {
                success: true,
                message: 'Health check service started successfully',
                data: this.healthCheckService.getServiceStatus(),
                timestamp: new Date(),
                requestId,
            };
            res.json(response);
            logger_1.default.info('Health check service started', {
                requestId,
                status: this.healthCheckService.getServiceStatus(),
            });
        }
        catch (error) {
            logger_1.default.error('Error starting health check service', {
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
    async stopHealthCheckService(req, res) {
        try {
            const requestId = req.headers['x-request-id'] || 'unknown';
            await this.healthCheckService.stop();
            const response = {
                success: true,
                message: 'Health check service stopped successfully',
                data: this.healthCheckService.getServiceStatus(),
                timestamp: new Date(),
                requestId,
            };
            res.json(response);
            logger_1.default.info('Health check service stopped', {
                requestId,
                status: this.healthCheckService.getServiceStatus(),
            });
        }
        catch (error) {
            logger_1.default.error('Error stopping health check service', {
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
exports.HealthController = HealthController;
//# sourceMappingURL=HealthController.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthCheckService = void 0;
const axios_1 = __importDefault(require("axios"));
const ServiceHealthModel_1 = require("@/models/ServiceHealthModel");
const types_1 = require("@/types");
const config_1 = require("@/config/config");
const logger_1 = __importDefault(require("@/utils/logger"));
class HealthCheckService {
    constructor() {
        this.isRunning = false;
        this.intervalId = null;
    }
    static getInstance() {
        if (!HealthCheckService.instance) {
            HealthCheckService.instance = new HealthCheckService();
        }
        return HealthCheckService.instance;
    }
    async start() {
        if (this.isRunning) {
            logger_1.default.warn('Health check service is already running');
            return;
        }
        this.isRunning = true;
        logger_1.default.info('Starting health check service', {
            interval: config_1.config.monitoring.healthCheckInterval,
            services: config_1.DEFAULT_SERVICES.length,
        });
        await this.runHealthChecks();
        this.intervalId = setInterval(async () => {
            try {
                await this.runHealthChecks();
            }
            catch (error) {
                logger_1.default.error('Error during periodic health checks', {
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }, config_1.config.monitoring.healthCheckInterval);
    }
    async stop() {
        if (!this.isRunning) {
            logger_1.default.warn('Health check service is not running');
            return;
        }
        this.isRunning = false;
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        logger_1.default.info('Health check service stopped');
    }
    async runHealthChecks() {
        const healthChecks = config_1.DEFAULT_SERVICES.map(service => this.checkServiceHealth(service));
        const results = await Promise.allSettled(healthChecks);
        const successful = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;
        logger_1.default.info('Health checks completed', {
            total: config_1.DEFAULT_SERVICES.length,
            successful,
            failed,
        });
    }
    async checkServiceHealth(service) {
        const startTime = Date.now();
        let status = types_1.ServiceStatus.UNKNOWN;
        let responseTime = null;
        let errorMessage = null;
        let metadata = {};
        try {
            const response = await axios_1.default.get(service.url, {
                timeout: 10000,
                headers: {
                    'User-Agent': `${config_1.config.server.serviceName}/${config_1.config.server.serviceVersion}`,
                },
            });
            responseTime = Date.now() - startTime;
            status = this.mapStatusToServiceStatus(response.data.status);
            metadata = {
                statusCode: response.status,
                version: response.data.details?.version,
                uptime: response.data.details?.uptime,
                memory: response.data.details?.memory,
                cpu: response.data.details?.cpu,
                database: response.data.details?.database,
                redis: response.data.details?.redis,
                checks: response.data.details?.checks,
            };
            logger_1.default.debug('Service health check successful', {
                serviceName: service.name,
                status,
                responseTime,
                statusCode: response.status,
            });
        }
        catch (error) {
            responseTime = Date.now() - startTime;
            status = types_1.ServiceStatus.UNHEALTHY;
            errorMessage = error instanceof Error ? error.message : 'Unknown error';
            metadata = {
                error: errorMessage,
                isTimeout: error instanceof Error && error.message.includes('timeout'),
                isNetworkError: error instanceof Error && error.message.includes('Network Error'),
            };
            logger_1.default.warn('Service health check failed', {
                serviceName: service.name,
                status,
                responseTime,
                error: errorMessage,
            });
        }
        const healthRecord = await ServiceHealthModel_1.ServiceHealthModel.create({
            serviceName: service.name,
            serviceUrl: service.url,
            status,
            responseTime,
            errorMessage: errorMessage || undefined,
            metadata,
        });
        return healthRecord;
    }
    async checkCustomServiceHealth(serviceName, serviceUrl, timeout = 10000) {
        const startTime = Date.now();
        let status = types_1.ServiceStatus.UNKNOWN;
        let responseTime = null;
        let errorMessage = null;
        let metadata = {};
        try {
            const response = await axios_1.default.get(serviceUrl, {
                timeout,
                headers: {
                    'User-Agent': `${config_1.config.server.serviceName}/${config_1.config.server.serviceVersion}`,
                },
            });
            responseTime = Date.now() - startTime;
            status = this.mapStatusToServiceStatus(response.data.status);
            metadata = {
                statusCode: response.status,
                version: response.data.details?.version,
                uptime: response.data.details?.uptime,
                memory: response.data.details?.memory,
                cpu: response.data.details?.cpu,
                database: response.data.details?.database,
                redis: response.data.details?.redis,
                checks: response.data.details?.checks,
            };
            logger_1.default.debug('Custom service health check successful', {
                serviceName,
                status,
                responseTime,
                statusCode: response.status,
            });
        }
        catch (error) {
            responseTime = Date.now() - startTime;
            status = types_1.ServiceStatus.UNHEALTHY;
            errorMessage = error instanceof Error ? error.message : 'Unknown error';
            metadata = {
                error: errorMessage,
                isTimeout: error instanceof Error && error.message.includes('timeout'),
                isNetworkError: error instanceof Error && error.message.includes('Network Error'),
            };
            logger_1.default.warn('Custom service health check failed', {
                serviceName,
                status,
                responseTime,
                error: errorMessage,
            });
        }
        const healthRecord = await ServiceHealthModel_1.ServiceHealthModel.create({
            serviceName,
            serviceUrl,
            status,
            responseTime,
            errorMessage: errorMessage || undefined,
            metadata,
        });
        return healthRecord;
    }
    async getAllServicesHealth() {
        try {
            return await ServiceHealthModel_1.ServiceHealthModel.getAllServicesHealth();
        }
        catch (error) {
            logger_1.default.error('Error getting all services health', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    async getServiceHealth(serviceName) {
        try {
            return await ServiceHealthModel_1.ServiceHealthModel.findLatestByService(serviceName);
        }
        catch (error) {
            logger_1.default.error('Error getting service health', {
                serviceName,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    async getServiceHealthSummary(serviceName, hours = 24) {
        try {
            return await ServiceHealthModel_1.ServiceHealthModel.getHealthSummary(serviceName, hours);
        }
        catch (error) {
            logger_1.default.error('Error getting service health summary', {
                serviceName,
                hours,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    async getServicesByStatus(status) {
        try {
            return await ServiceHealthModel_1.ServiceHealthModel.findByStatus(status);
        }
        catch (error) {
            logger_1.default.error('Error getting services by status', {
                status,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    mapStatusToServiceStatus(status) {
        switch (status.toLowerCase()) {
            case 'healthy':
                return types_1.ServiceStatus.HEALTHY;
            case 'unhealthy':
                return types_1.ServiceStatus.UNHEALTHY;
            case 'degraded':
                return types_1.ServiceStatus.DEGRADED;
            case 'maintenance':
                return types_1.ServiceStatus.MAINTENANCE;
            default:
                return types_1.ServiceStatus.UNKNOWN;
        }
    }
    isHealthCheckRunning() {
        return this.isRunning;
    }
    getServiceStatus() {
        return {
            isRunning: this.isRunning,
            interval: config_1.config.monitoring.healthCheckInterval,
            monitoredServices: config_1.DEFAULT_SERVICES.length,
        };
    }
    async cleanupOldRecords(daysToKeep = 30) {
        try {
            return await ServiceHealthModel_1.ServiceHealthModel.cleanupOldRecords(daysToKeep);
        }
        catch (error) {
            logger_1.default.error('Error cleaning up old health check records', {
                daysToKeep,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
}
exports.HealthCheckService = HealthCheckService;
//# sourceMappingURL=HealthCheckService.js.map
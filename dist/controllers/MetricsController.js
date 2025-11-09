"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricsController = void 0;
const MetricsCollectionService_1 = require("@/services/MetricsCollectionService");
const SystemMetricsModel_1 = require("@/models/SystemMetricsModel");
const PerformanceMetricsModel_1 = require("@/models/PerformanceMetricsModel");
const logger_1 = __importDefault(require("@/utils/logger"));
class MetricsController {
    constructor() {
        this.metricsCollectionService = MetricsCollectionService_1.MetricsCollectionService.getInstance();
    }
    async getSystemMetrics(req, res) {
        try {
            const { serviceName, metricName, startTime, endTime, aggregation, groupBy, limit = '100', offset = '0', } = req.query;
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
            let metrics;
            let totalCount = 0;
            if (startTime && endTime) {
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
                metrics = await SystemMetricsModel_1.SystemMetricsModel.findByTimeRange(start, end, serviceName, metricName, limitNumber, offsetNumber);
                const allMetrics = await SystemMetricsModel_1.SystemMetricsModel.findByTimeRange(start, end, serviceName, metricName, 10000, 0);
                totalCount = allMetrics.length;
            }
            else if (serviceName) {
                metrics = await SystemMetricsModel_1.SystemMetricsModel.findByService(serviceName, undefined, undefined, undefined, limitNumber);
                metrics = metrics.slice(offsetNumber);
                totalCount = await SystemMetricsModel_1.SystemMetricsModel.getMetricsCountByService(serviceName);
            }
            else if (metricName) {
                metrics = await SystemMetricsModel_1.SystemMetricsModel.findByMetricName(metricName, serviceName, undefined, undefined, limitNumber);
                metrics = metrics.slice(offsetNumber);
                totalCount = metrics.length;
            }
            else {
                res.status(400).json({
                    success: false,
                    error: 'At least one of serviceName, metricName, or time range must be provided',
                    timestamp: new Date(),
                    requestId,
                });
                return;
            }
            let aggregatedValue;
            if (aggregation && metrics.length > 0) {
                const values = metrics.map((m) => m.value);
                switch (aggregation) {
                    case 'avg':
                        aggregatedValue = values.reduce((sum, val) => sum + val, 0) / values.length;
                        break;
                    case 'sum':
                        aggregatedValue = values.reduce((sum, val) => sum + val, 0);
                        break;
                    case 'min':
                        aggregatedValue = Math.min(...values);
                        break;
                    case 'max':
                        aggregatedValue = Math.max(...values);
                        break;
                    case 'count':
                        aggregatedValue = values.length;
                        break;
                }
            }
            const response = {
                success: true,
                data: metrics,
                pagination: {
                    page: Math.floor(offsetNumber / limitNumber) + 1,
                    limit: limitNumber,
                    total: totalCount,
                    totalPages: Math.ceil(totalCount / limitNumber),
                    hasNext: offsetNumber + limitNumber < totalCount,
                    hasPrev: offsetNumber > 0,
                },
                timestamp: new Date(),
                requestId,
            };
            if (aggregatedValue !== undefined) {
                response.aggregation = {
                    type: aggregation,
                    value: aggregatedValue,
                };
            }
            res.json(response);
            logger_1.default.info('System metrics retrieved', {
                requestId,
                serviceName,
                metricName,
                count: metrics.length,
                aggregation,
            });
        }
        catch (error) {
            logger_1.default.error('Error getting system metrics', {
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
    async getPerformanceMetrics(req, res) {
        try {
            const { serviceName, endpoint, method, startTime, endTime, limit = '100', offset = '0', } = req.query;
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
            let metrics;
            if (startTime && endTime) {
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
                metrics = await PerformanceMetricsModel_1.PerformanceMetricsModel.findByTimeRange(start, end, serviceName, endpoint, limitNumber, offsetNumber);
            }
            else if (serviceName) {
                metrics = await PerformanceMetricsModel_1.PerformanceMetricsModel.findByService(serviceName, undefined, undefined, undefined, limitNumber);
                metrics = metrics.slice(offsetNumber);
            }
            else if (endpoint) {
                metrics = await PerformanceMetricsModel_1.PerformanceMetricsModel.findByEndpoint(serviceName, endpoint, undefined, undefined, limitNumber);
                metrics = metrics.slice(offsetNumber);
            }
            else {
                res.status(400).json({
                    success: false,
                    error: 'At least one of serviceName, endpoint, or time range must be provided',
                    timestamp: new Date(),
                    requestId,
                });
                return;
            }
            const response = {
                success: true,
                data: metrics,
                timestamp: new Date(),
                requestId,
            };
            res.json(response);
            logger_1.default.info('Performance metrics retrieved', {
                requestId,
                serviceName,
                endpoint,
                method,
                count: metrics.length,
            });
        }
        catch (error) {
            logger_1.default.error('Error getting performance metrics', {
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
    async getPerformanceSummary(req, res) {
        try {
            const { serviceName } = req.params;
            const { startTime, endTime, endpoint } = req.query;
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
            let start;
            let end;
            if (startTime && endTime) {
                start = new Date(startTime);
                end = new Date(endTime);
                if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                    res.status(400).json({
                        success: false,
                        error: 'Invalid startTime or endTime format',
                        timestamp: new Date(),
                        requestId,
                    });
                    return;
                }
            }
            else {
                end = new Date();
                start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
            }
            const summary = await this.metricsCollectionService.getPerformanceSummary(serviceName, start, end, endpoint);
            const response = {
                success: true,
                data: summary,
                timestamp: new Date(),
                requestId,
            };
            res.json(response);
            logger_1.default.info('Performance summary retrieved', {
                requestId,
                serviceName,
                startTime: start.toISOString(),
                endTime: end.toISOString(),
                totalRequests: summary.totalRequests,
                averageResponseTime: summary.averageResponseTime,
            });
        }
        catch (error) {
            logger_1.default.error('Error getting performance summary', {
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
    async getMetricsSummary(req, res) {
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
            const summary = await this.metricsCollectionService.getMetricsSummary(serviceName, hoursNumber);
            const response = {
                success: true,
                data: summary,
                timestamp: new Date(),
                requestId,
            };
            res.json(response);
            logger_1.default.info('Metrics summary retrieved', {
                requestId,
                serviceName,
                hours: hoursNumber,
                totalMetrics: summary.totalMetrics,
                uniqueMetricNames: summary.uniqueMetricNames.length,
            });
        }
        catch (error) {
            logger_1.default.error('Error getting metrics summary', {
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
    async recordCustomMetric(req, res) {
        try {
            const { serviceName, metricName, value, metricType = 'GAUGE', labels, } = req.body;
            const requestId = req.headers['x-request-id'] || 'unknown';
            if (!serviceName || !metricName || value === undefined) {
                res.status(400).json({
                    success: false,
                    error: 'Service name, metric name, and value are required',
                    timestamp: new Date(),
                    requestId,
                });
                return;
            }
            if (typeof value !== 'number' || isNaN(value)) {
                res.status(400).json({
                    success: false,
                    error: 'Value must be a valid number',
                    timestamp: new Date(),
                    requestId,
                });
                return;
            }
            const validMetricTypes = ['COUNTER', 'GAUGE', 'HISTOGRAM', 'SUMMARY'];
            if (!validMetricTypes.includes(metricType)) {
                res.status(400).json({
                    success: false,
                    error: `Invalid metric type. Must be one of: ${validMetricTypes.join(', ')}`,
                    timestamp: new Date(),
                    requestId,
                });
                return;
            }
            await this.metricsCollectionService.recordCustomMetric(serviceName, metricName, value, metricType, labels);
            const response = {
                success: true,
                message: 'Custom metric recorded successfully',
                data: {
                    serviceName,
                    metricName,
                    value,
                    metricType,
                    labels,
                    timestamp: new Date(),
                },
                timestamp: new Date(),
                requestId,
            };
            res.json(response);
            logger_1.default.info('Custom metric recorded', {
                requestId,
                serviceName,
                metricName,
                value,
                metricType,
            });
        }
        catch (error) {
            logger_1.default.error('Error recording custom metric', {
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
    async getSlowestEndpoints(req, res) {
        try {
            const { serviceName } = req.params;
            const { startTime, endTime, limit = '10' } = req.query;
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
            let start;
            let end;
            if (startTime && endTime) {
                start = new Date(startTime);
                end = new Date(endTime);
                if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                    res.status(400).json({
                        success: false,
                        error: 'Invalid startTime or endTime format',
                        timestamp: new Date(),
                        requestId,
                    });
                    return;
                }
            }
            else {
                end = new Date();
                start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
            }
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
            const slowestEndpoints = await PerformanceMetricsModel_1.PerformanceMetricsModel.getSlowestEndpoints(serviceName, limitNumber, start, end);
            const response = {
                success: true,
                data: slowestEndpoints,
                timestamp: new Date(),
                requestId,
            };
            res.json(response);
            logger_1.default.info('Slowest endpoints retrieved', {
                requestId,
                serviceName,
                startTime: start.toISOString(),
                endTime: end.toISOString(),
                count: slowestEndpoints.length,
            });
        }
        catch (error) {
            logger_1.default.error('Error getting slowest endpoints', {
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
    async getErrorRateByEndpoint(req, res) {
        try {
            const { serviceName } = req.params;
            const { startTime, endTime } = req.query;
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
            let start;
            let end;
            if (startTime && endTime) {
                start = new Date(startTime);
                end = new Date(endTime);
                if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                    res.status(400).json({
                        success: false,
                        error: 'Invalid startTime or endTime format',
                        timestamp: new Date(),
                        requestId,
                    });
                    return;
                }
            }
            else {
                end = new Date();
                start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
            }
            const errorRates = await PerformanceMetricsModel_1.PerformanceMetricsModel.getErrorRateByEndpoint(serviceName, start, end);
            const response = {
                success: true,
                data: errorRates,
                timestamp: new Date(),
                requestId,
            };
            res.json(response);
            logger_1.default.info('Error rates by endpoint retrieved', {
                requestId,
                serviceName,
                startTime: start.toISOString(),
                endTime: end.toISOString(),
                count: errorRates.length,
            });
        }
        catch (error) {
            logger_1.default.error('Error getting error rates by endpoint', {
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
    async startMetricsCollection(req, res) {
        try {
            const requestId = req.headers['x-request-id'] || 'unknown';
            await this.metricsCollectionService.start();
            const response = {
                success: true,
                message: 'Metrics collection service started successfully',
                data: this.metricsCollectionService.getServiceStatus(),
                timestamp: new Date(),
                requestId,
            };
            res.json(response);
            logger_1.default.info('Metrics collection service started', {
                requestId,
                status: this.metricsCollectionService.getServiceStatus(),
            });
        }
        catch (error) {
            logger_1.default.error('Error starting metrics collection service', {
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
    async stopMetricsCollection(req, res) {
        try {
            const requestId = req.headers['x-request-id'] || 'unknown';
            await this.metricsCollectionService.stop();
            const response = {
                success: true,
                message: 'Metrics collection service stopped successfully',
                data: this.metricsCollectionService.getServiceStatus(),
                timestamp: new Date(),
                requestId,
            };
            res.json(response);
            logger_1.default.info('Metrics collection service stopped', {
                requestId,
                status: this.metricsCollectionService.getServiceStatus(),
            });
        }
        catch (error) {
            logger_1.default.error('Error stopping metrics collection service', {
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
exports.MetricsController = MetricsController;
//# sourceMappingURL=MetricsController.js.map
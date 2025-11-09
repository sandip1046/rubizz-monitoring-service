"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricsCollectionService = void 0;
const os_1 = __importDefault(require("os"));
const SystemMetricsModel_1 = require("@/models/SystemMetricsModel");
const PerformanceMetricsModel_1 = require("@/models/PerformanceMetricsModel");
const types_1 = require("@/types");
const config_1 = require("@/config/config");
const logger_1 = __importDefault(require("@/utils/logger"));
class MetricsCollectionService {
    constructor() {
        this.isRunning = false;
        this.intervalId = null;
        this.performanceMetricsBuffer = [];
        this.systemMetricsBuffer = [];
        this.BUFFER_SIZE = 100;
        this.FLUSH_INTERVAL = 30000;
        setInterval(() => {
            this.flushBuffers();
        }, this.FLUSH_INTERVAL);
    }
    static getInstance() {
        if (!MetricsCollectionService.instance) {
            MetricsCollectionService.instance = new MetricsCollectionService();
        }
        return MetricsCollectionService.instance;
    }
    async start() {
        if (this.isRunning) {
            logger_1.default.warn('Metrics collection service is already running');
            return;
        }
        this.isRunning = true;
        logger_1.default.info('Starting metrics collection service', {
            interval: config_1.config.monitoring.metricsCollectionInterval,
            bufferSize: this.BUFFER_SIZE,
        });
        await this.collectSystemMetrics();
        this.intervalId = setInterval(async () => {
            try {
                await this.collectSystemMetrics();
            }
            catch (error) {
                logger_1.default.error('Error during periodic metrics collection', {
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }, config_1.config.monitoring.metricsCollectionInterval);
    }
    async stop() {
        if (!this.isRunning) {
            logger_1.default.warn('Metrics collection service is not running');
            return;
        }
        this.isRunning = false;
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        await this.flushBuffers();
        logger_1.default.info('Metrics collection service stopped');
    }
    async collectSystemMetrics() {
        try {
            const serviceName = config_1.config.server.serviceName;
            const timestamp = new Date();
            const cpuUsage = await this.getCpuUsage();
            const loadAverage = os_1.default.loadavg();
            const totalMemory = os_1.default.totalmem();
            const freeMemory = os_1.default.freemem();
            const usedMemory = totalMemory - freeMemory;
            const memoryUsagePercentage = (usedMemory / totalMemory) * 100;
            const processMemory = process.memoryUsage();
            const processUptime = process.uptime();
            const networkInterfaces = os_1.default.networkInterfaces();
            let networkIn = 0;
            let networkOut = 0;
            Object.values(networkInterfaces).forEach(interfaces => {
                interfaces?.forEach(iface => {
                    if (iface.internal)
                        return;
                    networkIn += 0;
                    networkOut += 0;
                });
            });
            const systemMetrics = [
                {
                    serviceName,
                    metricName: 'cpu.usage',
                    metricType: types_1.MetricType.GAUGE,
                    value: cpuUsage,
                    timestamp,
                },
                {
                    serviceName,
                    metricName: 'cpu.load.1m',
                    metricType: types_1.MetricType.GAUGE,
                    value: loadAverage[0] || 0,
                    timestamp,
                },
                {
                    serviceName,
                    metricName: 'cpu.load.5m',
                    metricType: types_1.MetricType.GAUGE,
                    value: loadAverage[1] || 0,
                    timestamp,
                },
                {
                    serviceName,
                    metricName: 'cpu.load.15m',
                    metricType: types_1.MetricType.GAUGE,
                    value: loadAverage[2] || 0,
                    timestamp,
                },
                {
                    serviceName,
                    metricName: 'memory.total',
                    metricType: types_1.MetricType.GAUGE,
                    value: totalMemory,
                    timestamp,
                },
                {
                    serviceName,
                    metricName: 'memory.used',
                    metricType: types_1.MetricType.GAUGE,
                    value: usedMemory,
                    timestamp,
                },
                {
                    serviceName,
                    metricName: 'memory.free',
                    metricType: types_1.MetricType.GAUGE,
                    value: freeMemory,
                    timestamp,
                },
                {
                    serviceName,
                    metricName: 'memory.usage.percentage',
                    metricType: types_1.MetricType.GAUGE,
                    value: memoryUsagePercentage,
                    timestamp,
                },
                {
                    serviceName,
                    metricName: 'process.memory.rss',
                    metricType: types_1.MetricType.GAUGE,
                    value: processMemory.rss,
                    timestamp,
                },
                {
                    serviceName,
                    metricName: 'process.memory.heapUsed',
                    metricType: types_1.MetricType.GAUGE,
                    value: processMemory.heapUsed,
                    timestamp,
                },
                {
                    serviceName,
                    metricName: 'process.memory.heapTotal',
                    metricType: types_1.MetricType.GAUGE,
                    value: processMemory.heapTotal,
                    timestamp,
                },
                {
                    serviceName,
                    metricName: 'process.memory.external',
                    metricType: types_1.MetricType.GAUGE,
                    value: processMemory.external,
                    timestamp,
                },
                {
                    serviceName,
                    metricName: 'process.uptime',
                    metricType: types_1.MetricType.GAUGE,
                    value: processUptime,
                    timestamp,
                },
                {
                    serviceName,
                    metricName: 'network.in',
                    metricType: types_1.MetricType.COUNTER,
                    value: networkIn,
                    timestamp,
                },
                {
                    serviceName,
                    metricName: 'network.out',
                    metricType: types_1.MetricType.COUNTER,
                    value: networkOut,
                    timestamp,
                },
            ];
            this.systemMetricsBuffer.push(...systemMetrics);
            if (this.systemMetricsBuffer.length >= this.BUFFER_SIZE) {
                await this.flushSystemMetrics();
            }
            logger_1.default.debug('System metrics collected', {
                serviceName,
                metricsCount: systemMetrics.length,
                bufferSize: this.systemMetricsBuffer.length,
            });
        }
        catch (error) {
            logger_1.default.error('Error collecting system metrics', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    async recordPerformanceMetric(metric) {
        try {
            this.performanceMetricsBuffer.push(metric);
            if (this.performanceMetricsBuffer.length >= this.BUFFER_SIZE) {
                await this.flushPerformanceMetrics();
            }
            logger_1.default.debug('Performance metric recorded', {
                serviceName: metric.serviceName,
                endpoint: metric.endpoint,
                method: metric.method,
                responseTime: metric.responseTime,
                statusCode: metric.statusCode,
            });
        }
        catch (error) {
            logger_1.default.error('Error recording performance metric', {
                serviceName: metric.serviceName,
                endpoint: metric.endpoint,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    async recordCustomMetric(serviceName, metricName, value, metricType = types_1.MetricType.GAUGE, labels) {
        try {
            const metric = {
                serviceName,
                metricName,
                metricType,
                value,
                labels,
                timestamp: new Date(),
            };
            this.systemMetricsBuffer.push(metric);
            if (this.systemMetricsBuffer.length >= this.BUFFER_SIZE) {
                await this.flushSystemMetrics();
            }
            logger_1.default.debug('Custom metric recorded', {
                serviceName,
                metricName,
                value,
                metricType,
            });
        }
        catch (error) {
            logger_1.default.error('Error recording custom metric', {
                serviceName,
                metricName,
                value,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    async flushSystemMetrics() {
        if (this.systemMetricsBuffer.length === 0)
            return;
        try {
            const metricsToFlush = [...this.systemMetricsBuffer];
            this.systemMetricsBuffer = [];
            await SystemMetricsModel_1.SystemMetricsModel.createMany(metricsToFlush);
            logger_1.default.debug('System metrics flushed to database', {
                count: metricsToFlush.length,
            });
        }
        catch (error) {
            logger_1.default.error('Error flushing system metrics', {
                count: this.systemMetricsBuffer.length,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            this.systemMetricsBuffer.unshift(...this.systemMetricsBuffer);
        }
    }
    async flushPerformanceMetrics() {
        if (this.performanceMetricsBuffer.length === 0)
            return;
        try {
            const metricsToFlush = [...this.performanceMetricsBuffer];
            this.performanceMetricsBuffer = [];
            await PerformanceMetricsModel_1.PerformanceMetricsModel.createMany(metricsToFlush);
            logger_1.default.debug('Performance metrics flushed to database', {
                count: metricsToFlush.length,
            });
        }
        catch (error) {
            logger_1.default.error('Error flushing performance metrics', {
                count: this.performanceMetricsBuffer.length,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            this.performanceMetricsBuffer.unshift(...this.performanceMetricsBuffer);
        }
    }
    async flushBuffers() {
        await Promise.all([
            this.flushSystemMetrics(),
            this.flushPerformanceMetrics(),
        ]);
    }
    async getCpuUsage() {
        return new Promise((resolve) => {
            const startMeasure = process.cpuUsage();
            const startTime = Date.now();
            setTimeout(() => {
                const endMeasure = process.cpuUsage(startMeasure);
                const endTime = Date.now();
                const userTime = endMeasure.user / 1000000;
                const systemTime = endMeasure.system / 1000000;
                const totalTime = userTime + systemTime;
                const elapsedTime = (endTime - startTime) / 1000;
                const cpuUsage = (totalTime / elapsedTime) * 100;
                resolve(Math.min(cpuUsage, 100));
            }, 100);
        });
    }
    async getMetricsSummary(serviceName, hours = 24) {
        try {
            return await SystemMetricsModel_1.SystemMetricsModel.getServiceMetricsSummary(serviceName, hours);
        }
        catch (error) {
            logger_1.default.error('Error getting metrics summary', {
                serviceName,
                hours,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    async getPerformanceSummary(serviceName, startTime, endTime, endpoint) {
        try {
            return await PerformanceMetricsModel_1.PerformanceMetricsModel.getPerformanceSummary(serviceName, startTime, endTime);
        }
        catch (error) {
            logger_1.default.error('Error getting performance summary', {
                serviceName,
                startTime,
                endTime,
                endpoint,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    isMetricsCollectionRunning() {
        return this.isRunning;
    }
    getServiceStatus() {
        return {
            isRunning: this.isRunning,
            interval: config_1.config.monitoring.metricsCollectionInterval,
            systemMetricsBufferSize: this.systemMetricsBuffer.length,
            performanceMetricsBufferSize: this.performanceMetricsBuffer.length,
        };
    }
    async cleanupOldMetrics(daysToKeep = 30) {
        try {
            const [systemMetricsDeleted, performanceMetricsDeleted] = await Promise.all([
                SystemMetricsModel_1.SystemMetricsModel.deleteOldMetrics(daysToKeep),
                PerformanceMetricsModel_1.PerformanceMetricsModel.deleteOldMetrics(daysToKeep),
            ]);
            logger_1.default.info('Old metrics cleaned up', {
                systemMetricsDeleted,
                performanceMetricsDeleted,
                daysToKeep,
            });
            return {
                systemMetricsDeleted,
                performanceMetricsDeleted,
            };
        }
        catch (error) {
            logger_1.default.error('Error cleaning up old metrics', {
                daysToKeep,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
}
exports.MetricsCollectionService = MetricsCollectionService;
//# sourceMappingURL=MetricsCollectionService.js.map
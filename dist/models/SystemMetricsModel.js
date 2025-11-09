"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemMetricsModel = void 0;
const SystemMetric_1 = require("./mongoose/SystemMetric");
const logger_1 = __importDefault(require("@/utils/logger"));
class SystemMetricsModel {
    static async create(data) {
        try {
            const metric = await SystemMetric_1.SystemMetricModel.create({
                serviceName: data.serviceName,
                metricName: data.metricName,
                metricType: data.metricType,
                value: data.value,
                labels: data.labels,
                timestamp: data.timestamp || new Date(),
            });
            return this.mapToSystemMetric(metric);
        }
        catch (error) {
            logger_1.default.error('Error creating system metric', {
                serviceName: data.serviceName,
                metricName: data.metricName,
            });
            throw error;
        }
    }
    static async createMany(metrics) {
        try {
            const docs = metrics.map(metric => ({
                serviceName: metric.serviceName,
                metricName: metric.metricName,
                metricType: metric.metricType,
                value: metric.value,
                labels: metric.labels,
                timestamp: metric.timestamp || new Date(),
            }));
            const result = await SystemMetric_1.SystemMetricModel.insertMany(docs);
            return result.length;
        }
        catch (error) {
            logger_1.default.error('Error creating multiple system metrics');
            throw error;
        }
    }
    static async findById(id) {
        try {
            const metric = await SystemMetric_1.SystemMetricModel.findById(id).lean();
            return metric ? this.mapToSystemMetric(metric) : null;
        }
        catch (error) {
            logger_1.default.error('Error finding system metric by ID', { id });
            throw error;
        }
    }
    static async findByService(serviceName, metricName, startTime, endTime, limit = 1000) {
        try {
            const query = { serviceName };
            if (metricName)
                query.metricName = metricName;
            if (startTime || endTime) {
                query.timestamp = {};
                if (startTime)
                    query.timestamp.$gte = startTime;
                if (endTime)
                    query.timestamp.$lte = endTime;
            }
            const metrics = await SystemMetric_1.SystemMetricModel.find(query)
                .sort({ timestamp: -1 })
                .limit(limit)
                .lean();
            return metrics.map(metric => this.mapToSystemMetric(metric));
        }
        catch (error) {
            logger_1.default.error('Error finding system metrics by service', { serviceName });
            throw error;
        }
    }
    static async getLatestMetric(serviceName, metricName) {
        try {
            const metric = await SystemMetric_1.SystemMetricModel.findOne({ serviceName, metricName })
                .sort({ timestamp: -1 })
                .lean();
            return metric ? this.mapToSystemMetric(metric) : null;
        }
        catch (error) {
            logger_1.default.error('Error getting latest metric', { serviceName, metricName });
            throw error;
        }
    }
    static async getAggregatedMetrics(serviceName, metricName, startTime, endTime, aggregation = 'avg') {
        try {
            const aggregationMap = {
                avg: { $avg: '$value' },
                sum: { $sum: '$value' },
                min: { $min: '$value' },
                max: { $max: '$value' }
            };
            const result = await SystemMetric_1.SystemMetricModel.aggregate([
                {
                    $match: {
                        serviceName,
                        metricName,
                        timestamp: { $gte: startTime, $lte: endTime }
                    }
                },
                {
                    $group: {
                        _id: null,
                        value: aggregationMap[aggregation]
                    }
                }
            ]);
            return result[0]?.value || 0;
        }
        catch (error) {
            logger_1.default.error('Error getting aggregated metrics', { serviceName, metricName });
            throw error;
        }
    }
    static async findByTimeRange(startTime, endTime, serviceName, metricName, limit = 1000, offset = 0) {
        const metrics = await this.findByService(serviceName || '', metricName, startTime, endTime, limit + offset);
        return metrics.slice(offset);
    }
    static async findByMetricName(metricName, serviceName, startTime, endTime, limit = 1000) {
        try {
            const query = { metricName };
            if (serviceName)
                query.serviceName = serviceName;
            if (startTime || endTime) {
                query.timestamp = {};
                if (startTime)
                    query.timestamp.$gte = startTime;
                if (endTime)
                    query.timestamp.$lte = endTime;
            }
            const metrics = await SystemMetric_1.SystemMetricModel.find(query)
                .sort({ timestamp: -1 })
                .limit(limit)
                .lean();
            return metrics.map(metric => this.mapToSystemMetric(metric));
        }
        catch (error) {
            logger_1.default.error('Error finding metrics by name', { metricName });
            throw error;
        }
    }
    static async getMetricsCountByService(serviceName) {
        try {
            return await SystemMetric_1.SystemMetricModel.countDocuments({ serviceName });
        }
        catch (error) {
            logger_1.default.error('Error getting metrics count', { serviceName });
            throw error;
        }
    }
    static async getServiceMetricsSummary(serviceName, hours = 24) {
        try {
            const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);
            const metrics = await this.findByService(serviceName, undefined, startTime, new Date());
            const summary = {
                serviceName,
                totalMetrics: metrics.length,
                metricsByType: {},
                averageValues: {}
            };
            metrics.forEach(metric => {
                if (!summary.metricsByType[metric.metricName]) {
                    summary.metricsByType[metric.metricName] = [];
                }
                summary.metricsByType[metric.metricName].push(metric.value);
            });
            Object.keys(summary.metricsByType).forEach(metricName => {
                const values = summary.metricsByType[metricName];
                summary.averageValues[metricName] = values.reduce((sum, val) => sum + val, 0) / values.length;
            });
            return summary;
        }
        catch (error) {
            logger_1.default.error('Error getting service metrics summary', { serviceName });
            throw error;
        }
    }
    static async deleteOldMetrics(daysToKeep = 30) {
        return this.cleanupOldMetrics(daysToKeep);
    }
    static async cleanupOldMetrics(daysToKeep = 30) {
        try {
            const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
            const result = await SystemMetric_1.SystemMetricModel.deleteMany({
                timestamp: { $lt: cutoffDate }
            });
            return result.deletedCount;
        }
        catch (error) {
            logger_1.default.error('Error cleaning up old metrics', { daysToKeep });
            throw error;
        }
    }
    static mapToSystemMetric(doc) {
        return {
            id: doc._id?.toString() || doc.id,
            serviceName: doc.serviceName,
            metricName: doc.metricName,
            metricType: doc.metricType,
            value: doc.value,
            labels: doc.labels,
            timestamp: doc.timestamp,
        };
    }
}
exports.SystemMetricsModel = SystemMetricsModel;
//# sourceMappingURL=SystemMetricsModel.js.map
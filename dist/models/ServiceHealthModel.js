"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceHealthModel = void 0;
const ServiceHealth_1 = require("./mongoose/ServiceHealth");
const logger_1 = __importDefault(require("@/utils/logger"));
class ServiceHealthModel {
    static async create(data) {
        try {
            const healthRecord = await ServiceHealth_1.ServiceHealthModel.create({
                serviceName: data.serviceName,
                serviceUrl: data.serviceUrl,
                status: data.status,
                responseTime: data.responseTime,
                errorMessage: data.errorMessage,
                metadata: data.metadata,
            });
            return this.mapToServiceHealth(healthRecord);
        }
        catch (error) {
            logger_1.default.error('Error creating service health record', {
                serviceName: data.serviceName,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    static async findById(id) {
        try {
            const healthRecord = await ServiceHealth_1.ServiceHealthModel.findById(id).lean();
            return healthRecord ? this.mapToServiceHealth(healthRecord) : null;
        }
        catch (error) {
            logger_1.default.error('Error finding service health by ID', { id });
            throw error;
        }
    }
    static async findLatest(serviceName) {
        try {
            const healthRecord = await ServiceHealth_1.ServiceHealthModel.findOne({ serviceName })
                .sort({ lastChecked: -1 })
                .lean();
            return healthRecord ? this.mapToServiceHealth(healthRecord) : null;
        }
        catch (error) {
            logger_1.default.error('Error finding latest service health', { serviceName });
            throw error;
        }
    }
    static async findByService(serviceName, limit = 100) {
        try {
            const records = await ServiceHealth_1.ServiceHealthModel.find({ serviceName })
                .sort({ lastChecked: -1 })
                .limit(limit)
                .lean();
            return records.map(record => this.mapToServiceHealth(record));
        }
        catch (error) {
            logger_1.default.error('Error finding service health by service', { serviceName });
            throw error;
        }
    }
    static async findByStatus(status, limit = 100) {
        try {
            const records = await ServiceHealth_1.ServiceHealthModel.find({ status })
                .sort({ lastChecked: -1 })
                .limit(limit)
                .lean();
            return records.map(record => this.mapToServiceHealth(record));
        }
        catch (error) {
            logger_1.default.error('Error finding service health by status', { status });
            throw error;
        }
    }
    static async update(id, data) {
        try {
            const healthRecord = await ServiceHealth_1.ServiceHealthModel.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true });
            if (!healthRecord)
                throw new Error('Service health record not found');
            return this.mapToServiceHealth(healthRecord);
        }
        catch (error) {
            logger_1.default.error('Error updating service health', { id });
            throw error;
        }
    }
    static async delete(id) {
        try {
            await ServiceHealth_1.ServiceHealthModel.findByIdAndDelete(id);
        }
        catch (error) {
            logger_1.default.error('Error deleting service health', { id });
            throw error;
        }
    }
    static async getServicesSummary() {
        try {
            const records = await ServiceHealth_1.ServiceHealthModel.aggregate([
                { $sort: { lastChecked: -1 } },
                { $group: { _id: '$serviceName', latest: { $first: '$$ROOT' } } }
            ]);
            const summary = {};
            records.forEach((record) => {
                summary[record._id] = this.mapToServiceHealth(record.latest);
            });
            return summary;
        }
        catch (error) {
            logger_1.default.error('Error getting services summary');
            throw error;
        }
    }
    static async cleanupOldRecords(daysToKeep = 7) {
        try {
            const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
            const result = await ServiceHealth_1.ServiceHealthModel.deleteMany({
                lastChecked: { $lt: cutoffDate }
            });
            return result.deletedCount;
        }
        catch (error) {
            logger_1.default.error('Error cleaning up old records', { daysToKeep });
            throw error;
        }
    }
    static async getAllServicesHealth() {
        try {
            const summary = await this.getServicesSummary();
            return Object.values(summary);
        }
        catch (error) {
            logger_1.default.error('Error getting all services health');
            throw error;
        }
    }
    static async findLatestByService(serviceName) {
        return this.findLatest(serviceName);
    }
    static async getHealthSummary(serviceName, hours = 24) {
        try {
            const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);
            const records = await ServiceHealth_1.ServiceHealthModel.find({
                serviceName,
                lastChecked: { $gte: startTime }
            })
                .sort({ lastChecked: -1 })
                .lean();
            if (records.length === 0) {
                return {
                    serviceName,
                    totalChecks: 0,
                    healthyCount: 0,
                    unhealthyCount: 0,
                    averageResponseTime: 0,
                    uptime: 0
                };
            }
            const healthyCount = records.filter(r => r.status === ServiceHealth_1.ServiceStatus.HEALTHY).length;
            const responseTimes = records.filter(r => r.responseTime).map(r => r.responseTime);
            return {
                serviceName,
                totalChecks: records.length,
                healthyCount,
                unhealthyCount: records.length - healthyCount,
                averageResponseTime: responseTimes.length > 0
                    ? responseTimes.reduce((sum, rt) => sum + rt, 0) / responseTimes.length
                    : 0,
                uptime: (healthyCount / records.length) * 100
            };
        }
        catch (error) {
            logger_1.default.error('Error getting health summary', { serviceName });
            throw error;
        }
    }
    static mapToServiceHealth(doc) {
        return {
            id: doc._id?.toString() || doc.id,
            serviceName: doc.serviceName,
            serviceUrl: doc.serviceUrl,
            status: doc.status,
            responseTime: doc.responseTime,
            lastChecked: doc.lastChecked,
            errorMessage: doc.errorMessage,
            metadata: doc.metadata,
        };
    }
}
exports.ServiceHealthModel = ServiceHealthModel;
//# sourceMappingURL=ServiceHealthModel.js.map
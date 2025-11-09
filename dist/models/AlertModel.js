"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlertModel = void 0;
const Alert_1 = require("./mongoose/Alert");
const logger_1 = __importDefault(require("@/utils/logger"));
class AlertModel {
    static async create(data) {
        try {
            const alert = await Alert_1.AlertModel.create({
                serviceName: data.serviceName,
                alertType: data.alertType,
                severity: data.severity,
                status: data.status || Alert_1.AlertStatus.ACTIVE,
                title: data.title,
                description: data.description,
                value: data.value,
                threshold: data.threshold,
                labels: data.labels,
                acknowledgedBy: data.acknowledgedBy,
            });
            logger_1.default.warn('Alert created', {
                alertId: alert._id?.toString() || alert.id,
                serviceName: data.serviceName,
                alertType: data.alertType,
                severity: data.severity,
                status: data.status,
            });
            return this.mapToAlert(alert);
        }
        catch (error) {
            logger_1.default.error('Error creating alert', {
                serviceName: data.serviceName,
                alertType: data.alertType,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    static async findById(id) {
        try {
            const alert = await Alert_1.AlertModel.findById(id);
            return alert ? this.mapToAlert(alert) : null;
        }
        catch (error) {
            logger_1.default.error('Error finding alert by ID', {
                id,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    static async findByService(serviceName, status, limit = 100, offset = 0) {
        try {
            const query = { serviceName };
            if (status) {
                query.status = status;
            }
            const alerts = await Alert_1.AlertModel.find(query)
                .sort({ createdAt: -1 })
                .limit(limit)
                .skip(offset)
                .lean();
            return alerts.map((alert) => this.mapToAlert(alert));
        }
        catch (error) {
            logger_1.default.error('Error finding alerts by service', {
                serviceName,
                status,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    static async findBySeverity(severity, status, limit = 100, offset = 0) {
        try {
            const query = { severity };
            if (status) {
                query.status = status;
            }
            const alerts = await Alert_1.AlertModel.find(query)
                .sort({ createdAt: -1 })
                .limit(limit)
                .skip(offset)
                .lean();
            return alerts.map((alert) => this.mapToAlert(alert));
        }
        catch (error) {
            logger_1.default.error('Error finding alerts by severity', {
                severity,
                status,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    static async findActive(limit = 100, offset = 0) {
        try {
            const alerts = await Alert_1.AlertModel.find({ status: Alert_1.AlertStatus.ACTIVE })
                .sort({ severity: -1, createdAt: -1 })
                .limit(limit)
                .skip(offset)
                .lean();
            return alerts.map((alert) => this.mapToAlert(alert));
        }
        catch (error) {
            logger_1.default.error('Error finding active alerts', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    static async findCritical(limit = 50) {
        try {
            const alerts = await Alert_1.AlertModel.find({
                severity: Alert_1.AlertSeverity.CRITICAL,
                status: Alert_1.AlertStatus.ACTIVE,
            })
                .sort({ createdAt: -1 })
                .limit(limit)
                .lean();
            return alerts.map((alert) => this.mapToAlert(alert));
        }
        catch (error) {
            logger_1.default.error('Error finding critical alerts', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    static async findByTimeRange(startTime, endTime, serviceName, severity, status, limit = 1000, offset = 0) {
        try {
            const query = {
                createdAt: {
                    $gte: startTime,
                    $lte: endTime,
                },
            };
            if (serviceName)
                query.serviceName = serviceName;
            if (severity)
                query.severity = severity;
            if (status)
                query.status = status;
            const alerts = await Alert_1.AlertModel.find(query)
                .sort({ createdAt: -1 })
                .limit(limit)
                .skip(offset)
                .lean();
            return alerts.map((alert) => this.mapToAlert(alert));
        }
        catch (error) {
            logger_1.default.error('Error finding alerts by time range', {
                startTime,
                endTime,
                serviceName,
                severity,
                status,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    static async update(id, data) {
        try {
            const updateData = { ...data };
            if (data.status === Alert_1.AlertStatus.RESOLVED) {
                updateData.resolvedAt = new Date();
            }
            if (data.status === Alert_1.AlertStatus.ACKNOWLEDGED) {
                updateData.acknowledgedAt = new Date();
            }
            const alert = await Alert_1.AlertModel.findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true });
            if (!alert) {
                throw new Error('Alert not found');
            }
            logger_1.default.debug('Alert updated', {
                alertId: id,
                status: data.status,
                severity: data.severity,
            });
            return this.mapToAlert(alert);
        }
        catch (error) {
            logger_1.default.error('Error updating alert', {
                id,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    static async acknowledge(id, acknowledgedBy) {
        try {
            const alert = await Alert_1.AlertModel.findByIdAndUpdate(id, {
                $set: {
                    status: Alert_1.AlertStatus.ACKNOWLEDGED,
                    acknowledgedAt: new Date(),
                    acknowledgedBy,
                },
            }, { new: true });
            if (!alert) {
                throw new Error('Alert not found');
            }
            logger_1.default.info('Alert acknowledged', {
                alertId: id,
                acknowledgedBy,
                serviceName: alert.serviceName,
            });
            return this.mapToAlert(alert);
        }
        catch (error) {
            logger_1.default.error('Error acknowledging alert', {
                id,
                acknowledgedBy,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    static async resolve(id, resolvedBy) {
        try {
            const alert = await Alert_1.AlertModel.findByIdAndUpdate(id, {
                $set: {
                    status: Alert_1.AlertStatus.RESOLVED,
                    resolvedAt: new Date(),
                },
            }, { new: true });
            if (!alert) {
                throw new Error('Alert not found');
            }
            logger_1.default.info('Alert resolved', {
                alertId: id,
                resolvedBy,
                serviceName: alert.serviceName,
            });
            return this.mapToAlert(alert);
        }
        catch (error) {
            logger_1.default.error('Error resolving alert', {
                id,
                resolvedBy,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    static async delete(id) {
        try {
            await Alert_1.AlertModel.findByIdAndDelete(id);
            logger_1.default.debug('Alert deleted', { id });
        }
        catch (error) {
            logger_1.default.error('Error deleting alert', {
                id,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    static async getAlertsSummary(serviceName) {
        try {
            const query = {};
            if (serviceName) {
                query.serviceName = serviceName;
            }
            const [total, active, resolved, acknowledged, critical, high, medium, low,] = await Promise.all([
                Alert_1.AlertModel.countDocuments(query),
                Alert_1.AlertModel.countDocuments({ ...query, status: Alert_1.AlertStatus.ACTIVE }),
                Alert_1.AlertModel.countDocuments({ ...query, status: Alert_1.AlertStatus.RESOLVED }),
                Alert_1.AlertModel.countDocuments({ ...query, status: Alert_1.AlertStatus.ACKNOWLEDGED }),
                Alert_1.AlertModel.countDocuments({ ...query, severity: Alert_1.AlertSeverity.CRITICAL }),
                Alert_1.AlertModel.countDocuments({ ...query, severity: Alert_1.AlertSeverity.HIGH }),
                Alert_1.AlertModel.countDocuments({ ...query, severity: Alert_1.AlertSeverity.MEDIUM }),
                Alert_1.AlertModel.countDocuments({ ...query, severity: Alert_1.AlertSeverity.LOW }),
            ]);
            return {
                total,
                active,
                resolved,
                acknowledged,
                critical,
                high,
                medium,
                low,
            };
        }
        catch (error) {
            logger_1.default.error('Error getting alerts summary', {
                serviceName,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    static async findByAlertType(alertType, serviceName, status, limit = 100, offset = 0) {
        try {
            const query = { alertType };
            if (serviceName)
                query.serviceName = serviceName;
            if (status)
                query.status = status;
            const alerts = await Alert_1.AlertModel.find(query)
                .sort({ createdAt: -1 })
                .limit(limit)
                .skip(offset)
                .lean();
            return alerts.map((alert) => this.mapToAlert(alert));
        }
        catch (error) {
            logger_1.default.error('Error finding alerts by alert type', {
                alertType,
                serviceName,
                status,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    static async cleanupOldAlerts(daysToKeep = 30) {
        try {
            const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
            const result = await Alert_1.AlertModel.deleteMany({
                status: Alert_1.AlertStatus.RESOLVED,
                resolvedAt: {
                    $lt: cutoffDate,
                },
            });
            logger_1.default.info('Cleaned up old resolved alerts', {
                deletedCount: result.deletedCount,
                cutoffDate,
            });
            return result.deletedCount;
        }
        catch (error) {
            logger_1.default.error('Error cleaning up old alerts', {
                daysToKeep,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    static async getAlertTrends(startTime, endTime, serviceName, groupBy = 'day') {
        try {
            const query = {
                createdAt: {
                    $gte: startTime,
                    $lte: endTime,
                },
            };
            if (serviceName) {
                query.serviceName = serviceName;
            }
            const alerts = await Alert_1.AlertModel.find(query, {
                createdAt: 1,
                severity: 1,
            })
                .sort({ createdAt: 1 })
                .lean();
            const trends = {};
            alerts.forEach((alert) => {
                let period;
                const date = new Date(alert.createdAt);
                switch (groupBy) {
                    case 'hour':
                        period = date.toISOString().slice(0, 13) + ':00:00.000Z';
                        break;
                    case 'day':
                        period = date.toISOString().slice(0, 10);
                        break;
                    case 'week':
                        const weekStart = new Date(date);
                        weekStart.setDate(date.getDate() - date.getDay());
                        period = weekStart.toISOString().slice(0, 10);
                        break;
                    default:
                        period = date.toISOString().slice(0, 10);
                }
                if (!trends[period]) {
                    trends[period] = {
                        [Alert_1.AlertSeverity.LOW]: 0,
                        [Alert_1.AlertSeverity.MEDIUM]: 0,
                        [Alert_1.AlertSeverity.HIGH]: 0,
                        [Alert_1.AlertSeverity.CRITICAL]: 0,
                    };
                }
                const severity = alert.severity;
                if (trends[period]) {
                    const periodTrends = trends[period];
                    if (periodTrends && periodTrends[severity] !== undefined) {
                        periodTrends[severity] = (periodTrends[severity] || 0) + 1;
                    }
                }
            });
            const result = [];
            Object.entries(trends).forEach(([period, severities]) => {
                Object.entries(severities).forEach(([severity, count]) => {
                    result.push({
                        period,
                        count: count,
                        severity: severity,
                    });
                });
            });
            return result.sort((a, b) => a.period.localeCompare(b.period));
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
    static mapToAlert(doc) {
        return {
            id: doc._id?.toString() || doc.id,
            serviceName: doc.serviceName,
            alertType: doc.alertType,
            severity: doc.severity,
            status: doc.status,
            title: doc.title,
            description: doc.description,
            value: doc.value,
            threshold: doc.threshold,
            labels: doc.labels,
            resolvedAt: doc.resolvedAt,
            acknowledgedAt: doc.acknowledgedAt,
            acknowledgedBy: doc.acknowledgedBy,
        };
    }
}
exports.AlertModel = AlertModel;
//# sourceMappingURL=AlertModel.js.map
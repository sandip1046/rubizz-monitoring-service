import { AlertModel as MongooseAlertModel, AlertSeverity, AlertStatus } from './mongoose/Alert';
import { Alert, AlertSeverity as AlertSeverityType, AlertStatus as AlertStatusType } from '@/types';
import logger from '@/utils/logger';

export class AlertModel {
  /**
   * Create a new alert
   */
  static async create(data: Omit<Alert, 'id'>): Promise<Alert> {
    try {
      const alert = await MongooseAlertModel.create({
        serviceName: data.serviceName,
        alertType: data.alertType,
        severity: data.severity,
        status: data.status || AlertStatus.ACTIVE,
        title: data.title,
        description: data.description,
        value: data.value,
        threshold: data.threshold,
        labels: data.labels,
        acknowledgedBy: data.acknowledgedBy,
      });

      logger.warn('Alert created', {
        alertId: (alert._id as any)?.toString() || alert.id,
        serviceName: data.serviceName,
        alertType: data.alertType,
        severity: data.severity,
        status: data.status,
      });

      return this.mapToAlert(alert);
    } catch (error) {
      logger.error('Error creating alert', {
        serviceName: data.serviceName,
        alertType: data.alertType,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get alert by ID
   */
  static async findById(id: string): Promise<Alert | null> {
    try {
      const alert = await MongooseAlertModel.findById(id);
      return alert ? this.mapToAlert(alert) : null;
    } catch (error) {
      logger.error('Error finding alert by ID', {
        id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get alerts by service name
   */
  static async findByService(
    serviceName: string,
    status?: AlertStatusType,
    limit: number = 100,
    offset: number = 0
  ): Promise<Alert[]> {
    try {
      const query: any = { serviceName };
      if (status) {
        query.status = status;
      }

      const alerts = await MongooseAlertModel.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(offset)
        .lean();

      return alerts.map((alert: any) => this.mapToAlert(alert));
    } catch (error) {
      logger.error('Error finding alerts by service', {
        serviceName,
        status,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get alerts by severity
   */
  static async findBySeverity(
    severity: AlertSeverityType,
    status?: AlertStatusType,
    limit: number = 100,
    offset: number = 0
  ): Promise<Alert[]> {
    try {
      const query: any = { severity };
      if (status) {
        query.status = status;
      }

      const alerts = await MongooseAlertModel.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(offset)
        .lean();

      return alerts.map((alert: any) => this.mapToAlert(alert));
    } catch (error) {
      logger.error('Error finding alerts by severity', {
        severity,
        status,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get active alerts
   */
  static async findActive(limit: number = 100, offset: number = 0): Promise<Alert[]> {
    try {
      const alerts = await MongooseAlertModel.find({ status: AlertStatus.ACTIVE })
        .sort({ severity: -1, createdAt: -1 })
        .limit(limit)
        .skip(offset)
        .lean();

      return alerts.map((alert: any) => this.mapToAlert(alert));
    } catch (error) {
      logger.error('Error finding active alerts', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get critical alerts
   */
  static async findCritical(limit: number = 50): Promise<Alert[]> {
    try {
      const alerts = await MongooseAlertModel.find({
        severity: AlertSeverity.CRITICAL,
        status: AlertStatus.ACTIVE,
      })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      return alerts.map((alert: any) => this.mapToAlert(alert));
    } catch (error) {
      logger.error('Error finding critical alerts', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get alerts within a time range
   */
  static async findByTimeRange(
    startTime: Date,
    endTime: Date,
    serviceName?: string,
    severity?: AlertSeverityType,
    status?: AlertStatusType,
    limit: number = 1000,
    offset: number = 0
  ): Promise<Alert[]> {
    try {
      const query: any = {
        createdAt: {
          $gte: startTime,
          $lte: endTime,
        },
      };

      if (serviceName) query.serviceName = serviceName;
      if (severity) query.severity = severity;
      if (status) query.status = status;

      const alerts = await MongooseAlertModel.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(offset)
        .lean();

      return alerts.map((alert: any) => this.mapToAlert(alert));
    } catch (error) {
      logger.error('Error finding alerts by time range', {
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

  /**
   * Update alert
   */
  static async update(id: string, data: Partial<Alert>): Promise<Alert> {
    try {
      const updateData: any = { ...data };

      if (data.status === AlertStatus.RESOLVED) {
        updateData.resolvedAt = new Date();
      }

      if (data.status === AlertStatus.ACKNOWLEDGED) {
        updateData.acknowledgedAt = new Date();
      }

      const alert = await MongooseAlertModel.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (!alert) {
        throw new Error('Alert not found');
      }

      logger.debug('Alert updated', {
        alertId: id,
        status: data.status,
        severity: data.severity,
      });

      return this.mapToAlert(alert);
    } catch (error) {
      logger.error('Error updating alert', {
        id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Acknowledge alert
   */
  static async acknowledge(id: string, acknowledgedBy: string): Promise<Alert> {
    try {
      const alert = await MongooseAlertModel.findByIdAndUpdate(
        id,
        {
          $set: {
            status: AlertStatus.ACKNOWLEDGED,
            acknowledgedAt: new Date(),
            acknowledgedBy,
          },
        },
        { new: true }
      );

      if (!alert) {
        throw new Error('Alert not found');
      }

      logger.info('Alert acknowledged', {
        alertId: id,
        acknowledgedBy,
        serviceName: alert.serviceName,
      });

      return this.mapToAlert(alert);
    } catch (error) {
      logger.error('Error acknowledging alert', {
        id,
        acknowledgedBy,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Resolve alert
   */
  static async resolve(id: string, resolvedBy?: string): Promise<Alert> {
    try {
      const alert = await MongooseAlertModel.findByIdAndUpdate(
        id,
        {
          $set: {
            status: AlertStatus.RESOLVED,
            resolvedAt: new Date(),
          },
        },
        { new: true }
      );

      if (!alert) {
        throw new Error('Alert not found');
      }

      logger.info('Alert resolved', {
        alertId: id,
        resolvedBy,
        serviceName: alert.serviceName,
      });

      return this.mapToAlert(alert);
    } catch (error) {
      logger.error('Error resolving alert', {
        id,
        resolvedBy,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Delete alert
   */
  static async delete(id: string): Promise<void> {
    try {
      await MongooseAlertModel.findByIdAndDelete(id);
      logger.debug('Alert deleted', { id });
    } catch (error) {
      logger.error('Error deleting alert', {
        id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get alerts summary
   */
  static async getAlertsSummary(serviceName?: string): Promise<{
    total: number;
    active: number;
    resolved: number;
    acknowledged: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  }> {
    try {
      const query: any = {};
      if (serviceName) {
        query.serviceName = serviceName;
      }

      const [
        total,
        active,
        resolved,
        acknowledged,
        critical,
        high,
        medium,
        low,
      ] = await Promise.all([
        MongooseAlertModel.countDocuments(query),
        MongooseAlertModel.countDocuments({ ...query, status: AlertStatus.ACTIVE }),
        MongooseAlertModel.countDocuments({ ...query, status: AlertStatus.RESOLVED }),
        MongooseAlertModel.countDocuments({ ...query, status: AlertStatus.ACKNOWLEDGED }),
        MongooseAlertModel.countDocuments({ ...query, severity: AlertSeverity.CRITICAL }),
        MongooseAlertModel.countDocuments({ ...query, severity: AlertSeverity.HIGH }),
        MongooseAlertModel.countDocuments({ ...query, severity: AlertSeverity.MEDIUM }),
        MongooseAlertModel.countDocuments({ ...query, severity: AlertSeverity.LOW }),
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
    } catch (error) {
      logger.error('Error getting alerts summary', {
        serviceName,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get alerts by alert type
   */
  static async findByAlertType(
    alertType: string,
    serviceName?: string,
    status?: AlertStatusType,
    limit: number = 100,
    offset: number = 0
  ): Promise<Alert[]> {
    try {
      const query: any = { alertType };
      if (serviceName) query.serviceName = serviceName;
      if (status) query.status = status;

      const alerts = await MongooseAlertModel.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(offset)
        .lean();

      return alerts.map((alert: any) => this.mapToAlert(alert));
    } catch (error) {
      logger.error('Error finding alerts by alert type', {
        alertType,
        serviceName,
        status,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Clean up old resolved alerts
   */
  static async cleanupOldAlerts(daysToKeep: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

      const result = await MongooseAlertModel.deleteMany({
        status: AlertStatus.RESOLVED,
        resolvedAt: {
          $lt: cutoffDate,
        },
      });

      logger.info('Cleaned up old resolved alerts', {
        deletedCount: result.deletedCount,
        cutoffDate,
      });

      return result.deletedCount;
    } catch (error) {
      logger.error('Error cleaning up old alerts', {
        daysToKeep,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get alert trends over time
   */
  static async getAlertTrends(
    startTime: Date,
    endTime: Date,
    serviceName?: string,
    groupBy: 'hour' | 'day' | 'week' = 'day'
  ): Promise<Array<{ period: string; count: number; severity: AlertSeverityType }>> {
    try {
      const query: any = {
        createdAt: {
          $gte: startTime,
          $lte: endTime,
        },
      };

      if (serviceName) {
        query.serviceName = serviceName;
      }

      const alerts = await MongooseAlertModel.find(query, {
        createdAt: 1,
        severity: 1,
      })
        .sort({ createdAt: 1 })
        .lean();

      // Group by time period and severity
      const trends: Record<string, Record<AlertSeverityType, number>> = {};

      alerts.forEach((alert: any) => {
        let period: string;
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
            [AlertSeverity.LOW]: 0,
            [AlertSeverity.MEDIUM]: 0,
            [AlertSeverity.HIGH]: 0,
            [AlertSeverity.CRITICAL]: 0,
          } as Record<AlertSeverityType, number>;
        }

        const severity = alert.severity as AlertSeverityType;
        if (trends[period]) {
          const periodTrends = trends[period];
          if (periodTrends && periodTrends[severity] !== undefined) {
            periodTrends[severity] = (periodTrends[severity] || 0) + 1;
          }
        }
      });

      // Convert to array format
      const result: Array<{ period: string; count: number; severity: AlertSeverityType }> = [];
      Object.entries(trends).forEach(([period, severities]) => {
        Object.entries(severities).forEach(([severity, count]) => {
          result.push({
            period,
            count: count as number,
            severity: severity as AlertSeverityType,
          });
        });
      });

      return result.sort((a, b) => a.period.localeCompare(b.period));
    } catch (error) {
      logger.error('Error getting alert trends', {
        startTime,
        endTime,
        serviceName,
        groupBy,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Map Mongoose document to Alert interface
   */
  private static mapToAlert(doc: any): Alert {
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

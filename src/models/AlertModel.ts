import { prisma } from '@/database/connection';
import { Alert, AlertSeverity, AlertStatus } from '@/types';
import { logger } from '@/utils/logger';

export class AlertModel {
  /**
   * Create a new alert
   */
  static async create(data: Omit<Alert, 'id'>): Promise<Alert> {
    try {
      const alert = await prisma.alert.create({
        data: {
          serviceName: data.serviceName,
          alertType: data.alertType,
          severity: data.severity,
          status: data.status,
          title: data.title,
          description: data.description,
          value: data.value,
          threshold: data.threshold,
          labels: data.labels,
          acknowledgedBy: data.acknowledgedBy,
        },
      });

      logger.warn('Alert created', {
        alertId: alert.id,
        serviceName: data.serviceName,
        alertType: data.alertType,
        severity: data.severity,
        status: data.status,
      });

      return alert as Alert;
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
      const alert = await prisma.alert.findUnique({
        where: { id },
      });

      return alert as Alert | null;
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
    status?: AlertStatus,
    limit: number = 100,
    offset: number = 0
  ): Promise<Alert[]> {
    try {
      const whereClause: any = { serviceName };
      if (status) {
        whereClause.status = status;
      }

      const alerts = await prisma.alert.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      });

      return alerts as Alert[];
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
    severity: AlertSeverity,
    status?: AlertStatus,
    limit: number = 100,
    offset: number = 0
  ): Promise<Alert[]> {
    try {
      const whereClause: any = { severity };
      if (status) {
        whereClause.status = status;
      }

      const alerts = await prisma.alert.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      });

      return alerts as Alert[];
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
      const alerts = await prisma.alert.findMany({
        where: { status: AlertStatus.ACTIVE },
        orderBy: [
          { severity: 'desc' },
          { createdAt: 'desc' },
        ],
        take: limit,
        skip: offset,
      });

      return alerts as Alert[];
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
      const alerts = await prisma.alert.findMany({
        where: {
          severity: AlertSeverity.CRITICAL,
          status: AlertStatus.ACTIVE,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      return alerts as Alert[];
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
    severity?: AlertSeverity,
    status?: AlertStatus,
    limit: number = 1000,
    offset: number = 0
  ): Promise<Alert[]> {
    try {
      const whereClause: any = {
        createdAt: {
          gte: startTime,
          lte: endTime,
        },
      };

      if (serviceName) {
        whereClause.serviceName = serviceName;
      }

      if (severity) {
        whereClause.severity = severity;
      }

      if (status) {
        whereClause.status = status;
      }

      const alerts = await prisma.alert.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      });

      return alerts as Alert[];
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

      const alert = await prisma.alert.update({
        where: { id },
        data: updateData,
      });

      logger.debug('Alert updated', {
        alertId: id,
        status: data.status,
        severity: data.severity,
      });

      return alert as Alert;
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
      const alert = await prisma.alert.update({
        where: { id },
        data: {
          status: AlertStatus.ACKNOWLEDGED,
          acknowledgedAt: new Date(),
          acknowledgedBy,
        },
      });

      logger.info('Alert acknowledged', {
        alertId: id,
        acknowledgedBy,
        serviceName: alert.serviceName,
      });

      return alert as Alert;
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
      const alert = await prisma.alert.update({
        where: { id },
        data: {
          status: AlertStatus.RESOLVED,
          resolvedAt: new Date(),
        },
      });

      logger.info('Alert resolved', {
        alertId: id,
        resolvedBy,
        serviceName: alert.serviceName,
      });

      return alert as Alert;
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
      await prisma.alert.delete({
        where: { id },
      });

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
      const whereClause: any = {};
      if (serviceName) {
        whereClause.serviceName = serviceName;
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
        prisma.alert.count({ where: whereClause }),
        prisma.alert.count({ where: { ...whereClause, status: AlertStatus.ACTIVE } }),
        prisma.alert.count({ where: { ...whereClause, status: AlertStatus.RESOLVED } }),
        prisma.alert.count({ where: { ...whereClause, status: AlertStatus.ACKNOWLEDGED } }),
        prisma.alert.count({ where: { ...whereClause, severity: AlertSeverity.CRITICAL } }),
        prisma.alert.count({ where: { ...whereClause, severity: AlertSeverity.HIGH } }),
        prisma.alert.count({ where: { ...whereClause, severity: AlertSeverity.MEDIUM } }),
        prisma.alert.count({ where: { ...whereClause, severity: AlertSeverity.LOW } }),
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
    status?: AlertStatus,
    limit: number = 100,
    offset: number = 0
  ): Promise<Alert[]> {
    try {
      const whereClause: any = { alertType };
      if (serviceName) {
        whereClause.serviceName = serviceName;
      }
      if (status) {
        whereClause.status = status;
      }

      const alerts = await prisma.alert.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      });

      return alerts as Alert[];
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

      const result = await prisma.alert.deleteMany({
        where: {
          status: AlertStatus.RESOLVED,
          resolvedAt: {
            lt: cutoffDate,
          },
        },
      });

      logger.info('Cleaned up old resolved alerts', {
        deletedCount: result.count,
        cutoffDate,
      });

      return result.count;
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
  ): Promise<Array<{ period: string; count: number; severity: AlertSeverity }>> {
    try {
      const whereClause: any = {
        createdAt: {
          gte: startTime,
          lte: endTime,
        },
      };

      if (serviceName) {
        whereClause.serviceName = serviceName;
      }

      const alerts = await prisma.alert.findMany({
        where: whereClause,
        select: {
          createdAt: true,
          severity: true,
        },
        orderBy: { createdAt: 'asc' },
      });

      // Group by time period and severity
      const trends: Record<string, Record<AlertSeverity, number>> = {};
      
      alerts.forEach(alert => {
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
          };
        }

        trends[period][alert.severity]++;
      });

      // Convert to array format
      const result: Array<{ period: string; count: number; severity: AlertSeverity }> = [];
      Object.entries(trends).forEach(([period, severities]) => {
        Object.entries(severities).forEach(([severity, count]) => {
          result.push({
            period,
            count,
            severity: severity as AlertSeverity,
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
}

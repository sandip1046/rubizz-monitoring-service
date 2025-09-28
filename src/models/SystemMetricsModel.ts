import { prisma } from '@/database/connection';
import { SystemMetric, MetricType } from '@/types';
import { logger } from '@/utils/logger';

export class SystemMetricsModel {
  /**
   * Create a new system metric record
   */
  static async create(data: Omit<SystemMetric, 'id'>): Promise<SystemMetric> {
    try {
      const metric = await prisma.systemMetric.create({
        data: {
          serviceName: data.serviceName,
          metricName: data.metricName,
          metricType: data.metricType,
          value: data.value,
          labels: data.labels,
          timestamp: data.timestamp || new Date(),
        },
      });

      logger.debug('System metric created', {
        serviceName: data.serviceName,
        metricName: data.metricName,
        value: data.value,
      });

      return metric as SystemMetric;
    } catch (error) {
      logger.error('Error creating system metric', {
        serviceName: data.serviceName,
        metricName: data.metricName,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Create multiple system metrics in batch
   */
  static async createMany(metrics: Omit<SystemMetric, 'id'>[]): Promise<number> {
    try {
      const result = await prisma.systemMetric.createMany({
        data: metrics.map(metric => ({
          serviceName: metric.serviceName,
          metricName: metric.metricName,
          metricType: metric.metricType,
          value: metric.value,
          labels: metric.labels,
          timestamp: metric.timestamp || new Date(),
        })),
      });

      logger.debug('System metrics created in batch', {
        count: result.count,
        serviceNames: [...new Set(metrics.map(m => m.serviceName))],
      });

      return result.count;
    } catch (error) {
      logger.error('Error creating system metrics in batch', {
        count: metrics.length,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get system metric by ID
   */
  static async findById(id: string): Promise<SystemMetric | null> {
    try {
      const metric = await prisma.systemMetric.findUnique({
        where: { id },
      });

      return metric as SystemMetric | null;
    } catch (error) {
      logger.error('Error finding system metric by ID', {
        id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get metrics by service name
   */
  static async findByService(
    serviceName: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<SystemMetric[]> {
    try {
      const metrics = await prisma.systemMetric.findMany({
        where: { serviceName },
        orderBy: { timestamp: 'desc' },
        take: limit,
        skip: offset,
      });

      return metrics as SystemMetric[];
    } catch (error) {
      logger.error('Error finding system metrics by service', {
        serviceName,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get metrics by metric name
   */
  static async findByMetricName(
    metricName: string,
    serviceName?: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<SystemMetric[]> {
    try {
      const whereClause: any = { metricName };
      if (serviceName) {
        whereClause.serviceName = serviceName;
      }

      const metrics = await prisma.systemMetric.findMany({
        where: whereClause,
        orderBy: { timestamp: 'desc' },
        take: limit,
        skip: offset,
      });

      return metrics as SystemMetric[];
    } catch (error) {
      logger.error('Error finding system metrics by metric name', {
        metricName,
        serviceName,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get metrics within a time range
   */
  static async findByTimeRange(
    startTime: Date,
    endTime: Date,
    serviceName?: string,
    metricName?: string,
    limit: number = 1000,
    offset: number = 0
  ): Promise<SystemMetric[]> {
    try {
      const whereClause: any = {
        timestamp: {
          gte: startTime,
          lte: endTime,
        },
      };

      if (serviceName) {
        whereClause.serviceName = serviceName;
      }

      if (metricName) {
        whereClause.metricName = metricName;
      }

      const metrics = await prisma.systemMetric.findMany({
        where: whereClause,
        orderBy: { timestamp: 'desc' },
        take: limit,
        skip: offset,
      });

      return metrics as SystemMetric[];
    } catch (error) {
      logger.error('Error finding system metrics by time range', {
        startTime,
        endTime,
        serviceName,
        metricName,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get aggregated metrics
   */
  static async getAggregatedMetrics(
    serviceName: string,
    metricName: string,
    startTime: Date,
    endTime: Date,
    aggregation: 'avg' | 'sum' | 'min' | 'max' | 'count' = 'avg'
  ): Promise<{ value: number; timestamp: Date }> {
    try {
      const metrics = await prisma.systemMetric.findMany({
        where: {
          serviceName,
          metricName,
          timestamp: {
            gte: startTime,
            lte: endTime,
          },
        },
        orderBy: { timestamp: 'desc' },
      });

      if (metrics.length === 0) {
        return { value: 0, timestamp: new Date() };
      }

      let aggregatedValue: number;
      const values = metrics.map(m => m.value);

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
        default:
          aggregatedValue = values.reduce((sum, val) => sum + val, 0) / values.length;
      }

      return {
        value: aggregatedValue,
        timestamp: metrics[0].timestamp,
      };
    } catch (error) {
      logger.error('Error getting aggregated system metrics', {
        serviceName,
        metricName,
        aggregation,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get latest metric value for a service and metric name
   */
  static async getLatestMetric(
    serviceName: string,
    metricName: string
  ): Promise<SystemMetric | null> {
    try {
      const metric = await prisma.systemMetric.findFirst({
        where: {
          serviceName,
          metricName,
        },
        orderBy: { timestamp: 'desc' },
      });

      return metric as SystemMetric | null;
    } catch (error) {
      logger.error('Error getting latest system metric', {
        serviceName,
        metricName,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get metrics summary for a service
   */
  static async getServiceMetricsSummary(
    serviceName: string,
    hours: number = 24
  ): Promise<{
    serviceName: string;
    totalMetrics: number;
    uniqueMetricNames: string[];
    averageValue: number;
    minValue: number;
    maxValue: number;
    lastUpdated: Date | null;
  }> {
    try {
      const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);

      const metrics = await prisma.systemMetric.findMany({
        where: {
          serviceName,
          timestamp: {
            gte: startTime,
          },
        },
        orderBy: { timestamp: 'desc' },
      });

      const uniqueMetricNames = [...new Set(metrics.map(m => m.metricName))];
      const values = metrics.map(m => m.value);
      const averageValue = values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
      const minValue = values.length > 0 ? Math.min(...values) : 0;
      const maxValue = values.length > 0 ? Math.max(...values) : 0;

      return {
        serviceName,
        totalMetrics: metrics.length,
        uniqueMetricNames,
        averageValue,
        minValue,
        maxValue,
        lastUpdated: metrics[0]?.timestamp || null,
      };
    } catch (error) {
      logger.error('Error getting service metrics summary', {
        serviceName,
        hours,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get metrics by type
   */
  static async findByType(
    metricType: MetricType,
    serviceName?: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<SystemMetric[]> {
    try {
      const whereClause: any = { metricType };
      if (serviceName) {
        whereClause.serviceName = serviceName;
      }

      const metrics = await prisma.systemMetric.findMany({
        where: whereClause,
        orderBy: { timestamp: 'desc' },
        take: limit,
        skip: offset,
      });

      return metrics as SystemMetric[];
    } catch (error) {
      logger.error('Error finding system metrics by type', {
        metricType,
        serviceName,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Delete old metrics
   */
  static async deleteOldMetrics(daysToKeep: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

      const result = await prisma.systemMetric.deleteMany({
        where: {
          timestamp: {
            lt: cutoffDate,
          },
        },
      });

      logger.info('Cleaned up old system metrics', {
        deletedCount: result.count,
        cutoffDate,
      });

      return result.count;
    } catch (error) {
      logger.error('Error cleaning up old system metrics', {
        daysToKeep,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get metrics count by service
   */
  static async getMetricsCountByService(serviceName: string): Promise<number> {
    try {
      const count = await prisma.systemMetric.count({
        where: { serviceName },
      });

      return count;
    } catch (error) {
      logger.error('Error getting metrics count by service', {
        serviceName,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get unique metric names for a service
   */
  static async getUniqueMetricNames(serviceName: string): Promise<string[]> {
    try {
      const metrics = await prisma.systemMetric.findMany({
        where: { serviceName },
        select: { metricName: true },
        distinct: ['metricName'],
      });

      return metrics.map(m => m.metricName);
    } catch (error) {
      logger.error('Error getting unique metric names', {
        serviceName,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}

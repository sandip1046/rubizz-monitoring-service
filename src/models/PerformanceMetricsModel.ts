import { prisma } from '@/database/connection';
import { PerformanceMetric } from '@/types';
import { logger } from '@/utils/logger';

export class PerformanceMetricsModel {
  /**
   * Create a new performance metric record
   */
  static async create(data: Omit<PerformanceMetric, 'id'>): Promise<PerformanceMetric> {
    try {
      const metric = await prisma.performanceMetric.create({
        data: {
          serviceName: data.serviceName,
          endpoint: data.endpoint,
          method: data.method,
          responseTime: data.responseTime,
          statusCode: data.statusCode,
          requestSize: data.requestSize,
          responseSize: data.responseSize,
          userAgent: data.userAgent,
          ipAddress: data.ipAddress,
          timestamp: data.timestamp || new Date(),
        },
      });

      logger.debug('Performance metric created', {
        serviceName: data.serviceName,
        endpoint: data.endpoint,
        method: data.method,
        responseTime: data.responseTime,
        statusCode: data.statusCode,
      });

      return metric as PerformanceMetric;
    } catch (error) {
      logger.error('Error creating performance metric', {
        serviceName: data.serviceName,
        endpoint: data.endpoint,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Create multiple performance metrics in batch
   */
  static async createMany(metrics: Omit<PerformanceMetric, 'id'>[]): Promise<number> {
    try {
      const result = await prisma.performanceMetric.createMany({
        data: metrics.map(metric => ({
          serviceName: metric.serviceName,
          endpoint: metric.endpoint,
          method: metric.method,
          responseTime: metric.responseTime,
          statusCode: metric.statusCode,
          requestSize: metric.requestSize,
          responseSize: metric.responseSize,
          userAgent: metric.userAgent,
          ipAddress: metric.ipAddress,
          timestamp: metric.timestamp || new Date(),
        })),
      });

      logger.debug('Performance metrics created in batch', {
        count: result.count,
        serviceNames: [...new Set(metrics.map(m => m.serviceName))],
      });

      return result.count;
    } catch (error) {
      logger.error('Error creating performance metrics in batch', {
        count: metrics.length,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get performance metric by ID
   */
  static async findById(id: string): Promise<PerformanceMetric | null> {
    try {
      const metric = await prisma.performanceMetric.findUnique({
        where: { id },
      });

      return metric as PerformanceMetric | null;
    } catch (error) {
      logger.error('Error finding performance metric by ID', {
        id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get performance metrics by service name
   */
  static async findByService(
    serviceName: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<PerformanceMetric[]> {
    try {
      const metrics = await prisma.performanceMetric.findMany({
        where: { serviceName },
        orderBy: { timestamp: 'desc' },
        take: limit,
        skip: offset,
      });

      return metrics as PerformanceMetric[];
    } catch (error) {
      logger.error('Error finding performance metrics by service', {
        serviceName,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get performance metrics by endpoint
   */
  static async findByEndpoint(
    endpoint: string,
    serviceName?: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<PerformanceMetric[]> {
    try {
      const whereClause: any = { endpoint };
      if (serviceName) {
        whereClause.serviceName = serviceName;
      }

      const metrics = await prisma.performanceMetric.findMany({
        where: whereClause,
        orderBy: { timestamp: 'desc' },
        take: limit,
        skip: offset,
      });

      return metrics as PerformanceMetric[];
    } catch (error) {
      logger.error('Error finding performance metrics by endpoint', {
        endpoint,
        serviceName,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get performance metrics by status code
   */
  static async findByStatusCode(
    statusCode: number,
    serviceName?: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<PerformanceMetric[]> {
    try {
      const whereClause: any = { statusCode };
      if (serviceName) {
        whereClause.serviceName = serviceName;
      }

      const metrics = await prisma.performanceMetric.findMany({
        where: whereClause,
        orderBy: { timestamp: 'desc' },
        take: limit,
        skip: offset,
      });

      return metrics as PerformanceMetric[];
    } catch (error) {
      logger.error('Error finding performance metrics by status code', {
        statusCode,
        serviceName,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get performance metrics within a time range
   */
  static async findByTimeRange(
    startTime: Date,
    endTime: Date,
    serviceName?: string,
    endpoint?: string,
    method?: string,
    limit: number = 1000,
    offset: number = 0
  ): Promise<PerformanceMetric[]> {
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

      if (endpoint) {
        whereClause.endpoint = endpoint;
      }

      if (method) {
        whereClause.method = method;
      }

      const metrics = await prisma.performanceMetric.findMany({
        where: whereClause,
        orderBy: { timestamp: 'desc' },
        take: limit,
        skip: offset,
      });

      return metrics as PerformanceMetric[];
    } catch (error) {
      logger.error('Error finding performance metrics by time range', {
        startTime,
        endTime,
        serviceName,
        endpoint,
        method,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get performance summary for a service
   */
  static async getPerformanceSummary(
    serviceName: string,
    startTime: Date,
    endTime: Date,
    endpoint?: string
  ): Promise<{
    serviceName: string;
    totalRequests: number;
    averageResponseTime: number;
    minResponseTime: number;
    maxResponseTime: number;
    errorRate: number;
    throughput: number;
    statusCodes: Record<number, number>;
    topEndpoints: Array<{ endpoint: string; count: number; avgResponseTime: number }>;
  }> {
    try {
      const whereClause: any = {
        serviceName,
        timestamp: {
          gte: startTime,
          lte: endTime,
        },
      };

      if (endpoint) {
        whereClause.endpoint = endpoint;
      }

      const metrics = await prisma.performanceMetric.findMany({
        where: whereClause,
        orderBy: { timestamp: 'desc' },
      });

      const totalRequests = metrics.length;
      const responseTimes = metrics.map(m => m.responseTime);
      const averageResponseTime = responseTimes.length > 0 
        ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
        : 0;
      const minResponseTime = responseTimes.length > 0 ? Math.min(...responseTimes) : 0;
      const maxResponseTime = responseTimes.length > 0 ? Math.max(...responseTimes) : 0;

      const errorRequests = metrics.filter(m => m.statusCode >= 400).length;
      const errorRate = totalRequests > 0 ? (errorRequests / totalRequests) * 100 : 0;

      const timeDiffMs = endTime.getTime() - startTime.getTime();
      const timeDiffSeconds = timeDiffMs / 1000;
      const throughput = timeDiffSeconds > 0 ? totalRequests / timeDiffSeconds : 0;

      // Status code distribution
      const statusCodes: Record<number, number> = {};
      metrics.forEach(m => {
        statusCodes[m.statusCode] = (statusCodes[m.statusCode] || 0) + 1;
      });

      // Top endpoints
      const endpointStats: Record<string, { count: number; totalResponseTime: number }> = {};
      metrics.forEach(m => {
        if (!endpointStats[m.endpoint]) {
          endpointStats[m.endpoint] = { count: 0, totalResponseTime: 0 };
        }
        endpointStats[m.endpoint].count++;
        endpointStats[m.endpoint].totalResponseTime += m.responseTime;
      });

      const topEndpoints = Object.entries(endpointStats)
        .map(([endpoint, stats]) => ({
          endpoint,
          count: stats.count,
          avgResponseTime: stats.totalResponseTime / stats.count,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return {
        serviceName,
        totalRequests,
        averageResponseTime,
        minResponseTime,
        maxResponseTime,
        errorRate,
        throughput,
        statusCodes,
        topEndpoints,
      };
    } catch (error) {
      logger.error('Error getting performance summary', {
        serviceName,
        startTime,
        endTime,
        endpoint,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get response time percentiles
   */
  static async getResponseTimePercentiles(
    serviceName: string,
    startTime: Date,
    endTime: Date,
    endpoint?: string,
    percentiles: number[] = [50, 90, 95, 99]
  ): Promise<Record<number, number>> {
    try {
      const whereClause: any = {
        serviceName,
        timestamp: {
          gte: startTime,
          lte: endTime,
        },
      };

      if (endpoint) {
        whereClause.endpoint = endpoint;
      }

      const metrics = await prisma.performanceMetric.findMany({
        where: whereClause,
        select: { responseTime: true },
        orderBy: { responseTime: 'asc' },
      });

      const responseTimes = metrics.map(m => m.responseTime).sort((a, b) => a - b);
      const result: Record<number, number> = {};

      percentiles.forEach(percentile => {
        if (responseTimes.length === 0) {
          result[percentile] = 0;
          return;
        }

        const index = Math.ceil((percentile / 100) * responseTimes.length) - 1;
        result[percentile] = responseTimes[Math.max(0, index)];
      });

      return result;
    } catch (error) {
      logger.error('Error getting response time percentiles', {
        serviceName,
        startTime,
        endTime,
        endpoint,
        percentiles,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get slowest endpoints
   */
  static async getSlowestEndpoints(
    serviceName: string,
    startTime: Date,
    endTime: Date,
    limit: number = 10
  ): Promise<Array<{ endpoint: string; method: string; avgResponseTime: number; count: number }>> {
    try {
      const metrics = await prisma.performanceMetric.findMany({
        where: {
          serviceName,
          timestamp: {
            gte: startTime,
            lte: endTime,
          },
        },
        select: {
          endpoint: true,
          method: true,
          responseTime: true,
        },
      });

      const endpointStats: Record<string, { totalResponseTime: number; count: number }> = {};
      
      metrics.forEach(m => {
        const key = `${m.method} ${m.endpoint}`;
        if (!endpointStats[key]) {
          endpointStats[key] = { totalResponseTime: 0, count: 0 };
        }
        endpointStats[key].totalResponseTime += m.responseTime;
        endpointStats[key].count++;
      });

      const slowestEndpoints = Object.entries(endpointStats)
        .map(([key, stats]) => {
          const [method, endpoint] = key.split(' ', 2);
          return {
            endpoint,
            method,
            avgResponseTime: stats.totalResponseTime / stats.count,
            count: stats.count,
          };
        })
        .sort((a, b) => b.avgResponseTime - a.avgResponseTime)
        .slice(0, limit);

      return slowestEndpoints;
    } catch (error) {
      logger.error('Error getting slowest endpoints', {
        serviceName,
        startTime,
        endTime,
        limit,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get error rate by endpoint
   */
  static async getErrorRateByEndpoint(
    serviceName: string,
    startTime: Date,
    endTime: Date
  ): Promise<Array<{ endpoint: string; method: string; errorRate: number; totalRequests: number; errorRequests: number }>> {
    try {
      const metrics = await prisma.performanceMetric.findMany({
        where: {
          serviceName,
          timestamp: {
            gte: startTime,
            lte: endTime,
          },
        },
        select: {
          endpoint: true,
          method: true,
          statusCode: true,
        },
      });

      const endpointStats: Record<string, { total: number; errors: number }> = {};
      
      metrics.forEach(m => {
        const key = `${m.method} ${m.endpoint}`;
        if (!endpointStats[key]) {
          endpointStats[key] = { total: 0, errors: 0 };
        }
        endpointStats[key].total++;
        if (m.statusCode >= 400) {
          endpointStats[key].errors++;
        }
      });

      const errorRates = Object.entries(endpointStats)
        .map(([key, stats]) => {
          const [method, endpoint] = key.split(' ', 2);
          return {
            endpoint,
            method,
            errorRate: (stats.errors / stats.total) * 100,
            totalRequests: stats.total,
            errorRequests: stats.errors,
          };
        })
        .sort((a, b) => b.errorRate - a.errorRate);

      return errorRates;
    } catch (error) {
      logger.error('Error getting error rate by endpoint', {
        serviceName,
        startTime,
        endTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Clean up old performance metrics
   */
  static async deleteOldMetrics(daysToKeep: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

      const result = await prisma.performanceMetric.deleteMany({
        where: {
          timestamp: {
            lt: cutoffDate,
          },
        },
      });

      logger.info('Cleaned up old performance metrics', {
        deletedCount: result.count,
        cutoffDate,
      });

      return result.count;
    } catch (error) {
      logger.error('Error cleaning up old performance metrics', {
        daysToKeep,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get performance metrics count by service
   */
  static async getMetricsCountByService(serviceName: string): Promise<number> {
    try {
      const count = await prisma.performanceMetric.count({
        where: { serviceName },
      });

      return count;
    } catch (error) {
      logger.error('Error getting performance metrics count by service', {
        serviceName,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get unique endpoints for a service
   */
  static async getUniqueEndpoints(serviceName: string): Promise<string[]> {
    try {
      const metrics = await prisma.performanceMetric.findMany({
        where: { serviceName },
        select: { endpoint: true },
        distinct: ['endpoint'],
      });

      return metrics.map(m => m.endpoint);
    } catch (error) {
      logger.error('Error getting unique endpoints', {
        serviceName,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}

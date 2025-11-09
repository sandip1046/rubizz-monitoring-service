import { PerformanceMetricModel as MongoosePerformanceMetricModel } from './mongoose/PerformanceMetric';
import { PerformanceMetric } from '@/types';
import logger from '@/utils/logger';

export class PerformanceMetricsModel {
  static async create(data: Omit<PerformanceMetric, 'id'>): Promise<PerformanceMetric> {
    try {
      const metric = await MongoosePerformanceMetricModel.create({
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
      });
      return this.mapToPerformanceMetric(metric);
    } catch (error) {
      logger.error('Error creating performance metric', {
        serviceName: data.serviceName,
        endpoint: data.endpoint,
      });
      throw error;
    }
  }

  static async createMany(metrics: Omit<PerformanceMetric, 'id'>[]): Promise<number> {
    try {
      const docs = metrics.map(metric => ({
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
      }));
      const result = await MongoosePerformanceMetricModel.insertMany(docs);
      return result.length;
    } catch (error) {
      logger.error('Error creating multiple performance metrics');
      throw error;
    }
  }

  static async findByService(
    serviceName: string,
    endpoint?: string,
    startTime?: Date,
    endTime?: Date,
    limit: number = 1000
  ): Promise<PerformanceMetric[]> {
    try {
      const query: any = { serviceName };
      if (endpoint) query.endpoint = endpoint;
      if (startTime || endTime) {
        query.timestamp = {};
        if (startTime) query.timestamp.$gte = startTime;
        if (endTime) query.timestamp.$lte = endTime;
      }

      const metrics = await MongoosePerformanceMetricModel.find(query)
        .sort({ timestamp: -1 })
        .limit(limit)
        .lean();
      return metrics.map(metric => this.mapToPerformanceMetric(metric));
    } catch (error) {
      logger.error('Error finding performance metrics by service', { serviceName });
      throw error;
    }
  }

  static async getSlowestEndpoints(
    serviceName: string,
    limit: number = 10,
    startTime?: Date,
    endTime?: Date
  ): Promise<Array<{ endpoint: string; avgResponseTime: number; count: number }>> {
    try {
      const match: any = { serviceName };
      if (startTime || endTime) {
        match.timestamp = {};
        if (startTime) match.timestamp.$gte = startTime;
        if (endTime) match.timestamp.$lte = endTime;
      }

      const result = await MongoosePerformanceMetricModel.aggregate([
        { $match: match },
        {
          $group: {
            _id: '$endpoint',
            avgResponseTime: { $avg: '$responseTime' },
            count: { $sum: 1 }
          }
        },
        { $sort: { avgResponseTime: -1 } },
        { $limit: limit }
      ]);

      return result.map((item: any) => ({
        endpoint: item._id,
        avgResponseTime: item.avgResponseTime,
        count: item.count
      }));
    } catch (error) {
      logger.error('Error getting slowest endpoints', { serviceName });
      throw error;
    }
  }

  static async getErrorRates(
    serviceName: string,
    startTime?: Date,
    endTime?: Date
  ): Promise<Array<{ endpoint: string; errorRate: number; totalRequests: number; errorCount: number }>> {
    try {
      const match: any = { serviceName };
      if (startTime || endTime) {
        match.timestamp = {};
        if (startTime) match.timestamp.$gte = startTime;
        if (endTime) match.timestamp.$lte = endTime;
      }

      const result = await MongoosePerformanceMetricModel.aggregate([
        { $match: match },
        {
          $group: {
            _id: '$endpoint',
            totalRequests: { $sum: 1 },
            errorCount: {
              $sum: { $cond: [{ $gte: ['$statusCode', 400] }, 1, 0] }
            }
          }
        },
        {
          $project: {
            endpoint: '$_id',
            totalRequests: 1,
            errorCount: 1,
            errorRate: {
              $multiply: [
                { $divide: ['$errorCount', '$totalRequests'] },
                100
              ]
            }
          }
        },
        { $sort: { errorRate: -1 } }
      ]);

      return result;
    } catch (error) {
      logger.error('Error getting error rates', { serviceName });
      throw error;
    }
  }

  static async cleanupOldMetrics(daysToKeep: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
      const result = await MongoosePerformanceMetricModel.deleteMany({
        timestamp: { $lt: cutoffDate }
      });
      return result.deletedCount;
    } catch (error) {
      logger.error('Error cleaning up old performance metrics', { daysToKeep });
      throw error;
    }
  }

  static async findByTimeRange(
    startTime: Date,
    endTime: Date,
    serviceName?: string,
    endpoint?: string,
    limit: number = 1000,
    offset: number = 0
  ): Promise<PerformanceMetric[]> {
    const metrics = await this.findByService(
      serviceName || '',
      endpoint,
      startTime,
      endTime,
      limit + offset
    );
    return metrics.slice(offset);
  }

  static async findByEndpoint(
    serviceName: string,
    endpoint: string,
    startTime?: Date,
    endTime?: Date,
    limit: number = 1000
  ): Promise<PerformanceMetric[]> {
    const metrics = await this.findByService(serviceName, endpoint, startTime, endTime, limit);
    return metrics;
  }

  static async getPerformanceSummary(
    serviceName: string,
    startTime: Date,
    endTime: Date
  ): Promise<any> {
    try {
      const metrics = await this.findByService(serviceName, undefined, startTime, endTime);
      
      const summary: any = {
        serviceName,
        totalRequests: metrics.length,
        averageResponseTime: 0,
        endpoints: {}
      };

      if (metrics.length > 0) {
        summary.averageResponseTime = metrics.reduce((sum, m) => sum + m.responseTime, 0) / metrics.length;
        
        metrics.forEach(metric => {
          if (!summary.endpoints[metric.endpoint]) {
            summary.endpoints[metric.endpoint] = {
              count: 0,
              totalResponseTime: 0,
              averageResponseTime: 0,
              errorCount: 0
            };
          }
          const endpoint = summary.endpoints[metric.endpoint];
          endpoint.count++;
          endpoint.totalResponseTime += metric.responseTime;
          if (metric.statusCode >= 400) {
            endpoint.errorCount++;
          }
        });

        Object.keys(summary.endpoints).forEach(endpoint => {
          const ep = summary.endpoints[endpoint];
          ep.averageResponseTime = ep.totalResponseTime / ep.count;
        });
      }

      return summary;
    } catch (error) {
      logger.error('Error getting performance summary', { serviceName });
      throw error;
    }
  }

  static async getErrorRateByEndpoint(
    serviceName: string,
    startTime: Date,
    endTime: Date
  ): Promise<Array<{ endpoint: string; errorRate: number; totalRequests: number; errorCount: number }>> {
    return this.getErrorRates(serviceName, startTime, endTime);
  }

  static async deleteOldMetrics(daysToKeep: number = 30): Promise<number> {
    return this.cleanupOldMetrics(daysToKeep);
  }

  private static mapToPerformanceMetric(doc: any): PerformanceMetric {
    return {
      id: doc._id?.toString() || doc.id,
      serviceName: doc.serviceName,
      endpoint: doc.endpoint,
      method: doc.method,
      responseTime: doc.responseTime,
      statusCode: doc.statusCode,
      requestSize: doc.requestSize,
      responseSize: doc.responseSize,
      userAgent: doc.userAgent,
      ipAddress: doc.ipAddress,
      timestamp: doc.timestamp,
    };
  }
}

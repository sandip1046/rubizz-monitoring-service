import { SystemMetricModel as MongooseSystemMetricModel, MetricType } from './mongoose/SystemMetric';
import { SystemMetric, MetricType as MetricTypeEnum } from '@/types';
import logger from '@/utils/logger';

export class SystemMetricsModel {
  static async create(data: Omit<SystemMetric, 'id'>): Promise<SystemMetric> {
    try {
      const metric = await MongooseSystemMetricModel.create({
        serviceName: data.serviceName,
        metricName: data.metricName,
        metricType: data.metricType,
        value: data.value,
        labels: data.labels,
        timestamp: data.timestamp || new Date(),
      });
      return this.mapToSystemMetric(metric);
    } catch (error) {
      logger.error('Error creating system metric', {
        serviceName: data.serviceName,
        metricName: data.metricName,
      });
      throw error;
    }
  }

  static async createMany(metrics: Omit<SystemMetric, 'id'>[]): Promise<number> {
    try {
      const docs = metrics.map(metric => ({
        serviceName: metric.serviceName,
        metricName: metric.metricName,
        metricType: metric.metricType,
        value: metric.value,
        labels: metric.labels,
        timestamp: metric.timestamp || new Date(),
      }));
      const result = await MongooseSystemMetricModel.insertMany(docs);
      return result.length;
    } catch (error) {
      logger.error('Error creating multiple system metrics');
      throw error;
    }
  }

  static async findById(id: string): Promise<SystemMetric | null> {
    try {
      const metric = await MongooseSystemMetricModel.findById(id).lean();
      return metric ? this.mapToSystemMetric(metric) : null;
    } catch (error) {
      logger.error('Error finding system metric by ID', { id });
      throw error;
    }
  }

  static async findByService(
    serviceName: string,
    metricName?: string,
    startTime?: Date,
    endTime?: Date,
    limit: number = 1000
  ): Promise<SystemMetric[]> {
    try {
      const query: any = { serviceName };
      if (metricName) query.metricName = metricName;
      if (startTime || endTime) {
        query.timestamp = {};
        if (startTime) query.timestamp.$gte = startTime;
        if (endTime) query.timestamp.$lte = endTime;
      }

      const metrics = await MongooseSystemMetricModel.find(query)
        .sort({ timestamp: -1 })
        .limit(limit)
        .lean();
      return metrics.map(metric => this.mapToSystemMetric(metric));
    } catch (error) {
      logger.error('Error finding system metrics by service', { serviceName });
      throw error;
    }
  }

  static async getLatestMetric(serviceName: string, metricName: string): Promise<SystemMetric | null> {
    try {
      const metric = await MongooseSystemMetricModel.findOne({ serviceName, metricName })
        .sort({ timestamp: -1 })
        .lean();
      return metric ? this.mapToSystemMetric(metric) : null;
    } catch (error) {
      logger.error('Error getting latest metric', { serviceName, metricName });
      throw error;
    }
  }

  static async getAggregatedMetrics(
    serviceName: string,
    metricName: string,
    startTime: Date,
    endTime: Date,
    aggregation: 'avg' | 'sum' | 'min' | 'max' = 'avg'
  ): Promise<number> {
    try {
      const aggregationMap: Record<string, any> = {
        avg: { $avg: '$value' },
        sum: { $sum: '$value' },
        min: { $min: '$value' },
        max: { $max: '$value' }
      };

      const result = await MongooseSystemMetricModel.aggregate([
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
    } catch (error) {
      logger.error('Error getting aggregated metrics', { serviceName, metricName });
      throw error;
    }
  }

  static async findByTimeRange(
    startTime: Date,
    endTime: Date,
    serviceName?: string,
    metricName?: string,
    limit: number = 1000,
    offset: number = 0
  ): Promise<SystemMetric[]> {
    const metrics = await this.findByService(
      serviceName || '',
      metricName,
      startTime,
      endTime,
      limit + offset
    );
    return metrics.slice(offset);
  }

  static async findByMetricName(
    metricName: string,
    serviceName?: string,
    startTime?: Date,
    endTime?: Date,
    limit: number = 1000
  ): Promise<SystemMetric[]> {
    try {
      const query: any = { metricName };
      if (serviceName) query.serviceName = serviceName;
      if (startTime || endTime) {
        query.timestamp = {};
        if (startTime) query.timestamp.$gte = startTime;
        if (endTime) query.timestamp.$lte = endTime;
      }

      const metrics = await MongooseSystemMetricModel.find(query)
        .sort({ timestamp: -1 })
        .limit(limit)
        .lean();
      return metrics.map(metric => this.mapToSystemMetric(metric));
    } catch (error) {
      logger.error('Error finding metrics by name', { metricName });
      throw error;
    }
  }

  static async getMetricsCountByService(serviceName: string): Promise<number> {
    try {
      return await MongooseSystemMetricModel.countDocuments({ serviceName });
    } catch (error) {
      logger.error('Error getting metrics count', { serviceName });
      throw error;
    }
  }

  static async getServiceMetricsSummary(serviceName: string, hours: number = 24): Promise<any> {
    try {
      const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);
      const metrics = await this.findByService(serviceName, undefined, startTime, new Date());
      
      const summary: any = {
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
        summary.averageValues[metricName] = values.reduce((sum: number, val: number) => sum + val, 0) / values.length;
      });

      return summary;
    } catch (error) {
      logger.error('Error getting service metrics summary', { serviceName });
      throw error;
    }
  }

  static async deleteOldMetrics(daysToKeep: number = 30): Promise<number> {
    return this.cleanupOldMetrics(daysToKeep);
  }

  static async cleanupOldMetrics(daysToKeep: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
      const result = await MongooseSystemMetricModel.deleteMany({
        timestamp: { $lt: cutoffDate }
      });
      return result.deletedCount;
    } catch (error) {
      logger.error('Error cleaning up old metrics', { daysToKeep });
      throw error;
    }
  }

  private static mapToSystemMetric(doc: any): SystemMetric {
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

import { ServiceHealthModel as MongooseServiceHealthModel, ServiceStatus } from './mongoose/ServiceHealth';
import { ServiceHealth, ServiceStatus as ServiceStatusType } from '@/types';
import logger from '@/utils/logger';

export class ServiceHealthModel {
  static async create(data: Omit<ServiceHealth, 'id'>): Promise<ServiceHealth> {
    try {
      const healthRecord = await MongooseServiceHealthModel.create({
        serviceName: data.serviceName,
        serviceUrl: data.serviceUrl,
        status: data.status,
        responseTime: data.responseTime,
        errorMessage: data.errorMessage,
        metadata: data.metadata,
      });

      return this.mapToServiceHealth(healthRecord);
    } catch (error) {
      logger.error('Error creating service health record', {
        serviceName: data.serviceName,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  static async findById(id: string): Promise<ServiceHealth | null> {
    try {
      const healthRecord = await MongooseServiceHealthModel.findById(id).lean();
      return healthRecord ? this.mapToServiceHealth(healthRecord) : null;
    } catch (error) {
      logger.error('Error finding service health by ID', { id });
      throw error;
    }
  }

  static async findLatest(serviceName: string): Promise<ServiceHealth | null> {
    try {
      const healthRecord = await MongooseServiceHealthModel.findOne({ serviceName })
        .sort({ lastChecked: -1 })
        .lean();
      return healthRecord ? this.mapToServiceHealth(healthRecord) : null;
    } catch (error) {
      logger.error('Error finding latest service health', { serviceName });
      throw error;
    }
  }

  static async findByService(serviceName: string, limit: number = 100): Promise<ServiceHealth[]> {
    try {
      const records = await MongooseServiceHealthModel.find({ serviceName })
        .sort({ lastChecked: -1 })
        .limit(limit)
        .lean();
      return records.map(record => this.mapToServiceHealth(record));
    } catch (error) {
      logger.error('Error finding service health by service', { serviceName });
      throw error;
    }
  }

  static async findByStatus(status: ServiceStatusType, limit: number = 100): Promise<ServiceHealth[]> {
    try {
      const records = await MongooseServiceHealthModel.find({ status })
        .sort({ lastChecked: -1 })
        .limit(limit)
        .lean();
      return records.map(record => this.mapToServiceHealth(record));
    } catch (error) {
      logger.error('Error finding service health by status', { status });
      throw error;
    }
  }

  static async update(id: string, data: Partial<ServiceHealth>): Promise<ServiceHealth> {
    try {
      const healthRecord = await MongooseServiceHealthModel.findByIdAndUpdate(
        id,
        { $set: data },
        { new: true, runValidators: true }
      );
      if (!healthRecord) throw new Error('Service health record not found');
      return this.mapToServiceHealth(healthRecord);
    } catch (error) {
      logger.error('Error updating service health', { id });
      throw error;
    }
  }

  static async delete(id: string): Promise<void> {
    try {
      await MongooseServiceHealthModel.findByIdAndDelete(id);
    } catch (error) {
      logger.error('Error deleting service health', { id });
      throw error;
    }
  }

  static async getServicesSummary(): Promise<Record<string, ServiceHealth>> {
    try {
      const records = await MongooseServiceHealthModel.aggregate([
        { $sort: { lastChecked: -1 } },
        { $group: { _id: '$serviceName', latest: { $first: '$$ROOT' } } }
      ]);
      
      const summary: Record<string, ServiceHealth> = {};
      records.forEach((record: any) => {
        summary[record._id] = this.mapToServiceHealth(record.latest);
      });
      return summary;
    } catch (error) {
      logger.error('Error getting services summary');
      throw error;
    }
  }

  static async cleanupOldRecords(daysToKeep: number = 7): Promise<number> {
    try {
      const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
      const result = await MongooseServiceHealthModel.deleteMany({
        lastChecked: { $lt: cutoffDate }
      });
      return result.deletedCount;
    } catch (error) {
      logger.error('Error cleaning up old records', { daysToKeep });
      throw error;
    }
  }

  static async getAllServicesHealth(): Promise<ServiceHealth[]> {
    try {
      const summary = await this.getServicesSummary();
      return Object.values(summary);
    } catch (error) {
      logger.error('Error getting all services health');
      throw error;
    }
  }

  static async findLatestByService(serviceName: string): Promise<ServiceHealth | null> {
    return this.findLatest(serviceName);
  }

  static async getHealthSummary(serviceName: string, hours: number = 24): Promise<any> {
    try {
      const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);
      const records = await MongooseServiceHealthModel.find({
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

      const healthyCount = records.filter(r => r.status === ServiceStatus.HEALTHY).length;
      const responseTimes = records.filter(r => r.responseTime).map(r => r.responseTime!);

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
    } catch (error) {
      logger.error('Error getting health summary', { serviceName });
      throw error;
    }
  }

  private static mapToServiceHealth(doc: any): ServiceHealth {
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

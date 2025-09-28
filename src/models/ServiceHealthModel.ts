import { prisma } from '@/database/connection';
import { ServiceHealth, ServiceStatus } from '@/types';
import { logger } from '@/utils/logger';

export class ServiceHealthModel {
  /**
   * Create a new service health record
   */
  static async create(data: Omit<ServiceHealth, 'id'>): Promise<ServiceHealth> {
    try {
      const healthRecord = await prisma.serviceHealth.create({
        data: {
          serviceName: data.serviceName,
          serviceUrl: data.serviceUrl,
          status: data.status,
          responseTime: data.responseTime,
          errorMessage: data.errorMessage,
          metadata: data.metadata,
        },
      });

      logger.debug('Service health record created', {
        serviceName: data.serviceName,
        status: data.status,
        responseTime: data.responseTime,
      });

      return healthRecord as ServiceHealth;
    } catch (error) {
      logger.error('Error creating service health record', {
        serviceName: data.serviceName,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get service health by ID
   */
  static async findById(id: string): Promise<ServiceHealth | null> {
    try {
      const healthRecord = await prisma.serviceHealth.findUnique({
        where: { id },
      });

      return healthRecord as ServiceHealth | null;
    } catch (error) {
      logger.error('Error finding service health by ID', {
        id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get latest health status for a service
   */
  static async findLatestByService(serviceName: string): Promise<ServiceHealth | null> {
    try {
      const healthRecord = await prisma.serviceHealth.findFirst({
        where: { serviceName },
        orderBy: { lastChecked: 'desc' },
      });

      return healthRecord as ServiceHealth | null;
    } catch (error) {
      logger.error('Error finding latest service health', {
        serviceName,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get health records for multiple services
   */
  static async findByServices(serviceNames: string[]): Promise<ServiceHealth[]> {
    try {
      const healthRecords = await prisma.serviceHealth.findMany({
        where: {
          serviceName: { in: serviceNames },
        },
        orderBy: { lastChecked: 'desc' },
      });

      return healthRecords as ServiceHealth[];
    } catch (error) {
      logger.error('Error finding service health records', {
        serviceNames,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get health records by status
   */
  static async findByStatus(status: ServiceStatus): Promise<ServiceHealth[]> {
    try {
      const healthRecords = await prisma.serviceHealth.findMany({
        where: { status },
        orderBy: { lastChecked: 'desc' },
      });

      return healthRecords as ServiceHealth[];
    } catch (error) {
      logger.error('Error finding service health by status', {
        status,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get health records within a time range
   */
  static async findByTimeRange(
    startTime: Date,
    endTime: Date,
    serviceName?: string
  ): Promise<ServiceHealth[]> {
    try {
      const whereClause: any = {
        lastChecked: {
          gte: startTime,
          lte: endTime,
        },
      };

      if (serviceName) {
        whereClause.serviceName = serviceName;
      }

      const healthRecords = await prisma.serviceHealth.findMany({
        where: whereClause,
        orderBy: { lastChecked: 'desc' },
      });

      return healthRecords as ServiceHealth[];
    } catch (error) {
      logger.error('Error finding service health by time range', {
        startTime,
        endTime,
        serviceName,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Update service health record
   */
  static async update(id: string, data: Partial<ServiceHealth>): Promise<ServiceHealth> {
    try {
      const healthRecord = await prisma.serviceHealth.update({
        where: { id },
        data: {
          ...data,
          lastChecked: new Date(),
        },
      });

      logger.debug('Service health record updated', {
        id,
        serviceName: data.serviceName,
        status: data.status,
      });

      return healthRecord as ServiceHealth;
    } catch (error) {
      logger.error('Error updating service health record', {
        id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Delete service health record
   */
  static async delete(id: string): Promise<void> {
    try {
      await prisma.serviceHealth.delete({
        where: { id },
      });

      logger.debug('Service health record deleted', { id });
    } catch (error) {
      logger.error('Error deleting service health record', {
        id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get service health summary
   */
  static async getHealthSummary(serviceName: string, hours: number = 24): Promise<{
    serviceName: string;
    totalChecks: number;
    healthyChecks: number;
    unhealthyChecks: number;
    degradedChecks: number;
    averageResponseTime: number;
    uptime: number;
    lastChecked: Date | null;
  }> {
    try {
      const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);

      const healthRecords = await prisma.serviceHealth.findMany({
        where: {
          serviceName,
          lastChecked: {
            gte: startTime,
          },
        },
        orderBy: { lastChecked: 'desc' },
      });

      const totalChecks = healthRecords.length;
      const healthyChecks = healthRecords.filter(r => r.status === ServiceStatus.HEALTHY).length;
      const unhealthyChecks = healthRecords.filter(r => r.status === ServiceStatus.UNHEALTHY).length;
      const degradedChecks = healthRecords.filter(r => r.status === ServiceStatus.DEGRADED).length;
      
      const averageResponseTime = healthRecords
        .filter(r => r.responseTime !== null)
        .reduce((sum, r) => sum + (r.responseTime || 0), 0) / 
        healthRecords.filter(r => r.responseTime !== null).length || 0;

      const uptime = totalChecks > 0 ? (healthyChecks / totalChecks) * 100 : 0;

      return {
        serviceName,
        totalChecks,
        healthyChecks,
        unhealthyChecks,
        degradedChecks,
        averageResponseTime,
        uptime,
        lastChecked: healthRecords[0]?.lastChecked || null,
      };
    } catch (error) {
      logger.error('Error getting service health summary', {
        serviceName,
        hours,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get all services health status
   */
  static async getAllServicesHealth(): Promise<ServiceHealth[]> {
    try {
      // Get the latest health record for each service
      const services = await prisma.serviceHealth.groupBy({
        by: ['serviceName'],
        _max: {
          lastChecked: true,
        },
      });

      const healthRecords = await Promise.all(
        services.map(async (service) => {
          const latestRecord = await prisma.serviceHealth.findFirst({
            where: {
              serviceName: service.serviceName,
              lastChecked: service._max.lastChecked,
            },
            orderBy: { lastChecked: 'desc' },
          });
          return latestRecord;
        })
      );

      return healthRecords.filter(Boolean) as ServiceHealth[];
    } catch (error) {
      logger.error('Error getting all services health', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Clean up old health records
   */
  static async cleanupOldRecords(daysToKeep: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

      const result = await prisma.serviceHealth.deleteMany({
        where: {
          lastChecked: {
            lt: cutoffDate,
          },
        },
      });

      logger.info('Cleaned up old service health records', {
        deletedCount: result.count,
        cutoffDate,
      });

      return result.count;
    } catch (error) {
      logger.error('Error cleaning up old service health records', {
        daysToKeep,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}

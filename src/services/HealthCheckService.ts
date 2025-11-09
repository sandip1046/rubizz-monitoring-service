import axios, { AxiosResponse } from 'axios';
import { ServiceHealthModel } from '@/models/ServiceHealthModel';
import { ServiceHealth, ServiceStatus, HealthCheckResponse } from '@/types';
import { config, DEFAULT_SERVICES } from '@/config/config';
import logger from '@/utils/logger';

export class HealthCheckService {
  private static instance: HealthCheckService;
  private isRunning: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;

  private constructor() {}

  public static getInstance(): HealthCheckService {
    if (!HealthCheckService.instance) {
      HealthCheckService.instance = new HealthCheckService();
    }
    return HealthCheckService.instance;
  }

  /**
   * Start health check monitoring
   */
  public async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Health check service is already running');
      return;
    }

    this.isRunning = true;
    logger.info('Starting health check service', {
      interval: config.monitoring.healthCheckInterval,
      services: DEFAULT_SERVICES.length,
    });

    // Run initial health checks
    await this.runHealthChecks();

    // Set up interval for periodic health checks
    this.intervalId = setInterval(async () => {
      try {
        await this.runHealthChecks();
      } catch (error) {
        logger.error('Error during periodic health checks', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }, config.monitoring.healthCheckInterval);
  }

  /**
   * Stop health check monitoring
   */
  public async stop(): Promise<void> {
    if (!this.isRunning) {
      logger.warn('Health check service is not running');
      return;
    }

    this.isRunning = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    logger.info('Health check service stopped');
  }

  /**
   * Run health checks for all services
   */
  public async runHealthChecks(): Promise<void> {
    const healthChecks = DEFAULT_SERVICES.map(service => this.checkServiceHealth(service));
    const results = await Promise.allSettled(healthChecks);

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    logger.info('Health checks completed', {
      total: DEFAULT_SERVICES.length,
      successful,
      failed,
    });
  }

  /**
   * Check health of a single service
   */
  public async checkServiceHealth(service: {
    name: string;
    url: string;
    port: number;
  }): Promise<ServiceHealth> {
    const startTime = Date.now();
    let status: ServiceStatus = ServiceStatus.UNKNOWN;
    let responseTime: number | null = null;
    let errorMessage: string | null = null;
    let metadata: Record<string, any> = {};

    try {
      // Prepare headers
      const headers: Record<string, string> = {
        'User-Agent': `${config.server.serviceName}/${config.server.serviceVersion}`,
      };

      // Add API Gateway token if this is an API Gateway health check and token is configured
      if (service.name === 'rubizz-api-gateway' && config.apiGateway.token) {
        headers['Authorization'] = `Bearer ${config.apiGateway.token}`;
        headers['X-Service-Token'] = config.apiGateway.token;
      }

      const response: AxiosResponse<HealthCheckResponse> = await axios.get(service.url, {
        timeout: 10000, // 10 second timeout
        headers,
      });

      responseTime = Date.now() - startTime;
      status = this.mapStatusToServiceStatus(response.data.status);
      metadata = {
        statusCode: response.status,
        version: response.data.details?.version,
        uptime: response.data.details?.uptime,
        memory: response.data.details?.memory,
        cpu: response.data.details?.cpu,
        database: response.data.details?.database,
        redis: response.data.details?.redis,
        checks: response.data.details?.checks,
      };

      logger.debug('Service health check successful', {
        serviceName: service.name,
        status,
        responseTime,
        statusCode: response.status,
      });
    } catch (error) {
      responseTime = Date.now() - startTime;
      status = ServiceStatus.UNHEALTHY;
      errorMessage = error instanceof Error ? error.message : 'Unknown error';
      metadata = {
        error: errorMessage,
        isTimeout: error instanceof Error && error.message.includes('timeout'),
        isNetworkError: error instanceof Error && error.message.includes('Network Error'),
      };

      logger.warn('Service health check failed', {
        serviceName: service.name,
        status,
        responseTime,
        error: errorMessage,
      });
    }

    // Create health record
    const healthRecord = await ServiceHealthModel.create({
      serviceName: service.name,
      serviceUrl: service.url,
      status,
      responseTime,
      errorMessage: errorMessage || undefined,
      metadata,
    });

    return healthRecord;
  }

  /**
   * Check health of a custom service
   */
  public async checkCustomServiceHealth(
    serviceName: string,
    serviceUrl: string,
    timeout: number = 10000
  ): Promise<ServiceHealth> {
    const startTime = Date.now();
    let status: ServiceStatus = ServiceStatus.UNKNOWN;
    let responseTime: number | null = null;
    let errorMessage: string | null = null;
    let metadata: Record<string, any> = {};

    try {
      // Prepare headers
      const headers: Record<string, string> = {
        'User-Agent': `${config.server.serviceName}/${config.server.serviceVersion}`,
      };

      // Add API Gateway token if this is an API Gateway health check and token is configured
      if (serviceUrl.includes(config.apiGateway.url) && config.apiGateway.token) {
        headers['Authorization'] = `Bearer ${config.apiGateway.token}`;
        headers['X-Service-Token'] = config.apiGateway.token;
      }

      const response: AxiosResponse<HealthCheckResponse> = await axios.get(serviceUrl, {
        timeout,
        headers,
      });

      responseTime = Date.now() - startTime;
      status = this.mapStatusToServiceStatus(response.data.status);
      metadata = {
        statusCode: response.status,
        version: response.data.details?.version,
        uptime: response.data.details?.uptime,
        memory: response.data.details?.memory,
        cpu: response.data.details?.cpu,
        database: response.data.details?.database,
        redis: response.data.details?.redis,
        checks: response.data.details?.checks,
      };

      logger.debug('Custom service health check successful', {
        serviceName,
        status,
        responseTime,
        statusCode: response.status,
      });
    } catch (error) {
      responseTime = Date.now() - startTime;
      status = ServiceStatus.UNHEALTHY;
      errorMessage = error instanceof Error ? error.message : 'Unknown error';
      metadata = {
        error: errorMessage,
        isTimeout: error instanceof Error && error.message.includes('timeout'),
        isNetworkError: error instanceof Error && error.message.includes('Network Error'),
      };

      logger.warn('Custom service health check failed', {
        serviceName,
        status,
        responseTime,
        error: errorMessage,
      });
    }

    // Create health record
    const healthRecord = await ServiceHealthModel.create({
      serviceName,
      serviceUrl,
      status,
      responseTime,
      errorMessage: errorMessage || undefined,
      metadata,
    });

    return healthRecord;
  }

  /**
   * Get latest health status for all services
   */
  public async getAllServicesHealth(): Promise<ServiceHealth[]> {
    try {
      return await ServiceHealthModel.getAllServicesHealth();
    } catch (error) {
      logger.error('Error getting all services health', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get health status for a specific service
   */
  public async getServiceHealth(serviceName: string): Promise<ServiceHealth | null> {
    try {
      return await ServiceHealthModel.findLatestByService(serviceName);
    } catch (error) {
      logger.error('Error getting service health', {
        serviceName,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get health summary for a service
   */
  public async getServiceHealthSummary(
    serviceName: string,
    hours: number = 24
  ): Promise<{
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
      return await ServiceHealthModel.getHealthSummary(serviceName, hours);
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
   * Get services by status
   */
  public async getServicesByStatus(status: ServiceStatus): Promise<ServiceHealth[]> {
    try {
      return await ServiceHealthModel.findByStatus(status);
    } catch (error) {
      logger.error('Error getting services by status', {
        status,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Map health check response status to ServiceStatus enum
   */
  private mapStatusToServiceStatus(status: string): ServiceStatus {
    switch (status.toLowerCase()) {
      case 'healthy':
        return ServiceStatus.HEALTHY;
      case 'unhealthy':
        return ServiceStatus.UNHEALTHY;
      case 'degraded':
        return ServiceStatus.DEGRADED;
      case 'maintenance':
        return ServiceStatus.MAINTENANCE;
      default:
        return ServiceStatus.UNKNOWN;
    }
  }

  /**
   * Check if health check service is running
   */
  public isHealthCheckRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Get health check service status
   */
  public getServiceStatus(): {
    isRunning: boolean;
    interval: number;
    monitoredServices: number;
  } {
    return {
      isRunning: this.isRunning,
      interval: config.monitoring.healthCheckInterval,
      monitoredServices: DEFAULT_SERVICES.length,
    };
  }

  /**
   * Clean up old health check records
   */
  public async cleanupOldRecords(daysToKeep: number = 30): Promise<number> {
    try {
      return await ServiceHealthModel.cleanupOldRecords(daysToKeep);
    } catch (error) {
      logger.error('Error cleaning up old health check records', {
        daysToKeep,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}

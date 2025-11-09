import { Request, Response } from 'express';
import { HealthCheckService } from '@/services/HealthCheckService';
import { MetricsCollectionService } from '@/services/MetricsCollectionService';
import { AlertService } from '@/services/AlertService';
import { NotificationService } from '@/services/NotificationService';
import { connectDatabase, isDatabaseConnected, databaseHealthCheck } from '@/database/connection';
import { RedisService } from '@/services/RedisService';
import { config } from '@/config/config';
import logger from '@/utils/logger';
import { HealthCheckResponse, ApiResponse, ServiceStatus } from '@/types';

export class HealthController {
  private healthCheckService: HealthCheckService;
  private metricsCollectionService: MetricsCollectionService;
  private alertService: AlertService;
  private notificationService: NotificationService;
  private redisService: RedisService;

  constructor() {
    this.healthCheckService = HealthCheckService.getInstance();
    this.metricsCollectionService = MetricsCollectionService.getInstance();
    this.alertService = AlertService.getInstance();
    this.notificationService = NotificationService.getInstance();
    this.redisService = new RedisService();
  }

  /**
   * Get service health status
   */
  public async getHealth(req: Request, res: Response): Promise<void> {
    try {
      const startTime = Date.now();
      const requestId = req.headers['x-request-id'] as string || 'unknown';

      // Check database connection
      const databaseConnected = await databaseHealthCheck();
      const databaseResponseTime = Date.now() - startTime;

      // Check Redis connection
      const redisHealthCheck = await this.redisService.healthCheck();
      const redisConnected = redisHealthCheck.session && redisHealthCheck.cache && redisHealthCheck.queue;
      const redisResponseTime = Date.now() - startTime;

      // Get service statuses
      const healthCheckStatus = this.healthCheckService.getServiceStatus();
      const metricsStatus = this.metricsCollectionService.getServiceStatus();
      const alertStatus = this.alertService.getServiceStatus();
      const notificationStatus = this.notificationService.getServiceStatus();

      // Calculate overall health
      const isHealthy = databaseConnected && redisConnected && 
                       healthCheckStatus.isRunning && metricsStatus.isRunning;

      const response: HealthCheckResponse = {
        status: isHealthy ? ServiceStatus.HEALTHY : ServiceStatus.UNHEALTHY,
        serviceName: config.server.serviceName,
        timestamp: new Date(),
        responseTime: Date.now() - startTime,
        details: {
          version: config.server.serviceVersion,
          uptime: process.uptime(),
          memory: {
            used: process.memoryUsage().heapUsed,
            total: process.memoryUsage().heapTotal,
            percentage: (process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100,
          },
          cpu: {
            usage: 0, // Would need to calculate actual CPU usage
            load: require('os').loadavg(),
          },
          database: {
            connected: databaseConnected,
            responseTime: databaseResponseTime,
          },
          redis: {
            connected: redisConnected,
            responseTime: redisResponseTime,
          },
        },
      };
      
      // Add checks as additional property (not in type definition)
      (response as any).checks = {
        database: databaseConnected,
        redis: redisConnected,
        externalServices: true, // Would check external services
      };

      // Add service statuses to response
      (response as any).services = {
        healthCheck: healthCheckStatus,
        metricsCollection: metricsStatus,
        alert: alertStatus,
        notification: notificationStatus,
      };

      const statusCode = isHealthy ? 200 : 503;
      res.status(statusCode).json(response);

      logger.info('Health check completed', {
        requestId,
        status: response.status,
        responseTime: response.responseTime,
        databaseConnected,
        redisConnected,
      });
    } catch (error) {
      logger.error('Error in health check', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });

      const errorResponse: HealthCheckResponse = {
        status: ServiceStatus.UNHEALTHY,
        serviceName: config.server.serviceName,
        timestamp: new Date(),
        responseTime: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      res.status(503).json(errorResponse);
    }
  }

  /**
   * Get detailed health status
   */
  public async getDetailedHealth(req: Request, res: Response): Promise<void> {
    try {
      const requestId = req.headers['x-request-id'] as string || 'unknown';
      const startTime = Date.now();

      // Get all services health
      const allServicesHealth = await this.healthCheckService.getAllServicesHealth();

      // Get system metrics
      const systemMetrics = await this.metricsCollectionService.getMetricsSummary(
        config.server.serviceName,
        1 // Last hour
      );

      // Get active alerts
      const activeAlerts = await this.alertService.getActiveAlerts(10);

      // Get alerts summary
      const alertsSummary = await this.alertService.getAlertsSummary();

      const response: ApiResponse = {
        success: true,
        data: {
          service: {
            name: config.server.serviceName,
            version: config.server.serviceVersion,
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            cpu: require('os').loadavg(),
          },
          services: allServicesHealth,
          metrics: systemMetrics,
          alerts: {
            active: activeAlerts,
            summary: alertsSummary,
          },
          timestamp: new Date(),
        },
        timestamp: new Date(),
        requestId,
      };

      res.json(response);

      logger.info('Detailed health check completed', {
        requestId,
        responseTime: Date.now() - startTime,
        servicesCount: allServicesHealth.length,
        activeAlertsCount: activeAlerts.length,
      });
    } catch (error) {
      logger.error('Error in detailed health check', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });

      const errorResponse: ApiResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
        requestId: req.headers['x-request-id'] as string || 'unknown',
      };

      res.status(500).json(errorResponse);
    }
  }

  /**
   * Get service health by name
   */
  public async getServiceHealth(req: Request, res: Response): Promise<void> {
    try {
      const { serviceName } = req.params;
      const requestId = req.headers['x-request-id'] as string || 'unknown';

      if (!serviceName) {
        res.status(400).json({
          success: false,
          error: 'Service name is required',
          timestamp: new Date(),
          requestId,
        });
        return;
      }

      const serviceHealth = await this.healthCheckService.getServiceHealth(serviceName);

      if (!serviceHealth) {
        res.status(404).json({
          success: false,
          error: 'Service not found',
          timestamp: new Date(),
          requestId,
        });
        return;
      }

      const response: ApiResponse = {
        success: true,
        data: serviceHealth,
        timestamp: new Date(),
        requestId,
      };

      res.json(response);

      logger.info('Service health retrieved', {
        requestId,
        serviceName,
        status: serviceHealth.status,
      });
    } catch (error) {
      logger.error('Error getting service health', {
        serviceName: req.params.serviceName,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      const errorResponse: ApiResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
        requestId: req.headers['x-request-id'] as string || 'unknown',
      };

      res.status(500).json(errorResponse);
    }
  }

  /**
   * Get service health summary
   */
  public async getServiceHealthSummary(req: Request, res: Response): Promise<void> {
    try {
      const { serviceName } = req.params;
      const { hours = '24' } = req.query;
      const requestId = req.headers['x-request-id'] as string || 'unknown';

      if (!serviceName) {
        res.status(400).json({
          success: false,
          error: 'Service name is required',
          timestamp: new Date(),
          requestId,
        });
        return;
      }

      const hoursNumber = parseInt(hours as string, 10);
      if (isNaN(hoursNumber) || hoursNumber < 1 || hoursNumber > 168) {
        res.status(400).json({
          success: false,
          error: 'Hours must be a number between 1 and 168',
          timestamp: new Date(),
          requestId,
        });
        return;
      }

      const summary = await this.healthCheckService.getServiceHealthSummary(
        serviceName,
        hoursNumber
      );

      const response: ApiResponse = {
        success: true,
        data: summary,
        timestamp: new Date(),
        requestId,
      };

      res.json(response);

      logger.info('Service health summary retrieved', {
        requestId,
        serviceName,
        hours: hoursNumber,
        totalChecks: summary.totalChecks,
        uptime: summary.uptime,
      });
    } catch (error) {
      logger.error('Error getting service health summary', {
        serviceName: req.params.serviceName,
        hours: req.query.hours,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      const errorResponse: ApiResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
        requestId: req.headers['x-request-id'] as string || 'unknown',
      };

      res.status(500).json(errorResponse);
    }
  }

  /**
   * Get services by status
   */
  public async getServicesByStatus(req: Request, res: Response): Promise<void> {
    try {
      const { status } = req.params;
      const requestId = req.headers['x-request-id'] as string || 'unknown';

      if (!status) {
        res.status(400).json({
          success: false,
          error: 'Status is required',
          timestamp: new Date(),
          requestId,
        });
        return;
      }

      const validStatuses = ['HEALTHY', 'UNHEALTHY', 'DEGRADED', 'UNKNOWN', 'MAINTENANCE'];
      if (!validStatuses.includes(status.toUpperCase())) {
        res.status(400).json({
          success: false,
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
          timestamp: new Date(),
          requestId,
        });
        return;
      }

      const services = await this.healthCheckService.getServicesByStatus(
        status.toUpperCase() as any
      );

      const response: ApiResponse = {
        success: true,
        data: services,
        timestamp: new Date(),
        requestId,
      };

      res.json(response);

      logger.info('Services by status retrieved', {
        requestId,
        status,
        count: services.length,
      });
    } catch (error) {
      logger.error('Error getting services by status', {
        status: req.params.status,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      const errorResponse: ApiResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
        requestId: req.headers['x-request-id'] as string || 'unknown',
      };

      res.status(500).json(errorResponse);
    }
  }

  /**
   * Check custom service health
   */
  public async checkCustomServiceHealth(req: Request, res: Response): Promise<void> {
    try {
      const { serviceName, serviceUrl, timeout = '10000' } = req.body;
      const requestId = req.headers['x-request-id'] as string || 'unknown';

      if (!serviceName || !serviceUrl) {
        res.status(400).json({
          success: false,
          error: 'Service name and URL are required',
          timestamp: new Date(),
          requestId,
        });
        return;
      }

      const timeoutNumber = parseInt(timeout, 10);
      if (isNaN(timeoutNumber) || timeoutNumber < 1000 || timeoutNumber > 30000) {
        res.status(400).json({
          success: false,
          error: 'Timeout must be a number between 1000 and 30000 milliseconds',
          timestamp: new Date(),
          requestId,
        });
        return;
      }

      const healthRecord = await this.healthCheckService.checkCustomServiceHealth(
        serviceName,
        serviceUrl,
        timeoutNumber
      );

      const response: ApiResponse = {
        success: true,
        data: healthRecord,
        timestamp: new Date(),
        requestId,
      };

      res.json(response);

      logger.info('Custom service health check completed', {
        requestId,
        serviceName,
        serviceUrl,
        status: healthRecord.status,
        responseTime: healthRecord.responseTime,
      });
    } catch (error) {
      logger.error('Error checking custom service health', {
        serviceName: req.body.serviceName,
        serviceUrl: req.body.serviceUrl,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      const errorResponse: ApiResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
        requestId: req.headers['x-request-id'] as string || 'unknown',
      };

      res.status(500).json(errorResponse);
    }
  }

  /**
   * Start health check service
   */
  public async startHealthCheckService(req: Request, res: Response): Promise<void> {
    try {
      const requestId = req.headers['x-request-id'] as string || 'unknown';

      await this.healthCheckService.start();

      const response: ApiResponse = {
        success: true,
        message: 'Health check service started successfully',
        data: this.healthCheckService.getServiceStatus(),
        timestamp: new Date(),
        requestId,
      };

      res.json(response);

      logger.info('Health check service started', {
        requestId,
        status: this.healthCheckService.getServiceStatus(),
      });
    } catch (error) {
      logger.error('Error starting health check service', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      const errorResponse: ApiResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
        requestId: req.headers['x-request-id'] as string || 'unknown',
      };

      res.status(500).json(errorResponse);
    }
  }

  /**
   * Stop health check service
   */
  public async stopHealthCheckService(req: Request, res: Response): Promise<void> {
    try {
      const requestId = req.headers['x-request-id'] as string || 'unknown';

      await this.healthCheckService.stop();

      const response: ApiResponse = {
        success: true,
        message: 'Health check service stopped successfully',
        data: this.healthCheckService.getServiceStatus(),
        timestamp: new Date(),
        requestId,
      };

      res.json(response);

      logger.info('Health check service stopped', {
        requestId,
        status: this.healthCheckService.getServiceStatus(),
      });
    } catch (error) {
      logger.error('Error stopping health check service', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      const errorResponse: ApiResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
        requestId: req.headers['x-request-id'] as string || 'unknown',
      };

      res.status(500).json(errorResponse);
    }
  }
}

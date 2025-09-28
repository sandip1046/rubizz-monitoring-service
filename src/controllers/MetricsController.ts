import { Request, Response } from 'express';
import { MetricsCollectionService } from '@/services/MetricsCollectionService';
import { SystemMetricsModel } from '@/models/SystemMetricsModel';
import { PerformanceMetricsModel } from '@/models/PerformanceMetricsModel';
import { logger } from '@/utils/logger';
import { ApiResponse, PaginatedResponse, FilterParams } from '@/types';

export class MetricsController {
  private metricsCollectionService: MetricsCollectionService;

  constructor() {
    this.metricsCollectionService = MetricsCollectionService.getInstance();
  }

  /**
   * Get system metrics
   */
  public async getSystemMetrics(req: Request, res: Response): Promise<void> {
    try {
      const {
        serviceName,
        metricName,
        startTime,
        endTime,
        aggregation,
        groupBy,
        limit = '100',
        offset = '0',
      } = req.query;

      const requestId = req.headers['x-request-id'] as string || 'unknown';

      const limitNumber = parseInt(limit as string, 10);
      const offsetNumber = parseInt(offset as string, 10);

      if (isNaN(limitNumber) || limitNumber < 1 || limitNumber > 1000) {
        res.status(400).json({
          success: false,
          error: 'Limit must be a number between 1 and 1000',
          timestamp: new Date(),
          requestId,
        });
        return;
      }

      if (isNaN(offsetNumber) || offsetNumber < 0) {
        res.status(400).json({
          success: false,
          error: 'Offset must be a non-negative number',
          timestamp: new Date(),
          requestId,
        });
        return;
      }

      let metrics;
      let totalCount = 0;

      if (startTime && endTime) {
        const start = new Date(startTime as string);
        const end = new Date(endTime as string);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          res.status(400).json({
            success: false,
            error: 'Invalid startTime or endTime format',
            timestamp: new Date(),
            requestId,
          });
          return;
        }

        metrics = await SystemMetricsModel.findByTimeRange(
          start,
          end,
          serviceName as string,
          metricName as string,
          limitNumber,
          offsetNumber
        );

        // Get total count for pagination
        const allMetrics = await SystemMetricsModel.findByTimeRange(
          start,
          end,
          serviceName as string,
          metricName as string,
          10000, // Large limit to get count
          0
        );
        totalCount = allMetrics.length;
      } else if (serviceName) {
        metrics = await SystemMetricsModel.findByService(
          serviceName as string,
          limitNumber,
          offsetNumber
        );
        totalCount = await SystemMetricsModel.getMetricsCountByService(serviceName as string);
      } else if (metricName) {
        metrics = await SystemMetricsModel.findByMetricName(
          metricName as string,
          serviceName as string,
          limitNumber,
          offsetNumber
        );
        totalCount = metrics.length; // Approximate count
      } else {
        res.status(400).json({
          success: false,
          error: 'At least one of serviceName, metricName, or time range must be provided',
          timestamp: new Date(),
          requestId,
        });
        return;
      }

      // Apply aggregation if requested
      let aggregatedValue;
      if (aggregation && metrics.length > 0) {
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
        }
      }

      const response: PaginatedResponse<any> = {
        success: true,
        data: metrics,
        pagination: {
          page: Math.floor(offsetNumber / limitNumber) + 1,
          limit: limitNumber,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limitNumber),
          hasNext: offsetNumber + limitNumber < totalCount,
          hasPrev: offsetNumber > 0,
        },
        timestamp: new Date(),
        requestId,
      };

      if (aggregatedValue !== undefined) {
        (response as any).aggregation = {
          type: aggregation,
          value: aggregatedValue,
        };
      }

      res.json(response);

      logger.info('System metrics retrieved', {
        requestId,
        serviceName,
        metricName,
        count: metrics.length,
        aggregation,
      });
    } catch (error) {
      logger.error('Error getting system metrics', {
        error: error instanceof Error ? error.message : 'Unknown error',
        query: req.query,
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
   * Get performance metrics
   */
  public async getPerformanceMetrics(req: Request, res: Response): Promise<void> {
    try {
      const {
        serviceName,
        endpoint,
        method,
        startTime,
        endTime,
        limit = '100',
        offset = '0',
      } = req.query;

      const requestId = req.headers['x-request-id'] as string || 'unknown';

      const limitNumber = parseInt(limit as string, 10);
      const offsetNumber = parseInt(offset as string, 10);

      if (isNaN(limitNumber) || limitNumber < 1 || limitNumber > 1000) {
        res.status(400).json({
          success: false,
          error: 'Limit must be a number between 1 and 1000',
          timestamp: new Date(),
          requestId,
        });
        return;
      }

      if (isNaN(offsetNumber) || offsetNumber < 0) {
        res.status(400).json({
          success: false,
          error: 'Offset must be a non-negative number',
          timestamp: new Date(),
          requestId,
        });
        return;
      }

      let metrics;

      if (startTime && endTime) {
        const start = new Date(startTime as string);
        const end = new Date(endTime as string);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          res.status(400).json({
            success: false,
            error: 'Invalid startTime or endTime format',
            timestamp: new Date(),
            requestId,
          });
          return;
        }

        metrics = await PerformanceMetricsModel.findByTimeRange(
          start,
          end,
          serviceName as string,
          endpoint as string,
          method as string,
          limitNumber,
          offsetNumber
        );
      } else if (serviceName) {
        metrics = await PerformanceMetricsModel.findByService(
          serviceName as string,
          limitNumber,
          offsetNumber
        );
      } else if (endpoint) {
        metrics = await PerformanceMetricsModel.findByEndpoint(
          endpoint as string,
          serviceName as string,
          limitNumber,
          offsetNumber
        );
      } else {
        res.status(400).json({
          success: false,
          error: 'At least one of serviceName, endpoint, or time range must be provided',
          timestamp: new Date(),
          requestId,
        });
        return;
      }

      const response: ApiResponse = {
        success: true,
        data: metrics,
        timestamp: new Date(),
        requestId,
      };

      res.json(response);

      logger.info('Performance metrics retrieved', {
        requestId,
        serviceName,
        endpoint,
        method,
        count: metrics.length,
      });
    } catch (error) {
      logger.error('Error getting performance metrics', {
        error: error instanceof Error ? error.message : 'Unknown error',
        query: req.query,
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
   * Get performance summary
   */
  public async getPerformanceSummary(req: Request, res: Response): Promise<void> {
    try {
      const { serviceName } = req.params;
      const { startTime, endTime, endpoint } = req.query;
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

      let start: Date;
      let end: Date;

      if (startTime && endTime) {
        start = new Date(startTime as string);
        end = new Date(endTime as string);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          res.status(400).json({
            success: false,
            error: 'Invalid startTime or endTime format',
            timestamp: new Date(),
            requestId,
          });
          return;
        }
      } else {
        // Default to last 24 hours
        end = new Date();
        start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
      }

      const summary = await this.metricsCollectionService.getPerformanceSummary(
        serviceName,
        start,
        end,
        endpoint as string
      );

      const response: ApiResponse = {
        success: true,
        data: summary,
        timestamp: new Date(),
        requestId,
      };

      res.json(response);

      logger.info('Performance summary retrieved', {
        requestId,
        serviceName,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        totalRequests: summary.totalRequests,
        averageResponseTime: summary.averageResponseTime,
      });
    } catch (error) {
      logger.error('Error getting performance summary', {
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
   * Get metrics summary
   */
  public async getMetricsSummary(req: Request, res: Response): Promise<void> {
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

      const summary = await this.metricsCollectionService.getMetricsSummary(
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

      logger.info('Metrics summary retrieved', {
        requestId,
        serviceName,
        hours: hoursNumber,
        totalMetrics: summary.totalMetrics,
        uniqueMetricNames: summary.uniqueMetricNames.length,
      });
    } catch (error) {
      logger.error('Error getting metrics summary', {
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
   * Record custom metric
   */
  public async recordCustomMetric(req: Request, res: Response): Promise<void> {
    try {
      const {
        serviceName,
        metricName,
        value,
        metricType = 'GAUGE',
        labels,
      } = req.body;

      const requestId = req.headers['x-request-id'] as string || 'unknown';

      if (!serviceName || !metricName || value === undefined) {
        res.status(400).json({
          success: false,
          error: 'Service name, metric name, and value are required',
          timestamp: new Date(),
          requestId,
        });
        return;
      }

      if (typeof value !== 'number' || isNaN(value)) {
        res.status(400).json({
          success: false,
          error: 'Value must be a valid number',
          timestamp: new Date(),
          requestId,
        });
        return;
      }

      const validMetricTypes = ['COUNTER', 'GAUGE', 'HISTOGRAM', 'SUMMARY'];
      if (!validMetricTypes.includes(metricType)) {
        res.status(400).json({
          success: false,
          error: `Invalid metric type. Must be one of: ${validMetricTypes.join(', ')}`,
          timestamp: new Date(),
          requestId,
        });
        return;
      }

      await this.metricsCollectionService.recordCustomMetric(
        serviceName,
        metricName,
        value,
        metricType as any,
        labels
      );

      const response: ApiResponse = {
        success: true,
        message: 'Custom metric recorded successfully',
        data: {
          serviceName,
          metricName,
          value,
          metricType,
          labels,
          timestamp: new Date(),
        },
        timestamp: new Date(),
        requestId,
      };

      res.json(response);

      logger.info('Custom metric recorded', {
        requestId,
        serviceName,
        metricName,
        value,
        metricType,
      });
    } catch (error) {
      logger.error('Error recording custom metric', {
        error: error instanceof Error ? error.message : 'Unknown error',
        body: req.body,
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
   * Get slowest endpoints
   */
  public async getSlowestEndpoints(req: Request, res: Response): Promise<void> {
    try {
      const { serviceName } = req.params;
      const { startTime, endTime, limit = '10' } = req.query;
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

      let start: Date;
      let end: Date;

      if (startTime && endTime) {
        start = new Date(startTime as string);
        end = new Date(endTime as string);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          res.status(400).json({
            success: false,
            error: 'Invalid startTime or endTime format',
            timestamp: new Date(),
            requestId,
          });
          return;
        }
      } else {
        // Default to last 24 hours
        end = new Date();
        start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
      }

      const limitNumber = parseInt(limit as string, 10);
      if (isNaN(limitNumber) || limitNumber < 1 || limitNumber > 100) {
        res.status(400).json({
          success: false,
          error: 'Limit must be a number between 1 and 100',
          timestamp: new Date(),
          requestId,
        });
        return;
      }

      const slowestEndpoints = await PerformanceMetricsModel.getSlowestEndpoints(
        serviceName,
        start,
        end,
        limitNumber
      );

      const response: ApiResponse = {
        success: true,
        data: slowestEndpoints,
        timestamp: new Date(),
        requestId,
      };

      res.json(response);

      logger.info('Slowest endpoints retrieved', {
        requestId,
        serviceName,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        count: slowestEndpoints.length,
      });
    } catch (error) {
      logger.error('Error getting slowest endpoints', {
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
   * Get error rate by endpoint
   */
  public async getErrorRateByEndpoint(req: Request, res: Response): Promise<void> {
    try {
      const { serviceName } = req.params;
      const { startTime, endTime } = req.query;
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

      let start: Date;
      let end: Date;

      if (startTime && endTime) {
        start = new Date(startTime as string);
        end = new Date(endTime as string);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          res.status(400).json({
            success: false,
            error: 'Invalid startTime or endTime format',
            timestamp: new Date(),
            requestId,
          });
          return;
        }
      } else {
        // Default to last 24 hours
        end = new Date();
        start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
      }

      const errorRates = await PerformanceMetricsModel.getErrorRateByEndpoint(
        serviceName,
        start,
        end
      );

      const response: ApiResponse = {
        success: true,
        data: errorRates,
        timestamp: new Date(),
        requestId,
      };

      res.json(response);

      logger.info('Error rates by endpoint retrieved', {
        requestId,
        serviceName,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        count: errorRates.length,
      });
    } catch (error) {
      logger.error('Error getting error rates by endpoint', {
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
   * Start metrics collection service
   */
  public async startMetricsCollection(req: Request, res: Response): Promise<void> {
    try {
      const requestId = req.headers['x-request-id'] as string || 'unknown';

      await this.metricsCollectionService.start();

      const response: ApiResponse = {
        success: true,
        message: 'Metrics collection service started successfully',
        data: this.metricsCollectionService.getServiceStatus(),
        timestamp: new Date(),
        requestId,
      };

      res.json(response);

      logger.info('Metrics collection service started', {
        requestId,
        status: this.metricsCollectionService.getServiceStatus(),
      });
    } catch (error) {
      logger.error('Error starting metrics collection service', {
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
   * Stop metrics collection service
   */
  public async stopMetricsCollection(req: Request, res: Response): Promise<void> {
    try {
      const requestId = req.headers['x-request-id'] as string || 'unknown';

      await this.metricsCollectionService.stop();

      const response: ApiResponse = {
        success: true,
        message: 'Metrics collection service stopped successfully',
        data: this.metricsCollectionService.getServiceStatus(),
        timestamp: new Date(),
        requestId,
      };

      res.json(response);

      logger.info('Metrics collection service stopped', {
        requestId,
        status: this.metricsCollectionService.getServiceStatus(),
      });
    } catch (error) {
      logger.error('Error stopping metrics collection service', {
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

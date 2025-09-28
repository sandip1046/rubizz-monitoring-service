import os from 'os';
import { SystemMetricsModel } from '@/models/SystemMetricsModel';
import { PerformanceMetricsModel } from '@/models/PerformanceMetricsModel';
import { SystemMetric, PerformanceMetric, MetricType } from '@/types';
import { config } from '@/config/config';
import { logger } from '@/utils/logger';

export class MetricsCollectionService {
  private static instance: MetricsCollectionService;
  private isRunning: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;
  private performanceMetricsBuffer: PerformanceMetric[] = [];
  private systemMetricsBuffer: SystemMetric[] = [];
  private readonly BUFFER_SIZE = 100;
  private readonly FLUSH_INTERVAL = 30000; // 30 seconds

  private constructor() {
    // Set up periodic buffer flush
    setInterval(() => {
      this.flushBuffers();
    }, this.FLUSH_INTERVAL);
  }

  public static getInstance(): MetricsCollectionService {
    if (!MetricsCollectionService.instance) {
      MetricsCollectionService.instance = new MetricsCollectionService();
    }
    return MetricsCollectionService.instance;
  }

  /**
   * Start metrics collection
   */
  public async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Metrics collection service is already running');
      return;
    }

    this.isRunning = true;
    logger.info('Starting metrics collection service', {
      interval: config.monitoring.metricsCollectionInterval,
      bufferSize: this.BUFFER_SIZE,
    });

    // Run initial metrics collection
    await this.collectSystemMetrics();

    // Set up interval for periodic metrics collection
    this.intervalId = setInterval(async () => {
      try {
        await this.collectSystemMetrics();
      } catch (error) {
        logger.error('Error during periodic metrics collection', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }, config.monitoring.metricsCollectionInterval);
  }

  /**
   * Stop metrics collection
   */
  public async stop(): Promise<void> {
    if (!this.isRunning) {
      logger.warn('Metrics collection service is not running');
      return;
    }

    this.isRunning = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    // Flush any remaining metrics
    await this.flushBuffers();

    logger.info('Metrics collection service stopped');
  }

  /**
   * Collect system metrics
   */
  public async collectSystemMetrics(): Promise<void> {
    try {
      const serviceName = config.server.serviceName;
      const timestamp = new Date();

      // CPU metrics
      const cpuUsage = await this.getCpuUsage();
      const loadAverage = os.loadavg();

      // Memory metrics
      const totalMemory = os.totalmem();
      const freeMemory = os.freemem();
      const usedMemory = totalMemory - freeMemory;
      const memoryUsagePercentage = (usedMemory / totalMemory) * 100;

      // Process metrics
      const processMemory = process.memoryUsage();
      const processUptime = process.uptime();

      // Network metrics (basic)
      const networkInterfaces = os.networkInterfaces();
      let networkIn = 0;
      let networkOut = 0;

      Object.values(networkInterfaces).forEach(interfaces => {
        interfaces?.forEach(iface => {
          if (iface.internal) return;
          // This is a simplified approach - in production, you'd want to track actual network stats
          networkIn += 0; // Would need to track actual network usage
          networkOut += 0;
        });
      });

      // Create system metrics
      const systemMetrics: Omit<SystemMetric, 'id'>[] = [
        {
          serviceName,
          metricName: 'cpu.usage',
          metricType: MetricType.GAUGE,
          value: cpuUsage,
          timestamp,
        },
        {
          serviceName,
          metricName: 'cpu.load.1m',
          metricType: MetricType.GAUGE,
          value: loadAverage[0],
          timestamp,
        },
        {
          serviceName,
          metricName: 'cpu.load.5m',
          metricType: MetricType.GAUGE,
          value: loadAverage[1],
          timestamp,
        },
        {
          serviceName,
          metricName: 'cpu.load.15m',
          metricType: MetricType.GAUGE,
          value: loadAverage[2],
          timestamp,
        },
        {
          serviceName,
          metricName: 'memory.total',
          metricType: MetricType.GAUGE,
          value: totalMemory,
          timestamp,
        },
        {
          serviceName,
          metricName: 'memory.used',
          metricType: MetricType.GAUGE,
          value: usedMemory,
          timestamp,
        },
        {
          serviceName,
          metricName: 'memory.free',
          metricType: MetricType.GAUGE,
          value: freeMemory,
          timestamp,
        },
        {
          serviceName,
          metricName: 'memory.usage.percentage',
          metricType: MetricType.GAUGE,
          value: memoryUsagePercentage,
          timestamp,
        },
        {
          serviceName,
          metricName: 'process.memory.rss',
          metricType: MetricType.GAUGE,
          value: processMemory.rss,
          timestamp,
        },
        {
          serviceName,
          metricName: 'process.memory.heapUsed',
          metricType: MetricType.GAUGE,
          value: processMemory.heapUsed,
          timestamp,
        },
        {
          serviceName,
          metricName: 'process.memory.heapTotal',
          metricType: MetricType.GAUGE,
          value: processMemory.heapTotal,
          timestamp,
        },
        {
          serviceName,
          metricName: 'process.memory.external',
          metricType: MetricType.GAUGE,
          value: processMemory.external,
          timestamp,
        },
        {
          serviceName,
          metricName: 'process.uptime',
          metricType: MetricType.GAUGE,
          value: processUptime,
          timestamp,
        },
        {
          serviceName,
          metricName: 'network.in',
          metricType: MetricType.COUNTER,
          value: networkIn,
          timestamp,
        },
        {
          serviceName,
          metricName: 'network.out',
          metricType: MetricType.COUNTER,
          value: networkOut,
          timestamp,
        },
      ];

      // Add to buffer
      this.systemMetricsBuffer.push(...systemMetrics);

      // Flush if buffer is full
      if (this.systemMetricsBuffer.length >= this.BUFFER_SIZE) {
        await this.flushSystemMetrics();
      }

      logger.debug('System metrics collected', {
        serviceName,
        metricsCount: systemMetrics.length,
        bufferSize: this.systemMetricsBuffer.length,
      });
    } catch (error) {
      logger.error('Error collecting system metrics', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Record performance metric
   */
  public async recordPerformanceMetric(metric: Omit<PerformanceMetric, 'id'>): Promise<void> {
    try {
      // Add to buffer
      this.performanceMetricsBuffer.push(metric);

      // Flush if buffer is full
      if (this.performanceMetricsBuffer.length >= this.BUFFER_SIZE) {
        await this.flushPerformanceMetrics();
      }

      logger.debug('Performance metric recorded', {
        serviceName: metric.serviceName,
        endpoint: metric.endpoint,
        method: metric.method,
        responseTime: metric.responseTime,
        statusCode: metric.statusCode,
      });
    } catch (error) {
      logger.error('Error recording performance metric', {
        serviceName: metric.serviceName,
        endpoint: metric.endpoint,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Record custom metric
   */
  public async recordCustomMetric(
    serviceName: string,
    metricName: string,
    value: number,
    metricType: MetricType = MetricType.GAUGE,
    labels?: Record<string, string>
  ): Promise<void> {
    try {
      const metric: Omit<SystemMetric, 'id'> = {
        serviceName,
        metricName,
        metricType,
        value,
        labels,
        timestamp: new Date(),
      };

      // Add to buffer
      this.systemMetricsBuffer.push(metric);

      // Flush if buffer is full
      if (this.systemMetricsBuffer.length >= this.BUFFER_SIZE) {
        await this.flushSystemMetrics();
      }

      logger.debug('Custom metric recorded', {
        serviceName,
        metricName,
        value,
        metricType,
      });
    } catch (error) {
      logger.error('Error recording custom metric', {
        serviceName,
        metricName,
        value,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Flush system metrics buffer
   */
  private async flushSystemMetrics(): Promise<void> {
    if (this.systemMetricsBuffer.length === 0) return;

    try {
      const metricsToFlush = [...this.systemMetricsBuffer];
      this.systemMetricsBuffer = [];

      await SystemMetricsModel.createMany(metricsToFlush);

      logger.debug('System metrics flushed to database', {
        count: metricsToFlush.length,
      });
    } catch (error) {
      logger.error('Error flushing system metrics', {
        count: this.systemMetricsBuffer.length,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      // Re-add metrics to buffer for retry
      this.systemMetricsBuffer.unshift(...this.systemMetricsBuffer);
    }
  }

  /**
   * Flush performance metrics buffer
   */
  private async flushPerformanceMetrics(): Promise<void> {
    if (this.performanceMetricsBuffer.length === 0) return;

    try {
      const metricsToFlush = [...this.performanceMetricsBuffer];
      this.performanceMetricsBuffer = [];

      await PerformanceMetricsModel.createMany(metricsToFlush);

      logger.debug('Performance metrics flushed to database', {
        count: metricsToFlush.length,
      });
    } catch (error) {
      logger.error('Error flushing performance metrics', {
        count: this.performanceMetricsBuffer.length,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      // Re-add metrics to buffer for retry
      this.performanceMetricsBuffer.unshift(...this.performanceMetricsBuffer);
    }
  }

  /**
   * Flush all buffers
   */
  public async flushBuffers(): Promise<void> {
    await Promise.all([
      this.flushSystemMetrics(),
      this.flushPerformanceMetrics(),
    ]);
  }

  /**
   * Get CPU usage percentage
   */
  private async getCpuUsage(): Promise<number> {
    return new Promise((resolve) => {
      const startMeasure = process.cpuUsage();
      const startTime = Date.now();

      setTimeout(() => {
        const endMeasure = process.cpuUsage(startMeasure);
        const endTime = Date.now();
        
        const userTime = endMeasure.user / 1000000; // Convert to seconds
        const systemTime = endMeasure.system / 1000000; // Convert to seconds
        const totalTime = userTime + systemTime;
        const elapsedTime = (endTime - startTime) / 1000; // Convert to seconds
        
        const cpuUsage = (totalTime / elapsedTime) * 100;
        resolve(Math.min(cpuUsage, 100)); // Cap at 100%
      }, 100);
    });
  }

  /**
   * Get metrics summary for a service
   */
  public async getMetricsSummary(
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
      return await SystemMetricsModel.getServiceMetricsSummary(serviceName, hours);
    } catch (error) {
      logger.error('Error getting metrics summary', {
        serviceName,
        hours,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get performance summary for a service
   */
  public async getPerformanceSummary(
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
      return await PerformanceMetricsModel.getPerformanceSummary(
        serviceName,
        startTime,
        endTime,
        endpoint
      );
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
   * Check if metrics collection service is running
   */
  public isMetricsCollectionRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Get metrics collection service status
   */
  public getServiceStatus(): {
    isRunning: boolean;
    interval: number;
    systemMetricsBufferSize: number;
    performanceMetricsBufferSize: number;
  } {
    return {
      isRunning: this.isRunning,
      interval: config.monitoring.metricsCollectionInterval,
      systemMetricsBufferSize: this.systemMetricsBuffer.length,
      performanceMetricsBufferSize: this.performanceMetricsBuffer.length,
    };
  }

  /**
   * Clean up old metrics
   */
  public async cleanupOldMetrics(daysToKeep: number = 30): Promise<{
    systemMetricsDeleted: number;
    performanceMetricsDeleted: number;
  }> {
    try {
      const [systemMetricsDeleted, performanceMetricsDeleted] = await Promise.all([
        SystemMetricsModel.deleteOldMetrics(daysToKeep),
        PerformanceMetricsModel.deleteOldMetrics(daysToKeep),
      ]);

      logger.info('Old metrics cleaned up', {
        systemMetricsDeleted,
        performanceMetricsDeleted,
        daysToKeep,
      });

      return {
        systemMetricsDeleted,
        performanceMetricsDeleted,
      };
    } catch (error) {
      logger.error('Error cleaning up old metrics', {
        daysToKeep,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}

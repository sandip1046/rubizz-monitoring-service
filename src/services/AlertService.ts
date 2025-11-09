import { AlertModel } from '@/models/AlertModel';
import { SystemMetricsModel } from '@/models/SystemMetricsModel';
import { PerformanceMetricsModel } from '@/models/PerformanceMetricsModel';
import { ServiceHealthModel } from '@/models/ServiceHealthModel';
import { Alert, AlertSeverity, AlertStatus, ServiceStatus, SystemMetric } from '@/types';
import { config } from '@/config/config';
import logger from '@/utils/logger';
import { NotificationService } from './NotificationService';

export class AlertService {
  private static instance: AlertService;
  private isRunning: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;
  private notificationService: NotificationService;

  private constructor() {
    this.notificationService = NotificationService.getInstance();
  }

  public static getInstance(): AlertService {
    if (!AlertService.instance) {
      AlertService.instance = new AlertService();
    }
    return AlertService.instance;
  }

  /**
   * Start alert monitoring
   */
  public async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Alert service is already running');
      return;
    }

    this.isRunning = true;
    logger.info('Starting alert service', {
      interval: 60000, // Check every minute
    });

    // Run initial alert checks
    await this.checkAlerts();

    // Set up interval for periodic alert checks
    this.intervalId = setInterval(async () => {
      try {
        await this.checkAlerts();
      } catch (error) {
        logger.error('Error during alert checks', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }, 60000); // Check every minute
  }

  /**
   * Stop alert monitoring
   */
  public async stop(): Promise<void> {
    if (!this.isRunning) {
      logger.warn('Alert service is not running');
      return;
    }

    this.isRunning = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    logger.info('Alert service stopped');
  }

  /**
   * Check for alerts based on current metrics and health status
   */
  public async checkAlerts(): Promise<void> {
    try {
      // Check service health alerts
      await this.checkServiceHealthAlerts();

      // Check system metrics alerts
      await this.checkSystemMetricsAlerts();

      // Check performance metrics alerts
      await this.checkPerformanceMetricsAlerts();

      logger.debug('Alert checks completed');
    } catch (error) {
      logger.error('Error during alert checks', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Check service health alerts
   */
  private async checkServiceHealthAlerts(): Promise<void> {
    try {
      const unhealthyServices = await ServiceHealthModel.findByStatus(ServiceStatus.UNHEALTHY);
      const degradedServices = await ServiceHealthModel.findByStatus(ServiceStatus.DEGRADED);

      // Check for unhealthy services
      for (const service of unhealthyServices) {
        const existingAlert = await this.findExistingAlert(
          service.serviceName,
          'service_unhealthy',
          AlertStatus.ACTIVE
        );

        if (!existingAlert) {
          await this.createAlert({
            serviceName: service.serviceName,
            alertType: 'service_unhealthy',
            severity: AlertSeverity.CRITICAL,
            status: AlertStatus.ACTIVE,
            title: `Service ${service.serviceName} is unhealthy`,
            description: `Service ${service.serviceName} is currently unhealthy. Last error: ${service.errorMessage || 'Unknown error'}`,
            value: service.responseTime || 0,
            threshold: config.monitoring.alertThresholds.responseTime,
            labels: {
              serviceUrl: service.serviceUrl,
              lastChecked: service.lastChecked?.toISOString() || new Date().toISOString(),
              errorMessage: service.errorMessage,
            },
          });
        }
      }

      // Check for degraded services
      for (const service of degradedServices) {
        const existingAlert = await this.findExistingAlert(
          service.serviceName,
          'service_degraded',
          AlertStatus.ACTIVE
        );

        if (!existingAlert) {
          await this.createAlert({
            serviceName: service.serviceName,
            alertType: 'service_degraded',
            severity: AlertSeverity.HIGH,
            status: AlertStatus.ACTIVE,
            title: `Service ${service.serviceName} is degraded`,
            description: `Service ${service.serviceName} is currently degraded but still responding.`,
            value: service.responseTime || 0,
            threshold: config.monitoring.alertThresholds.responseTime,
            labels: {
              serviceUrl: service.serviceUrl,
              lastChecked: service.lastChecked?.toISOString() || new Date().toISOString(),
            },
          });
        }
      }
    } catch (error) {
      logger.error('Error checking service health alerts', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Check system metrics alerts
   */
  private async checkSystemMetricsAlerts(): Promise<void> {
    try {
      const serviceName = config.server.serviceName;
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

      // Check CPU usage
      const cpuMetric = await SystemMetricsModel.getLatestMetric(serviceName, 'cpu.usage');
      if (cpuMetric && cpuMetric.value > config.monitoring.alertThresholds.cpu) {
        await this.checkMetricAlert(
          serviceName,
          'cpu_high',
          'CPU usage is high',
          `CPU usage is ${cpuMetric.value.toFixed(2)}%, which exceeds the threshold of ${config.monitoring.alertThresholds.cpu}%`,
          cpuMetric.value,
          config.monitoring.alertThresholds.cpu,
          AlertSeverity.HIGH
        );
      }

      // Check memory usage
      const memoryMetric = await SystemMetricsModel.getLatestMetric(serviceName, 'memory.usage.percentage');
      if (memoryMetric && memoryMetric.value > config.monitoring.alertThresholds.memory) {
        await this.checkMetricAlert(
          serviceName,
          'memory_high',
          'Memory usage is high',
          `Memory usage is ${memoryMetric.value.toFixed(2)}%, which exceeds the threshold of ${config.monitoring.alertThresholds.memory}%`,
          memoryMetric.value,
          config.monitoring.alertThresholds.memory,
          AlertSeverity.HIGH
        );
      }

      // Check response time
      const responseTimeMetrics = await SystemMetricsModel.findByTimeRange(
        fiveMinutesAgo,
        now,
        serviceName,
        'response_time',
        100
      );

      if (responseTimeMetrics.length > 0) {
        const avgResponseTime = responseTimeMetrics.reduce((sum: number, m: SystemMetric) => sum + m.value, 0) / responseTimeMetrics.length;
        if (avgResponseTime > config.monitoring.alertThresholds.responseTime) {
          await this.checkMetricAlert(
            serviceName,
            'response_time_high',
            'Response time is high',
            `Average response time is ${avgResponseTime.toFixed(2)}ms, which exceeds the threshold of ${config.monitoring.alertThresholds.responseTime}ms`,
            avgResponseTime,
            config.monitoring.alertThresholds.responseTime,
            AlertSeverity.MEDIUM
          );
        }
      }
    } catch (error) {
      logger.error('Error checking system metrics alerts', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Check performance metrics alerts
   */
  private async checkPerformanceMetricsAlerts(): Promise<void> {
    try {
      const serviceName = config.server.serviceName;
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

      // Get performance summary for the last 5 minutes
      const performanceSummary = await PerformanceMetricsModel.getPerformanceSummary(
        serviceName,
        fiveMinutesAgo,
        now
      );

      // Check error rate
      if (performanceSummary.errorRate > 10) { // 10% error rate threshold
        await this.checkMetricAlert(
          serviceName,
          'error_rate_high',
          'Error rate is high',
          `Error rate is ${performanceSummary.errorRate.toFixed(2)}%, which exceeds the threshold of 10%`,
          performanceSummary.errorRate,
          10,
          AlertSeverity.HIGH
        );
      }

      // Check average response time
      if (performanceSummary.averageResponseTime > config.monitoring.alertThresholds.responseTime) {
        await this.checkMetricAlert(
          serviceName,
          'performance_response_time_high',
          'Performance response time is high',
          `Average response time is ${performanceSummary.averageResponseTime.toFixed(2)}ms, which exceeds the threshold of ${config.monitoring.alertThresholds.responseTime}ms`,
          performanceSummary.averageResponseTime,
          config.monitoring.alertThresholds.responseTime,
          AlertSeverity.MEDIUM
        );
      }
    } catch (error) {
      logger.error('Error checking performance metrics alerts', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Check if a metric alert should be created
   */
  private async checkMetricAlert(
    serviceName: string,
    alertType: string,
    title: string,
    description: string,
    value: number,
    threshold: number,
    severity: AlertSeverity
  ): Promise<void> {
    try {
      const existingAlert = await this.findExistingAlert(serviceName, alertType, AlertStatus.ACTIVE);

      if (!existingAlert) {
        await this.createAlert({
          serviceName,
          alertType,
          severity,
          status: AlertStatus.ACTIVE,
          title,
          description,
          value,
          threshold,
          labels: {
            metricValue: value,
            threshold,
            timestamp: new Date().toISOString(),
          },
        });
      }
    } catch (error) {
      logger.error('Error checking metric alert', {
        serviceName,
        alertType,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Find existing alert
   */
  private async findExistingAlert(
    serviceName: string,
    alertType: string,
    status: AlertStatus
  ): Promise<Alert | null> {
    try {
      const alerts = await AlertModel.findByAlertType(alertType, serviceName, status, 1);
      return alerts.length > 0 ? (alerts[0] || null) : null;
    } catch (error) {
      logger.error('Error finding existing alert', {
        serviceName,
        alertType,
        status,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }

  /**
   * Create a new alert
   */
  public async createAlert(alertData: Omit<Alert, 'id'>): Promise<Alert> {
    try {
      const alert = await AlertModel.create(alertData);

      // Send notification
      await this.notificationService.sendAlertNotification(alert);

      logger.warn('Alert created', {
        alertId: alert.id,
        serviceName: alert.serviceName,
        alertType: alert.alertType,
        severity: alert.severity,
      });

      return alert;
    } catch (error) {
      logger.error('Error creating alert', {
        serviceName: alertData.serviceName,
        alertType: alertData.alertType,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Acknowledge an alert
   */
  public async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<Alert> {
    try {
      const alert = await AlertModel.acknowledge(alertId, acknowledgedBy);

      logger.info('Alert acknowledged', {
        alertId,
        acknowledgedBy,
        serviceName: alert.serviceName,
      });

      return alert;
    } catch (error) {
      logger.error('Error acknowledging alert', {
        alertId,
        acknowledgedBy,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Resolve an alert
   */
  public async resolveAlert(alertId: string, resolvedBy?: string): Promise<Alert> {
    try {
      const alert = await AlertModel.resolve(alertId, resolvedBy);

      logger.info('Alert resolved', {
        alertId,
        resolvedBy,
        serviceName: alert.serviceName,
      });

      return alert;
    } catch (error) {
      logger.error('Error resolving alert', {
        alertId,
        resolvedBy,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get active alerts
   */
  public async getActiveAlerts(limit: number = 100, offset: number = 0): Promise<Alert[]> {
    try {
      return await AlertModel.findActive(limit, offset);
    } catch (error) {
      logger.error('Error getting active alerts', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get critical alerts
   */
  public async getCriticalAlerts(limit: number = 50): Promise<Alert[]> {
    try {
      return await AlertModel.findCritical(limit);
    } catch (error) {
      logger.error('Error getting critical alerts', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get alerts by service
   */
  public async getAlertsByService(
    serviceName: string,
    status?: AlertStatus,
    limit: number = 100,
    offset: number = 0
  ): Promise<Alert[]> {
    try {
      return await AlertModel.findByService(serviceName, status, limit, offset);
    } catch (error) {
      logger.error('Error getting alerts by service', {
        serviceName,
        status,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get alerts summary
   */
  public async getAlertsSummary(serviceName?: string): Promise<{
    total: number;
    active: number;
    resolved: number;
    acknowledged: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  }> {
    try {
      return await AlertModel.getAlertsSummary(serviceName);
    } catch (error) {
      logger.error('Error getting alerts summary', {
        serviceName,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get alert trends
   */
  public async getAlertTrends(
    startTime: Date,
    endTime: Date,
    serviceName?: string,
    groupBy: 'hour' | 'day' | 'week' = 'day'
  ): Promise<Array<{ period: string; count: number; severity: AlertSeverity }>> {
    try {
      return await AlertModel.getAlertTrends(startTime, endTime, serviceName, groupBy);
    } catch (error) {
      logger.error('Error getting alert trends', {
        startTime,
        endTime,
        serviceName,
        groupBy,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Check if alert service is running
   */
  public isAlertServiceRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Get alert service status
   */
  public getServiceStatus(): {
    isRunning: boolean;
    interval: number;
  } {
    return {
      isRunning: this.isRunning,
      interval: 60000, // 1 minute
    };
  }

  /**
   * Clean up old alerts
   */
  public async cleanupOldAlerts(daysToKeep: number = 30): Promise<number> {
    try {
      return await AlertModel.cleanupOldAlerts(daysToKeep);
    } catch (error) {
      logger.error('Error cleaning up old alerts', {
        daysToKeep,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}

import { Request, Response } from 'express';
import { AlertService } from '@/services/AlertService';
import { NotificationService } from '@/services/NotificationService';
import logger from '@/utils/logger';
import { ApiResponse, PaginatedResponse, AlertStatus, AlertSeverity } from '@/types';

export class AlertsController {
  private alertService: AlertService;
  private notificationService: NotificationService;

  constructor() {
    this.alertService = AlertService.getInstance();
    this.notificationService = NotificationService.getInstance();
  }

  /**
   * Get active alerts
   */
  public async getActiveAlerts(req: Request, res: Response): Promise<void> {
    try {
      const { limit = '100', offset = '0' } = req.query;
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

      const alerts = await this.alertService.getActiveAlerts(limitNumber, offsetNumber);

      const response: ApiResponse = {
        success: true,
        data: alerts,
        timestamp: new Date(),
        requestId,
      };

      res.json(response);

      logger.info('Active alerts retrieved', {
        requestId,
        count: alerts.length,
        limit: limitNumber,
        offset: offsetNumber,
      });
    } catch (error) {
      logger.error('Error getting active alerts', {
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
   * Get critical alerts
   */
  public async getCriticalAlerts(req: Request, res: Response): Promise<void> {
    try {
      const { limit = '50' } = req.query;
      const requestId = req.headers['x-request-id'] as string || 'unknown';

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

      const alerts = await this.alertService.getCriticalAlerts(limitNumber);

      const response: ApiResponse = {
        success: true,
        data: alerts,
        timestamp: new Date(),
        requestId,
      };

      res.json(response);

      logger.info('Critical alerts retrieved', {
        requestId,
        count: alerts.length,
        limit: limitNumber,
      });
    } catch (error) {
      logger.error('Error getting critical alerts', {
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
   * Get alerts by service
   */
  public async getAlertsByService(req: Request, res: Response): Promise<void> {
    try {
      const { serviceName } = req.params;
      const { status, limit = '100', offset = '0' } = req.query;
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

      let alertStatus: AlertStatus | undefined;
      if (status) {
        const validStatuses = ['ACTIVE', 'RESOLVED', 'ACKNOWLEDGED', 'SUPPRESSED'];
        if (!validStatuses.includes(status as string)) {
          res.status(400).json({
            success: false,
            error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
            timestamp: new Date(),
            requestId,
          });
          return;
        }
        alertStatus = status as AlertStatus;
      }

      const alerts = await this.alertService.getAlertsByService(
        serviceName,
        alertStatus,
        limitNumber,
        offsetNumber
      );

      const response: ApiResponse = {
        success: true,
        data: alerts,
        timestamp: new Date(),
        requestId,
      };

      res.json(response);

      logger.info('Alerts by service retrieved', {
        requestId,
        serviceName,
        status,
        count: alerts.length,
        limit: limitNumber,
        offset: offsetNumber,
      });
    } catch (error) {
      logger.error('Error getting alerts by service', {
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
   * Get alerts summary
   */
  public async getAlertsSummary(req: Request, res: Response): Promise<void> {
    try {
      const { serviceName } = req.query;
      const requestId = req.headers['x-request-id'] as string || 'unknown';

      const summary = await this.alertService.getAlertsSummary(serviceName as string);

      const response: ApiResponse = {
        success: true,
        data: summary,
        timestamp: new Date(),
        requestId,
      };

      res.json(response);

      logger.info('Alerts summary retrieved', {
        requestId,
        serviceName,
        total: summary.total,
        active: summary.active,
        critical: summary.critical,
      });
    } catch (error) {
      logger.error('Error getting alerts summary', {
        serviceName: req.query.serviceName,
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
   * Get alert trends
   */
  public async getAlertTrends(req: Request, res: Response): Promise<void> {
    try {
      const {
        startTime,
        endTime,
        serviceName,
        groupBy = 'day',
      } = req.query;

      const requestId = req.headers['x-request-id'] as string || 'unknown';

      if (!startTime || !endTime) {
        res.status(400).json({
          success: false,
          error: 'startTime and endTime are required',
          timestamp: new Date(),
          requestId,
        });
        return;
      }

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

      const validGroupBy = ['hour', 'day', 'week'];
      if (!validGroupBy.includes(groupBy as string)) {
        res.status(400).json({
          success: false,
          error: `Invalid groupBy. Must be one of: ${validGroupBy.join(', ')}`,
          timestamp: new Date(),
          requestId,
        });
        return;
      }

      const trends = await this.alertService.getAlertTrends(
        start,
        end,
        serviceName as string,
        groupBy as 'hour' | 'day' | 'week'
      );

      const response: ApiResponse = {
        success: true,
        data: trends,
        timestamp: new Date(),
        requestId,
      };

      res.json(response);

      logger.info('Alert trends retrieved', {
        requestId,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        serviceName,
        groupBy,
        count: trends.length,
      });
    } catch (error) {
      logger.error('Error getting alert trends', {
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
   * Create a new alert
   */
  public async createAlert(req: Request, res: Response): Promise<void> {
    try {
      const {
        serviceName,
        alertType,
        severity,
        title,
        description,
        value,
        threshold,
        labels,
      } = req.body;

      const requestId = req.headers['x-request-id'] as string || 'unknown';

      if (!serviceName || !alertType || !severity || !title || !description) {
        res.status(400).json({
          success: false,
          error: 'Service name, alert type, severity, title, and description are required',
          timestamp: new Date(),
          requestId,
        });
        return;
      }

      const validSeverities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
      if (!validSeverities.includes(severity)) {
        res.status(400).json({
          success: false,
          error: `Invalid severity. Must be one of: ${validSeverities.join(', ')}`,
          timestamp: new Date(),
          requestId,
        });
        return;
      }

      const alert = await this.alertService.createAlert({
        serviceName,
        alertType,
        severity: severity as AlertSeverity,
        status: AlertStatus.ACTIVE,
        title,
        description,
        value,
        threshold,
        labels,
      });

      const response: ApiResponse = {
        success: true,
        message: 'Alert created successfully',
        data: alert,
        timestamp: new Date(),
        requestId,
      };

      res.status(201).json(response);

      logger.info('Alert created', {
        requestId,
        alertId: alert.id,
        serviceName,
        alertType,
        severity,
      });
    } catch (error) {
      logger.error('Error creating alert', {
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
   * Acknowledge an alert
   */
  public async acknowledgeAlert(req: Request, res: Response): Promise<void> {
    try {
      const { alertId } = req.params;
      const { acknowledgedBy } = req.body;
      const requestId = req.headers['x-request-id'] as string || 'unknown';

      if (!alertId) {
        res.status(400).json({
          success: false,
          error: 'Alert ID is required',
          timestamp: new Date(),
          requestId,
        });
        return;
      }

      if (!acknowledgedBy) {
        res.status(400).json({
          success: false,
          error: 'Acknowledged by is required',
          timestamp: new Date(),
          requestId,
        });
        return;
      }

      const alert = await this.alertService.acknowledgeAlert(alertId, acknowledgedBy);

      const response: ApiResponse = {
        success: true,
        message: 'Alert acknowledged successfully',
        data: alert,
        timestamp: new Date(),
        requestId,
      };

      res.json(response);

      logger.info('Alert acknowledged', {
        requestId,
        alertId,
        acknowledgedBy,
        serviceName: alert.serviceName,
      });
    } catch (error) {
      logger.error('Error acknowledging alert', {
        alertId: req.params.alertId,
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
   * Resolve an alert
   */
  public async resolveAlert(req: Request, res: Response): Promise<void> {
    try {
      const { alertId } = req.params;
      const { resolvedBy } = req.body;
      const requestId = req.headers['x-request-id'] as string || 'unknown';

      if (!alertId) {
        res.status(400).json({
          success: false,
          error: 'Alert ID is required',
          timestamp: new Date(),
          requestId,
        });
        return;
      }

      const alert = await this.alertService.resolveAlert(alertId, resolvedBy);

      const response: ApiResponse = {
        success: true,
        message: 'Alert resolved successfully',
        data: alert,
        timestamp: new Date(),
        requestId,
      };

      res.json(response);

      logger.info('Alert resolved', {
        requestId,
        alertId,
        resolvedBy,
        serviceName: alert.serviceName,
      });
    } catch (error) {
      logger.error('Error resolving alert', {
        alertId: req.params.alertId,
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
   * Get alert by ID
   */
  public async getAlertById(req: Request, res: Response): Promise<void> {
    try {
      const { alertId } = req.params;
      const requestId = req.headers['x-request-id'] as string || 'unknown';

      if (!alertId) {
        res.status(400).json({
          success: false,
          error: 'Alert ID is required',
          timestamp: new Date(),
          requestId,
        });
        return;
      }

      // This would need to be implemented in AlertService
      // const alert = await this.alertService.getAlertById(alertId);

      // For now, return a placeholder response
      const response: ApiResponse = {
        success: false,
        error: 'Get alert by ID not implemented yet',
        timestamp: new Date(),
        requestId,
      };

      res.status(501).json(response);
    } catch (error) {
      logger.error('Error getting alert by ID', {
        alertId: req.params.alertId,
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
   * Send test notification
   */
  public async sendTestNotification(req: Request, res: Response): Promise<void> {
    try {
      const { channel } = req.body;
      const requestId = req.headers['x-request-id'] as string || 'unknown';

      if (!channel) {
        res.status(400).json({
          success: false,
          error: 'Channel is required',
          timestamp: new Date(),
          requestId,
        });
        return;
      }

      const validChannels = ['email', 'slack', 'pagerduty'];
      if (!validChannels.includes(channel)) {
        res.status(400).json({
          success: false,
          error: `Invalid channel. Must be one of: ${validChannels.join(', ')}`,
          timestamp: new Date(),
          requestId,
        });
        return;
      }

      await this.notificationService.sendTestNotification(channel);

      const response: ApiResponse = {
        success: true,
        message: `Test notification sent via ${channel}`,
        timestamp: new Date(),
        requestId,
      };

      res.json(response);

      logger.info('Test notification sent', {
        requestId,
        channel,
      });
    } catch (error) {
      logger.error('Error sending test notification', {
        channel: req.body.channel,
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
   * Get notification service status
   */
  public async getNotificationStatus(req: Request, res: Response): Promise<void> {
    try {
      const requestId = req.headers['x-request-id'] as string || 'unknown';

      const status = this.notificationService.getServiceStatus();

      const response: ApiResponse = {
        success: true,
        data: status,
        timestamp: new Date(),
        requestId,
      };

      res.json(response);

      logger.info('Notification status retrieved', {
        requestId,
        status,
      });
    } catch (error) {
      logger.error('Error getting notification status', {
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
   * Start alert service
   */
  public async startAlertService(req: Request, res: Response): Promise<void> {
    try {
      const requestId = req.headers['x-request-id'] as string || 'unknown';

      await this.alertService.start();

      const response: ApiResponse = {
        success: true,
        message: 'Alert service started successfully',
        data: this.alertService.getServiceStatus(),
        timestamp: new Date(),
        requestId,
      };

      res.json(response);

      logger.info('Alert service started', {
        requestId,
        status: this.alertService.getServiceStatus(),
      });
    } catch (error) {
      logger.error('Error starting alert service', {
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
   * Stop alert service
   */
  public async stopAlertService(req: Request, res: Response): Promise<void> {
    try {
      const requestId = req.headers['x-request-id'] as string || 'unknown';

      await this.alertService.stop();

      const response: ApiResponse = {
        success: true,
        message: 'Alert service stopped successfully',
        data: this.alertService.getServiceStatus(),
        timestamp: new Date(),
        requestId,
      };

      res.json(response);

      logger.info('Alert service stopped', {
        requestId,
        status: this.alertService.getServiceStatus(),
      });
    } catch (error) {
      logger.error('Error stopping alert service', {
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
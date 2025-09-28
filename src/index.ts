import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

import { config } from '@/config/config';
import { logger } from '@/utils/logger';
import { connectDatabase, isDatabaseConnected } from '@/database/connection';
import { connectRedis, isRedisConnected } from '@/database/RedisConnection';
import { HealthCheckService } from '@/services/HealthCheckService';
import { MetricsCollectionService } from '@/services/MetricsCollectionService';
import { AlertService } from '@/services/AlertService';

// Import controllers
import { HealthController } from '@/controllers/HealthController';
import { MetricsController } from '@/controllers/MetricsController';
import { AlertsController } from '@/controllers/AlertsController';

// Import middleware
import { requestMonitoringMiddleware } from '@/middleware/requestMonitoring';
import {
  handleError,
  handleNotFound,
  asyncHandler,
  handleValidationError,
  handleDatabaseError,
  handleRateLimitError,
  handleJWTError,
  handleTimeoutError,
  handleCORSError,
} from '@/middleware/errorHandler';

class MonitoringService {
  private app: express.Application;
  private healthController: HealthController;
  private metricsController: MetricsController;
  private alertsController: AlertsController;
  private healthCheckService: HealthCheckService;
  private metricsCollectionService: MetricsCollectionService;
  private alertService: AlertService;

  constructor() {
    this.app = express();
    this.healthController = new HealthController();
    this.metricsController = new MetricsController();
    this.alertsController = new AlertsController();
    this.healthCheckService = HealthCheckService.getInstance();
    this.metricsCollectionService = MetricsCollectionService.getInstance();
    this.alertService = AlertService.getInstance();

    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
    this.initializeSwagger();
  }

  /**
   * Initialize middleware
   */
  private initializeMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    // CORS middleware
    this.app.use(cors({
      origin: config.cors.origin,
      credentials: config.cors.credentials,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    }));

    // Compression middleware
    this.app.use(compression());

    // Request logging middleware
    this.app.use(morgan('combined', {
      stream: {
        write: (message: string) => {
          logger.info(message.trim());
        },
      },
    }));

    // Rate limiting middleware
    const limiter = rateLimit({
      windowMs: config.rateLimit.windowMs,
      max: config.rateLimit.maxRequests,
      message: {
        success: false,
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
        timestamp: new Date(),
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use(limiter);

    // Request monitoring middleware
    this.app.use(requestMonitoringMiddleware.addRequestId());
    this.app.use(requestMonitoringMiddleware.logRequests());
    this.app.use(requestMonitoringMiddleware.monitorRequests());
    this.app.use(requestMonitoringMiddleware.trackSlowRequests(5000));
    this.app.use(requestMonitoringMiddleware.trackErrorRequests());

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request timeout middleware
    this.app.use((req, res, next) => {
      req.setTimeout(30000, () => {
        const error = new Error('Request Timeout');
        (error as any).timeout = true;
        next(error);
      });
      next();
    });
  }

  /**
   * Initialize routes
   */
  private initializeRoutes(): void {
    // Health routes
    this.app.get('/health', asyncHandler(this.healthController.getHealth.bind(this.healthController)));
    this.app.get('/health/detailed', asyncHandler(this.healthController.getDetailedHealth.bind(this.healthController)));
    this.app.get('/health/service/:serviceName', asyncHandler(this.healthController.getServiceHealth.bind(this.healthController)));
    this.app.get('/health/service/:serviceName/summary', asyncHandler(this.healthController.getServiceHealthSummary.bind(this.healthController)));
    this.app.get('/health/status/:status', asyncHandler(this.healthController.getServicesByStatus.bind(this.healthController)));
    this.app.post('/health/check', asyncHandler(this.healthController.checkCustomServiceHealth.bind(this.healthController)));
    this.app.post('/health/start', asyncHandler(this.healthController.startHealthCheckService.bind(this.healthController)));
    this.app.post('/health/stop', asyncHandler(this.healthController.stopHealthCheckService.bind(this.healthController)));

    // Metrics routes
    this.app.get('/metrics/system', asyncHandler(this.metricsController.getSystemMetrics.bind(this.metricsController)));
    this.app.get('/metrics/performance', asyncHandler(this.metricsController.getPerformanceMetrics.bind(this.metricsController)));
    this.app.get('/metrics/performance/:serviceName/summary', asyncHandler(this.metricsController.getPerformanceSummary.bind(this.metricsController)));
    this.app.get('/metrics/:serviceName/summary', asyncHandler(this.metricsController.getMetricsSummary.bind(this.metricsController)));
    this.app.post('/metrics/record', asyncHandler(this.metricsController.recordCustomMetric.bind(this.metricsController)));
    this.app.get('/metrics/performance/:serviceName/slowest', asyncHandler(this.metricsController.getSlowestEndpoints.bind(this.metricsController)));
    this.app.get('/metrics/performance/:serviceName/error-rates', asyncHandler(this.metricsController.getErrorRateByEndpoint.bind(this.metricsController)));
    this.app.post('/metrics/start', asyncHandler(this.metricsController.startMetricsCollection.bind(this.metricsController)));
    this.app.post('/metrics/stop', asyncHandler(this.metricsController.stopMetricsCollection.bind(this.metricsController)));

    // Alerts routes
    this.app.get('/alerts/active', asyncHandler(this.alertsController.getActiveAlerts.bind(this.alertsController)));
    this.app.get('/alerts/critical', asyncHandler(this.alertsController.getCriticalAlerts.bind(this.alertsController)));
    this.app.get('/alerts/service/:serviceName', asyncHandler(this.alertsController.getAlertsByService.bind(this.alertsController)));
    this.app.get('/alerts/summary', asyncHandler(this.alertsController.getAlertsSummary.bind(this.alertsController)));
    this.app.get('/alerts/trends', asyncHandler(this.alertsController.getAlertTrends.bind(this.alertsController)));
    this.app.post('/alerts', asyncHandler(this.alertsController.createAlert.bind(this.alertsController)));
    this.app.post('/alerts/:alertId/acknowledge', asyncHandler(this.alertsController.acknowledgeAlert.bind(this.alertsController)));
    this.app.post('/alerts/:alertId/resolve', asyncHandler(this.alertsController.resolveAlert.bind(this.alertsController)));
    this.app.get('/alerts/:alertId', asyncHandler(this.alertsController.getAlertById.bind(this.alertsController)));
    this.app.post('/alerts/test-notification', asyncHandler(this.alertsController.sendTestNotification.bind(this.alertsController)));
    this.app.get('/alerts/notification-status', asyncHandler(this.alertsController.getNotificationStatus.bind(this.alertsController)));
    this.app.post('/alerts/start', asyncHandler(this.alertsController.startAlertService.bind(this.alertsController)));
    this.app.post('/alerts/stop', asyncHandler(this.alertsController.stopAlertService.bind(this.alertsController)));

    // Root route
    this.app.get('/', (req, res) => {
      res.json({
        success: true,
        message: `Welcome to ${config.server.serviceName} v${config.server.serviceVersion}`,
        timestamp: new Date(),
        service: {
          name: config.server.serviceName,
          version: config.server.serviceVersion,
          environment: config.server.nodeEnv,
        },
        endpoints: {
          health: '/health',
          metrics: '/metrics',
          alerts: '/alerts',
          documentation: '/api-docs',
        },
      });
    });

    // API info route
    this.app.get('/api/info', (req, res) => {
      res.json({
        success: true,
        data: {
          service: config.server.serviceName,
          version: config.server.serviceVersion,
          environment: config.server.nodeEnv,
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          cpu: require('os').loadavg(),
          database: {
            connected: isDatabaseConnected(),
          },
          redis: {
            connected: isRedisConnected(),
          },
          services: {
            healthCheck: this.healthCheckService.getServiceStatus(),
            metricsCollection: this.metricsCollectionService.getServiceStatus(),
            alert: this.alertService.getServiceStatus(),
          },
        },
        timestamp: new Date(),
      });
    });
  }

  /**
   * Initialize error handling
   */
  private initializeErrorHandling(): void {
    // Error handling middleware (order matters)
    this.app.use(handleValidationError());
    this.app.use(handleDatabaseError());
    this.app.use(handleRateLimitError());
    this.app.use(handleJWTError());
    this.app.use(handleTimeoutError());
    this.app.use(handleCORSError());
    this.app.use(handleNotFound());
    this.app.use(handleError());
  }

  /**
   * Initialize Swagger documentation
   */
  private initializeSwagger(): void {
    const swaggerOptions = {
      definition: {
        openapi: '3.0.0',
        info: {
          title: config.swagger.title,
          version: config.swagger.version,
          description: config.swagger.description,
        },
        servers: [
          {
            url: config.swagger.baseUrl,
            description: 'Development server',
          },
        ],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT',
            },
          },
        },
      },
      apis: ['./src/controllers/*.ts'], // Path to the API docs
    };

    const specs = swaggerJsdoc(swaggerOptions);
    this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
      explorer: true,
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: config.swagger.title,
    }));
  }

  /**
   * Start the server
   */
  public async start(): Promise<void> {
    try {
      // Connect to database
      await connectDatabase();
      logger.info('Database connected successfully');

      // Connect to Redis
      await connectRedis();
      logger.info('Redis connected successfully');

      // Start monitoring services
      await this.healthCheckService.start();
      await this.metricsCollectionService.start();
      await this.alertService.start();

      logger.info('All monitoring services started successfully');

      // Start HTTP server
      this.app.listen(config.server.port, () => {
        logger.info(`🚀 ${config.server.serviceName} v${config.server.serviceVersion} started successfully`, {
          port: config.server.port,
          environment: config.server.nodeEnv,
          healthEndpoint: `http://localhost:${config.server.port}/health`,
          apiDocs: `http://localhost:${config.server.port}/api-docs`,
        });
      });

      // Graceful shutdown handling
      this.setupGracefulShutdown();
    } catch (error) {
      logger.error('Failed to start monitoring service', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      process.exit(1);
    }
  }

  /**
   * Setup graceful shutdown
   */
  private setupGracefulShutdown(): void {
    const gracefulShutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Starting graceful shutdown...`);

      try {
        // Stop monitoring services
        await this.healthCheckService.stop();
        await this.metricsCollectionService.stop();
        await this.alertService.stop();

        logger.info('All monitoring services stopped successfully');
        logger.info('Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        logger.error('Error during graceful shutdown', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        process.exit(1);
      }
    };

    // Handle different termination signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // For nodemon

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception', {
        error: error.message,
        stack: error.stack,
      });
      gracefulShutdown('uncaughtException');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection', {
        reason: reason instanceof Error ? reason.message : reason,
        promise: promise.toString(),
      });
      gracefulShutdown('unhandledRejection');
    });
  }
}

// Start the service
const monitoringService = new MonitoringService();
monitoringService.start().catch((error) => {
  logger.error('Failed to start monitoring service', {
    error: error instanceof Error ? error.message : 'Unknown error',
  });
  process.exit(1);
});

export default monitoringService;

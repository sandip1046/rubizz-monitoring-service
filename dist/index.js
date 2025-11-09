"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const compression_1 = __importDefault(require("compression"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const config_1 = require("@/config/config");
const logger_1 = __importDefault(require("@/utils/logger"));
const connection_1 = require("@/database/connection");
const RedisService_1 = require("@/services/RedisService");
const HealthCheckService_1 = require("@/services/HealthCheckService");
const MetricsCollectionService_1 = require("@/services/MetricsCollectionService");
const AlertService_1 = require("@/services/AlertService");
const KafkaService_1 = require("@/services/KafkaService");
const grpc_server_1 = require("@/servers/grpc.server");
const graphql_server_1 = require("@/servers/graphql.server");
const websocket_server_1 = require("@/servers/websocket.server");
const HealthController_1 = require("@/controllers/HealthController");
const MetricsController_1 = require("@/controllers/MetricsController");
const AlertsController_1 = require("@/controllers/AlertsController");
const requestMonitoring_1 = require("@/middleware/requestMonitoring");
const errorHandler_1 = require("@/middleware/errorHandler");
class MonitoringService {
    constructor() {
        this.app = (0, express_1.default)();
        this.healthController = new HealthController_1.HealthController();
        this.metricsController = new MetricsController_1.MetricsController();
        this.alertsController = new AlertsController_1.AlertsController();
        this.healthCheckService = HealthCheckService_1.HealthCheckService.getInstance();
        this.metricsCollectionService = MetricsCollectionService_1.MetricsCollectionService.getInstance();
        this.alertService = AlertService_1.AlertService.getInstance();
        this.redisService = new RedisService_1.RedisService();
        this.kafkaService = new KafkaService_1.KafkaService();
        this.grpcServer = new grpc_server_1.GrpcServer();
        this.graphqlServer = new graphql_server_1.GraphQLServer();
        this.websocketServer = new websocket_server_1.WebSocketServer();
        this.initializeMiddleware();
        this.initializeRoutes();
        this.initializeErrorHandling();
        this.initializeSwagger();
    }
    initializeMiddleware() {
        this.app.use((0, helmet_1.default)({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    scriptSrc: ["'self'"],
                    imgSrc: ["'self'", "data:", "https:"],
                },
            },
        }));
        this.app.use((0, cors_1.default)({
            origin: config_1.config.cors.origin,
            credentials: config_1.config.cors.credentials,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
        }));
        this.app.use((0, compression_1.default)());
        this.app.use((0, morgan_1.default)('combined', {
            stream: {
                write: (message) => {
                    logger_1.default.info(message.trim());
                },
            },
        }));
        const limiter = (0, express_rate_limit_1.default)({
            windowMs: config_1.config.rateLimit.windowMs,
            max: config_1.config.rateLimit.maxRequests,
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
        this.app.use(requestMonitoring_1.requestMonitoringMiddleware.addRequestId());
        this.app.use(requestMonitoring_1.requestMonitoringMiddleware.logRequests());
        this.app.use(requestMonitoring_1.requestMonitoringMiddleware.monitorRequests());
        this.app.use(requestMonitoring_1.requestMonitoringMiddleware.trackSlowRequests(5000));
        this.app.use(requestMonitoring_1.requestMonitoringMiddleware.trackErrorRequests());
        this.app.use(express_1.default.json({ limit: '10mb' }));
        this.app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
        this.app.use((req, res, next) => {
            req.setTimeout(30000, () => {
                const error = new Error('Request Timeout');
                error.timeout = true;
                next(error);
            });
            next();
        });
    }
    initializeRoutes() {
        this.app.get('/health', (0, errorHandler_1.asyncHandler)(this.healthController.getHealth.bind(this.healthController)));
        this.app.get('/health/detailed', (0, errorHandler_1.asyncHandler)(this.healthController.getDetailedHealth.bind(this.healthController)));
        this.app.get('/health/service/:serviceName', (0, errorHandler_1.asyncHandler)(this.healthController.getServiceHealth.bind(this.healthController)));
        this.app.get('/health/service/:serviceName/summary', (0, errorHandler_1.asyncHandler)(this.healthController.getServiceHealthSummary.bind(this.healthController)));
        this.app.get('/health/status/:status', (0, errorHandler_1.asyncHandler)(this.healthController.getServicesByStatus.bind(this.healthController)));
        this.app.post('/health/check', (0, errorHandler_1.asyncHandler)(this.healthController.checkCustomServiceHealth.bind(this.healthController)));
        this.app.post('/health/start', (0, errorHandler_1.asyncHandler)(this.healthController.startHealthCheckService.bind(this.healthController)));
        this.app.post('/health/stop', (0, errorHandler_1.asyncHandler)(this.healthController.stopHealthCheckService.bind(this.healthController)));
        this.app.get('/metrics/system', (0, errorHandler_1.asyncHandler)(this.metricsController.getSystemMetrics.bind(this.metricsController)));
        this.app.get('/metrics/performance', (0, errorHandler_1.asyncHandler)(this.metricsController.getPerformanceMetrics.bind(this.metricsController)));
        this.app.get('/metrics/performance/:serviceName/summary', (0, errorHandler_1.asyncHandler)(this.metricsController.getPerformanceSummary.bind(this.metricsController)));
        this.app.get('/metrics/:serviceName/summary', (0, errorHandler_1.asyncHandler)(this.metricsController.getMetricsSummary.bind(this.metricsController)));
        this.app.post('/metrics/record', (0, errorHandler_1.asyncHandler)(this.metricsController.recordCustomMetric.bind(this.metricsController)));
        this.app.get('/metrics/performance/:serviceName/slowest', (0, errorHandler_1.asyncHandler)(this.metricsController.getSlowestEndpoints.bind(this.metricsController)));
        this.app.get('/metrics/performance/:serviceName/error-rates', (0, errorHandler_1.asyncHandler)(this.metricsController.getErrorRateByEndpoint.bind(this.metricsController)));
        this.app.post('/metrics/start', (0, errorHandler_1.asyncHandler)(this.metricsController.startMetricsCollection.bind(this.metricsController)));
        this.app.post('/metrics/stop', (0, errorHandler_1.asyncHandler)(this.metricsController.stopMetricsCollection.bind(this.metricsController)));
        this.app.get('/alerts/active', (0, errorHandler_1.asyncHandler)(this.alertsController.getActiveAlerts.bind(this.alertsController)));
        this.app.get('/alerts/critical', (0, errorHandler_1.asyncHandler)(this.alertsController.getCriticalAlerts.bind(this.alertsController)));
        this.app.get('/alerts/service/:serviceName', (0, errorHandler_1.asyncHandler)(this.alertsController.getAlertsByService.bind(this.alertsController)));
        this.app.get('/alerts/summary', (0, errorHandler_1.asyncHandler)(this.alertsController.getAlertsSummary.bind(this.alertsController)));
        this.app.get('/alerts/trends', (0, errorHandler_1.asyncHandler)(this.alertsController.getAlertTrends.bind(this.alertsController)));
        this.app.post('/alerts', (0, errorHandler_1.asyncHandler)(this.alertsController.createAlert.bind(this.alertsController)));
        this.app.post('/alerts/:alertId/acknowledge', (0, errorHandler_1.asyncHandler)(this.alertsController.acknowledgeAlert.bind(this.alertsController)));
        this.app.post('/alerts/:alertId/resolve', (0, errorHandler_1.asyncHandler)(this.alertsController.resolveAlert.bind(this.alertsController)));
        this.app.get('/alerts/:alertId', (0, errorHandler_1.asyncHandler)(this.alertsController.getAlertById.bind(this.alertsController)));
        this.app.post('/alerts/test-notification', (0, errorHandler_1.asyncHandler)(this.alertsController.sendTestNotification.bind(this.alertsController)));
        this.app.get('/alerts/notification-status', (0, errorHandler_1.asyncHandler)(this.alertsController.getNotificationStatus.bind(this.alertsController)));
        this.app.post('/alerts/start', (0, errorHandler_1.asyncHandler)(this.alertsController.startAlertService.bind(this.alertsController)));
        this.app.post('/alerts/stop', (0, errorHandler_1.asyncHandler)(this.alertsController.stopAlertService.bind(this.alertsController)));
        this.app.get('/', (req, res) => {
            res.json({
                success: true,
                message: `Welcome to ${config_1.config.server.serviceName} v${config_1.config.server.serviceVersion}`,
                timestamp: new Date(),
                service: {
                    name: config_1.config.server.serviceName,
                    version: config_1.config.server.serviceVersion,
                    environment: config_1.config.server.nodeEnv,
                },
                endpoints: {
                    health: '/health',
                    metrics: '/metrics',
                    alerts: '/alerts',
                    documentation: '/api-docs',
                },
            });
        });
        this.app.get('/api/info', (req, res) => {
            res.json({
                success: true,
                data: {
                    service: config_1.config.server.serviceName,
                    version: config_1.config.server.serviceVersion,
                    environment: config_1.config.server.nodeEnv,
                    uptime: process.uptime(),
                    memory: process.memoryUsage(),
                    cpu: require('os').loadavg(),
                    database: {
                        connected: (0, connection_1.isDatabaseConnected)(),
                    },
                    redis: {
                        connected: this.redisService.isRedisConnected(),
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
    initializeErrorHandling() {
        this.app.use((0, errorHandler_1.handleValidationError)());
        this.app.use((0, errorHandler_1.handleDatabaseError)());
        this.app.use((0, errorHandler_1.handleRateLimitError)());
        this.app.use((0, errorHandler_1.handleJWTError)());
        this.app.use((0, errorHandler_1.handleTimeoutError)());
        this.app.use((0, errorHandler_1.handleCORSError)());
        this.app.use((0, errorHandler_1.handleNotFound)());
        this.app.use((0, errorHandler_1.handleError)());
    }
    initializeSwagger() {
        const swaggerOptions = {
            definition: {
                openapi: '3.0.0',
                info: {
                    title: config_1.config.swagger.title,
                    version: config_1.config.swagger.version,
                    description: config_1.config.swagger.description,
                },
                servers: [
                    {
                        url: config_1.config.swagger.baseUrl,
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
            apis: ['./src/controllers/*.ts'],
        };
        const specs = (0, swagger_jsdoc_1.default)(swaggerOptions);
        this.app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(specs, {
            explorer: true,
            customCss: '.swagger-ui .topbar { display: none }',
            customSiteTitle: config_1.config.swagger.title,
        }));
    }
    async start() {
        try {
            await (0, connection_1.connectDatabase)();
            logger_1.default.info('Database connected successfully');
            await this.redisService.connect();
            logger_1.default.info('Redis connected successfully');
            try {
                await this.kafkaService.connect();
                logger_1.default.info('Kafka connected successfully');
            }
            catch (error) {
                logger_1.default.warn('Kafka connection failed, continuing without Kafka', {
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
            await this.healthCheckService.start();
            await this.metricsCollectionService.start();
            await this.alertService.start();
            logger_1.default.info('All monitoring services started successfully');
            const httpServer = this.app.listen(config_1.config.server.port, async () => {
                logger_1.default.info(`🚀 ${config_1.config.server.serviceName} v${config_1.config.server.serviceVersion} started successfully`, {
                    port: config_1.config.server.port,
                    environment: config_1.config.server.nodeEnv,
                    healthEndpoint: `http://localhost:${config_1.config.server.port}/health`,
                    apiDocs: `http://localhost:${config_1.config.server.port}/api-docs`,
                });
                try {
                    await this.graphqlServer.start(this.app);
                    logger_1.default.info('GraphQL server started', {
                        path: config_1.config.graphql.path,
                    });
                }
                catch (error) {
                    logger_1.default.warn('GraphQL server failed to start', {
                        error: error instanceof Error ? error.message : 'Unknown error',
                    });
                }
                try {
                    await this.grpcServer.start();
                    logger_1.default.info('gRPC server started', {
                        port: config_1.config.grpc.port,
                    });
                }
                catch (error) {
                    logger_1.default.warn('gRPC server failed to start', {
                        error: error instanceof Error ? error.message : 'Unknown error',
                    });
                }
                try {
                    await this.websocketServer.start();
                    logger_1.default.info('WebSocket server started', {
                        port: config_1.config.websocket.port,
                    });
                }
                catch (error) {
                    logger_1.default.warn('WebSocket server failed to start', {
                        error: error instanceof Error ? error.message : 'Unknown error',
                    });
                }
            });
            this.setupGracefulShutdown();
        }
        catch (error) {
            logger_1.default.error('Failed to start monitoring service', {
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined,
            });
            process.exit(1);
        }
    }
    setupGracefulShutdown() {
        const gracefulShutdown = async (signal) => {
            logger_1.default.info(`Received ${signal}. Starting graceful shutdown...`);
            try {
                await this.grpcServer.stop();
                await this.graphqlServer.stop();
                await this.websocketServer.stop();
                await this.kafkaService.disconnect();
                await this.healthCheckService.stop();
                await this.metricsCollectionService.stop();
                await this.alertService.stop();
                await this.redisService.disconnect();
                const { db } = await Promise.resolve().then(() => __importStar(require('@/database/connection')));
                await db.disconnect();
                logger_1.default.info('All monitoring services stopped successfully');
                logger_1.default.info('Graceful shutdown completed');
                process.exit(0);
            }
            catch (error) {
                logger_1.default.error('Error during graceful shutdown', {
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
                process.exit(1);
            }
        };
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
        process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2'));
        process.on('uncaughtException', (error) => {
            logger_1.default.error('Uncaught Exception', {
                error: error.message,
                stack: error.stack,
            });
            gracefulShutdown('uncaughtException');
        });
        process.on('unhandledRejection', (reason, promise) => {
            logger_1.default.error('Unhandled Rejection', {
                reason: reason instanceof Error ? reason.message : reason,
                promise: promise.toString(),
            });
            gracefulShutdown('unhandledRejection');
        });
    }
}
const monitoringService = new MonitoringService();
monitoringService.start().catch((error) => {
    logger_1.default.error('Failed to start monitoring service', {
        error: error instanceof Error ? error.message : 'Unknown error',
    });
    process.exit(1);
});
exports.default = monitoringService;
//# sourceMappingURL=index.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_SERVICES = exports.kafka = exports.websocket = exports.graphql = exports.grpc = exports.serviceDiscovery = exports.alerts = exports.swagger = exports.cors = exports.rateLimit = exports.logging = exports.externalServices = exports.monitoring = exports.apiGateway = exports.jwt = exports.redisService = exports.database = exports.server = exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const zod_1 = require("zod");
dotenv_1.default.config();
const envSchema = zod_1.z.object({
    PORT: zod_1.z.string().transform(Number).default('3009'),
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    SERVICE_NAME: zod_1.z.string().default('rubizz-monitoring-service'),
    SERVICE_VERSION: zod_1.z.string().default('1.0.0'),
    DATABASE_URL: zod_1.z.string().min(1, 'DATABASE_URL is required'),
    REDIS_SERVICE_URL: zod_1.z.string().default('https://rubizz-redis-service.onrender.com/api/v1/redis'),
    REDIS_SERVICE_TIMEOUT: zod_1.z.string().transform((val) => Number(val)).default('30000'),
    REDIS_SERVICE_RETRIES: zod_1.z.string().transform((val) => Number(val)).default('3'),
    REDIS_SERVICE_RETRY_DELAY: zod_1.z.string().transform((val) => Number(val)).default('1000'),
    JWT_SECRET: zod_1.z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
    JWT_EXPIRES_IN: zod_1.z.string().default('24h'),
    JWT_REFRESH_EXPIRES_IN: zod_1.z.string().default('7d'),
    API_GATEWAY_URL: zod_1.z.string().url().default('http://localhost:3000'),
    API_GATEWAY_TOKEN: zod_1.z.string().optional(),
    METRICS_COLLECTION_INTERVAL: zod_1.z.string().transform(Number).default('30000'),
    HEALTH_CHECK_INTERVAL: zod_1.z.string().transform(Number).default('60000'),
    ALERT_THRESHOLD_CPU: zod_1.z.string().transform(Number).default('80'),
    ALERT_THRESHOLD_MEMORY: zod_1.z.string().transform(Number).default('85'),
    ALERT_THRESHOLD_DISK: zod_1.z.string().transform(Number).default('90'),
    ALERT_THRESHOLD_RESPONSE_TIME: zod_1.z.string().transform(Number).default('5000'),
    PROMETHEUS_ENDPOINT: zod_1.z.string().url().optional(),
    GRAFANA_ENDPOINT: zod_1.z.string().url().optional(),
    ELASTICSEARCH_ENDPOINT: zod_1.z.string().url().optional(),
    LOG_LEVEL: zod_1.z.enum(['error', 'warn', 'info', 'debug']).default('info'),
    LOG_FORMAT: zod_1.z.enum(['json', 'simple']).default('json'),
    LOG_FILE_PATH: zod_1.z.string().default('./logs/monitoring-service.log'),
    RATE_LIMIT_WINDOW_MS: zod_1.z.string().transform(Number).default('900000'),
    RATE_LIMIT_MAX_REQUESTS: zod_1.z.string().transform(Number).default('100'),
    CORS_ORIGIN: zod_1.z.string().default('http://localhost:4200'),
    CORS_CREDENTIALS: zod_1.z.string().transform(val => val === 'true').default('true'),
    SWAGGER_TITLE: zod_1.z.string().default('Rubizz Monitoring Service API'),
    SWAGGER_DESCRIPTION: zod_1.z.string().default('API documentation for Rubizz Hotel Inn Monitoring Service'),
    SWAGGER_VERSION: zod_1.z.string().default('1.0.0'),
    SWAGGER_BASE_URL: zod_1.z.string().url().default('http://localhost:3009'),
    ALERT_EMAIL_ENABLED: zod_1.z.string().transform(val => val === 'true').default('false'),
    ALERT_EMAIL_SMTP_HOST: zod_1.z.string().optional(),
    ALERT_EMAIL_SMTP_PORT: zod_1.z.string().transform(Number).optional(),
    ALERT_EMAIL_USER: zod_1.z.string().optional(),
    ALERT_EMAIL_PASS: zod_1.z.string().optional(),
    ALERT_EMAIL_FROM: zod_1.z.string().email().optional(),
    ALERT_EMAIL_TO: zod_1.z.string().email().optional(),
    ALERT_SLACK_ENABLED: zod_1.z.string().transform(val => val === 'true').default('false'),
    ALERT_SLACK_WEBHOOK_URL: zod_1.z.string().url().optional(),
    ALERT_PAGERDUTY_ENABLED: zod_1.z.string().transform(val => val === 'true').default('false'),
    ALERT_PAGERDUTY_INTEGRATION_KEY: zod_1.z.string().optional(),
    SERVICE_DISCOVERY_ENABLED: zod_1.z.string().transform(val => val === 'true').default('false'),
    SERVICE_REGISTRY_URL: zod_1.z.string().url().optional(),
    SERVICE_CHECK_INTERVAL: zod_1.z.string().default('30s'),
    SERVICE_CHECK_TIMEOUT: zod_1.z.string().default('10s'),
    GRPC_PORT: zod_1.z.string().transform(Number).default('50051'),
    GRPC_HOST: zod_1.z.string().default('0.0.0.0'),
    GRAPHQL_PORT: zod_1.z.string().transform(Number).default('4000'),
    GRAPHQL_PATH: zod_1.z.string().default('/graphql'),
    GRAPHQL_SUBSCRIPTION_PATH: zod_1.z.string().default('/graphql-subscriptions'),
    WEBSOCKET_PORT: zod_1.z.string().transform(Number).default('8080'),
    WEBSOCKET_PATH: zod_1.z.string().default('/ws'),
    KAFKA_BROKERS: zod_1.z.string().default('localhost:9092'),
    KAFKA_CLIENT_ID: zod_1.z.string().default('rubizz-monitoring-service'),
    KAFKA_GROUP_ID: zod_1.z.string().default('monitoring-service-group'),
    KAFKA_TOPICS_MONITORING: zod_1.z.string().default('monitoring.events'),
    KAFKA_TOPICS_ALERTS: zod_1.z.string().default('monitoring.alerts'),
    KAFKA_TOPICS_METRICS: zod_1.z.string().default('monitoring.metrics'),
});
const env = envSchema.parse(process.env);
exports.config = {
    server: {
        port: env.PORT,
        nodeEnv: env.NODE_ENV,
        serviceName: env.SERVICE_NAME,
        serviceVersion: env.SERVICE_VERSION,
    },
    database: {
        url: env.DATABASE_URL,
    },
    redisService: {
        url: env.REDIS_SERVICE_URL,
        timeout: env.REDIS_SERVICE_TIMEOUT,
        retries: env.REDIS_SERVICE_RETRIES,
        retryDelay: env.REDIS_SERVICE_RETRY_DELAY,
    },
    jwt: {
        secret: env.JWT_SECRET,
        expiresIn: env.JWT_EXPIRES_IN,
        refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
    },
    apiGateway: {
        url: env.API_GATEWAY_URL,
        token: env.API_GATEWAY_TOKEN,
    },
    monitoring: {
        metricsCollectionInterval: env.METRICS_COLLECTION_INTERVAL,
        healthCheckInterval: env.HEALTH_CHECK_INTERVAL,
        alertThresholds: {
            cpu: env.ALERT_THRESHOLD_CPU,
            memory: env.ALERT_THRESHOLD_MEMORY,
            disk: env.ALERT_THRESHOLD_DISK,
            responseTime: env.ALERT_THRESHOLD_RESPONSE_TIME,
        },
    },
    externalServices: {
        prometheus: env.PROMETHEUS_ENDPOINT,
        grafana: env.GRAFANA_ENDPOINT,
        elasticsearch: env.ELASTICSEARCH_ENDPOINT,
    },
    logging: {
        level: env.LOG_LEVEL,
        format: env.LOG_FORMAT,
        filePath: env.LOG_FILE_PATH,
    },
    rateLimit: {
        windowMs: env.RATE_LIMIT_WINDOW_MS,
        maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
    },
    cors: {
        origin: env.CORS_ORIGIN,
        credentials: env.CORS_CREDENTIALS,
    },
    swagger: {
        title: env.SWAGGER_TITLE,
        description: env.SWAGGER_DESCRIPTION,
        version: env.SWAGGER_VERSION,
        baseUrl: env.SWAGGER_BASE_URL,
    },
    alerts: {
        email: {
            enabled: env.ALERT_EMAIL_ENABLED,
            smtp: {
                host: env.ALERT_EMAIL_SMTP_HOST,
                port: env.ALERT_EMAIL_SMTP_PORT,
                user: env.ALERT_EMAIL_USER,
                pass: env.ALERT_EMAIL_PASS,
            },
            from: env.ALERT_EMAIL_FROM,
            to: env.ALERT_EMAIL_TO,
        },
        slack: {
            enabled: env.ALERT_SLACK_ENABLED,
            webhookUrl: env.ALERT_SLACK_WEBHOOK_URL,
        },
        pagerduty: {
            enabled: env.ALERT_PAGERDUTY_ENABLED,
            integrationKey: env.ALERT_PAGERDUTY_INTEGRATION_KEY,
        },
    },
    serviceDiscovery: {
        enabled: env.SERVICE_DISCOVERY_ENABLED,
        registryUrl: env.SERVICE_REGISTRY_URL,
        checkInterval: env.SERVICE_CHECK_INTERVAL,
        checkTimeout: env.SERVICE_CHECK_TIMEOUT,
    },
    grpc: {
        port: env.GRPC_PORT,
        host: env.GRPC_HOST,
    },
    graphql: {
        port: env.GRAPHQL_PORT,
        path: env.GRAPHQL_PATH,
        subscriptionPath: env.GRAPHQL_SUBSCRIPTION_PATH,
    },
    websocket: {
        port: env.WEBSOCKET_PORT,
        path: env.WEBSOCKET_PATH,
    },
    kafka: {
        brokers: env.KAFKA_BROKERS.split(','),
        clientId: env.KAFKA_CLIENT_ID,
        groupId: env.KAFKA_GROUP_ID,
        topics: {
            monitoring: env.KAFKA_TOPICS_MONITORING,
            alerts: env.KAFKA_TOPICS_ALERTS,
            metrics: env.KAFKA_TOPICS_METRICS,
        },
    },
};
exports.server = exports.config.server, exports.database = exports.config.database, exports.redisService = exports.config.redisService, exports.jwt = exports.config.jwt, exports.apiGateway = exports.config.apiGateway, exports.monitoring = exports.config.monitoring, exports.externalServices = exports.config.externalServices, exports.logging = exports.config.logging, exports.rateLimit = exports.config.rateLimit, exports.cors = exports.config.cors, exports.swagger = exports.config.swagger, exports.alerts = exports.config.alerts, exports.serviceDiscovery = exports.config.serviceDiscovery, exports.grpc = exports.config.grpc, exports.graphql = exports.config.graphql, exports.websocket = exports.config.websocket, exports.kafka = exports.config.kafka;
exports.DEFAULT_SERVICES = [
    {
        name: 'rubizz-api-gateway',
        url: 'http://localhost:3000/health',
        port: 3000,
    },
    {
        name: 'rubizz-auth-service',
        url: 'http://localhost:3001/health',
        port: 3001,
    },
    {
        name: 'rubizz-user-service',
        url: 'http://localhost:3002/health',
        port: 3002,
    },
    {
        name: 'rubizz-customer-service',
        url: 'http://localhost:3003/health',
        port: 3003,
    },
    {
        name: 'rubizz-hotel-service',
        url: 'http://localhost:3004/health',
        port: 3004,
    },
    {
        name: 'rubizz-restaurant-service',
        url: 'http://localhost:3005/health',
        port: 3005,
    },
    {
        name: 'rubizz-food-delivery-service',
        url: 'http://localhost:3006/health',
        port: 3006,
    },
    {
        name: 'rubizz-hall-service',
        url: 'http://localhost:3007/health',
        port: 3007,
    },
    {
        name: 'rubizz-inventory-service',
        url: 'http://localhost:3008/health',
        port: 3008,
    },
    {
        name: 'rubizz-finance-service',
        url: 'http://localhost:3010/health',
        port: 3010,
    },
    {
        name: 'rubizz-analytics-service',
        url: 'http://localhost:3011/health',
        port: 3011,
    },
    {
        name: 'rubizz-notification-service',
        url: 'http://localhost:3012/health',
        port: 3012,
    },
    {
        name: 'rubizz-logging-service',
        url: 'http://localhost:3013/health',
        port: 3013,
    },
    {
        name: 'rubizz-administration-service',
        url: 'http://localhost:3014/health',
        port: 3014,
    },
];
exports.default = exports.config;
//# sourceMappingURL=config.js.map
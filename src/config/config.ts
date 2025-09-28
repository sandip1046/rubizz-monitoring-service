import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenv.config();

// Environment validation schema
const envSchema = z.object({
  // Server Configuration
  PORT: z.string().transform(Number).default('3009'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  SERVICE_NAME: z.string().default('rubizz-monitoring-service'),
  SERVICE_VERSION: z.string().default('1.0.0'),

  // Database Configuration
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // Redis Configuration
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().transform(Number).default('6379'),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.string().transform(Number).default('0'),

  // JWT Configuration
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('24h'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // API Gateway Configuration
  API_GATEWAY_URL: z.string().url().default('http://localhost:3000'),
  API_GATEWAY_TOKEN: z.string().optional(),

  // Monitoring Configuration
  METRICS_COLLECTION_INTERVAL: z.string().transform(Number).default('30000'),
  HEALTH_CHECK_INTERVAL: z.string().transform(Number).default('60000'),
  ALERT_THRESHOLD_CPU: z.string().transform(Number).default('80'),
  ALERT_THRESHOLD_MEMORY: z.string().transform(Number).default('85'),
  ALERT_THRESHOLD_DISK: z.string().transform(Number).default('90'),
  ALERT_THRESHOLD_RESPONSE_TIME: z.string().transform(Number).default('5000'),

  // External Services
  PROMETHEUS_ENDPOINT: z.string().url().optional(),
  GRAFANA_ENDPOINT: z.string().url().optional(),
  ELASTICSEARCH_ENDPOINT: z.string().url().optional(),

  // Logging Configuration
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_FORMAT: z.enum(['json', 'simple']).default('json'),
  LOG_FILE_PATH: z.string().default('./logs/monitoring-service.log'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),

  // CORS Configuration
  CORS_ORIGIN: z.string().default('http://localhost:4200'),
  CORS_CREDENTIALS: z.string().transform(val => val === 'true').default('true'),

  // Swagger Configuration
  SWAGGER_TITLE: z.string().default('Rubizz Monitoring Service API'),
  SWAGGER_DESCRIPTION: z.string().default('API documentation for Rubizz Hotel Inn Monitoring Service'),
  SWAGGER_VERSION: z.string().default('1.0.0'),
  SWAGGER_BASE_URL: z.string().url().default('http://localhost:3009'),

  // Alert Configuration
  ALERT_EMAIL_ENABLED: z.string().transform(val => val === 'true').default('false'),
  ALERT_EMAIL_SMTP_HOST: z.string().optional(),
  ALERT_EMAIL_SMTP_PORT: z.string().transform(Number).optional(),
  ALERT_EMAIL_USER: z.string().optional(),
  ALERT_EMAIL_PASS: z.string().optional(),
  ALERT_EMAIL_FROM: z.string().email().optional(),
  ALERT_EMAIL_TO: z.string().email().optional(),

  // Slack Configuration
  ALERT_SLACK_ENABLED: z.string().transform(val => val === 'true').default('false'),
  ALERT_SLACK_WEBHOOK_URL: z.string().url().optional(),

  // PagerDuty Configuration
  ALERT_PAGERDUTY_ENABLED: z.string().transform(val => val === 'true').default('false'),
  ALERT_PAGERDUTY_INTEGRATION_KEY: z.string().optional(),

  // Service Discovery
  SERVICE_DISCOVERY_ENABLED: z.string().transform(val => val === 'true').default('false'),
  SERVICE_REGISTRY_URL: z.string().url().optional(),
  SERVICE_CHECK_INTERVAL: z.string().default('30s'),
  SERVICE_CHECK_TIMEOUT: z.string().default('10s'),
});

// Validate environment variables
const env = envSchema.parse(process.env);

// Configuration object
export const config = {
  // Server Configuration
  server: {
    port: env.PORT,
    nodeEnv: env.NODE_ENV,
    serviceName: env.SERVICE_NAME,
    serviceVersion: env.SERVICE_VERSION,
  },

  // Database Configuration
  database: {
    url: env.DATABASE_URL,
  },

  // Redis Configuration
  redis: {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD,
    db: env.REDIS_DB,
  },

  // JWT Configuration
  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
    refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
  },

  // API Gateway Configuration
  apiGateway: {
    url: env.API_GATEWAY_URL,
    token: env.API_GATEWAY_TOKEN,
  },

  // Monitoring Configuration
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

  // External Services
  externalServices: {
    prometheus: env.PROMETHEUS_ENDPOINT,
    grafana: env.GRAFANA_ENDPOINT,
    elasticsearch: env.ELASTICSEARCH_ENDPOINT,
  },

  // Logging Configuration
  logging: {
    level: env.LOG_LEVEL,
    format: env.LOG_FORMAT,
    filePath: env.LOG_FILE_PATH,
  },

  // Rate Limiting
  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
  },

  // CORS Configuration
  cors: {
    origin: env.CORS_ORIGIN,
    credentials: env.CORS_CREDENTIALS,
  },

  // Swagger Configuration
  swagger: {
    title: env.SWAGGER_TITLE,
    description: env.SWAGGER_DESCRIPTION,
    version: env.SWAGGER_VERSION,
    baseUrl: env.SWAGGER_BASE_URL,
  },

  // Alert Configuration
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

  // Service Discovery
  serviceDiscovery: {
    enabled: env.SERVICE_DISCOVERY_ENABLED,
    registryUrl: env.SERVICE_REGISTRY_URL,
    checkInterval: env.SERVICE_CHECK_INTERVAL,
    checkTimeout: env.SERVICE_CHECK_TIMEOUT,
  },
};

// Export individual configurations for convenience
export const {
  server,
  database,
  redis,
  jwt,
  apiGateway,
  monitoring,
  externalServices,
  logging,
  rateLimit,
  cors,
  swagger,
  alerts,
  serviceDiscovery,
} = config;

// Default service endpoints for monitoring
export const DEFAULT_SERVICES = [
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

export default config;

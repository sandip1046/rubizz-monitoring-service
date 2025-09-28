import winston from 'winston';
import path from 'path';
import { config } from '@/config/config';

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss.SSS',
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss.SSS',
  }),
  winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
    let log = `${timestamp} [${level}]`;
    if (service) log += ` [${service}]`;
    log += `: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      log += `\n${JSON.stringify(meta, null, 2)}`;
    }
    
    return log;
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  defaultMeta: {
    service: config.server.serviceName,
    version: config.server.serviceVersion,
    environment: config.server.nodeEnv,
  },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: config.server.nodeEnv === 'development' ? consoleFormat : logFormat,
    }),
    
    // File transport for errors
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: logFormat,
    }),
    
    // File transport for all logs
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: logFormat,
    }),
  ],
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'exceptions.log'),
      format: logFormat,
    }),
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'rejections.log'),
      format: logFormat,
    }),
  ],
});

// Add request ID to logs
export const addRequestId = (requestId: string) => {
  return winston.format((info) => {
    info.requestId = requestId;
    return info;
  })();
};

// Create child logger with additional context
export const createChildLogger = (context: Record<string, any>) => {
  return logger.child(context);
};

// Structured logging methods
export const logInfo = (message: string, meta?: Record<string, any>) => {
  logger.info(message, meta);
};

export const logError = (message: string, error?: Error | any, meta?: Record<string, any>) => {
  const errorMeta = {
    ...meta,
    error: error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      name: error.name,
    } : error,
  };
  logger.error(message, errorMeta);
};

export const logWarn = (message: string, meta?: Record<string, any>) => {
  logger.warn(message, meta);
};

export const logDebug = (message: string, meta?: Record<string, any>) => {
  logger.debug(message, meta);
};

// Performance logging
export const logPerformance = (operation: string, duration: number, meta?: Record<string, any>) => {
  logger.info(`Performance: ${operation}`, {
    ...meta,
    operation,
    duration,
    unit: 'ms',
  });
};

// API request logging
export const logApiRequest = (
  method: string,
  url: string,
  statusCode: number,
  responseTime: number,
  meta?: Record<string, any>
) => {
  logger.info('API Request', {
    ...meta,
    method,
    url,
    statusCode,
    responseTime,
    unit: 'ms',
  });
};

// Database operation logging
export const logDatabaseOperation = (
  operation: string,
  table: string,
  duration: number,
  meta?: Record<string, any>
) => {
  logger.debug('Database Operation', {
    ...meta,
    operation,
    table,
    duration,
    unit: 'ms',
  });
};

// Service health logging
export const logServiceHealth = (
  serviceName: string,
  status: string,
  responseTime: number,
  meta?: Record<string, any>
) => {
  logger.info('Service Health Check', {
    ...meta,
    serviceName,
    status,
    responseTime,
    unit: 'ms',
  });
};

// Alert logging
export const logAlert = (
  alertType: string,
  severity: string,
  serviceName: string,
  message: string,
  meta?: Record<string, any>
) => {
  logger.warn('Alert Triggered', {
    ...meta,
    alertType,
    severity,
    serviceName,
    message,
  });
};

// Metrics logging
export const logMetrics = (
  metricName: string,
  value: number,
  serviceName: string,
  meta?: Record<string, any>
) => {
  logger.debug('Metrics Collected', {
    ...meta,
    metricName,
    value,
    serviceName,
  });
};

// Security logging
export const logSecurity = (
  event: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  details: string,
  meta?: Record<string, any>
) => {
  logger.warn('Security Event', {
    ...meta,
    event,
    severity,
    details,
  });
};

// Audit logging
export const logAudit = (
  action: string,
  userId?: string,
  resource?: string,
  details?: Record<string, any>
) => {
  logger.info('Audit Log', {
    action,
    userId,
    resource,
    details,
    timestamp: new Date().toISOString(),
  });
};

// Error logging with context
export const logErrorWithContext = (
  message: string,
  error: Error,
  context: Record<string, any>
) => {
  logger.error(message, {
    ...context,
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name,
    },
  });
};

// Cleanup method for graceful shutdown
export const cleanupLogger = () => {
  logger.end();
};

export default logger;

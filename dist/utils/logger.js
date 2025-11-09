"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupLogger = exports.logErrorWithContext = exports.logAudit = exports.logSecurity = exports.logMetrics = exports.logAlert = exports.logServiceHealth = exports.logDatabaseOperation = exports.logApiRequest = exports.logPerformance = exports.logDebug = exports.logWarn = exports.logError = exports.logInfo = exports.createChildLogger = exports.addRequestId = void 0;
const winston_1 = __importDefault(require("winston"));
const path_1 = __importDefault(require("path"));
const config_1 = require("@/config/config");
const logFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss.SSS',
}), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json(), winston_1.default.format.prettyPrint());
const consoleFormat = winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss.SSS',
}), winston_1.default.format.printf(({ timestamp, level, message, service, ...meta }) => {
    let log = `${timestamp} [${level}]`;
    if (service)
        log += ` [${service}]`;
    log += `: ${message}`;
    if (Object.keys(meta).length > 0) {
        log += `\n${JSON.stringify(meta, null, 2)}`;
    }
    return log;
}));
const logger = winston_1.default.createLogger({
    level: config_1.config.logging.level,
    format: logFormat,
    defaultMeta: {
        service: config_1.config.server.serviceName,
        version: config_1.config.server.serviceVersion,
        environment: config_1.config.server.nodeEnv,
    },
    transports: [
        new winston_1.default.transports.Console({
            format: config_1.config.server.nodeEnv === 'development' ? consoleFormat : logFormat,
        }),
        new winston_1.default.transports.File({
            filename: path_1.default.join(process.cwd(), 'logs', 'error.log'),
            level: 'error',
            maxsize: 5242880,
            maxFiles: 5,
            format: logFormat,
        }),
        new winston_1.default.transports.File({
            filename: path_1.default.join(process.cwd(), 'logs', 'combined.log'),
            maxsize: 5242880,
            maxFiles: 5,
            format: logFormat,
        }),
    ],
    exceptionHandlers: [
        new winston_1.default.transports.File({
            filename: path_1.default.join(process.cwd(), 'logs', 'exceptions.log'),
            format: logFormat,
        }),
    ],
    rejectionHandlers: [
        new winston_1.default.transports.File({
            filename: path_1.default.join(process.cwd(), 'logs', 'rejections.log'),
            format: logFormat,
        }),
    ],
});
const addRequestId = (requestId) => {
    return winston_1.default.format((info) => {
        info.requestId = requestId;
        return info;
    })();
};
exports.addRequestId = addRequestId;
const createChildLogger = (context) => {
    return logger.child(context);
};
exports.createChildLogger = createChildLogger;
const logInfo = (message, meta) => {
    logger.info(message, meta);
};
exports.logInfo = logInfo;
const logError = (message, error, meta) => {
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
exports.logError = logError;
const logWarn = (message, meta) => {
    logger.warn(message, meta);
};
exports.logWarn = logWarn;
const logDebug = (message, meta) => {
    logger.debug(message, meta);
};
exports.logDebug = logDebug;
const logPerformance = (operation, duration, meta) => {
    logger.info(`Performance: ${operation}`, {
        ...meta,
        operation,
        duration,
        unit: 'ms',
    });
};
exports.logPerformance = logPerformance;
const logApiRequest = (method, url, statusCode, responseTime, meta) => {
    logger.info('API Request', {
        ...meta,
        method,
        url,
        statusCode,
        responseTime,
        unit: 'ms',
    });
};
exports.logApiRequest = logApiRequest;
const logDatabaseOperation = (operation, table, duration, meta) => {
    logger.debug('Database Operation', {
        ...meta,
        operation,
        table,
        duration,
        unit: 'ms',
    });
};
exports.logDatabaseOperation = logDatabaseOperation;
const logServiceHealth = (serviceName, status, responseTime, meta) => {
    logger.info('Service Health Check', {
        ...meta,
        serviceName,
        status,
        responseTime,
        unit: 'ms',
    });
};
exports.logServiceHealth = logServiceHealth;
const logAlert = (alertType, severity, serviceName, message, meta) => {
    logger.warn('Alert Triggered', {
        ...meta,
        alertType,
        severity,
        serviceName,
        message,
    });
};
exports.logAlert = logAlert;
const logMetrics = (metricName, value, serviceName, meta) => {
    logger.debug('Metrics Collected', {
        ...meta,
        metricName,
        value,
        serviceName,
    });
};
exports.logMetrics = logMetrics;
const logSecurity = (event, severity, details, meta) => {
    logger.warn('Security Event', {
        ...meta,
        event,
        severity,
        details,
    });
};
exports.logSecurity = logSecurity;
const logAudit = (action, userId, resource, details) => {
    logger.info('Audit Log', {
        action,
        userId,
        resource,
        details,
        timestamp: new Date().toISOString(),
    });
};
exports.logAudit = logAudit;
const logErrorWithContext = (message, error, context) => {
    logger.error(message, {
        ...context,
        error: {
            message: error.message,
            stack: error.stack,
            name: error.name,
        },
    });
};
exports.logErrorWithContext = logErrorWithContext;
const cleanupLogger = () => {
    logger.end();
};
exports.cleanupLogger = cleanupLogger;
exports.default = logger;
//# sourceMappingURL=logger.js.map
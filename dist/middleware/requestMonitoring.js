"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestMonitoringMiddleware = exports.RequestMonitoringMiddleware = void 0;
const MetricsCollectionService_1 = require("@/services/MetricsCollectionService");
const logger_1 = __importDefault(require("@/utils/logger"));
const config_1 = require("@/config/config");
class RequestMonitoringMiddleware {
    constructor() {
        this.metricsCollectionService = MetricsCollectionService_1.MetricsCollectionService.getInstance();
    }
    monitorRequests() {
        return async (req, res, next) => {
            const startTime = Date.now();
            const requestId = req.headers['x-request-id'] || this.generateRequestId();
            if (!req.headers['x-request-id']) {
                req.headers['x-request-id'] = requestId;
            }
            res.setHeader('X-Request-ID', requestId);
            const originalSend = res.send;
            const originalJson = res.json;
            const originalEnd = res.end;
            let responseSize = 0;
            let statusCode = 200;
            res.send = function (data) {
                responseSize = Buffer.byteLength(data || '', 'utf8');
                statusCode = res.statusCode;
                return originalSend.call(this, data);
            };
            res.json = function (data) {
                const jsonData = JSON.stringify(data || {});
                responseSize = Buffer.byteLength(jsonData, 'utf8');
                statusCode = res.statusCode;
                return originalJson.call(this, data);
            };
            res.end = function (data, encoding, cb) {
                if (data) {
                    responseSize = Buffer.byteLength(data || '', 'utf8');
                }
                statusCode = res.statusCode;
                if (typeof cb === 'function') {
                    return originalEnd.call(this, data, encoding, cb);
                }
                else if (encoding && typeof encoding !== 'function') {
                    return originalEnd.call(this, data, encoding);
                }
                else {
                    return originalEnd.call(this, data, encoding);
                }
            };
            res.on('finish', async () => {
                try {
                    const responseTime = Date.now() - startTime;
                    const requestSize = this.getRequestSize(req);
                    await this.metricsCollectionService.recordPerformanceMetric({
                        serviceName: config_1.config.server.serviceName,
                        endpoint: req.path,
                        method: req.method,
                        responseTime,
                        statusCode,
                        requestSize,
                        responseSize,
                        userAgent: req.get('User-Agent'),
                        ipAddress: this.getClientIP(req),
                        timestamp: new Date(),
                    });
                    logger_1.default.info('Request completed', {
                        requestId,
                        method: req.method,
                        url: req.originalUrl,
                        statusCode,
                        responseTime,
                        requestSize,
                        responseSize,
                        userAgent: req.get('User-Agent'),
                        ipAddress: this.getClientIP(req),
                    });
                }
                catch (error) {
                    logger_1.default.error('Error recording performance metric', {
                        requestId,
                        error: error instanceof Error ? error.message : 'Unknown error',
                    });
                }
            });
            res.on('close', () => {
                const responseTime = Date.now() - startTime;
                logger_1.default.warn('Request closed by client', {
                    requestId,
                    method: req.method,
                    url: req.originalUrl,
                    responseTime,
                    statusCode: res.statusCode,
                });
            });
            res.on('error', (error) => {
                const responseTime = Date.now() - startTime;
                logger_1.default.error('Response error', {
                    requestId,
                    method: req.method,
                    url: req.originalUrl,
                    responseTime,
                    error: error.message,
                });
            });
            next();
        };
    }
    addRequestId() {
        return (req, res, next) => {
            const requestId = req.headers['x-request-id'] || this.generateRequestId();
            req.headers['x-request-id'] = requestId;
            res.setHeader('X-Request-ID', requestId);
            req.requestId = requestId;
            next();
        };
    }
    logRequests() {
        return (req, res, next) => {
            const requestId = req.headers['x-request-id'] || 'unknown';
            logger_1.default.info('Request started', {
                requestId,
                method: req.method,
                url: req.originalUrl,
                userAgent: req.get('User-Agent'),
                ipAddress: this.getClientIP(req),
                headers: this.getSafeHeaders(req),
                query: req.query,
                body: this.getSafeBody(req),
            });
            next();
        };
    }
    trackSlowRequests(thresholdMs = 5000) {
        return (req, res, next) => {
            const startTime = Date.now();
            const requestId = req.headers['x-request-id'] || 'unknown';
            res.on('finish', () => {
                const responseTime = Date.now() - startTime;
                if (responseTime > thresholdMs) {
                    logger_1.default.warn('Slow request detected', {
                        requestId,
                        method: req.method,
                        url: req.originalUrl,
                        responseTime,
                        threshold: thresholdMs,
                        statusCode: res.statusCode,
                    });
                }
            });
            next();
        };
    }
    trackErrorRequests() {
        return (req, res, next) => {
            const requestId = req.headers['x-request-id'] || 'unknown';
            res.on('finish', () => {
                if (res.statusCode >= 400) {
                    logger_1.default.warn('Error request detected', {
                        requestId,
                        method: req.method,
                        url: req.originalUrl,
                        statusCode: res.statusCode,
                        userAgent: req.get('User-Agent'),
                        ipAddress: this.getClientIP(req),
                    });
                }
            });
            next();
        };
    }
    generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    getClientIP(req) {
        return (req.ip ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            req.connection?.socket?.remoteAddress ||
            req.headers['x-forwarded-for']?.toString().split(',')[0] ||
            req.headers['x-real-ip']?.toString() ||
            'unknown');
    }
    getRequestSize(req) {
        const contentLength = req.get('content-length');
        if (contentLength) {
            return parseInt(contentLength, 10);
        }
        if (req.body) {
            return Buffer.byteLength(JSON.stringify(req.body), 'utf8');
        }
        return 0;
    }
    getSafeHeaders(req) {
        const safeHeaders = {};
        const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'x-auth-token'];
        Object.entries(req.headers).forEach(([key, value]) => {
            if (!sensitiveHeaders.includes(key.toLowerCase())) {
                safeHeaders[key] = Array.isArray(value) ? value.join(', ') : value || '';
            }
            else {
                safeHeaders[key] = '[REDACTED]';
            }
        });
        return safeHeaders;
    }
    getSafeBody(req) {
        if (!req.body) {
            return undefined;
        }
        const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth'];
        const safeBody = { ...req.body };
        Object.keys(safeBody).forEach(key => {
            if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
                safeBody[key] = '[REDACTED]';
            }
        });
        return safeBody;
    }
}
exports.RequestMonitoringMiddleware = RequestMonitoringMiddleware;
exports.requestMonitoringMiddleware = new RequestMonitoringMiddleware();
//# sourceMappingURL=requestMonitoring.js.map
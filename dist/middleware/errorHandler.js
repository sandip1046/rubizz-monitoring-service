"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleCORSError = exports.handleTimeoutError = exports.handleJWTError = exports.handleRateLimitError = exports.handleDatabaseError = exports.handleValidationError = exports.asyncHandler = exports.handleNotFound = exports.handleError = exports.ErrorHandlerMiddleware = void 0;
const logger_1 = __importDefault(require("@/utils/logger"));
class ErrorHandlerMiddleware {
    static handleError() {
        return (error, req, res, next) => {
            const requestId = req.headers['x-request-id'] || 'unknown';
            logger_1.default.error('Unhandled error occurred', {
                requestId,
                error: error.message,
                stack: error.stack,
                method: req.method,
                url: req.originalUrl,
                userAgent: req.get('User-Agent'),
                ipAddress: req.ip,
                body: req.body,
                query: req.query,
                params: req.params,
            });
            let statusCode = 500;
            let message = 'Internal Server Error';
            if (error.name === 'ValidationError') {
                statusCode = 400;
                message = 'Validation Error';
            }
            else if (error.name === 'UnauthorizedError') {
                statusCode = 401;
                message = 'Unauthorized';
            }
            else if (error.name === 'ForbiddenError') {
                statusCode = 403;
                message = 'Forbidden';
            }
            else if (error.name === 'NotFoundError') {
                statusCode = 404;
                message = 'Not Found';
            }
            else if (error.name === 'ConflictError') {
                statusCode = 409;
                message = 'Conflict';
            }
            else if (error.name === 'TooManyRequestsError') {
                statusCode = 429;
                message = 'Too Many Requests';
            }
            const errorResponse = {
                success: false,
                error: message,
                message: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred',
                timestamp: new Date(),
                requestId,
            };
            if (process.env.NODE_ENV === 'development') {
                errorResponse.stack = error.stack;
            }
            res.status(statusCode).json(errorResponse);
        };
    }
    static handleNotFound() {
        return (req, res, next) => {
            const requestId = req.headers['x-request-id'] || 'unknown';
            logger_1.default.warn('Route not found', {
                requestId,
                method: req.method,
                url: req.originalUrl,
                userAgent: req.get('User-Agent'),
                ipAddress: req.ip,
            });
            const errorResponse = {
                success: false,
                error: 'Not Found',
                message: `Route ${req.method} ${req.originalUrl} not found`,
                timestamp: new Date(),
                requestId,
            };
            res.status(404).json(errorResponse);
        };
    }
    static asyncHandler(fn) {
        return (req, res, next) => {
            Promise.resolve(fn(req, res, next)).catch(next);
        };
    }
    static handleValidationError() {
        return (error, req, res, next) => {
            if (error.name === 'ValidationError' || error.isJoi) {
                const requestId = req.headers['x-request-id'] || 'unknown';
                logger_1.default.warn('Validation error', {
                    requestId,
                    error: error.message,
                    method: req.method,
                    url: req.originalUrl,
                    body: req.body,
                    query: req.query,
                });
                const errorResponse = {
                    success: false,
                    error: 'Validation Error',
                    message: error.message,
                    timestamp: new Date(),
                    requestId,
                };
                if (error.details) {
                    errorResponse.validationErrors = error.details.map((detail) => ({
                        field: detail.path?.join('.') || detail.context?.key,
                        message: detail.message,
                        value: detail.context?.value,
                    }));
                }
                res.status(400).json(errorResponse);
                return;
            }
            next(error);
        };
    }
    static handleDatabaseError() {
        return (error, req, res, next) => {
            if (error.code && error.code.startsWith('P')) {
                const requestId = req.headers['x-request-id'] || 'unknown';
                logger_1.default.error('Database error', {
                    requestId,
                    error: error.message,
                    code: error.code,
                    method: req.method,
                    url: req.originalUrl,
                });
                let statusCode = 500;
                let message = 'Database Error';
                switch (error.code) {
                    case 'P2002':
                        statusCode = 409;
                        message = 'Duplicate entry';
                        break;
                    case 'P2025':
                        statusCode = 404;
                        message = 'Record not found';
                        break;
                    case 'P2003':
                        statusCode = 400;
                        message = 'Foreign key constraint failed';
                        break;
                    case 'P2014':
                        statusCode = 400;
                        message = 'Invalid ID';
                        break;
                }
                const errorResponse = {
                    success: false,
                    error: message,
                    message: process.env.NODE_ENV === 'development' ? error.message : 'A database error occurred',
                    timestamp: new Date(),
                    requestId,
                };
                res.status(statusCode).json(errorResponse);
                return;
            }
            next(error);
        };
    }
    static handleRateLimitError() {
        return (error, req, res, next) => {
            if (error.status === 429) {
                const requestId = req.headers['x-request-id'] || 'unknown';
                logger_1.default.warn('Rate limit exceeded', {
                    requestId,
                    method: req.method,
                    url: req.originalUrl,
                    ipAddress: req.ip,
                    userAgent: req.get('User-Agent'),
                });
                const errorResponse = {
                    success: false,
                    error: 'Too Many Requests',
                    message: 'Rate limit exceeded. Please try again later.',
                    timestamp: new Date(),
                    requestId,
                };
                res.setHeader('Retry-After', Math.round(error.resetTime / 1000) || 60);
                res.setHeader('X-RateLimit-Limit', error.limit || 100);
                res.setHeader('X-RateLimit-Remaining', error.remaining || 0);
                res.setHeader('X-RateLimit-Reset', new Date(error.resetTime || Date.now() + 60000).toISOString());
                res.status(429).json(errorResponse);
                return;
            }
            next(error);
        };
    }
    static handleJWTError() {
        return (error, req, res, next) => {
            if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
                const requestId = req.headers['x-request-id'] || 'unknown';
                logger_1.default.warn('JWT error', {
                    requestId,
                    error: error.message,
                    method: req.method,
                    url: req.originalUrl,
                    ipAddress: req.ip,
                });
                const errorResponse = {
                    success: false,
                    error: 'Unauthorized',
                    message: error.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token',
                    timestamp: new Date(),
                    requestId,
                };
                res.status(401).json(errorResponse);
                return;
            }
            next(error);
        };
    }
    static handleTimeoutError() {
        return (error, req, res, next) => {
            if (error.code === 'ETIMEDOUT' || error.timeout) {
                const requestId = req.headers['x-request-id'] || 'unknown';
                logger_1.default.error('Timeout error', {
                    requestId,
                    error: error.message,
                    method: req.method,
                    url: req.originalUrl,
                    timeout: error.timeout,
                });
                const errorResponse = {
                    success: false,
                    error: 'Request Timeout',
                    message: 'The request timed out',
                    timestamp: new Date(),
                    requestId,
                };
                res.status(408).json(errorResponse);
                return;
            }
            next(error);
        };
    }
    static handleCORSError() {
        return (error, req, res, next) => {
            if (error.message && error.message.includes('CORS')) {
                const requestId = req.headers['x-request-id'] || 'unknown';
                logger_1.default.warn('CORS error', {
                    requestId,
                    error: error.message,
                    method: req.method,
                    url: req.originalUrl,
                    origin: req.get('Origin'),
                });
                const errorResponse = {
                    success: false,
                    error: 'CORS Error',
                    message: 'Cross-origin request blocked',
                    timestamp: new Date(),
                    requestId,
                };
                res.status(403).json(errorResponse);
                return;
            }
            next(error);
        };
    }
}
exports.ErrorHandlerMiddleware = ErrorHandlerMiddleware;
exports.handleError = ErrorHandlerMiddleware.handleError, exports.handleNotFound = ErrorHandlerMiddleware.handleNotFound, exports.asyncHandler = ErrorHandlerMiddleware.asyncHandler, exports.handleValidationError = ErrorHandlerMiddleware.handleValidationError, exports.handleDatabaseError = ErrorHandlerMiddleware.handleDatabaseError, exports.handleRateLimitError = ErrorHandlerMiddleware.handleRateLimitError, exports.handleJWTError = ErrorHandlerMiddleware.handleJWTError, exports.handleTimeoutError = ErrorHandlerMiddleware.handleTimeoutError, exports.handleCORSError = ErrorHandlerMiddleware.handleCORSError;
//# sourceMappingURL=errorHandler.js.map
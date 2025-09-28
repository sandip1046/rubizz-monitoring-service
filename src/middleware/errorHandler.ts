import { Request, Response, NextFunction } from 'express';
import { logger } from '@/utils/logger';
import { ApiResponse } from '@/types';

export class ErrorHandlerMiddleware {
  /**
   * Global error handler middleware
   */
  public static handleError() {
    return (error: Error, req: Request, res: Response, next: NextFunction): void => {
      const requestId = req.headers['x-request-id'] as string || 'unknown';
      
      // Log the error
      logger.error('Unhandled error occurred', {
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

      // Determine status code based on error type
      let statusCode = 500;
      let message = 'Internal Server Error';

      if (error.name === 'ValidationError') {
        statusCode = 400;
        message = 'Validation Error';
      } else if (error.name === 'UnauthorizedError') {
        statusCode = 401;
        message = 'Unauthorized';
      } else if (error.name === 'ForbiddenError') {
        statusCode = 403;
        message = 'Forbidden';
      } else if (error.name === 'NotFoundError') {
        statusCode = 404;
        message = 'Not Found';
      } else if (error.name === 'ConflictError') {
        statusCode = 409;
        message = 'Conflict';
      } else if (error.name === 'TooManyRequestsError') {
        statusCode = 429;
        message = 'Too Many Requests';
      }

      const errorResponse: ApiResponse = {
        success: false,
        error: message,
        message: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred',
        timestamp: new Date(),
        requestId,
      };

      // Add stack trace in development
      if (process.env.NODE_ENV === 'development') {
        (errorResponse as any).stack = error.stack;
      }

      res.status(statusCode).json(errorResponse);
    };
  }

  /**
   * Handle 404 errors
   */
  public static handleNotFound() {
    return (req: Request, res: Response, next: NextFunction): void => {
      const requestId = req.headers['x-request-id'] as string || 'unknown';
      
      logger.warn('Route not found', {
        requestId,
        method: req.method,
        url: req.originalUrl,
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip,
      });

      const errorResponse: ApiResponse = {
        success: false,
        error: 'Not Found',
        message: `Route ${req.method} ${req.originalUrl} not found`,
        timestamp: new Date(),
        requestId,
      };

      res.status(404).json(errorResponse);
    };
  }

  /**
   * Handle async errors
   */
  public static asyncHandler(fn: Function) {
    return (req: Request, res: Response, next: NextFunction): void => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }

  /**
   * Handle validation errors
   */
  public static handleValidationError() {
    return (error: any, req: Request, res: Response, next: NextFunction): void => {
      if (error.name === 'ValidationError' || error.isJoi) {
        const requestId = req.headers['x-request-id'] as string || 'unknown';
        
        logger.warn('Validation error', {
          requestId,
          error: error.message,
          method: req.method,
          url: req.originalUrl,
          body: req.body,
          query: req.query,
        });

        const errorResponse: ApiResponse = {
          success: false,
          error: 'Validation Error',
          message: error.message,
          timestamp: new Date(),
          requestId,
        };

        // Add validation details if available
        if (error.details) {
          (errorResponse as any).validationErrors = error.details.map((detail: any) => ({
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

  /**
   * Handle database errors
   */
  public static handleDatabaseError() {
    return (error: any, req: Request, res: Response, next: NextFunction): void => {
      if (error.code && error.code.startsWith('P')) {
        // Prisma error
        const requestId = req.headers['x-request-id'] as string || 'unknown';
        
        logger.error('Database error', {
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

        const errorResponse: ApiResponse = {
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

  /**
   * Handle rate limit errors
   */
  public static handleRateLimitError() {
    return (error: any, req: Request, res: Response, next: NextFunction): void => {
      if (error.status === 429) {
        const requestId = req.headers['x-request-id'] as string || 'unknown';
        
        logger.warn('Rate limit exceeded', {
          requestId,
          method: req.method,
          url: req.originalUrl,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
        });

        const errorResponse: ApiResponse = {
          success: false,
          error: 'Too Many Requests',
          message: 'Rate limit exceeded. Please try again later.',
          timestamp: new Date(),
          requestId,
        };

        // Add rate limit headers
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

  /**
   * Handle JWT errors
   */
  public static handleJWTError() {
    return (error: any, req: Request, res: Response, next: NextFunction): void => {
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        const requestId = req.headers['x-request-id'] as string || 'unknown';
        
        logger.warn('JWT error', {
          requestId,
          error: error.message,
          method: req.method,
          url: req.originalUrl,
          ipAddress: req.ip,
        });

        const errorResponse: ApiResponse = {
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

  /**
   * Handle timeout errors
   */
  public static handleTimeoutError() {
    return (error: any, req: Request, res: Response, next: NextFunction): void => {
      if (error.code === 'ETIMEDOUT' || error.timeout) {
        const requestId = req.headers['x-request-id'] as string || 'unknown';
        
        logger.error('Timeout error', {
          requestId,
          error: error.message,
          method: req.method,
          url: req.originalUrl,
          timeout: error.timeout,
        });

        const errorResponse: ApiResponse = {
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

  /**
   * Handle CORS errors
   */
  public static handleCORSError() {
    return (error: any, req: Request, res: Response, next: NextFunction): void => {
      if (error.message && error.message.includes('CORS')) {
        const requestId = req.headers['x-request-id'] as string || 'unknown';
        
        logger.warn('CORS error', {
          requestId,
          error: error.message,
          method: req.method,
          url: req.originalUrl,
          origin: req.get('Origin'),
        });

        const errorResponse: ApiResponse = {
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

// Export error handler functions
export const {
  handleError,
  handleNotFound,
  asyncHandler,
  handleValidationError,
  handleDatabaseError,
  handleRateLimitError,
  handleJWTError,
  handleTimeoutError,
  handleCORSError,
} = ErrorHandlerMiddleware;

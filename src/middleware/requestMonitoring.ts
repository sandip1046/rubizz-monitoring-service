import { Request, Response, NextFunction } from 'express';
import { MetricsCollectionService } from '@/services/MetricsCollectionService';
import logger from '@/utils/logger';
import { config } from '@/config/config';

export class RequestMonitoringMiddleware {
  private metricsCollectionService: MetricsCollectionService;

  constructor() {
    this.metricsCollectionService = MetricsCollectionService.getInstance();
  }

  /**
   * Middleware to monitor and record performance metrics for requests
   */
  public monitorRequests() {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const startTime = Date.now();
      const requestId = req.headers['x-request-id'] as string || this.generateRequestId();
      
      // Add request ID to headers if not present
      if (!req.headers['x-request-id']) {
        req.headers['x-request-id'] = requestId;
      }

      // Add request ID to response headers
      res.setHeader('X-Request-ID', requestId);

      // Capture original response methods
      const originalSend = res.send;
      const originalJson = res.json;
      const originalEnd = res.end;

      let responseSize = 0;
      let statusCode = 200;

      // Override response methods to capture data
      res.send = function(data: any) {
        responseSize = Buffer.byteLength(data || '', 'utf8');
        statusCode = res.statusCode;
        return originalSend.call(this, data);
      };

      res.json = function(data: any) {
        const jsonData = JSON.stringify(data || {});
        responseSize = Buffer.byteLength(jsonData, 'utf8');
        statusCode = res.statusCode;
        return originalJson.call(this, data);
      };

      res.end = function(data?: any, encoding?: any, cb?: any) {
        if (data) {
          responseSize = Buffer.byteLength(data || '', 'utf8');
        }
        statusCode = res.statusCode;
        if (typeof cb === 'function') {
          return originalEnd.call(this, data, encoding, cb);
        } else if (encoding && typeof encoding !== 'function') {
          return originalEnd.call(this, data, encoding);
        } else {
          return originalEnd.call(this, data, encoding);
        }
      };

      // Handle response finish event
      res.on('finish', async () => {
        try {
          const responseTime = Date.now() - startTime;
          const requestSize = this.getRequestSize(req);

          // Record performance metric
          await this.metricsCollectionService.recordPerformanceMetric({
            serviceName: config.server.serviceName,
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

          // Log request details
          logger.info('Request completed', {
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
        } catch (error) {
          logger.error('Error recording performance metric', {
            requestId,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      });

      // Handle response close event (client disconnected)
      res.on('close', () => {
        const responseTime = Date.now() - startTime;
        
        logger.warn('Request closed by client', {
          requestId,
          method: req.method,
          url: req.originalUrl,
          responseTime,
          statusCode: res.statusCode,
        });
      });

      // Handle response error event
      res.on('error', (error) => {
        const responseTime = Date.now() - startTime;
        
        logger.error('Response error', {
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

  /**
   * Middleware to add request ID to all requests
   */
  public addRequestId() {
    return (req: Request, res: Response, next: NextFunction): void => {
      const requestId = req.headers['x-request-id'] as string || this.generateRequestId();
      
      req.headers['x-request-id'] = requestId;
      res.setHeader('X-Request-ID', requestId);
      
      // Add request ID to request object for easy access
      (req as any).requestId = requestId;
      
      next();
    };
  }

  /**
   * Middleware to log request details
   */
  public logRequests() {
    return (req: Request, res: Response, next: NextFunction): void => {
      const requestId = req.headers['x-request-id'] as string || 'unknown';
      
      logger.info('Request started', {
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

  /**
   * Middleware to track slow requests
   */
  public trackSlowRequests(thresholdMs: number = 5000) {
    return (req: Request, res: Response, next: NextFunction): void => {
      const startTime = Date.now();
      const requestId = req.headers['x-request-id'] as string || 'unknown';
      
      res.on('finish', () => {
        const responseTime = Date.now() - startTime;
        
        if (responseTime > thresholdMs) {
          logger.warn('Slow request detected', {
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

  /**
   * Middleware to track error requests
   */
  public trackErrorRequests() {
    return (req: Request, res: Response, next: NextFunction): void => {
      const requestId = req.headers['x-request-id'] as string || 'unknown';
      
      res.on('finish', () => {
        if (res.statusCode >= 400) {
          logger.warn('Error request detected', {
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

  /**
   * Generate a unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get client IP address
   */
  private getClientIP(req: Request): string {
    return (
      req.ip ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      (req.connection as any)?.socket?.remoteAddress ||
      req.headers['x-forwarded-for']?.toString().split(',')[0] ||
      req.headers['x-real-ip']?.toString() ||
      'unknown'
    );
  }

  /**
   * Get request size in bytes
   */
  private getRequestSize(req: Request): number {
    const contentLength = req.get('content-length');
    if (contentLength) {
      return parseInt(contentLength, 10);
    }

    // Estimate size based on body
    if (req.body) {
      return Buffer.byteLength(JSON.stringify(req.body), 'utf8');
    }

    return 0;
  }

  /**
   * Get safe headers (exclude sensitive information)
   */
  private getSafeHeaders(req: Request): Record<string, string> {
    const safeHeaders: Record<string, string> = {};
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'x-auth-token'];
    
    Object.entries(req.headers).forEach(([key, value]) => {
      if (!sensitiveHeaders.includes(key.toLowerCase())) {
        safeHeaders[key] = Array.isArray(value) ? value.join(', ') : value || '';
      } else {
        safeHeaders[key] = '[REDACTED]';
      }
    });
    
    return safeHeaders;
  }

  /**
   * Get safe body (exclude sensitive information)
   */
  private getSafeBody(req: Request): any {
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

// Export singleton instance
export const requestMonitoringMiddleware = new RequestMonitoringMiddleware();

import axios from 'axios';
import { config } from '../config/config';
import logger from '../utils/logger';

export class RedisService {
  private baseUrl: string;
  private timeout: number;
  private retries: number;
  private retryDelay: number;
  private isConnected: boolean = false;

  constructor() {
    this.baseUrl = config.redisService.url;
    this.timeout = config.redisService.timeout;
    this.retries = config.redisService.retries;
    this.retryDelay = config.redisService.retryDelay;
  }

  public async connect(): Promise<void> {
    try {
      const health = await this.healthCheck();
      this.isConnected = health.session && health.cache && health.queue;
      
      if (this.isConnected) {
        logger.info('Connected to Redis service successfully', {
          service: config.server.serviceName,
        });
      } else {
        throw new Error('Redis service health check failed');
      }
    } catch (error) {
      logger.error('Failed to connect to Redis service', {
        service: config.server.serviceName,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      this.isConnected = false;
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    this.isConnected = false;
    logger.info('Disconnected from Redis service', {
      service: config.server.serviceName,
    });
  }

  public isRedisConnected(): boolean {
    return this.isConnected;
  }

  // Session operations
  public async setSession(sessionId: string, data: any, ttl: number = 3600): Promise<boolean> {
    try {
      return await this.setCache(`session:${sessionId}`, data, ttl);
    } catch (error) {
      logger.error('Failed to set session', {
        service: config.server.serviceName,
        sessionId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  public async getSession(sessionId: string): Promise<any | null> {
    try {
      return await this.getCache(`session:${sessionId}`);
    } catch (error) {
      logger.error('Failed to get session', {
        service: config.server.serviceName,
        sessionId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }

  public async deleteSession(sessionId: string): Promise<boolean> {
    try {
      return await this.deleteCache(`session:${sessionId}`);
    } catch (error) {
      logger.error('Failed to delete session', {
        service: config.server.serviceName,
        sessionId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  // Cache operations
  public async setCache(key: string, data: any, ttl: number = 3600): Promise<boolean> {
    try {
      const response = await this.makeRequest('POST', '/cache', {
        key: `cache:${key}`,
        value: JSON.stringify(data),
        ttl
      });
      return response.success;
    } catch (error) {
      logger.error('Failed to set cache', {
        service: config.server.serviceName,
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  public async getCache(key: string): Promise<any | null> {
    try {
      const response = await this.makeRequest('GET', `/cache/${encodeURIComponent(`cache:${key}`)}`);
      if (response.success && response.data) {
        return JSON.parse(response.data);
      }
      return null;
    } catch (error) {
      logger.error('Failed to get cache', {
        service: config.server.serviceName,
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }

  public async getObject<T = any>(key: string): Promise<T | null> {
    return this.getCache(key);
  }

  public async deleteCache(key: string): Promise<boolean> {
    try {
      const response = await this.makeRequest('DELETE', `/cache/${encodeURIComponent(`cache:${key}`)}`);
      return response.success;
    } catch (error) {
      logger.error('Failed to delete cache', {
        service: config.server.serviceName,
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  // Queue operations
  public async pushToQueue(queueName: string, data: any): Promise<number> {
    try {
      const response = await this.makeRequest('POST', '/queue', {
        queue: `queue:${queueName}`,
        value: JSON.stringify(data)
      });
      return response.success ? response.data : 0;
    } catch (error) {
      logger.error('Failed to push to queue', {
        service: config.server.serviceName,
        queueName,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return 0;
    }
  }

  public async popFromQueue(queueName: string): Promise<any | null> {
    try {
      const response = await this.makeRequest('GET', `/queue/${encodeURIComponent(`queue:${queueName}`)}`);
      if (response.success && response.data) {
        return JSON.parse(response.data);
      }
      return null;
    } catch (error) {
      logger.error('Failed to pop from queue', {
        service: config.server.serviceName,
        queueName,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }

  public async getQueueLength(queueName: string): Promise<number> {
    try {
      const response = await this.makeRequest('GET', `/queue/${encodeURIComponent(`queue:${queueName}`)}/length`);
      return response.success ? response.data : 0;
    } catch (error) {
      logger.error('Failed to get queue length', {
        service: config.server.serviceName,
        queueName,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return 0;
    }
  }

  // Hash operations
  public async hset(key: string, field: string, value: any): Promise<boolean> {
    try {
      const response = await this.makeRequest('POST', '/hash', {
        key,
        field,
        value: JSON.stringify(value)
      });
      return response.success;
    } catch (error) {
      logger.error('Failed to hset', {
        service: config.server.serviceName,
        key,
        field,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  public async hget(key: string, field: string): Promise<any | null> {
    try {
      const response = await this.makeRequest('GET', `/hash/${encodeURIComponent(key)}/${encodeURIComponent(field)}`);
      if (response.success && response.data) {
        return JSON.parse(response.data);
      }
      return null;
    } catch (error) {
      logger.error('Failed to hget', {
        service: config.server.serviceName,
        key,
        field,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }

  public async hgetall(key: string): Promise<Record<string, any>> {
    try {
      const response = await this.makeRequest('GET', `/hash/${encodeURIComponent(key)}`);
      if (response.success && response.data) {
        const parsed: Record<string, any> = {};
        for (const [field, value] of Object.entries(response.data)) {
          parsed[field] = JSON.parse(value as string);
        }
        return parsed;
      }
      return {};
    } catch (error) {
      logger.error('Failed to hgetall', {
        service: config.server.serviceName,
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return {};
    }
  }

  public async hdel(key: string, field: string): Promise<boolean> {
    try {
      const response = await this.makeRequest('DELETE', `/hash/${encodeURIComponent(key)}/${encodeURIComponent(field)}`);
      return response.success;
    } catch (error) {
      logger.error('Failed to hdel', {
        service: config.server.serviceName,
        key,
        field,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  // List operations
  public async lpush(key: string, ...values: any[]): Promise<number> {
    try {
      const response = await this.makeRequest('POST', '/list/lpush', {
        key,
        values: values.map(value => JSON.stringify(value))
      });
      return response.success ? response.data : 0;
    } catch (error) {
      logger.error('Failed to lpush', {
        service: config.server.serviceName,
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return 0;
    }
  }

  public async rpush(key: string, ...values: any[]): Promise<number> {
    try {
      const response = await this.makeRequest('POST', '/list/rpush', {
        key,
        values: values.map(value => JSON.stringify(value))
      });
      return response.success ? response.data : 0;
    } catch (error) {
      logger.error('Failed to rpush', {
        service: config.server.serviceName,
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return 0;
    }
  }

  public async lpop(key: string): Promise<any | null> {
    try {
      const response = await this.makeRequest('GET', `/list/${encodeURIComponent(key)}/lpop`);
      if (response.success && response.data) {
        return JSON.parse(response.data);
      }
      return null;
    } catch (error) {
      logger.error('Failed to lpop', {
        service: config.server.serviceName,
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }

  public async rpop(key: string): Promise<any | null> {
    try {
      const response = await this.makeRequest('GET', `/list/${encodeURIComponent(key)}/rpop`);
      if (response.success && response.data) {
        return JSON.parse(response.data);
      }
      return null;
    } catch (error) {
      logger.error('Failed to rpop', {
        service: config.server.serviceName,
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }

  public async llen(key: string): Promise<number> {
    try {
      const response = await this.makeRequest('GET', `/list/${encodeURIComponent(key)}/length`);
      return response.success ? response.data : 0;
    } catch (error) {
      logger.error('Failed to llen', {
        service: config.server.serviceName,
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return 0;
    }
  }

  public async ltrim(key: string, start: number, stop: number): Promise<boolean> {
    try {
      const response = await this.makeRequest('POST', '/list/trim', {
        key,
        start,
        stop
      });
      return response.success;
    } catch (error) {
      logger.error('Failed to ltrim', {
        service: config.server.serviceName,
        key,
        start,
        stop,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  // Set operations
  public async sadd(key: string, ...members: any[]): Promise<number> {
    try {
      const response = await this.makeRequest('POST', '/set', {
        key,
        members: members.map(member => JSON.stringify(member))
      });
      return response.success ? response.data : 0;
    } catch (error) {
      logger.error('Failed to sadd', {
        service: config.server.serviceName,
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return 0;
    }
  }

  public async smembers(key: string): Promise<any[]> {
    try {
      const response = await this.makeRequest('GET', `/set/${encodeURIComponent(key)}`);
      if (response.success && response.data) {
        return response.data.map((value: string) => JSON.parse(value));
      }
      return [];
    } catch (error) {
      logger.error('Failed to smembers', {
        service: config.server.serviceName,
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return [];
    }
  }

  public async sismember(key: string, member: any): Promise<boolean> {
    try {
      const response = await this.makeRequest('GET', `/set/${encodeURIComponent(key)}/ismember?member=${encodeURIComponent(JSON.stringify(member))}`);
      return response.success ? response.data : false;
    } catch (error) {
      logger.error('Failed to sismember', {
        service: config.server.serviceName,
        key,
        member,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  // Utility operations
  public async exists(key: string): Promise<boolean> {
    try {
      const response = await this.makeRequest('GET', `/exists/${encodeURIComponent(key)}`);
      return response.success ? response.data : false;
    } catch (error) {
      logger.error('Failed to check existence', {
        service: config.server.serviceName,
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  public async expire(key: string, ttl: number): Promise<boolean> {
    try {
      const response = await this.makeRequest('POST', '/expire', {
        key,
        ttl
      });
      return response.success;
    } catch (error) {
      logger.error('Failed to set expiration', {
        service: config.server.serviceName,
        key,
        ttl,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  public async ttl(key: string): Promise<number> {
    try {
      const response = await this.makeRequest('GET', `/ttl/${encodeURIComponent(key)}`);
      return response.success ? response.data : -1;
    } catch (error) {
      logger.error('Failed to get TTL', {
        service: config.server.serviceName,
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return -1;
    }
  }

  public async incr(key: string): Promise<number> {
    try {
      const currentValue = await this.getCache(key);
      const newValue = currentValue ? parseInt(currentValue) + 1 : 1;
      await this.setCache(key, newValue.toString());
      return newValue;
    } catch (error) {
      logger.error('Failed to increment', {
        service: config.server.serviceName,
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return 0;
    }
  }

  // Pub/Sub operations (not supported by RedisService, but kept for compatibility)
  public async publish(channel: string, message: any): Promise<boolean> {
    try {
      logger.warn('Pub/Sub operations not supported in RedisService', {
        service: config.server.serviceName,
        channel,
      });
      return false;
    } catch (error) {
      logger.error('Failed to publish', {
        service: config.server.serviceName,
        channel,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  public async subscribe(channel: string, callback: (message: string) => void): Promise<boolean> {
    try {
      logger.warn('Pub/Sub operations not supported in RedisService', {
        service: config.server.serviceName,
        channel,
      });
      return false;
    } catch (error) {
      logger.error('Failed to subscribe', {
        service: config.server.serviceName,
        channel,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  // Cleanup method
  public async cleanup(): Promise<void> {
    try {
      await this.disconnect();
      logger.info('Redis service cleanup completed', {
        service: config.server.serviceName,
      });
    } catch (error) {
      logger.error('Error during Redis service cleanup', {
        service: config.server.serviceName,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Health check
  public async healthCheck(): Promise<{ session: boolean; cache: boolean; queue: boolean }> {
    try {
      const response = await this.makeRequest('GET', '/health');
      if (response.success && response.data) {
        return response.data.redis || { session: false, cache: false, queue: false };
      }
      return { session: false, cache: false, queue: false };
    } catch (error) {
      logger.error('Redis service health check failed', {
        service: config.server.serviceName,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return { session: false, cache: false, queue: false };
    }
  }

  // Private method to make HTTP requests
  private async makeRequest(method: string, endpoint: string, data?: any): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      method,
      url,
      timeout: this.timeout,
      data,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    let lastError: any;
    
    for (let attempt = 1; attempt <= this.retries; attempt++) {
      try {
        const response = await axios(config);
        return response.data;
      } catch (error) {
        lastError = error;
        if (attempt < this.retries) {
          await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        }
      }
    }

    throw lastError;
  }
}

export default RedisService;

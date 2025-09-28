import { createClient, RedisClientType } from 'redis';
import { config } from '@/config/config';
import { logger } from '@/utils/logger';

class RedisConnection {
  private static instance: RedisConnection;
  private client: RedisClientType;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;

  private constructor() {
    this.client = createClient({
      socket: {
        host: config.redis.host,
        port: config.redis.port,
        reconnectStrategy: (retries) => {
          if (retries > this.maxReconnectAttempts) {
            logger.error('Max Redis reconnection attempts reached', {
              service: config.server.serviceName,
              attempts: retries,
            });
            return new Error('Max reconnection attempts reached');
          }
          return Math.min(retries * this.reconnectDelay, 5000);
        },
      },
      password: config.redis.password,
      database: config.redis.db,
    });

    this.setupEventListeners();
  }

  public static getInstance(): RedisConnection {
    if (!RedisConnection.instance) {
      RedisConnection.instance = new RedisConnection();
    }
    return RedisConnection.instance;
  }

  public getClient(): RedisClientType {
    return this.client;
  }

  public async connect(): Promise<void> {
    try {
      await this.client.connect();
      this.isConnected = true;
      this.reconnectAttempts = 0;
      logger.info('Redis connected successfully', {
        service: config.server.serviceName,
        host: config.redis.host,
        port: config.redis.port,
        database: config.redis.db,
      });
    } catch (error) {
      this.isConnected = false;
      logger.error('Failed to connect to Redis', {
        service: config.server.serviceName,
        error: error instanceof Error ? error.message : 'Unknown error',
        host: config.redis.host,
        port: config.redis.port,
      });
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await this.client.disconnect();
      this.isConnected = false;
      logger.info('Redis disconnected successfully', {
        service: config.server.serviceName,
      });
    } catch (error) {
      logger.error('Error disconnecting from Redis', {
        service: config.server.serviceName,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  public async healthCheck(): Promise<boolean> {
    try {
      await this.client.ping();
      return true;
    } catch (error) {
      logger.error('Redis health check failed', {
        service: config.server.serviceName,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  public isRedisConnected(): boolean {
    return this.isConnected;
  }

  private setupEventListeners(): void {
    this.client.on('connect', () => {
      logger.info('Redis connection established', {
        service: config.server.serviceName,
      });
    });

    this.client.on('ready', () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      logger.info('Redis client ready', {
        service: config.server.serviceName,
      });
    });

    this.client.on('error', (error) => {
      this.isConnected = false;
      logger.error('Redis connection error', {
        service: config.server.serviceName,
        error: error.message,
      });
    });

    this.client.on('end', () => {
      this.isConnected = false;
      logger.warn('Redis connection ended', {
        service: config.server.serviceName,
      });
    });

    this.client.on('reconnecting', () => {
      this.reconnectAttempts++;
      logger.info('Redis reconnecting', {
        service: config.server.serviceName,
        attempt: this.reconnectAttempts,
      });
    });
  }

  // Cache helper methods
  public async set(
    key: string,
    value: string | object,
    ttl?: number
  ): Promise<void> {
    try {
      const serializedValue = typeof value === 'object' ? JSON.stringify(value) : value;
      if (ttl) {
        await this.client.setEx(key, ttl, serializedValue);
      } else {
        await this.client.set(key, serializedValue);
      }
    } catch (error) {
      logger.error('Error setting Redis key', {
        service: config.server.serviceName,
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  public async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch (error) {
      logger.error('Error getting Redis key', {
        service: config.server.serviceName,
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  public async getObject<T = any>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Error getting Redis object', {
        service: config.server.serviceName,
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  public async del(key: string): Promise<number> {
    try {
      return await this.client.del(key);
    } catch (error) {
      logger.error('Error deleting Redis key', {
        service: config.server.serviceName,
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  public async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Error checking Redis key existence', {
        service: config.server.serviceName,
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  public async expire(key: string, ttl: number): Promise<boolean> {
    try {
      const result = await this.client.expire(key, ttl);
      return result;
    } catch (error) {
      logger.error('Error setting Redis key expiration', {
        service: config.server.serviceName,
        key,
        ttl,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  public async ttl(key: string): Promise<number> {
    try {
      return await this.client.ttl(key);
    } catch (error) {
      logger.error('Error getting Redis key TTL', {
        service: config.server.serviceName,
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  // Hash operations
  public async hset(key: string, field: string, value: string | object): Promise<number> {
    try {
      const serializedValue = typeof value === 'object' ? JSON.stringify(value) : value;
      return await this.client.hSet(key, field, serializedValue);
    } catch (error) {
      logger.error('Error setting Redis hash field', {
        service: config.server.serviceName,
        key,
        field,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  public async hget(key: string, field: string): Promise<string | undefined> {
    try {
      return await this.client.hGet(key, field);
    } catch (error) {
      logger.error('Error getting Redis hash field', {
        service: config.server.serviceName,
        key,
        field,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  public async hgetall(key: string): Promise<Record<string, string>> {
    try {
      return await this.client.hGetAll(key);
    } catch (error) {
      logger.error('Error getting all Redis hash fields', {
        service: config.server.serviceName,
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  // List operations
  public async lpush(key: string, ...values: string[]): Promise<number> {
    try {
      return await this.client.lPush(key, values);
    } catch (error) {
      logger.error('Error pushing to Redis list', {
        service: config.server.serviceName,
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  public async rpop(key: string): Promise<string | null> {
    try {
      return await this.client.rPop(key);
    } catch (error) {
      logger.error('Error popping from Redis list', {
        service: config.server.serviceName,
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  public async llen(key: string): Promise<number> {
    try {
      return await this.client.lLen(key);
    } catch (error) {
      logger.error('Error getting Redis list length', {
        service: config.server.serviceName,
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  // Set operations
  public async sadd(key: string, ...members: string[]): Promise<number> {
    try {
      return await this.client.sAdd(key, members);
    } catch (error) {
      logger.error('Error adding to Redis set', {
        service: config.server.serviceName,
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  public async smembers(key: string): Promise<string[]> {
    try {
      return await this.client.sMembers(key);
    } catch (error) {
      logger.error('Error getting Redis set members', {
        service: config.server.serviceName,
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  // Cleanup method for graceful shutdown
  public async cleanup(): Promise<void> {
    try {
      await this.disconnect();
      logger.info('Redis cleanup completed', {
        service: config.server.serviceName,
      });
    } catch (error) {
      logger.error('Error during Redis cleanup', {
        service: config.server.serviceName,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

// Export singleton instance
export const redis = RedisConnection.getInstance();
export const redisClient = redis.getClient();

// Export connection helper functions
export const connectRedis = () => redis.connect();
export const disconnectRedis = () => redis.disconnect();
export const isRedisConnected = () => redis.isRedisConnected();
export const redisHealthCheck = () => redis.healthCheck();

export default redis;

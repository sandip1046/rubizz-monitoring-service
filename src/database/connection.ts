import { PrismaClient } from '@prisma/client';
import { config } from '@/config/config';
import { logger } from '@/utils/logger';

class DatabaseConnection {
  private static instance: DatabaseConnection;
  private prisma: PrismaClient;
  private isConnected: boolean = false;

  private constructor() {
    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: config.database.url,
        },
      },
      log: [
        {
          emit: 'event',
          level: 'query',
        },
        {
          emit: 'event',
          level: 'error',
        },
        {
          emit: 'event',
          level: 'info',
        },
        {
          emit: 'event',
          level: 'warn',
        },
      ],
    });

    // Set up event listeners
    this.setupEventListeners();
  }

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  public getPrismaClient(): PrismaClient {
    return this.prisma;
  }

  public async connect(): Promise<void> {
    try {
      await this.prisma.$connect();
      this.isConnected = true;
      logger.info('Database connected successfully', {
        service: config.server.serviceName,
        database: 'postgresql',
      });
    } catch (error) {
      this.isConnected = false;
      logger.error('Failed to connect to database', {
        service: config.server.serviceName,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await this.prisma.$disconnect();
      this.isConnected = false;
      logger.info('Database disconnected successfully', {
        service: config.server.serviceName,
      });
    } catch (error) {
      logger.error('Error disconnecting from database', {
        service: config.server.serviceName,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  public async healthCheck(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      logger.error('Database health check failed', {
        service: config.server.serviceName,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  public isDatabaseConnected(): boolean {
    return this.isConnected;
  }

  private setupEventListeners(): void {
    // Query event listener
    this.prisma.$on('query', (e) => {
      if (config.server.nodeEnv === 'development') {
        logger.debug('Database query executed', {
          service: config.server.serviceName,
          query: e.query,
          params: e.params,
          duration: e.duration,
        });
      }
    });

    // Error event listener
    this.prisma.$on('error', (e) => {
      logger.error('Database error occurred', {
        service: config.server.serviceName,
        error: e.message,
        target: e.target,
      });
    });

    // Info event listener
    this.prisma.$on('info', (e) => {
      logger.info('Database info', {
        service: config.server.serviceName,
        message: e.message,
        target: e.target,
      });
    });

    // Warn event listener
    this.prisma.$on('warn', (e) => {
      logger.warn('Database warning', {
        service: config.server.serviceName,
        message: e.message,
        target: e.target,
      });
    });
  }

  // Transaction helper methods
  public async transaction<T>(
    fn: (prisma: PrismaClient) => Promise<T>
  ): Promise<T> {
    return await this.prisma.$transaction(fn);
  }

  // Raw query helper
  public async rawQuery<T = any>(query: string, params: any[] = []): Promise<T> {
    return await this.prisma.$queryRawUnsafe(query, ...params);
  }

  // Cleanup method for graceful shutdown
  public async cleanup(): Promise<void> {
    try {
      await this.disconnect();
      logger.info('Database cleanup completed', {
        service: config.server.serviceName,
      });
    } catch (error) {
      logger.error('Error during database cleanup', {
        service: config.server.serviceName,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

// Export singleton instance
export const db = DatabaseConnection.getInstance();
export const prisma = db.getPrismaClient();

// Export connection helper functions
export const connectDatabase = () => db.connect();
export const disconnectDatabase = () => db.disconnect();
export const isDatabaseConnected = () => db.isDatabaseConnected();
export const databaseHealthCheck = () => db.healthCheck();

export default db;

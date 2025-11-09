import mongoose from 'mongoose';
import { config } from '@/config/config';
import logger from '@/utils/logger';

class DatabaseConnection {
  private static instance: DatabaseConnection;
  private isConnected: boolean = false;

  private constructor() {
    // Set up mongoose connection options
    mongoose.set('strictQuery', false);
  }

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  public async connect(): Promise<void> {
    try {
      if (this.isConnected) {
        logger.info('Database already connected');
        return;
      }

      const connectionOptions: mongoose.ConnectOptions = {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        bufferCommands: false,
      };

      await mongoose.connect(config.database.url, connectionOptions);
      this.isConnected = true;

      logger.info('MongoDB connected successfully', {
        service: config.server.serviceName,
        database: 'mongodb',
        url: config.database.url.replace(/\/\/.*@/, '//***:***@'), // Hide credentials
      });

      // Set up event listeners
      this.setupEventListeners();
    } catch (error) {
      this.isConnected = false;
      logger.error('Failed to connect to MongoDB', {
        service: config.server.serviceName,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      if (!this.isConnected) {
        return;
      }

      await mongoose.disconnect();
      this.isConnected = false;
      logger.info('MongoDB disconnected successfully', {
        service: config.server.serviceName,
      });
    } catch (error) {
      logger.error('Error disconnecting from MongoDB', {
        service: config.server.serviceName,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  public async healthCheck(): Promise<boolean> {
    try {
      if (!this.isConnected || !mongoose.connection.db) {
        return false;
      }

      await mongoose.connection.db.admin().ping();
      return true;
    } catch (error) {
      logger.error('MongoDB health check failed', {
        service: config.server.serviceName,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  public isDatabaseConnected(): boolean {
    return this.isConnected && mongoose.connection.readyState === 1;
  }

  private setupEventListeners(): void {
    mongoose.connection.on('connected', () => {
      logger.info('Mongoose connected to MongoDB', {
        service: config.server.serviceName,
      });
    });

    mongoose.connection.on('error', (error: Error) => {
      logger.error('Mongoose connection error', {
        service: config.server.serviceName,
        error: error.message,
      });
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('Mongoose disconnected from MongoDB', {
        service: config.server.serviceName,
      });
      this.isConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('Mongoose reconnected to MongoDB', {
        service: config.server.serviceName,
      });
      this.isConnected = true;
    });

    // Handle process termination
    process.on('SIGINT', async () => {
      await this.disconnect();
      process.exit(0);
    });
  }

  // Get mongoose connection
  public getConnection(): typeof mongoose {
    return mongoose;
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

// Export connection helper functions
export const connectDatabase = () => db.connect();
export const disconnectDatabase = () => db.disconnect();
export const isDatabaseConnected = () => db.isDatabaseConnected();
export const databaseHealthCheck = () => db.healthCheck();
export const getMongooseConnection = () => db.getConnection();

export default db;

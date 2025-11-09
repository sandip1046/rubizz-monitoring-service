"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMongooseConnection = exports.databaseHealthCheck = exports.isDatabaseConnected = exports.disconnectDatabase = exports.connectDatabase = exports.db = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const config_1 = require("@/config/config");
const logger_1 = __importDefault(require("@/utils/logger"));
class DatabaseConnection {
    constructor() {
        this.isConnected = false;
        mongoose_1.default.set('strictQuery', false);
    }
    static getInstance() {
        if (!DatabaseConnection.instance) {
            DatabaseConnection.instance = new DatabaseConnection();
        }
        return DatabaseConnection.instance;
    }
    async connect() {
        try {
            if (this.isConnected) {
                logger_1.default.info('Database already connected');
                return;
            }
            const connectionOptions = {
                maxPoolSize: 10,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
                bufferCommands: false,
            };
            await mongoose_1.default.connect(config_1.config.database.url, connectionOptions);
            this.isConnected = true;
            logger_1.default.info('MongoDB connected successfully', {
                service: config_1.config.server.serviceName,
                database: 'mongodb',
                url: config_1.config.database.url.replace(/\/\/.*@/, '//***:***@'),
            });
            this.setupEventListeners();
        }
        catch (error) {
            this.isConnected = false;
            logger_1.default.error('Failed to connect to MongoDB', {
                service: config_1.config.server.serviceName,
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined,
            });
            throw error;
        }
    }
    async disconnect() {
        try {
            if (!this.isConnected) {
                return;
            }
            await mongoose_1.default.disconnect();
            this.isConnected = false;
            logger_1.default.info('MongoDB disconnected successfully', {
                service: config_1.config.server.serviceName,
            });
        }
        catch (error) {
            logger_1.default.error('Error disconnecting from MongoDB', {
                service: config_1.config.server.serviceName,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    async healthCheck() {
        try {
            if (!this.isConnected || !mongoose_1.default.connection.db) {
                return false;
            }
            await mongoose_1.default.connection.db.admin().ping();
            return true;
        }
        catch (error) {
            logger_1.default.error('MongoDB health check failed', {
                service: config_1.config.server.serviceName,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return false;
        }
    }
    isDatabaseConnected() {
        return this.isConnected && mongoose_1.default.connection.readyState === 1;
    }
    setupEventListeners() {
        mongoose_1.default.connection.on('connected', () => {
            logger_1.default.info('Mongoose connected to MongoDB', {
                service: config_1.config.server.serviceName,
            });
        });
        mongoose_1.default.connection.on('error', (error) => {
            logger_1.default.error('Mongoose connection error', {
                service: config_1.config.server.serviceName,
                error: error.message,
            });
        });
        mongoose_1.default.connection.on('disconnected', () => {
            logger_1.default.warn('Mongoose disconnected from MongoDB', {
                service: config_1.config.server.serviceName,
            });
            this.isConnected = false;
        });
        mongoose_1.default.connection.on('reconnected', () => {
            logger_1.default.info('Mongoose reconnected to MongoDB', {
                service: config_1.config.server.serviceName,
            });
            this.isConnected = true;
        });
        process.on('SIGINT', async () => {
            await this.disconnect();
            process.exit(0);
        });
    }
    getConnection() {
        return mongoose_1.default;
    }
    async cleanup() {
        try {
            await this.disconnect();
            logger_1.default.info('Database cleanup completed', {
                service: config_1.config.server.serviceName,
            });
        }
        catch (error) {
            logger_1.default.error('Error during database cleanup', {
                service: config_1.config.server.serviceName,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
}
exports.db = DatabaseConnection.getInstance();
const connectDatabase = () => exports.db.connect();
exports.connectDatabase = connectDatabase;
const disconnectDatabase = () => exports.db.disconnect();
exports.disconnectDatabase = disconnectDatabase;
const isDatabaseConnected = () => exports.db.isDatabaseConnected();
exports.isDatabaseConnected = isDatabaseConnected;
const databaseHealthCheck = () => exports.db.healthCheck();
exports.databaseHealthCheck = databaseHealthCheck;
const getMongooseConnection = () => exports.db.getConnection();
exports.getMongooseConnection = getMongooseConnection;
exports.default = exports.db;
//# sourceMappingURL=connection.js.map
import mongoose from 'mongoose';
declare class DatabaseConnection {
    private static instance;
    private isConnected;
    private constructor();
    static getInstance(): DatabaseConnection;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    healthCheck(): Promise<boolean>;
    isDatabaseConnected(): boolean;
    private setupEventListeners;
    getConnection(): typeof mongoose;
    cleanup(): Promise<void>;
}
export declare const db: DatabaseConnection;
export declare const connectDatabase: () => Promise<void>;
export declare const disconnectDatabase: () => Promise<void>;
export declare const isDatabaseConnected: () => boolean;
export declare const databaseHealthCheck: () => Promise<boolean>;
export declare const getMongooseConnection: () => typeof mongoose;
export default db;
//# sourceMappingURL=connection.d.ts.map
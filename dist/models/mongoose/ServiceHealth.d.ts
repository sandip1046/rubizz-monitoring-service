import mongoose, { Document } from 'mongoose';
export declare enum ServiceStatus {
    HEALTHY = "HEALTHY",
    UNHEALTHY = "UNHEALTHY",
    DEGRADED = "DEGRADED",
    UNKNOWN = "UNKNOWN",
    MAINTENANCE = "MAINTENANCE"
}
export interface IServiceHealth extends Document {
    serviceName: string;
    serviceUrl: string;
    status: ServiceStatus;
    responseTime?: number;
    lastChecked: Date;
    errorMessage?: string;
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
export declare const ServiceHealthModel: mongoose.Model<IServiceHealth, {}, {}, {}, mongoose.Document<unknown, {}, IServiceHealth, {}, {}> & IServiceHealth & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=ServiceHealth.d.ts.map
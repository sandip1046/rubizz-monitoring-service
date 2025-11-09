import mongoose, { Document } from 'mongoose';
export interface IPerformanceMetric extends Document {
    serviceName: string;
    endpoint: string;
    method: string;
    responseTime: number;
    statusCode: number;
    requestSize?: number;
    responseSize?: number;
    userAgent?: string;
    ipAddress?: string;
    timestamp: Date;
    createdAt: Date;
}
export declare const PerformanceMetricModel: mongoose.Model<IPerformanceMetric, {}, {}, {}, mongoose.Document<unknown, {}, IPerformanceMetric, {}, {}> & IPerformanceMetric & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=PerformanceMetric.d.ts.map
import mongoose, { Document } from 'mongoose';
export interface IResourceMetric extends Document {
    serviceName: string;
    cpuUsage?: number;
    memoryUsage?: number;
    diskUsage?: number;
    networkIn?: number;
    networkOut?: number;
    timestamp: Date;
    createdAt: Date;
}
export declare const ResourceMetricModel: mongoose.Model<IResourceMetric, {}, {}, {}, mongoose.Document<unknown, {}, IResourceMetric, {}, {}> & IResourceMetric & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=ResourceMetric.d.ts.map
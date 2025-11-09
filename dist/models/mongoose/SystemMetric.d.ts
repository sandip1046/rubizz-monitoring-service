import mongoose, { Document } from 'mongoose';
export declare enum MetricType {
    COUNTER = "COUNTER",
    GAUGE = "GAUGE",
    HISTOGRAM = "HISTOGRAM",
    SUMMARY = "SUMMARY"
}
export interface ISystemMetric extends Document {
    serviceName: string;
    metricName: string;
    metricType: MetricType;
    value: number;
    labels?: Record<string, any>;
    timestamp: Date;
    createdAt: Date;
}
export declare const SystemMetricModel: mongoose.Model<ISystemMetric, {}, {}, {}, mongoose.Document<unknown, {}, ISystemMetric, {}, {}> & ISystemMetric & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=SystemMetric.d.ts.map
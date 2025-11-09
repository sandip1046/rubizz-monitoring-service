import mongoose, { Document } from 'mongoose';
export declare enum AlertSeverity {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    CRITICAL = "CRITICAL"
}
export declare enum AlertStatus {
    ACTIVE = "ACTIVE",
    RESOLVED = "RESOLVED",
    ACKNOWLEDGED = "ACKNOWLEDGED",
    SUPPRESSED = "SUPPRESSED"
}
export interface IAlert extends Document {
    serviceName: string;
    alertType: string;
    severity: AlertSeverity;
    status: AlertStatus;
    title: string;
    description: string;
    value?: number;
    threshold?: number;
    labels?: Record<string, any>;
    resolvedAt?: Date;
    acknowledgedAt?: Date;
    acknowledgedBy?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare const AlertModel: mongoose.Model<IAlert, {}, {}, {}, mongoose.Document<unknown, {}, IAlert, {}, {}> & IAlert & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Alert.d.ts.map
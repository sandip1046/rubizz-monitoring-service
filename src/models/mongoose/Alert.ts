import mongoose, { Schema, Document } from 'mongoose';

export enum AlertSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum AlertStatus {
  ACTIVE = 'ACTIVE',
  RESOLVED = 'RESOLVED',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  SUPPRESSED = 'SUPPRESSED',
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

const AlertSchema = new Schema<IAlert>(
  {
    serviceName: {
      type: String,
      required: true,
      index: true,
    },
    alertType: {
      type: String,
      required: true,
    },
    severity: {
      type: String,
      enum: Object.values(AlertSeverity),
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(AlertStatus),
      default: AlertStatus.ACTIVE,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    value: {
      type: Number,
      default: null,
    },
    threshold: {
      type: Number,
      default: null,
    },
    labels: {
      type: Schema.Types.Mixed,
      default: {},
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    acknowledgedAt: {
      type: Date,
      default: null,
    },
    acknowledgedBy: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'alerts',
  }
);

// Compound indexes
AlertSchema.index({ serviceName: 1, status: 1 });
AlertSchema.index({ serviceName: 1, severity: 1, status: 1 });
AlertSchema.index({ createdAt: -1 });
AlertSchema.index({ serviceName: 1, alertType: 1, status: 1 });

export const AlertModel = mongoose.model<IAlert>('Alert', AlertSchema);


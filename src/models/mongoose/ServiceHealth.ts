import mongoose, { Schema, Document } from 'mongoose';

export enum ServiceStatus {
  HEALTHY = 'HEALTHY',
  UNHEALTHY = 'UNHEALTHY',
  DEGRADED = 'DEGRADED',
  UNKNOWN = 'UNKNOWN',
  MAINTENANCE = 'MAINTENANCE',
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

const ServiceHealthSchema = new Schema<IServiceHealth>(
  {
    serviceName: {
      type: String,
      required: true,
      index: true,
    },
    serviceUrl: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(ServiceStatus),
      required: true,
      index: true,
    },
    responseTime: {
      type: Number,
      default: null,
    },
    lastChecked: {
      type: Date,
      default: Date.now,
      index: true,
    },
    errorMessage: {
      type: String,
      default: null,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    collection: 'service_health',
  }
);

// Compound indexes
ServiceHealthSchema.index({ serviceName: 1, status: 1 });
ServiceHealthSchema.index({ serviceName: 1, lastChecked: -1 });

export const ServiceHealthModel = mongoose.model<IServiceHealth>(
  'ServiceHealth',
  ServiceHealthSchema
);


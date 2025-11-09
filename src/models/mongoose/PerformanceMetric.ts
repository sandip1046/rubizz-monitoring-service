import mongoose, { Schema, Document } from 'mongoose';

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

const PerformanceMetricSchema = new Schema<IPerformanceMetric>(
  {
    serviceName: {
      type: String,
      required: true,
      index: true,
    },
    endpoint: {
      type: String,
      required: true,
      index: true,
    },
    method: {
      type: String,
      required: true,
    },
    responseTime: {
      type: Number,
      required: true,
    },
    statusCode: {
      type: Number,
      required: true,
    },
    requestSize: {
      type: Number,
      default: null,
    },
    responseSize: {
      type: Number,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
    ipAddress: {
      type: String,
      default: null,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'performance_metrics',
  }
);

// Compound indexes for efficient queries
PerformanceMetricSchema.index({ serviceName: 1, endpoint: 1, timestamp: -1 });
PerformanceMetricSchema.index({ serviceName: 1, timestamp: -1 });
PerformanceMetricSchema.index({ endpoint: 1, timestamp: -1 });
PerformanceMetricSchema.index({ statusCode: 1, timestamp: -1 });

// TTL index for automatic cleanup (30 days)
PerformanceMetricSchema.index({ timestamp: 1 }, { expireAfterSeconds: 2592000 });

export const PerformanceMetricModel = mongoose.model<IPerformanceMetric>(
  'PerformanceMetric',
  PerformanceMetricSchema
);


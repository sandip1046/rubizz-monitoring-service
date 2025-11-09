import mongoose, { Schema, Document } from 'mongoose';

export enum MetricType {
  COUNTER = 'COUNTER',
  GAUGE = 'GAUGE',
  HISTOGRAM = 'HISTOGRAM',
  SUMMARY = 'SUMMARY',
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

const SystemMetricSchema = new Schema<ISystemMetric>(
  {
    serviceName: {
      type: String,
      required: true,
      index: true,
    },
    metricName: {
      type: String,
      required: true,
      index: true,
    },
    metricType: {
      type: String,
      enum: Object.values(MetricType),
      required: true,
    },
    value: {
      type: Number,
      required: true,
    },
    labels: {
      type: Schema.Types.Mixed,
      default: {},
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'system_metrics',
  }
);

// Compound indexes for efficient queries
SystemMetricSchema.index({ serviceName: 1, metricName: 1, timestamp: -1 });
SystemMetricSchema.index({ serviceName: 1, timestamp: -1 });
SystemMetricSchema.index({ metricName: 1, timestamp: -1 });

// TTL index for automatic cleanup (30 days)
SystemMetricSchema.index({ timestamp: 1 }, { expireAfterSeconds: 2592000 });

export const SystemMetricModel = mongoose.model<ISystemMetric>(
  'SystemMetric',
  SystemMetricSchema
);


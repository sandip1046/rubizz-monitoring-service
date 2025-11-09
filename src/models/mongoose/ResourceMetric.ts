import mongoose, { Schema, Document } from 'mongoose';

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

const ResourceMetricSchema = new Schema<IResourceMetric>(
  {
    serviceName: {
      type: String,
      required: true,
      index: true,
    },
    cpuUsage: {
      type: Number,
      default: null,
    },
    memoryUsage: {
      type: Number,
      default: null,
    },
    diskUsage: {
      type: Number,
      default: null,
    },
    networkIn: {
      type: Number,
      default: null,
    },
    networkOut: {
      type: Number,
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
    collection: 'resource_metrics',
  }
);

// Compound indexes
ResourceMetricSchema.index({ serviceName: 1, timestamp: -1 });

// TTL index for automatic cleanup (30 days)
ResourceMetricSchema.index({ timestamp: 1 }, { expireAfterSeconds: 2592000 });

export const ResourceMetricModel = mongoose.model<IResourceMetric>(
  'ResourceMetric',
  ResourceMetricSchema
);


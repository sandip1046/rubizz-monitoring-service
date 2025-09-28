import { MetricType } from './index';

// Metric Collection Types
export interface MetricCollectionRequest {
  serviceName: string;
  metrics: MetricData[];
  timestamp?: Date;
  labels?: Record<string, string>;
}

export interface MetricData {
  name: string;
  type: MetricType;
  value: number;
  labels?: Record<string, string>;
  timestamp?: Date;
}

export interface MetricCollectionResponse {
  success: boolean;
  collectedCount: number;
  errors?: string[];
  timestamp: Date;
}

// Metric Query Types
export interface MetricQuery {
  serviceName?: string;
  metricName?: string;
  startTime?: Date;
  endTime?: Date;
  aggregation?: MetricAggregation;
  groupBy?: string[];
  limit?: number;
  offset?: number;
}

export interface MetricAggregation {
  type: 'avg' | 'sum' | 'min' | 'max' | 'count' | 'percentile';
  percentile?: number; // for percentile aggregation
  window?: string; // time window for aggregation
}

export interface MetricQueryResponse {
  metrics: MetricResult[];
  aggregation?: {
    type: string;
    value: number;
  };
  totalCount: number;
  hasMore: boolean;
}

export interface MetricResult {
  serviceName: string;
  metricName: string;
  value: number;
  timestamp: Date;
  labels?: Record<string, string>;
}

// System Metrics Types
export interface SystemMetrics {
  serviceName: string;
  timestamp: Date;
  cpu: {
    usage: number;
    load: number[];
    cores: number;
  };
  memory: {
    used: number;
    total: number;
    free: number;
    percentage: number;
  };
  disk: {
    used: number;
    total: number;
    free: number;
    percentage: number;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
    packetsIn: number;
    packetsOut: number;
  };
  process: {
    pid: number;
    uptime: number;
    memory: number;
    cpu: number;
  };
}

// Performance Metrics Types
export interface PerformanceMetrics {
  serviceName: string;
  endpoint: string;
  method: string;
  timestamp: Date;
  responseTime: number;
  statusCode: number;
  requestSize: number;
  responseSize: number;
  userAgent?: string;
  ipAddress?: string;
  sessionId?: string;
  userId?: string;
}

// Business Metrics Types
export interface BusinessMetrics {
  serviceName: string;
  timestamp: Date;
  revenue: number;
  orders: number;
  customers: number;
  bookings: number;
  cancellations: number;
  refunds: number;
  conversionRate: number;
  averageOrderValue: number;
  customerSatisfaction: number;
}

// Custom Metrics Types
export interface CustomMetric {
  id: string;
  name: string;
  description: string;
  serviceName: string;
  type: MetricType;
  enabled: boolean;
  collectionInterval: number;
  retentionPeriod: number;
  labels?: Record<string, string>;
  query?: string;
  formula?: string;
  thresholds?: {
    warning: number;
    critical: number;
  };
}

// Metric Alert Types
export interface MetricAlert {
  id: string;
  metricName: string;
  serviceName: string;
  condition: MetricAlertCondition;
  threshold: number;
  duration: number; // in seconds
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  cooldown: number; // in seconds
  labels?: Record<string, string>;
}

export interface MetricAlertCondition {
  operator: '>' | '<' | '>=' | '<=' | '==' | '!=' | 'contains' | 'not_contains';
  value: number | string;
  aggregation?: 'avg' | 'sum' | 'min' | 'max' | 'count';
  window?: string; // time window
}

// Metric Dashboard Types
export interface MetricDashboard {
  id: string;
  name: string;
  description: string;
  serviceName?: string;
  widgets: MetricWidget[];
  layout: DashboardLayout;
  refreshInterval: number;
  isPublic: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MetricWidget {
  id: string;
  type: 'chart' | 'gauge' | 'table' | 'stat' | 'alert';
  title: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  config: {
    metricName: string;
    query?: string;
    chartType?: 'line' | 'bar' | 'pie' | 'area';
    timeRange?: string;
    aggregation?: string;
    thresholds?: {
      warning: number;
      critical: number;
    };
  };
}

export interface DashboardLayout {
  columns: number;
  rows: number;
  gap: number;
}

// Metric Export Types
export interface MetricExportRequest {
  serviceName?: string;
  metricName?: string;
  startTime: Date;
  endTime: Date;
  format: 'csv' | 'json' | 'xlsx';
  aggregation?: string;
  groupBy?: string[];
}

export interface MetricExportResponse {
  success: boolean;
  downloadUrl?: string;
  data?: any;
  format: string;
  recordCount: number;
  generatedAt: Date;
}

// Metric Retention Types
export interface MetricRetentionPolicy {
  serviceName: string;
  metricName: string;
  retentionDays: number;
  aggregationAfterDays: number;
  enabled: boolean;
}

// Metric Statistics Types
export interface MetricStatistics {
  serviceName: string;
  metricName: string;
  period: {
    start: Date;
    end: Date;
  };
  statistics: {
    count: number;
    sum: number;
    average: number;
    minimum: number;
    maximum: number;
    median: number;
    p95: number;
    p99: number;
    standardDeviation: number;
  };
  trends: {
    direction: 'up' | 'down' | 'stable';
    change: number;
    changePercentage: number;
  };
}

// Real-time Metrics Types
export interface RealTimeMetrics {
  serviceName: string;
  timestamp: Date;
  metrics: {
    [key: string]: {
      value: number;
      labels?: Record<string, string>;
    };
  };
}

// Metric Health Check Types
export interface MetricHealthCheck {
  serviceName: string;
  metricName: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  lastValue: number;
  lastUpdate: Date;
  expectedRange: {
    min: number;
    max: number;
  };
  alerts: number;
}

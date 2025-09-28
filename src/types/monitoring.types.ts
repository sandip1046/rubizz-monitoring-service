import { ServiceStatus, AlertSeverity, AlertStatus, MetricType } from './index';

// Monitoring Event Types
export enum MonitoringEventType {
  SERVICE_HEALTH_CHANGED = 'service.health.changed',
  ALERT_CREATED = 'alert.created',
  ALERT_RESOLVED = 'alert.resolved',
  METRIC_COLLECTED = 'metric.collected',
  SERVICE_REGISTERED = 'service.registered',
  SERVICE_DEREGISTERED = 'service.deregistered',
  DASHBOARD_CREATED = 'dashboard.created',
  DASHBOARD_UPDATED = 'dashboard.updated',
}

// Monitoring Event Interface
export interface MonitoringEvent {
  id: string;
  type: MonitoringEventType;
  serviceName: string;
  data: Record<string, any>;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// Health Check Configuration
export interface HealthCheckConfig {
  serviceName: string;
  url: string;
  timeout: number;
  retries: number;
  interval: number;
  enabled: boolean;
  headers?: Record<string, string>;
  expectedStatus?: number;
  expectedResponse?: string;
}

// Metrics Collection Configuration
export interface MetricsCollectionConfig {
  serviceName: string;
  enabled: boolean;
  collectionInterval: number;
  metrics: string[];
  labels?: Record<string, string>;
}

// Alert Rule Configuration
export interface AlertRuleConfig {
  id: string;
  name: string;
  description: string;
  serviceName: string;
  metricName: string;
  condition: AlertCondition;
  threshold: number;
  severity: AlertSeverity;
  enabled: boolean;
  evaluationInterval: number;
  cooldownPeriod: number;
  labels?: Record<string, any>;
}

// Alert Condition Types
export enum AlertCondition {
  GREATER_THAN = '>',
  LESS_THAN = '<',
  GREATER_THAN_OR_EQUAL = '>=',
  LESS_THAN_OR_EQUAL = '<=',
  EQUAL = '==',
  NOT_EQUAL = '!=',
  CONTAINS = 'contains',
  NOT_CONTAINS = 'not_contains',
  REGEX_MATCH = 'regex_match',
}

// Service Discovery Configuration
export interface ServiceDiscoveryConfig {
  enabled: boolean;
  registryUrl: string;
  checkInterval: number;
  checkTimeout: number;
  heartbeatInterval: number;
  deregisterAfter: number;
}

// Monitoring Thresholds
export interface MonitoringThresholds {
  cpu: {
    warning: number;
    critical: number;
  };
  memory: {
    warning: number;
    critical: number;
  };
  disk: {
    warning: number;
    critical: number;
  };
  responseTime: {
    warning: number;
    critical: number;
  };
  errorRate: {
    warning: number;
    critical: number;
  };
}

// Service Health Check Result
export interface HealthCheckResult {
  serviceName: string;
  status: ServiceStatus;
  responseTime: number;
  timestamp: Date;
  success: boolean;
  error?: string;
  details?: {
    statusCode?: number;
    responseSize?: number;
    headers?: Record<string, string>;
  };
}

// Metrics Aggregation Result
export interface MetricsAggregationResult {
  serviceName: string;
  metricName: string;
  aggregation: 'avg' | 'sum' | 'min' | 'max' | 'count';
  value: number;
  timestamp: Date;
  labels?: Record<string, string>;
}

// Service Performance Summary
export interface ServicePerformanceSummary {
  serviceName: string;
  period: {
    start: Date;
    end: Date;
  };
  metrics: {
    totalRequests: number;
    averageResponseTime: number;
    minResponseTime: number;
    maxResponseTime: number;
    errorRate: number;
    throughput: number; // requests per second
  };
  health: {
    uptime: number; // percentage
    status: ServiceStatus;
    lastChecked: Date;
  };
  alerts: {
    total: number;
    critical: number;
    warning: number;
    resolved: number;
  };
}

// Monitoring Dashboard Widget
export interface DashboardWidget {
  id: string;
  type: 'chart' | 'metric' | 'table' | 'alert' | 'status';
  title: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  config: {
    dataSource: string;
    query?: string;
    refreshInterval?: number;
    chartType?: 'line' | 'bar' | 'pie' | 'gauge';
    thresholds?: {
      warning: number;
      critical: number;
    };
  };
}

// Monitoring Report Configuration
export interface ReportConfig {
  id: string;
  name: string;
  description: string;
  schedule: string; // cron expression
  recipients: string[];
  format: 'pdf' | 'html' | 'json';
  template: string;
  enabled: boolean;
  services?: string[];
  metrics?: string[];
}

// Service Dependency
export interface ServiceDependency {
  serviceName: string;
  dependencies: string[];
  dependents: string[];
  criticalPath: boolean;
}

// Monitoring Alert Template
export interface AlertTemplate {
  id: string;
  name: string;
  alertType: string;
  severity: AlertSeverity;
  title: string;
  description: string;
  channels: string[];
  template: string;
  variables: string[];
  enabled: boolean;
}

// Service Metrics Configuration
export interface ServiceMetricsConfig {
  serviceName: string;
  enabled: boolean;
  collectionInterval: number;
  retentionPeriod: number; // in days
  metrics: {
    name: string;
    type: MetricType;
    enabled: boolean;
    labels?: Record<string, string>;
  }[];
}

// Monitoring Status
export interface MonitoringStatus {
  isRunning: boolean;
  startTime: Date;
  uptime: number;
  servicesMonitored: number;
  activeAlerts: number;
  lastHealthCheck: Date;
  lastMetricsCollection: Date;
  errors: string[];
}

// Service Health Status
export enum ServiceStatus {
  HEALTHY = 'HEALTHY',
  UNHEALTHY = 'UNHEALTHY',
  DEGRADED = 'DEGRADED',
  UNKNOWN = 'UNKNOWN',
  MAINTENANCE = 'MAINTENANCE',
}

// Alert Severity Levels
export enum AlertSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

// Alert Status
export enum AlertStatus {
  ACTIVE = 'ACTIVE',
  RESOLVED = 'RESOLVED',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  SUPPRESSED = 'SUPPRESSED',
}

// Metric Types
export enum MetricType {
  COUNTER = 'COUNTER',
  GAUGE = 'GAUGE',
  HISTOGRAM = 'HISTOGRAM',
  SUMMARY = 'SUMMARY',
}

// Service Health Check Interface
export interface ServiceHealthCheck {
  id?: string;
  serviceName: string;
  serviceUrl: string;
  status: ServiceStatus;
  responseTime?: number;
  lastChecked?: Date;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

// Service Health Interface (alias for compatibility)
export interface ServiceHealth extends ServiceHealthCheck {}

// System Metric Interface
export interface SystemMetric {
  id?: string;
  serviceName: string;
  metricName: string;
  metricType: MetricType;
  value: number;
  labels?: Record<string, string>;
  timestamp?: Date;
}

// Performance Metric Interface
export interface PerformanceMetric {
  id?: string;
  serviceName: string;
  endpoint: string;
  method: string;
  responseTime: number;
  statusCode: number;
  requestSize?: number;
  responseSize?: number;
  userAgent?: string;
  ipAddress?: string;
  timestamp?: Date;
}

// Resource Metric Interface
export interface ResourceMetric {
  id?: string;
  serviceName: string;
  cpuUsage?: number;
  memoryUsage?: number;
  diskUsage?: number;
  networkIn?: number;
  networkOut?: number;
  timestamp?: Date;
}

// Alert Interface
export interface Alert {
  id?: string;
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
}

// Alert Rule Interface
export interface AlertRule {
  id?: string;
  name: string;
  description: string;
  serviceName: string;
  metricName: string;
  condition: string;
  threshold: number;
  severity: AlertSeverity;
  enabled: boolean;
  labels?: Record<string, any>;
}

// Service Registry Interface
export interface ServiceRegistry {
  id?: string;
  serviceName: string;
  serviceUrl: string;
  version: string;
  environment: string;
  region?: string;
  zone?: string;
  tags: string[];
  metadata?: Record<string, any>;
  lastSeen?: Date;
  isActive: boolean;
}

// Dashboard Interface
export interface Dashboard {
  id?: string;
  name: string;
  description?: string;
  layout: Record<string, any>;
  widgets: Record<string, any>[];
  isPublic: boolean;
  createdBy?: string;
}

// Monitoring Report Interface
export interface MonitoringReport {
  id?: string;
  reportType: string;
  serviceName?: string;
  title: string;
  content: Record<string, any>;
  generatedAt?: Date;
  generatedBy?: string;
}

// Health Check Response Interface
export interface HealthCheckResponse {
  status: ServiceStatus;
  serviceName: string;
  responseTime: number;
  timestamp: Date;
  details?: Record<string, any>;
  error?: string;
}

// Metrics Collection Response Interface
export interface MetricsCollectionResponse {
  success: boolean;
  metricsCount: number;
  errors?: string[];
  timestamp: Date;
}

// Alert Notification Interface
export interface AlertNotification {
  alertId: string;
  serviceName: string;
  severity: AlertSeverity;
  title: string;
  description: string;
  timestamp: Date;
  channels: string[]; // email, slack, pagerduty
}

// Service Discovery Response Interface
export interface ServiceDiscoveryResponse {
  services: ServiceRegistry[];
  totalCount: number;
  lastUpdated: Date;
}

// Monitoring Dashboard Data Interface
export interface DashboardData {
  serviceHealth: ServiceHealthCheck[];
  systemMetrics: SystemMetric[];
  performanceMetrics: PerformanceMetric[];
  resourceMetrics: ResourceMetric[];
  alerts: Alert[];
  lastUpdated: Date;
}

// API Response Interface
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: Date;
  requestId?: string;
}

// Pagination Interface
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Paginated Response Interface
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Filter Parameters Interface
export interface FilterParams {
  serviceName?: string;
  status?: ServiceStatus;
  severity?: AlertSeverity;
  startDate?: Date;
  endDate?: Date;
  metricName?: string;
  alertType?: string;
}

// Monitoring Configuration Interface
export interface MonitoringConfig {
  collectionInterval: number;
  healthCheckInterval: number;
  alertThresholds: {
    cpu: number;
    memory: number;
    disk: number;
    responseTime: number;
  };
  enabledServices: string[];
  alertChannels: string[];
}

// Service Endpoint Interface
export interface ServiceEndpoint {
  name: string;
  url: string;
  port: number;
  healthPath?: string;
  timeout?: number;
  retries?: number;
}

// Metrics Query Interface
export interface MetricsQuery {
  serviceName?: string;
  metricName?: string;
  startTime?: Date;
  endTime?: Date;
  aggregation?: 'avg' | 'sum' | 'min' | 'max' | 'count';
  groupBy?: string[];
  limit?: number;
}

// Alert Query Interface
export interface AlertQuery {
  serviceName?: string;
  severity?: AlertSeverity;
  status?: AlertStatus;
  alertType?: string;
  startTime?: Date;
  endTime?: Date;
  limit?: number;
}

// Service Health Summary Interface
export interface ServiceHealthSummary {
  serviceName: string;
  status: ServiceStatus;
  uptime: number; // percentage
  averageResponseTime: number;
  totalRequests: number;
  errorRate: number;
  lastChecked: Date;
  alerts: Alert[];
}

// System Overview Interface
export interface SystemOverview {
  totalServices: number;
  healthyServices: number;
  unhealthyServices: number;
  degradedServices: number;
  activeAlerts: number;
  criticalAlerts: number;
  averageResponseTime: number;
  systemUptime: number;
  lastUpdated: Date;
}

// Export all types
export * from './monitoring.types';
export * from './api.types';
export * from './metrics.types';

export declare enum ServiceStatus {
    HEALTHY = "HEALTHY",
    UNHEALTHY = "UNHEALTHY",
    DEGRADED = "DEGRADED",
    UNKNOWN = "UNKNOWN",
    MAINTENANCE = "MAINTENANCE"
}
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
export declare enum MetricType {
    COUNTER = "COUNTER",
    GAUGE = "GAUGE",
    HISTOGRAM = "HISTOGRAM",
    SUMMARY = "SUMMARY"
}
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
export interface ServiceHealth extends ServiceHealthCheck {
}
export interface SystemMetric {
    id?: string;
    serviceName: string;
    metricName: string;
    metricType: MetricType;
    value: number;
    labels?: Record<string, string>;
    timestamp?: Date;
}
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
export interface Dashboard {
    id?: string;
    name: string;
    description?: string;
    layout: Record<string, any>;
    widgets: Record<string, any>[];
    isPublic: boolean;
    createdBy?: string;
}
export interface MonitoringReport {
    id?: string;
    reportType: string;
    serviceName?: string;
    title: string;
    content: Record<string, any>;
    generatedAt?: Date;
    generatedBy?: string;
}
export interface HealthCheckResponse {
    status: ServiceStatus;
    serviceName: string;
    responseTime: number;
    timestamp: Date;
    details?: Record<string, any>;
    error?: string;
}
export interface MetricsCollectionResponse {
    success: boolean;
    metricsCount: number;
    errors?: string[];
    timestamp: Date;
}
export interface AlertNotification {
    alertId: string;
    serviceName: string;
    severity: AlertSeverity;
    title: string;
    description: string;
    timestamp: Date;
    channels: string[];
}
export interface ServiceDiscoveryResponse {
    services: ServiceRegistry[];
    totalCount: number;
    lastUpdated: Date;
}
export interface DashboardData {
    serviceHealth: ServiceHealthCheck[];
    systemMetrics: SystemMetric[];
    performanceMetrics: PerformanceMetric[];
    resourceMetrics: ResourceMetric[];
    alerts: Alert[];
    lastUpdated: Date;
}
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
    timestamp: Date;
    requestId?: string;
}
export interface PaginationParams {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
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
export interface FilterParams {
    serviceName?: string;
    status?: ServiceStatus;
    severity?: AlertSeverity;
    startDate?: Date;
    endDate?: Date;
    metricName?: string;
    alertType?: string;
}
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
export interface ServiceEndpoint {
    name: string;
    url: string;
    port: number;
    healthPath?: string;
    timeout?: number;
    retries?: number;
}
export interface MetricsQuery {
    serviceName?: string;
    metricName?: string;
    startTime?: Date;
    endTime?: Date;
    aggregation?: 'avg' | 'sum' | 'min' | 'max' | 'count';
    groupBy?: string[];
    limit?: number;
}
export interface AlertQuery {
    serviceName?: string;
    severity?: AlertSeverity;
    status?: AlertStatus;
    alertType?: string;
    startTime?: Date;
    endTime?: Date;
    limit?: number;
}
export interface ServiceHealthSummary {
    serviceName: string;
    status: ServiceStatus;
    uptime: number;
    averageResponseTime: number;
    totalRequests: number;
    errorRate: number;
    lastChecked: Date;
    alerts: Alert[];
}
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
export * from './monitoring.types';
export * from './api.types';
export * from './metrics.types';
//# sourceMappingURL=index.d.ts.map
import { ServiceStatus, AlertSeverity, AlertStatus } from './index';
export interface ApiRequest {
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: any;
    query?: Record<string, any>;
    params?: Record<string, any>;
    timestamp: Date;
    requestId: string;
    userId?: string;
    ipAddress?: string;
    userAgent?: string;
}
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
    timestamp: Date;
    requestId?: string;
    pagination?: PaginationInfo;
}
export interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}
export interface HealthCheckRequest {
    serviceName?: string;
    includeDetails?: boolean;
}
export interface HealthCheckResponse {
    status: 'healthy' | 'unhealthy' | 'degraded';
    serviceName: string;
    timestamp: Date;
    responseTime: number;
    details?: {
        version: string;
        uptime: number;
        memory: {
            used: number;
            total: number;
            percentage: number;
        };
        cpu: {
            usage: number;
            load: number[];
        };
        database: {
            connected: boolean;
            responseTime: number;
        };
        redis: {
            connected: boolean;
            responseTime: number;
        };
    };
    checks?: {
        database: boolean;
        redis: boolean;
        externalServices: boolean;
    };
}
export interface MetricsRequest {
    serviceName?: string;
    metricName?: string;
    startTime?: string;
    endTime?: string;
    aggregation?: 'avg' | 'sum' | 'min' | 'max' | 'count';
    groupBy?: string[];
    limit?: number;
}
export interface MetricsResponse {
    metrics: {
        serviceName: string;
        metricName: string;
        value: number;
        timestamp: Date;
        labels?: Record<string, string>;
    }[];
    aggregation?: {
        type: string;
        value: number;
    };
    totalCount: number;
}
export interface AlertsRequest {
    serviceName?: string;
    severity?: AlertSeverity;
    status?: AlertStatus;
    alertType?: string;
    startTime?: string;
    endTime?: string;
    limit?: number;
    page?: number;
}
export interface AlertsResponse {
    alerts: {
        id: string;
        serviceName: string;
        alertType: string;
        severity: AlertSeverity;
        status: AlertStatus;
        title: string;
        description: string;
        value?: number;
        threshold?: number;
        createdAt: Date;
        resolvedAt?: Date;
        acknowledgedAt?: Date;
        acknowledgedBy?: string;
    }[];
    totalCount: number;
    pagination: PaginationInfo;
}
export interface DashboardRequest {
    id?: string;
    name?: string;
    isPublic?: boolean;
    createdBy?: string;
}
export interface DashboardResponse {
    id: string;
    name: string;
    description?: string;
    layout: Record<string, any>;
    widgets: Record<string, any>[];
    isPublic: boolean;
    createdBy?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface ServiceRegistryRequest {
    serviceName?: string;
    environment?: string;
    isActive?: boolean;
    limit?: number;
    page?: number;
}
export interface ServiceRegistryResponse {
    services: {
        id: string;
        serviceName: string;
        serviceUrl: string;
        version: string;
        environment: string;
        region?: string;
        zone?: string;
        tags: string[];
        lastSeen: Date;
        isActive: boolean;
    }[];
    totalCount: number;
    pagination: PaginationInfo;
}
export interface MonitoringConfigRequest {
    collectionInterval?: number;
    healthCheckInterval?: number;
    alertThresholds?: {
        cpu?: number;
        memory?: number;
        disk?: number;
        responseTime?: number;
    };
    enabledServices?: string[];
    alertChannels?: string[];
}
export interface MonitoringConfigResponse {
    config: {
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
    };
    lastUpdated: Date;
}
export interface ServicePerformanceRequest {
    serviceName: string;
    startTime?: string;
    endTime?: string;
    metrics?: string[];
}
export interface ServicePerformanceResponse {
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
        throughput: number;
    };
    health: {
        uptime: number;
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
export interface SystemOverviewResponse {
    totalServices: number;
    healthyServices: number;
    unhealthyServices: number;
    degradedServices: number;
    activeAlerts: number;
    criticalAlerts: number;
    averageResponseTime: number;
    systemUptime: number;
    lastUpdated: Date;
    services: {
        name: string;
        status: ServiceStatus;
        responseTime: number;
        uptime: number;
        alerts: number;
    }[];
}
export interface ErrorResponse {
    success: false;
    error: string;
    message: string;
    timestamp: Date;
    requestId?: string;
    details?: Record<string, any>;
}
export interface ValidationErrorResponse extends ErrorResponse {
    validationErrors: {
        field: string;
        message: string;
        value?: any;
    }[];
}
export interface RateLimitErrorResponse extends ErrorResponse {
    retryAfter: number;
    limit: number;
    remaining: number;
}
export interface AuthErrorResponse extends ErrorResponse {
    code: 'UNAUTHORIZED' | 'FORBIDDEN' | 'TOKEN_EXPIRED' | 'INVALID_TOKEN';
}
export interface ServiceUnavailableErrorResponse extends ErrorResponse {
    serviceName: string;
    retryAfter?: number;
}
//# sourceMappingURL=api.types.d.ts.map
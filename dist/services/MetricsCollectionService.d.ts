import { PerformanceMetric, MetricType } from '@/types';
export declare class MetricsCollectionService {
    private static instance;
    private isRunning;
    private intervalId;
    private performanceMetricsBuffer;
    private systemMetricsBuffer;
    private readonly BUFFER_SIZE;
    private readonly FLUSH_INTERVAL;
    private constructor();
    static getInstance(): MetricsCollectionService;
    start(): Promise<void>;
    stop(): Promise<void>;
    collectSystemMetrics(): Promise<void>;
    recordPerformanceMetric(metric: Omit<PerformanceMetric, 'id'>): Promise<void>;
    recordCustomMetric(serviceName: string, metricName: string, value: number, metricType?: MetricType, labels?: Record<string, string>): Promise<void>;
    private flushSystemMetrics;
    private flushPerformanceMetrics;
    flushBuffers(): Promise<void>;
    private getCpuUsage;
    getMetricsSummary(serviceName: string, hours?: number): Promise<{
        serviceName: string;
        totalMetrics: number;
        uniqueMetricNames: string[];
        averageValue: number;
        minValue: number;
        maxValue: number;
        lastUpdated: Date | null;
    }>;
    getPerformanceSummary(serviceName: string, startTime: Date, endTime: Date, endpoint?: string): Promise<{
        serviceName: string;
        totalRequests: number;
        averageResponseTime: number;
        minResponseTime: number;
        maxResponseTime: number;
        errorRate: number;
        throughput: number;
        statusCodes: Record<number, number>;
        topEndpoints: Array<{
            endpoint: string;
            count: number;
            avgResponseTime: number;
        }>;
    }>;
    isMetricsCollectionRunning(): boolean;
    getServiceStatus(): {
        isRunning: boolean;
        interval: number;
        systemMetricsBufferSize: number;
        performanceMetricsBufferSize: number;
    };
    cleanupOldMetrics(daysToKeep?: number): Promise<{
        systemMetricsDeleted: number;
        performanceMetricsDeleted: number;
    }>;
}
//# sourceMappingURL=MetricsCollectionService.d.ts.map
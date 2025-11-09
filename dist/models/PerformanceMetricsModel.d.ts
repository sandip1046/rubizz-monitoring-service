import { PerformanceMetric } from '@/types';
export declare class PerformanceMetricsModel {
    static create(data: Omit<PerformanceMetric, 'id'>): Promise<PerformanceMetric>;
    static createMany(metrics: Omit<PerformanceMetric, 'id'>[]): Promise<number>;
    static findByService(serviceName: string, endpoint?: string, startTime?: Date, endTime?: Date, limit?: number): Promise<PerformanceMetric[]>;
    static getSlowestEndpoints(serviceName: string, limit?: number, startTime?: Date, endTime?: Date): Promise<Array<{
        endpoint: string;
        avgResponseTime: number;
        count: number;
    }>>;
    static getErrorRates(serviceName: string, startTime?: Date, endTime?: Date): Promise<Array<{
        endpoint: string;
        errorRate: number;
        totalRequests: number;
        errorCount: number;
    }>>;
    static cleanupOldMetrics(daysToKeep?: number): Promise<number>;
    static findByTimeRange(startTime: Date, endTime: Date, serviceName?: string, endpoint?: string, limit?: number, offset?: number): Promise<PerformanceMetric[]>;
    static findByEndpoint(serviceName: string, endpoint: string, startTime?: Date, endTime?: Date, limit?: number): Promise<PerformanceMetric[]>;
    static getPerformanceSummary(serviceName: string, startTime: Date, endTime: Date): Promise<any>;
    static getErrorRateByEndpoint(serviceName: string, startTime: Date, endTime: Date): Promise<Array<{
        endpoint: string;
        errorRate: number;
        totalRequests: number;
        errorCount: number;
    }>>;
    static deleteOldMetrics(daysToKeep?: number): Promise<number>;
    private static mapToPerformanceMetric;
}
//# sourceMappingURL=PerformanceMetricsModel.d.ts.map
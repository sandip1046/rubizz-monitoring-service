import { SystemMetric } from '@/types';
export declare class SystemMetricsModel {
    static create(data: Omit<SystemMetric, 'id'>): Promise<SystemMetric>;
    static createMany(metrics: Omit<SystemMetric, 'id'>[]): Promise<number>;
    static findById(id: string): Promise<SystemMetric | null>;
    static findByService(serviceName: string, metricName?: string, startTime?: Date, endTime?: Date, limit?: number): Promise<SystemMetric[]>;
    static getLatestMetric(serviceName: string, metricName: string): Promise<SystemMetric | null>;
    static getAggregatedMetrics(serviceName: string, metricName: string, startTime: Date, endTime: Date, aggregation?: 'avg' | 'sum' | 'min' | 'max'): Promise<number>;
    static findByTimeRange(startTime: Date, endTime: Date, serviceName?: string, metricName?: string, limit?: number, offset?: number): Promise<SystemMetric[]>;
    static findByMetricName(metricName: string, serviceName?: string, startTime?: Date, endTime?: Date, limit?: number): Promise<SystemMetric[]>;
    static getMetricsCountByService(serviceName: string): Promise<number>;
    static getServiceMetricsSummary(serviceName: string, hours?: number): Promise<any>;
    static deleteOldMetrics(daysToKeep?: number): Promise<number>;
    static cleanupOldMetrics(daysToKeep?: number): Promise<number>;
    private static mapToSystemMetric;
}
//# sourceMappingURL=SystemMetricsModel.d.ts.map
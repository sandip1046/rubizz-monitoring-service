import { Alert, AlertSeverity as AlertSeverityType, AlertStatus as AlertStatusType } from '@/types';
export declare class AlertModel {
    static create(data: Omit<Alert, 'id'>): Promise<Alert>;
    static findById(id: string): Promise<Alert | null>;
    static findByService(serviceName: string, status?: AlertStatusType, limit?: number, offset?: number): Promise<Alert[]>;
    static findBySeverity(severity: AlertSeverityType, status?: AlertStatusType, limit?: number, offset?: number): Promise<Alert[]>;
    static findActive(limit?: number, offset?: number): Promise<Alert[]>;
    static findCritical(limit?: number): Promise<Alert[]>;
    static findByTimeRange(startTime: Date, endTime: Date, serviceName?: string, severity?: AlertSeverityType, status?: AlertStatusType, limit?: number, offset?: number): Promise<Alert[]>;
    static update(id: string, data: Partial<Alert>): Promise<Alert>;
    static acknowledge(id: string, acknowledgedBy: string): Promise<Alert>;
    static resolve(id: string, resolvedBy?: string): Promise<Alert>;
    static delete(id: string): Promise<void>;
    static getAlertsSummary(serviceName?: string): Promise<{
        total: number;
        active: number;
        resolved: number;
        acknowledged: number;
        critical: number;
        high: number;
        medium: number;
        low: number;
    }>;
    static findByAlertType(alertType: string, serviceName?: string, status?: AlertStatusType, limit?: number, offset?: number): Promise<Alert[]>;
    static cleanupOldAlerts(daysToKeep?: number): Promise<number>;
    static getAlertTrends(startTime: Date, endTime: Date, serviceName?: string, groupBy?: 'hour' | 'day' | 'week'): Promise<Array<{
        period: string;
        count: number;
        severity: AlertSeverityType;
    }>>;
    private static mapToAlert;
}
//# sourceMappingURL=AlertModel.d.ts.map
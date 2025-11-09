import { Alert, AlertSeverity, AlertStatus } from '@/types';
export declare class AlertService {
    private static instance;
    private isRunning;
    private intervalId;
    private notificationService;
    private constructor();
    static getInstance(): AlertService;
    start(): Promise<void>;
    stop(): Promise<void>;
    checkAlerts(): Promise<void>;
    private checkServiceHealthAlerts;
    private checkSystemMetricsAlerts;
    private checkPerformanceMetricsAlerts;
    private checkMetricAlert;
    private findExistingAlert;
    createAlert(alertData: Omit<Alert, 'id'>): Promise<Alert>;
    acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<Alert>;
    resolveAlert(alertId: string, resolvedBy?: string): Promise<Alert>;
    getActiveAlerts(limit?: number, offset?: number): Promise<Alert[]>;
    getCriticalAlerts(limit?: number): Promise<Alert[]>;
    getAlertsByService(serviceName: string, status?: AlertStatus, limit?: number, offset?: number): Promise<Alert[]>;
    getAlertsSummary(serviceName?: string): Promise<{
        total: number;
        active: number;
        resolved: number;
        acknowledged: number;
        critical: number;
        high: number;
        medium: number;
        low: number;
    }>;
    getAlertTrends(startTime: Date, endTime: Date, serviceName?: string, groupBy?: 'hour' | 'day' | 'week'): Promise<Array<{
        period: string;
        count: number;
        severity: AlertSeverity;
    }>>;
    isAlertServiceRunning(): boolean;
    getServiceStatus(): {
        isRunning: boolean;
        interval: number;
    };
    cleanupOldAlerts(daysToKeep?: number): Promise<number>;
}
//# sourceMappingURL=AlertService.d.ts.map
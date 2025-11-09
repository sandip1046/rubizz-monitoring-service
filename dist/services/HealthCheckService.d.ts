import { ServiceHealth, ServiceStatus } from '@/types';
export declare class HealthCheckService {
    private static instance;
    private isRunning;
    private intervalId;
    private constructor();
    static getInstance(): HealthCheckService;
    start(): Promise<void>;
    stop(): Promise<void>;
    runHealthChecks(): Promise<void>;
    checkServiceHealth(service: {
        name: string;
        url: string;
        port: number;
    }): Promise<ServiceHealth>;
    checkCustomServiceHealth(serviceName: string, serviceUrl: string, timeout?: number): Promise<ServiceHealth>;
    getAllServicesHealth(): Promise<ServiceHealth[]>;
    getServiceHealth(serviceName: string): Promise<ServiceHealth | null>;
    getServiceHealthSummary(serviceName: string, hours?: number): Promise<{
        serviceName: string;
        totalChecks: number;
        healthyChecks: number;
        unhealthyChecks: number;
        degradedChecks: number;
        averageResponseTime: number;
        uptime: number;
        lastChecked: Date | null;
    }>;
    getServicesByStatus(status: ServiceStatus): Promise<ServiceHealth[]>;
    private mapStatusToServiceStatus;
    isHealthCheckRunning(): boolean;
    getServiceStatus(): {
        isRunning: boolean;
        interval: number;
        monitoredServices: number;
    };
    cleanupOldRecords(daysToKeep?: number): Promise<number>;
}
//# sourceMappingURL=HealthCheckService.d.ts.map
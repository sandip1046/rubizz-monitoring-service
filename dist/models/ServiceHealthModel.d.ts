import { ServiceHealth, ServiceStatus as ServiceStatusType } from '@/types';
export declare class ServiceHealthModel {
    static create(data: Omit<ServiceHealth, 'id'>): Promise<ServiceHealth>;
    static findById(id: string): Promise<ServiceHealth | null>;
    static findLatest(serviceName: string): Promise<ServiceHealth | null>;
    static findByService(serviceName: string, limit?: number): Promise<ServiceHealth[]>;
    static findByStatus(status: ServiceStatusType, limit?: number): Promise<ServiceHealth[]>;
    static update(id: string, data: Partial<ServiceHealth>): Promise<ServiceHealth>;
    static delete(id: string): Promise<void>;
    static getServicesSummary(): Promise<Record<string, ServiceHealth>>;
    static cleanupOldRecords(daysToKeep?: number): Promise<number>;
    static getAllServicesHealth(): Promise<ServiceHealth[]>;
    static findLatestByService(serviceName: string): Promise<ServiceHealth | null>;
    static getHealthSummary(serviceName: string, hours?: number): Promise<any>;
    private static mapToServiceHealth;
}
//# sourceMappingURL=ServiceHealthModel.d.ts.map
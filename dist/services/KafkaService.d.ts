export declare class KafkaService {
    private kafka;
    private producer;
    private consumer;
    private isConnected;
    constructor();
    connect(): Promise<void>;
    private handleMessage;
    private handleMonitoringEvent;
    private handleAlertEvent;
    private handleMetricEvent;
    publishMonitoringEvent(event: string, data: any): Promise<void>;
    publishAlert(alert: any): Promise<void>;
    publishMetric(metric: any): Promise<void>;
    isKafkaConnected(): boolean;
    disconnect(): Promise<void>;
}
//# sourceMappingURL=KafkaService.d.ts.map
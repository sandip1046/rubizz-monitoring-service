export declare class GrpcServer {
    private server;
    private protoPath;
    constructor();
    private loadProto;
    private getHealth;
    private getServiceHealth;
    private getSystemMetrics;
    private getPerformanceMetrics;
    private recordMetric;
    private getAlerts;
    private createAlert;
    private acknowledgeAlert;
    private resolveAlert;
    private streamMetrics;
    private streamAlerts;
    start(): Promise<void>;
    stop(): Promise<void>;
}
//# sourceMappingURL=grpc.server.d.ts.map
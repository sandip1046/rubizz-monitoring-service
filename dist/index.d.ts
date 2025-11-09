declare class MonitoringService {
    private app;
    private healthController;
    private metricsController;
    private alertsController;
    private healthCheckService;
    private metricsCollectionService;
    private alertService;
    private redisService;
    private kafkaService;
    private grpcServer;
    private graphqlServer;
    private websocketServer;
    constructor();
    private initializeMiddleware;
    private initializeRoutes;
    private initializeErrorHandling;
    private initializeSwagger;
    start(): Promise<void>;
    private setupGracefulShutdown;
}
declare const monitoringService: MonitoringService;
export default monitoringService;
//# sourceMappingURL=index.d.ts.map
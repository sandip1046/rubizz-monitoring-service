import { Request, Response } from 'express';
export declare class HealthController {
    private healthCheckService;
    private metricsCollectionService;
    private alertService;
    private notificationService;
    private redisService;
    constructor();
    getHealth(req: Request, res: Response): Promise<void>;
    getDetailedHealth(req: Request, res: Response): Promise<void>;
    getServiceHealth(req: Request, res: Response): Promise<void>;
    getServiceHealthSummary(req: Request, res: Response): Promise<void>;
    getServicesByStatus(req: Request, res: Response): Promise<void>;
    checkCustomServiceHealth(req: Request, res: Response): Promise<void>;
    startHealthCheckService(req: Request, res: Response): Promise<void>;
    stopHealthCheckService(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=HealthController.d.ts.map
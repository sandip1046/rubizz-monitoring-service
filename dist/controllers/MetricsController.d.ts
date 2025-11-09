import { Request, Response } from 'express';
export declare class MetricsController {
    private metricsCollectionService;
    constructor();
    getSystemMetrics(req: Request, res: Response): Promise<void>;
    getPerformanceMetrics(req: Request, res: Response): Promise<void>;
    getPerformanceSummary(req: Request, res: Response): Promise<void>;
    getMetricsSummary(req: Request, res: Response): Promise<void>;
    recordCustomMetric(req: Request, res: Response): Promise<void>;
    getSlowestEndpoints(req: Request, res: Response): Promise<void>;
    getErrorRateByEndpoint(req: Request, res: Response): Promise<void>;
    startMetricsCollection(req: Request, res: Response): Promise<void>;
    stopMetricsCollection(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=MetricsController.d.ts.map
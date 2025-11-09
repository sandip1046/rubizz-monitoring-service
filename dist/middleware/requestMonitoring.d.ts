import { Request, Response, NextFunction } from 'express';
export declare class RequestMonitoringMiddleware {
    private metricsCollectionService;
    constructor();
    monitorRequests(): (req: Request, res: Response, next: NextFunction) => Promise<void>;
    addRequestId(): (req: Request, res: Response, next: NextFunction) => void;
    logRequests(): (req: Request, res: Response, next: NextFunction) => void;
    trackSlowRequests(thresholdMs?: number): (req: Request, res: Response, next: NextFunction) => void;
    trackErrorRequests(): (req: Request, res: Response, next: NextFunction) => void;
    private generateRequestId;
    private getClientIP;
    private getRequestSize;
    private getSafeHeaders;
    private getSafeBody;
}
export declare const requestMonitoringMiddleware: RequestMonitoringMiddleware;
//# sourceMappingURL=requestMonitoring.d.ts.map
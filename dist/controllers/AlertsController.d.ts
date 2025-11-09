import { Request, Response } from 'express';
export declare class AlertsController {
    private alertService;
    private notificationService;
    constructor();
    getActiveAlerts(req: Request, res: Response): Promise<void>;
    getCriticalAlerts(req: Request, res: Response): Promise<void>;
    getAlertsByService(req: Request, res: Response): Promise<void>;
    getAlertsSummary(req: Request, res: Response): Promise<void>;
    getAlertTrends(req: Request, res: Response): Promise<void>;
    createAlert(req: Request, res: Response): Promise<void>;
    acknowledgeAlert(req: Request, res: Response): Promise<void>;
    resolveAlert(req: Request, res: Response): Promise<void>;
    getAlertById(req: Request, res: Response): Promise<void>;
    sendTestNotification(req: Request, res: Response): Promise<void>;
    getNotificationStatus(req: Request, res: Response): Promise<void>;
    startAlertService(req: Request, res: Response): Promise<void>;
    stopAlertService(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=AlertsController.d.ts.map
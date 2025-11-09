import { Alert } from '@/types';
export declare class NotificationService {
    private static instance;
    private emailTransporter;
    private constructor();
    static getInstance(): NotificationService;
    private initializeEmailTransporter;
    sendAlertNotification(alert: Alert): Promise<void>;
    private getNotificationChannels;
    private sendEmailNotification;
    private sendSlackNotification;
    private sendPagerDutyNotification;
    private generateEmailTemplate;
    private getSeverityColor;
    private mapSeverityToPagerDuty;
    sendTestNotification(channel: 'email' | 'slack' | 'pagerduty'): Promise<void>;
    getServiceStatus(): {
        emailEnabled: boolean;
        slackEnabled: boolean;
        pagerdutyEnabled: boolean;
    };
}
//# sourceMappingURL=NotificationService.d.ts.map
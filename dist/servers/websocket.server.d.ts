export declare class WebSocketServer {
    private wss;
    private clients;
    private subscriptions;
    start(): Promise<void>;
    private handleMessage;
    private startBroadcasting;
    private broadcastMetrics;
    broadcastAlert(alert: any): Promise<void>;
    stop(): Promise<void>;
}
//# sourceMappingURL=websocket.server.d.ts.map
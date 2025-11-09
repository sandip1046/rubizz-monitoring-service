"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketServer = void 0;
const ws_1 = require("ws");
const config_1 = require("@/config/config");
const logger_1 = __importDefault(require("@/utils/logger"));
class WebSocketServer {
    constructor() {
        this.wss = null;
        this.clients = new Set();
        this.subscriptions = new Map();
    }
    async start() {
        this.wss = new ws_1.WebSocketServer({
            port: config_1.config.websocket.port,
            path: config_1.config.websocket.path,
        });
        this.wss.on('connection', (ws, req) => {
            this.clients.add(ws);
            logger_1.default.info('WebSocket client connected', {
                clientCount: this.clients.size,
            });
            ws.on('message', async (message) => {
                try {
                    const data = JSON.parse(message.toString());
                    await this.handleMessage(ws, data);
                }
                catch (error) {
                    logger_1.default.error('Error handling WebSocket message', {
                        error: error instanceof Error ? error.message : 'Unknown error',
                    });
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: 'Invalid message format',
                    }));
                }
            });
            ws.on('close', () => {
                this.clients.delete(ws);
                this.subscriptions.delete(ws);
                logger_1.default.info('WebSocket client disconnected', {
                    clientCount: this.clients.size,
                });
            });
            ws.on('error', (error) => {
                logger_1.default.error('WebSocket error', {
                    error: error.message,
                });
            });
            ws.send(JSON.stringify({
                type: 'connected',
                message: 'Connected to Rubizz Monitoring Service',
                timestamp: new Date().toISOString(),
            }));
        });
        logger_1.default.info('WebSocket server started', {
            port: config_1.config.websocket.port,
            path: config_1.config.websocket.path,
        });
        this.startBroadcasting();
    }
    async handleMessage(ws, data) {
        switch (data.type) {
            case 'subscribe':
                this.subscriptions.set(ws, {
                    ws,
                    serviceName: data.serviceName,
                    metricNames: data.metricNames,
                    alertSeverity: data.alertSeverity,
                });
                ws.send(JSON.stringify({
                    type: 'subscribed',
                    message: 'Successfully subscribed to updates',
                }));
                break;
            case 'unsubscribe':
                this.subscriptions.delete(ws);
                ws.send(JSON.stringify({
                    type: 'unsubscribed',
                    message: 'Successfully unsubscribed',
                }));
                break;
            case 'ping':
                ws.send(JSON.stringify({
                    type: 'pong',
                    timestamp: new Date().toISOString(),
                }));
                break;
            default:
                ws.send(JSON.stringify({
                    type: 'error',
                    message: `Unknown message type: ${data.type}`,
                }));
        }
    }
    startBroadcasting() {
        setInterval(() => {
            this.broadcastMetrics();
        }, 5000);
    }
    async broadcastMetrics() {
        const message = {
            type: 'metric',
            data: {
                timestamp: new Date().toISOString(),
                metrics: [],
            },
        };
        this.clients.forEach((client) => {
            if (client.readyState === ws_1.WebSocket.OPEN) {
                const subscription = this.subscriptions.get(client);
                if (subscription) {
                    client.send(JSON.stringify(message));
                }
            }
        });
    }
    async broadcastAlert(alert) {
        const message = {
            type: 'alert',
            data: {
                alert,
                timestamp: new Date().toISOString(),
            },
        };
        this.clients.forEach((client) => {
            if (client.readyState === ws_1.WebSocket.OPEN) {
                const subscription = this.subscriptions.get(client);
                if (subscription) {
                    if (!subscription.serviceName ||
                        subscription.serviceName === alert.serviceName) {
                        if (!subscription.alertSeverity ||
                            subscription.alertSeverity === alert.severity) {
                            client.send(JSON.stringify(message));
                        }
                    }
                }
            }
        });
    }
    async stop() {
        if (this.wss) {
            this.clients.forEach((client) => {
                client.close();
            });
            this.clients.clear();
            this.subscriptions.clear();
            return new Promise((resolve) => {
                this.wss.close(() => {
                    logger_1.default.info('WebSocket server stopped');
                    resolve();
                });
            });
        }
    }
}
exports.WebSocketServer = WebSocketServer;
//# sourceMappingURL=websocket.server.js.map
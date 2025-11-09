import { WebSocketServer as WSServer, WebSocket } from 'ws';
import { config } from '@/config/config';
import logger from '@/utils/logger';
import { AlertModel } from '@/models/AlertModel';
import { AlertSeverity, AlertStatus } from '@/types';

interface ClientSubscription {
  ws: WebSocket;
  serviceName?: string;
  metricNames?: string[];
  alertSeverity?: AlertSeverity;
}

export class WebSocketServer {
  private wss: WSServer | null = null;
  private clients: Set<WebSocket> = new Set();
  private subscriptions: Map<WebSocket, ClientSubscription> = new Map();

  public async start(): Promise<void> {
    this.wss = new WSServer({
      port: config.websocket.port,
      path: config.websocket.path,
    });

    this.wss.on('connection', (ws: WebSocket, req: any) => {
      this.clients.add(ws);
      logger.info('WebSocket client connected', {
        clientCount: this.clients.size,
      });

      ws.on('message', async (message: string) => {
        try {
          const data = JSON.parse(message.toString());
          await this.handleMessage(ws, data);
        } catch (error) {
          logger.error('Error handling WebSocket message', {
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          ws.send(
            JSON.stringify({
              type: 'error',
              message: 'Invalid message format',
            })
          );
        }
      });

      ws.on('close', () => {
        this.clients.delete(ws);
        this.subscriptions.delete(ws);
        logger.info('WebSocket client disconnected', {
          clientCount: this.clients.size,
        });
      });

      ws.on('error', (error) => {
        logger.error('WebSocket error', {
          error: error.message,
        });
      });

      // Send welcome message
      ws.send(
        JSON.stringify({
          type: 'connected',
          message: 'Connected to Rubizz Monitoring Service',
          timestamp: new Date().toISOString(),
        })
      );
    });

    logger.info('WebSocket server started', {
      port: config.websocket.port,
      path: config.websocket.path,
    });

    // Start broadcasting metrics and alerts
    this.startBroadcasting();
  }

  private async handleMessage(ws: WebSocket, data: any): Promise<void> {
    switch (data.type) {
      case 'subscribe':
        this.subscriptions.set(ws, {
          ws,
          serviceName: data.serviceName,
          metricNames: data.metricNames,
          alertSeverity: data.alertSeverity,
        });
        ws.send(
          JSON.stringify({
            type: 'subscribed',
            message: 'Successfully subscribed to updates',
          })
        );
        break;

      case 'unsubscribe':
        this.subscriptions.delete(ws);
        ws.send(
          JSON.stringify({
            type: 'unsubscribed',
            message: 'Successfully unsubscribed',
          })
        );
        break;

      case 'ping':
        ws.send(
          JSON.stringify({
            type: 'pong',
            timestamp: new Date().toISOString(),
          })
        );
        break;

      default:
        ws.send(
          JSON.stringify({
            type: 'error',
            message: `Unknown message type: ${data.type}`,
          })
        );
    }
  }

  private startBroadcasting(): void {
    // Broadcast metrics every 5 seconds
    setInterval(() => {
      this.broadcastMetrics();
    }, 5000);

    // Broadcast alerts when they occur
    // This would be triggered by alert creation events
  }

  private async broadcastMetrics(): Promise<void> {
    const message = {
      type: 'metric',
      data: {
        timestamp: new Date().toISOString(),
        metrics: [],
      },
    };

    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        const subscription = this.subscriptions.get(client);
        if (subscription) {
          client.send(JSON.stringify(message));
        }
      }
    });
  }

  public async broadcastAlert(alert: any): Promise<void> {
    const message = {
      type: 'alert',
      data: {
        alert,
        timestamp: new Date().toISOString(),
      },
    };

    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        const subscription = this.subscriptions.get(client);
        if (subscription) {
          // Filter by subscription criteria
          if (
            !subscription.serviceName ||
            subscription.serviceName === alert.serviceName
          ) {
            if (
              !subscription.alertSeverity ||
              subscription.alertSeverity === alert.severity
            ) {
              client.send(JSON.stringify(message));
            }
          }
        }
      }
    });
  }

  public async stop(): Promise<void> {
    if (this.wss) {
      this.clients.forEach((client) => {
        client.close();
      });
      this.clients.clear();
      this.subscriptions.clear();

      return new Promise((resolve) => {
        this.wss!.close(() => {
          logger.info('WebSocket server stopped');
          resolve();
        });
      });
    }
  }
}


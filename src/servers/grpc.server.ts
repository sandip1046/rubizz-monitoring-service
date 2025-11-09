import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import { config } from '@/config/config';
import logger from '@/utils/logger';
import { AlertModel } from '@/models/AlertModel';
import { AlertSeverity, AlertStatus } from '@/types';

export class GrpcServer {
  private server: grpc.Server;
  private protoPath: string;

  constructor() {
    this.protoPath = path.join(__dirname, '../proto/monitoring.proto');
    this.server = new grpc.Server();
    this.loadProto();
  }

  private loadProto(): void {
    const packageDefinition = protoLoader.loadSync(this.protoPath, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    });

    const monitoringProto = grpc.loadPackageDefinition(packageDefinition) as any;
    const monitoringService = monitoringProto.monitoring.MonitoringService.service;

    // Register service implementations
    this.server.addService(monitoringService, {
      GetHealth: this.getHealth.bind(this),
      GetServiceHealth: this.getServiceHealth.bind(this),
      GetSystemMetrics: this.getSystemMetrics.bind(this),
      GetPerformanceMetrics: this.getPerformanceMetrics.bind(this),
      RecordMetric: this.recordMetric.bind(this),
      GetAlerts: this.getAlerts.bind(this),
      CreateAlert: this.createAlert.bind(this),
      AcknowledgeAlert: this.acknowledgeAlert.bind(this),
      ResolveAlert: this.resolveAlert.bind(this),
      StreamMetrics: this.streamMetrics.bind(this),
      StreamAlerts: this.streamAlerts.bind(this),
    });
  }

  // Health Check
  private async getHealth(
    call: grpc.ServerUnaryCall<any, any>,
    callback: grpc.sendUnaryData<any>
  ): Promise<void> {
    try {
      callback(null, {
        healthy: true,
        status: 'OK',
        timestamp: Date.now(),
      });
    } catch (error) {
      callback({
        code: grpc.status.INTERNAL,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private async getServiceHealth(
    call: grpc.ServerUnaryCall<any, any>,
    callback: grpc.sendUnaryData<any>
  ): Promise<void> {
    try {
      const { service_name } = call.request;
      // Implementation would fetch from ServiceHealthModel
      callback(null, {
        service_name,
        status: 'HEALTHY',
        response_time: 100,
        last_checked: Date.now(),
        error_message: '',
      });
    } catch (error) {
      callback({
        code: grpc.status.INTERNAL,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Metrics
  private async getSystemMetrics(
    call: grpc.ServerUnaryCall<any, any>,
    callback: grpc.sendUnaryData<any>
  ): Promise<void> {
    try {
      callback(null, {
        metrics: [],
        total: 0,
      });
    } catch (error) {
      callback({
        code: grpc.status.INTERNAL,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private async getPerformanceMetrics(
    call: grpc.ServerUnaryCall<any, any>,
    callback: grpc.sendUnaryData<any>
  ): Promise<void> {
    try {
      callback(null, {
        metrics: [],
        total: 0,
      });
    } catch (error) {
      callback({
        code: grpc.status.INTERNAL,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private async recordMetric(
    call: grpc.ServerUnaryCall<any, any>,
    callback: grpc.sendUnaryData<any>
  ): Promise<void> {
    try {
      callback(null, {
        success: true,
        metric_id: 'generated-id',
      });
    } catch (error) {
      callback({
        code: grpc.status.INTERNAL,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Alerts
  private async getAlerts(
    call: grpc.ServerUnaryCall<any, any>,
    callback: grpc.sendUnaryData<any>
  ): Promise<void> {
    try {
      const { service_name, status, severity, limit = 100, offset = 0 } = call.request;

      const alerts = await AlertModel.findByService(
        service_name || '',
        status as AlertStatus | undefined,
        limit,
        offset
      );

      callback(null, {
        alerts: alerts.map(alert => ({
          id: alert.id,
          service_name: alert.serviceName,
          alert_type: alert.alertType,
          severity: alert.severity,
          status: alert.status,
          title: alert.title,
          description: alert.description,
          value: alert.value || 0,
          threshold: alert.threshold || 0,
          created_at: new Date().getTime(),
        })),
        total: alerts.length,
      });
    } catch (error) {
      callback({
        code: grpc.status.INTERNAL,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private async createAlert(
    call: grpc.ServerUnaryCall<any, any>,
    callback: grpc.sendUnaryData<any>
  ): Promise<void> {
    try {
      const {
        service_name,
        alert_type,
        severity,
        title,
        description,
        value,
        threshold,
        labels,
      } = call.request;

      const alert = await AlertModel.create({
        serviceName: service_name,
        alertType: alert_type,
        severity: severity as AlertSeverity,
        status: AlertStatus.ACTIVE,
        title,
        description,
        value,
        threshold,
        labels,
      });

      callback(null, {
        success: true,
        alert_id: alert.id || '',
      });
    } catch (error) {
      callback({
        code: grpc.status.INTERNAL,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private async acknowledgeAlert(
    call: grpc.ServerUnaryCall<any, any>,
    callback: grpc.sendUnaryData<any>
  ): Promise<void> {
    try {
      const { alert_id, acknowledged_by } = call.request;
      await AlertModel.acknowledge(alert_id, acknowledged_by);
      callback(null, { success: true });
    } catch (error) {
      callback({
        code: grpc.status.INTERNAL,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private async resolveAlert(
    call: grpc.ServerUnaryCall<any, any>,
    callback: grpc.sendUnaryData<any>
  ): Promise<void> {
    try {
      const { alert_id } = call.request;
      await AlertModel.resolve(alert_id);
      callback(null, { success: true });
    } catch (error) {
      callback({
        code: grpc.status.INTERNAL,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Streaming
  private streamMetrics(call: grpc.ServerWritableStream<any, any>): void {
    // Implementation for streaming metrics
    const interval = setInterval(() => {
      call.write({
        metric: {
          id: 'stream-id',
          service_name: call.request.service_name,
          metric_name: 'cpu_usage',
          metric_type: 'GAUGE',
          value: Math.random() * 100,
          timestamp: Date.now(),
        },
        timestamp: Date.now(),
      });
    }, 5000);

    call.on('cancelled', () => {
      clearInterval(interval);
    });
  }

  private streamAlerts(call: grpc.ServerWritableStream<any, any>): void {
    // Implementation for streaming alerts
    // Would use event emitters or Kafka consumers
  }

  public async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server.bindAsync(
        `${config.grpc.host}:${config.grpc.port}`,
        grpc.ServerCredentials.createInsecure(),
        (error, port) => {
          if (error) {
            logger.error('Failed to start gRPC server', {
              error: error.message,
            });
            reject(error);
            return;
          }

          this.server.start();
          logger.info('gRPC server started successfully', {
            port: config.grpc.port,
            host: config.grpc.host,
          });
          resolve();
        }
      );
    });
  }

  public async stop(): Promise<void> {
    return new Promise((resolve) => {
      this.server.tryShutdown(() => {
        logger.info('gRPC server stopped');
        resolve();
      });
    });
  }
}


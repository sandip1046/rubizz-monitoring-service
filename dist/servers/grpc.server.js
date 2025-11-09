"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GrpcServer = void 0;
const grpc = __importStar(require("@grpc/grpc-js"));
const protoLoader = __importStar(require("@grpc/proto-loader"));
const path_1 = __importDefault(require("path"));
const config_1 = require("@/config/config");
const logger_1 = __importDefault(require("@/utils/logger"));
const AlertModel_1 = require("@/models/AlertModel");
const types_1 = require("@/types");
class GrpcServer {
    constructor() {
        this.protoPath = path_1.default.join(__dirname, '../proto/monitoring.proto');
        this.server = new grpc.Server();
        this.loadProto();
    }
    loadProto() {
        const packageDefinition = protoLoader.loadSync(this.protoPath, {
            keepCase: true,
            longs: String,
            enums: String,
            defaults: true,
            oneofs: true,
        });
        const monitoringProto = grpc.loadPackageDefinition(packageDefinition);
        const monitoringService = monitoringProto.monitoring.MonitoringService.service;
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
    async getHealth(call, callback) {
        try {
            callback(null, {
                healthy: true,
                status: 'OK',
                timestamp: Date.now(),
            });
        }
        catch (error) {
            callback({
                code: grpc.status.INTERNAL,
                message: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    async getServiceHealth(call, callback) {
        try {
            const { service_name } = call.request;
            callback(null, {
                service_name,
                status: 'HEALTHY',
                response_time: 100,
                last_checked: Date.now(),
                error_message: '',
            });
        }
        catch (error) {
            callback({
                code: grpc.status.INTERNAL,
                message: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    async getSystemMetrics(call, callback) {
        try {
            callback(null, {
                metrics: [],
                total: 0,
            });
        }
        catch (error) {
            callback({
                code: grpc.status.INTERNAL,
                message: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    async getPerformanceMetrics(call, callback) {
        try {
            callback(null, {
                metrics: [],
                total: 0,
            });
        }
        catch (error) {
            callback({
                code: grpc.status.INTERNAL,
                message: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    async recordMetric(call, callback) {
        try {
            callback(null, {
                success: true,
                metric_id: 'generated-id',
            });
        }
        catch (error) {
            callback({
                code: grpc.status.INTERNAL,
                message: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    async getAlerts(call, callback) {
        try {
            const { service_name, status, severity, limit = 100, offset = 0 } = call.request;
            const alerts = await AlertModel_1.AlertModel.findByService(service_name || '', status, limit, offset);
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
        }
        catch (error) {
            callback({
                code: grpc.status.INTERNAL,
                message: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    async createAlert(call, callback) {
        try {
            const { service_name, alert_type, severity, title, description, value, threshold, labels, } = call.request;
            const alert = await AlertModel_1.AlertModel.create({
                serviceName: service_name,
                alertType: alert_type,
                severity: severity,
                status: types_1.AlertStatus.ACTIVE,
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
        }
        catch (error) {
            callback({
                code: grpc.status.INTERNAL,
                message: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    async acknowledgeAlert(call, callback) {
        try {
            const { alert_id, acknowledged_by } = call.request;
            await AlertModel_1.AlertModel.acknowledge(alert_id, acknowledged_by);
            callback(null, { success: true });
        }
        catch (error) {
            callback({
                code: grpc.status.INTERNAL,
                message: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    async resolveAlert(call, callback) {
        try {
            const { alert_id } = call.request;
            await AlertModel_1.AlertModel.resolve(alert_id);
            callback(null, { success: true });
        }
        catch (error) {
            callback({
                code: grpc.status.INTERNAL,
                message: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    streamMetrics(call) {
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
    streamAlerts(call) {
    }
    async start() {
        return new Promise((resolve, reject) => {
            this.server.bindAsync(`${config_1.config.grpc.host}:${config_1.config.grpc.port}`, grpc.ServerCredentials.createInsecure(), (error, port) => {
                if (error) {
                    logger_1.default.error('Failed to start gRPC server', {
                        error: error.message,
                    });
                    reject(error);
                    return;
                }
                this.server.start();
                logger_1.default.info('gRPC server started successfully', {
                    port: config_1.config.grpc.port,
                    host: config_1.config.grpc.host,
                });
                resolve();
            });
        });
    }
    async stop() {
        return new Promise((resolve) => {
            this.server.tryShutdown(() => {
                logger_1.default.info('gRPC server stopped');
                resolve();
            });
        });
    }
}
exports.GrpcServer = GrpcServer;
//# sourceMappingURL=grpc.server.js.map
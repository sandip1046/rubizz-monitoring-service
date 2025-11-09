"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KafkaService = void 0;
const kafkajs_1 = require("kafkajs");
const config_1 = require("@/config/config");
const logger_1 = __importDefault(require("@/utils/logger"));
const AlertModel_1 = require("@/models/AlertModel");
const types_1 = require("@/types");
class KafkaService {
    constructor() {
        this.producer = null;
        this.consumer = null;
        this.isConnected = false;
        this.kafka = new kafkajs_1.Kafka({
            clientId: config_1.config.kafka.clientId,
            brokers: config_1.config.kafka.brokers,
            retry: {
                retries: 8,
                initialRetryTime: 100,
                multiplier: 2,
            },
        });
    }
    async connect() {
        try {
            this.producer = this.kafka.producer();
            await this.producer.connect();
            this.consumer = this.kafka.consumer({ groupId: config_1.config.kafka.groupId });
            await this.consumer.connect();
            await this.consumer.subscribe({
                topics: [
                    config_1.config.kafka.topics.monitoring,
                    config_1.config.kafka.topics.alerts,
                    config_1.config.kafka.topics.metrics,
                ],
                fromBeginning: false,
            });
            await this.consumer.run({
                eachMessage: async (payload) => {
                    await this.handleMessage(payload);
                },
            });
            this.isConnected = true;
            logger_1.default.info('Kafka service connected successfully', {
                brokers: config_1.config.kafka.brokers,
                topics: Object.values(config_1.config.kafka.topics),
            });
        }
        catch (error) {
            this.isConnected = false;
            logger_1.default.error('Failed to connect to Kafka', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    async handleMessage(payload) {
        try {
            const { topic, partition, message } = payload;
            const value = message.value?.toString();
            if (!value) {
                return;
            }
            const data = JSON.parse(value);
            logger_1.default.debug('Kafka message received', {
                topic,
                partition,
                offset: message.offset,
            });
            switch (topic) {
                case config_1.config.kafka.topics.monitoring:
                    await this.handleMonitoringEvent(data);
                    break;
                case config_1.config.kafka.topics.alerts:
                    await this.handleAlertEvent(data);
                    break;
                case config_1.config.kafka.topics.metrics:
                    await this.handleMetricEvent(data);
                    break;
                default:
                    logger_1.default.warn('Unknown Kafka topic', { topic });
            }
        }
        catch (error) {
            logger_1.default.error('Error handling Kafka message', {
                error: error instanceof Error ? error.message : 'Unknown error',
                topic: payload.topic,
            });
        }
    }
    async handleMonitoringEvent(data) {
        logger_1.default.debug('Handling monitoring event', { data });
    }
    async handleAlertEvent(data) {
        if (data.event === 'alert.created') {
            try {
                await AlertModel_1.AlertModel.create({
                    serviceName: data.serviceName,
                    alertType: data.alertType,
                    severity: data.severity,
                    status: types_1.AlertStatus.ACTIVE,
                    title: data.title,
                    description: data.description,
                    value: data.value,
                    threshold: data.threshold,
                    labels: data.labels,
                });
            }
            catch (error) {
                logger_1.default.error('Error creating alert from Kafka event', {
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }
    }
    async handleMetricEvent(data) {
        logger_1.default.debug('Handling metric event', { data });
    }
    async publishMonitoringEvent(event, data) {
        if (!this.producer || !this.isConnected) {
            throw new Error('Kafka producer not connected');
        }
        try {
            await this.producer.send({
                topic: config_1.config.kafka.topics.monitoring,
                messages: [
                    {
                        key: event,
                        value: JSON.stringify({
                            event,
                            ...data,
                            timestamp: new Date().toISOString(),
                        }),
                    },
                ],
            });
            logger_1.default.debug('Published monitoring event to Kafka', { event });
        }
        catch (error) {
            logger_1.default.error('Error publishing monitoring event', {
                error: error instanceof Error ? error.message : 'Unknown error',
                event,
            });
            throw error;
        }
    }
    async publishAlert(alert) {
        if (!this.producer || !this.isConnected) {
            throw new Error('Kafka producer not connected');
        }
        try {
            await this.producer.send({
                topic: config_1.config.kafka.topics.alerts,
                messages: [
                    {
                        key: alert.id || alert.serviceName,
                        value: JSON.stringify({
                            event: 'alert.created',
                            ...alert,
                            timestamp: new Date().toISOString(),
                        }),
                    },
                ],
            });
            logger_1.default.debug('Published alert to Kafka', { alertId: alert.id });
        }
        catch (error) {
            logger_1.default.error('Error publishing alert to Kafka', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    async publishMetric(metric) {
        if (!this.producer || !this.isConnected) {
            throw new Error('Kafka producer not connected');
        }
        try {
            await this.producer.send({
                topic: config_1.config.kafka.topics.metrics,
                messages: [
                    {
                        key: metric.serviceName,
                        value: JSON.stringify({
                            ...metric,
                            timestamp: new Date().toISOString(),
                        }),
                    },
                ],
            });
            logger_1.default.debug('Published metric to Kafka', { metricName: metric.metricName });
        }
        catch (error) {
            logger_1.default.error('Error publishing metric to Kafka', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    isKafkaConnected() {
        return this.isConnected;
    }
    async disconnect() {
        try {
            if (this.producer) {
                await this.producer.disconnect();
            }
            if (this.consumer) {
                await this.consumer.disconnect();
            }
            this.isConnected = false;
            logger_1.default.info('Kafka service disconnected');
        }
        catch (error) {
            logger_1.default.error('Error disconnecting from Kafka', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
}
exports.KafkaService = KafkaService;
//# sourceMappingURL=KafkaService.js.map
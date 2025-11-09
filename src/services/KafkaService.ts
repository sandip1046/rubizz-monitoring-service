import { Kafka, Producer, Consumer, EachMessagePayload } from 'kafkajs';
import { config } from '@/config/config';
import logger from '@/utils/logger';
import { AlertModel } from '@/models/AlertModel';
import { AlertSeverity, AlertStatus } from '@/types';

export class KafkaService {
  private kafka: Kafka;
  private producer: Producer | null = null;
  private consumer: Consumer | null = null;
  private isConnected: boolean = false;

  constructor() {
    this.kafka = new Kafka({
      clientId: config.kafka.clientId,
      brokers: config.kafka.brokers,
      retry: {
        retries: 8,
        initialRetryTime: 100,
        multiplier: 2,
      },
    });
  }

  public async connect(): Promise<void> {
    try {
      // Initialize producer
      this.producer = this.kafka.producer();
      await this.producer.connect();

      // Initialize consumer
      this.consumer = this.kafka.consumer({ groupId: config.kafka.groupId });
      await this.consumer.connect();

      // Subscribe to topics
      await this.consumer.subscribe({
        topics: [
          config.kafka.topics.monitoring,
          config.kafka.topics.alerts,
          config.kafka.topics.metrics,
        ],
        fromBeginning: false,
      });

      // Start consuming messages
      await this.consumer.run({
        eachMessage: async (payload: EachMessagePayload) => {
          await this.handleMessage(payload);
        },
      });

      this.isConnected = true;
      logger.info('Kafka service connected successfully', {
        brokers: config.kafka.brokers,
        topics: Object.values(config.kafka.topics),
      });
    } catch (error) {
      this.isConnected = false;
      logger.error('Failed to connect to Kafka', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  private async handleMessage(payload: EachMessagePayload): Promise<void> {
    try {
      const { topic, partition, message } = payload;
      const value = message.value?.toString();

      if (!value) {
        return;
      }

      const data = JSON.parse(value);

      logger.debug('Kafka message received', {
        topic,
        partition,
        offset: message.offset,
      });

      switch (topic) {
        case config.kafka.topics.monitoring:
          await this.handleMonitoringEvent(data);
          break;

        case config.kafka.topics.alerts:
          await this.handleAlertEvent(data);
          break;

        case config.kafka.topics.metrics:
          await this.handleMetricEvent(data);
          break;

        default:
          logger.warn('Unknown Kafka topic', { topic });
      }
    } catch (error) {
      logger.error('Error handling Kafka message', {
        error: error instanceof Error ? error.message : 'Unknown error',
        topic: payload.topic,
      });
    }
  }

  private async handleMonitoringEvent(data: any): Promise<void> {
    // Handle monitoring events (service health updates, etc.)
    logger.debug('Handling monitoring event', { data });
  }

  private async handleAlertEvent(data: any): Promise<void> {
    // Handle alert events from other services
    if (data.event === 'alert.created') {
      try {
        await AlertModel.create({
          serviceName: data.serviceName,
          alertType: data.alertType,
          severity: data.severity as AlertSeverity,
          status: AlertStatus.ACTIVE,
          title: data.title,
          description: data.description,
          value: data.value,
          threshold: data.threshold,
          labels: data.labels,
        });
      } catch (error) {
        logger.error('Error creating alert from Kafka event', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  }

  private async handleMetricEvent(data: any): Promise<void> {
    // Handle metric events from other services
    logger.debug('Handling metric event', { data });
  }

  public async publishMonitoringEvent(event: string, data: any): Promise<void> {
    if (!this.producer || !this.isConnected) {
      throw new Error('Kafka producer not connected');
    }

    try {
      await this.producer.send({
        topic: config.kafka.topics.monitoring,
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

      logger.debug('Published monitoring event to Kafka', { event });
    } catch (error) {
      logger.error('Error publishing monitoring event', {
        error: error instanceof Error ? error.message : 'Unknown error',
        event,
      });
      throw error;
    }
  }

  public async publishAlert(alert: any): Promise<void> {
    if (!this.producer || !this.isConnected) {
      throw new Error('Kafka producer not connected');
    }

    try {
      await this.producer.send({
        topic: config.kafka.topics.alerts,
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

      logger.debug('Published alert to Kafka', { alertId: alert.id });
    } catch (error) {
      logger.error('Error publishing alert to Kafka', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  public async publishMetric(metric: any): Promise<void> {
    if (!this.producer || !this.isConnected) {
      throw new Error('Kafka producer not connected');
    }

    try {
      await this.producer.send({
        topic: config.kafka.topics.metrics,
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

      logger.debug('Published metric to Kafka', { metricName: metric.metricName });
    } catch (error) {
      logger.error('Error publishing metric to Kafka', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  public isKafkaConnected(): boolean {
    return this.isConnected;
  }

  public async disconnect(): Promise<void> {
    try {
      if (this.producer) {
        await this.producer.disconnect();
      }

      if (this.consumer) {
        await this.consumer.disconnect();
      }

      this.isConnected = false;
      logger.info('Kafka service disconnected');
    } catch (error) {
      logger.error('Error disconnecting from Kafka', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}


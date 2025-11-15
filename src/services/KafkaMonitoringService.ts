/**
 * Kafka monitoring service for consumer lag, topic metrics, and cluster health
 */

import { Kafka } from 'kafkajs';
import { KafkaMonitor, TopicManager, ConsumerLagInfo, TopicMetrics, ClusterHealth, ConsumerGroupInfo } from '@sandip1046/rubizz-shared-libs';
import { Logger } from '@sandip1046/rubizz-shared-libs';
import { config } from '../config/config';

export class KafkaMonitoringService {
  private kafka: Kafka;
  private monitor: KafkaMonitor;
  private topicManager: TopicManager;
  private logger: Logger;
  private isInitialized: boolean = false;

  constructor() {
    this.logger = Logger.getInstance('rubizz-monitoring-service', config.server.nodeEnv);
    
    this.kafka = new Kafka({
      clientId: 'rubizz-monitoring-service',
      brokers: config.kafka.brokers,
      retry: {
        initialRetryTime: 100,
        retries: 8,
        multiplier: 2,
      },
    });

    this.monitor = new KafkaMonitor(this.kafka, this.logger);
    this.topicManager = new TopicManager(this.kafka, this.logger);
  }

  /**
   * Initialize monitoring service
   */
  async initialize(): Promise<void> {
    try {
      await this.monitor.connect();
      await this.topicManager.connect();
      this.isInitialized = true;
      this.logger.info('Kafka monitoring service initialized');
    } catch (error) {
      this.logger.error('Failed to initialize Kafka monitoring service', error as Error);
      throw error;
    }
  }

  /**
   * Get consumer lag for a specific consumer group
   */
  async getConsumerLag(groupId: string, topics?: string[]): Promise<ConsumerLagInfo[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    return this.monitor.getConsumerLag(groupId, topics);
  }

  /**
   * Get all consumer groups
   */
  async getConsumerGroups(): Promise<string[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    return this.monitor.getConsumerGroups();
  }

  /**
   * Get detailed consumer group information
   */
  async getConsumerGroupInfo(groupId: string): Promise<ConsumerGroupInfo | null> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    return this.monitor.getConsumerGroupInfo(groupId);
  }

  /**
   * Get topic metrics
   */
  async getTopicMetrics(topic: string): Promise<TopicMetrics | null> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    return this.monitor.getTopicMetrics(topic);
  }

  /**
   * Get all topics
   */
  async getTopics(): Promise<string[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    return this.monitor.getTopics();
  }

  /**
   * Get cluster health
   */
  async getClusterHealth(): Promise<ClusterHealth> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    return this.monitor.getClusterHealth();
  }

  /**
   * Get consumers with high lag (above threshold)
   */
  async getHighLagConsumers(threshold: number = 1000): Promise<ConsumerLagInfo[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    return this.monitor.getHighLagConsumers(threshold);
  }

  /**
   * Get topic information
   */
  async getTopicInfo(topic: string) {
    if (!this.isInitialized) {
      await this.initialize();
    }
    return this.topicManager.getTopicInfo(topic);
  }

  /**
   * List all topics
   */
  async listTopics(): Promise<string[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    return this.topicManager.listTopics();
  }

  /**
   * Create a new topic
   */
  async createTopic(topic: string, partitions: number, replicationFactor: number): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    return this.topicManager.createTopic({
      topic,
      partitions,
      replicationFactor,
    });
  }

  /**
   * Delete a topic
   */
  async deleteTopic(topic: string): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    return this.topicManager.deleteTopic(topic);
  }

  /**
   * Increase topic partitions
   */
  async increasePartitions(topic: string, newPartitionCount: number): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    return this.topicManager.increasePartitions(topic, newPartitionCount);
  }

  /**
   * Shutdown monitoring service
   */
  async shutdown(): Promise<void> {
    try {
      await this.monitor.disconnect();
      await this.topicManager.disconnect();
      this.isInitialized = false;
      this.logger.info('Kafka monitoring service shut down');
    } catch (error) {
      this.logger.error('Error shutting down Kafka monitoring service', error as Error);
    }
  }
}


/**
 * Kafka monitoring controller for consumer lag, topic metrics, and cluster health
 */

import { Router, Request, Response } from 'express';
import { KafkaMonitoringService } from '../services/KafkaMonitoringService';
import { asyncHandler } from '@/middleware/errorHandler';
import { ResponseFormatter } from '@sandip1046/rubizz-shared-libs';

const router = Router();
const kafkaMonitoringService = new KafkaMonitoringService();

// Initialize service on first use
let isInitialized = false;
const ensureInitialized = async () => {
  if (!isInitialized) {
    await kafkaMonitoringService.initialize();
    isInitialized = true;
  }
};

/**
 * Get cluster health
 * GET /api/v1/kafka/health
 */
router.get('/health',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    await ensureInitialized();
    const health = await kafkaMonitoringService.getClusterHealth();
    res.json(ResponseFormatter.success(health, 'Cluster health retrieved successfully'));
  })
);

/**
 * Get all topics
 * GET /api/v1/kafka/topics
 */
router.get('/topics',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    await ensureInitialized();
    const topics = await kafkaMonitoringService.getTopics();
    res.json(ResponseFormatter.success(topics, 'Topics retrieved successfully'));
  })
);

/**
 * Get topic information
 * GET /api/v1/kafka/topics/:topic
 */
router.get('/topics/:topic',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    await ensureInitialized();
    const { topic } = req.params;
    if (!topic) {
      res.status(400).json(ResponseFormatter.error('Topic parameter is required', 'VALIDATION_ERROR'));
      return;
    }
    const topicInfo = await kafkaMonitoringService.getTopicInfo(topic);
    
    if (!topicInfo) {
      res.status(404).json(ResponseFormatter.error('Topic not found', 'TOPIC_NOT_FOUND'));
      return;
    }
    
    res.json(ResponseFormatter.success(topicInfo, 'Topic information retrieved successfully'));
  })
);

/**
 * Get topic metrics
 * GET /api/v1/kafka/topics/:topic/metrics
 */
router.get('/topics/:topic/metrics',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    await ensureInitialized();
    const { topic } = req.params;
    if (!topic) {
      res.status(400).json(ResponseFormatter.error('Topic parameter is required', 'VALIDATION_ERROR'));
      return;
    }
    const metrics = await kafkaMonitoringService.getTopicMetrics(topic);
    
    if (!metrics) {
      res.status(404).json(ResponseFormatter.error('Topic not found', 'TOPIC_NOT_FOUND'));
      return;
    }
    
    res.json(ResponseFormatter.success(metrics, 'Topic metrics retrieved successfully'));
  })
);

/**
 * Get all consumer groups
 * GET /api/v1/kafka/consumer-groups
 */
router.get('/consumer-groups',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    await ensureInitialized();
    const groups = await kafkaMonitoringService.getConsumerGroups();
    res.json(ResponseFormatter.success(groups, 'Consumer groups retrieved successfully'));
  })
);

/**
 * Get consumer group information
 * GET /api/v1/kafka/consumer-groups/:groupId
 */
router.get('/consumer-groups/:groupId',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    await ensureInitialized();
    const { groupId } = req.params;
    if (!groupId) {
      res.status(400).json(ResponseFormatter.error('Group ID parameter is required', 'VALIDATION_ERROR'));
      return;
    }
    const groupInfo = await kafkaMonitoringService.getConsumerGroupInfo(groupId);
    
    if (!groupInfo) {
      res.status(404).json(ResponseFormatter.error('Consumer group not found', 'GROUP_NOT_FOUND'));
      return;
    }
    
    res.json(ResponseFormatter.success(groupInfo, 'Consumer group information retrieved successfully'));
  })
);

/**
 * Get consumer lag for a consumer group
 * GET /api/v1/kafka/consumer-groups/:groupId/lag
 */
router.get('/consumer-groups/:groupId/lag',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    await ensureInitialized();
    const { groupId } = req.params;
    if (!groupId) {
      res.status(400).json(ResponseFormatter.error('Group ID parameter is required', 'VALIDATION_ERROR'));
      return;
    }
    const topics = req.query.topics ? (req.query.topics as string).split(',') : undefined;
    
    const lag = await kafkaMonitoringService.getConsumerLag(groupId, topics);
    res.json(ResponseFormatter.success(lag, 'Consumer lag retrieved successfully'));
  })
);

/**
 * Get consumers with high lag
 * GET /api/v1/kafka/consumer-groups/high-lag?threshold=1000
 */
router.get('/consumer-groups/high-lag',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    await ensureInitialized();
    const threshold = req.query.threshold ? parseInt(req.query.threshold as string, 10) : 1000;
    const highLagConsumers = await kafkaMonitoringService.getHighLagConsumers(threshold);
    res.json(ResponseFormatter.success(highLagConsumers, 'High lag consumers retrieved successfully'));
  })
);

/**
 * Create a new topic
 * POST /api/v1/kafka/topics
 */
router.post('/topics',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    await ensureInitialized();
    const { topic, partitions, replicationFactor } = req.body;
    
    if (!topic || !partitions || !replicationFactor) {
      res.status(400).json(ResponseFormatter.error('Missing required fields: topic, partitions, replicationFactor', 'VALIDATION_ERROR'));
      return;
    }
    
    await kafkaMonitoringService.createTopic(topic, partitions, replicationFactor);
    res.status(201).json(ResponseFormatter.created({ topic, partitions, replicationFactor }, 'Topic created successfully'));
  })
);

/**
 * Delete a topic
 * DELETE /api/v1/kafka/topics/:topic
 */
router.delete('/topics/:topic',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    await ensureInitialized();
    const { topic } = req.params;
    if (!topic) {
      res.status(400).json(ResponseFormatter.error('Topic parameter is required', 'VALIDATION_ERROR'));
      return;
    }
    await kafkaMonitoringService.deleteTopic(topic);
    res.json(ResponseFormatter.deleted('Topic deleted successfully'));
  })
);

/**
 * Increase topic partitions
 * PATCH /api/v1/kafka/topics/:topic/partitions
 */
router.patch('/topics/:topic/partitions',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    await ensureInitialized();
    const { topic } = req.params;
    if (!topic) {
      res.status(400).json(ResponseFormatter.error('Topic parameter is required', 'VALIDATION_ERROR'));
      return;
    }
    const { newPartitionCount } = req.body;
    
    if (!newPartitionCount || typeof newPartitionCount !== 'number') {
      res.status(400).json(ResponseFormatter.error('Missing or invalid newPartitionCount', 'VALIDATION_ERROR'));
      return;
    }
    
    await kafkaMonitoringService.increasePartitions(topic, newPartitionCount);
    res.json(ResponseFormatter.success({ topic, newPartitionCount }, 'Topic partitions increased successfully'));
  })
);

export { router as KafkaMonitoringController };


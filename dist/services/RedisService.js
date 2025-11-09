"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisService = void 0;
const axios_1 = __importDefault(require("axios"));
const config_1 = require("../config/config");
const logger_1 = __importDefault(require("../utils/logger"));
class RedisService {
    constructor() {
        this.isConnected = false;
        this.baseUrl = config_1.config.redisService.url;
        this.timeout = config_1.config.redisService.timeout;
        this.retries = config_1.config.redisService.retries;
        this.retryDelay = config_1.config.redisService.retryDelay;
    }
    async connect() {
        try {
            const health = await this.healthCheck();
            this.isConnected = health.session && health.cache && health.queue;
            if (this.isConnected) {
                logger_1.default.info('Connected to Redis service successfully', {
                    service: config_1.config.server.serviceName,
                });
            }
            else {
                throw new Error('Redis service health check failed');
            }
        }
        catch (error) {
            logger_1.default.error('Failed to connect to Redis service', {
                service: config_1.config.server.serviceName,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            this.isConnected = false;
            throw error;
        }
    }
    async disconnect() {
        this.isConnected = false;
        logger_1.default.info('Disconnected from Redis service', {
            service: config_1.config.server.serviceName,
        });
    }
    isRedisConnected() {
        return this.isConnected;
    }
    async setSession(sessionId, data, ttl = 3600) {
        try {
            return await this.setCache(`session:${sessionId}`, data, ttl);
        }
        catch (error) {
            logger_1.default.error('Failed to set session', {
                service: config_1.config.server.serviceName,
                sessionId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return false;
        }
    }
    async getSession(sessionId) {
        try {
            return await this.getCache(`session:${sessionId}`);
        }
        catch (error) {
            logger_1.default.error('Failed to get session', {
                service: config_1.config.server.serviceName,
                sessionId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return null;
        }
    }
    async deleteSession(sessionId) {
        try {
            return await this.deleteCache(`session:${sessionId}`);
        }
        catch (error) {
            logger_1.default.error('Failed to delete session', {
                service: config_1.config.server.serviceName,
                sessionId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return false;
        }
    }
    async setCache(key, data, ttl = 3600) {
        try {
            const response = await this.makeRequest('POST', '/cache', {
                key: `cache:${key}`,
                value: JSON.stringify(data),
                ttl
            });
            return response.success;
        }
        catch (error) {
            logger_1.default.error('Failed to set cache', {
                service: config_1.config.server.serviceName,
                key,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return false;
        }
    }
    async getCache(key) {
        try {
            const response = await this.makeRequest('GET', `/cache/${encodeURIComponent(`cache:${key}`)}`);
            if (response.success && response.data) {
                return JSON.parse(response.data);
            }
            return null;
        }
        catch (error) {
            logger_1.default.error('Failed to get cache', {
                service: config_1.config.server.serviceName,
                key,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return null;
        }
    }
    async getObject(key) {
        return this.getCache(key);
    }
    async deleteCache(key) {
        try {
            const response = await this.makeRequest('DELETE', `/cache/${encodeURIComponent(`cache:${key}`)}`);
            return response.success;
        }
        catch (error) {
            logger_1.default.error('Failed to delete cache', {
                service: config_1.config.server.serviceName,
                key,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return false;
        }
    }
    async pushToQueue(queueName, data) {
        try {
            const response = await this.makeRequest('POST', '/queue', {
                queue: `queue:${queueName}`,
                value: JSON.stringify(data)
            });
            return response.success ? response.data : 0;
        }
        catch (error) {
            logger_1.default.error('Failed to push to queue', {
                service: config_1.config.server.serviceName,
                queueName,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return 0;
        }
    }
    async popFromQueue(queueName) {
        try {
            const response = await this.makeRequest('GET', `/queue/${encodeURIComponent(`queue:${queueName}`)}`);
            if (response.success && response.data) {
                return JSON.parse(response.data);
            }
            return null;
        }
        catch (error) {
            logger_1.default.error('Failed to pop from queue', {
                service: config_1.config.server.serviceName,
                queueName,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return null;
        }
    }
    async getQueueLength(queueName) {
        try {
            const response = await this.makeRequest('GET', `/queue/${encodeURIComponent(`queue:${queueName}`)}/length`);
            return response.success ? response.data : 0;
        }
        catch (error) {
            logger_1.default.error('Failed to get queue length', {
                service: config_1.config.server.serviceName,
                queueName,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return 0;
        }
    }
    async hset(key, field, value) {
        try {
            const response = await this.makeRequest('POST', '/hash', {
                key,
                field,
                value: JSON.stringify(value)
            });
            return response.success;
        }
        catch (error) {
            logger_1.default.error('Failed to hset', {
                service: config_1.config.server.serviceName,
                key,
                field,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return false;
        }
    }
    async hget(key, field) {
        try {
            const response = await this.makeRequest('GET', `/hash/${encodeURIComponent(key)}/${encodeURIComponent(field)}`);
            if (response.success && response.data) {
                return JSON.parse(response.data);
            }
            return null;
        }
        catch (error) {
            logger_1.default.error('Failed to hget', {
                service: config_1.config.server.serviceName,
                key,
                field,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return null;
        }
    }
    async hgetall(key) {
        try {
            const response = await this.makeRequest('GET', `/hash/${encodeURIComponent(key)}`);
            if (response.success && response.data) {
                const parsed = {};
                for (const [field, value] of Object.entries(response.data)) {
                    parsed[field] = JSON.parse(value);
                }
                return parsed;
            }
            return {};
        }
        catch (error) {
            logger_1.default.error('Failed to hgetall', {
                service: config_1.config.server.serviceName,
                key,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return {};
        }
    }
    async hdel(key, field) {
        try {
            const response = await this.makeRequest('DELETE', `/hash/${encodeURIComponent(key)}/${encodeURIComponent(field)}`);
            return response.success;
        }
        catch (error) {
            logger_1.default.error('Failed to hdel', {
                service: config_1.config.server.serviceName,
                key,
                field,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return false;
        }
    }
    async lpush(key, ...values) {
        try {
            const response = await this.makeRequest('POST', '/list/lpush', {
                key,
                values: values.map(value => JSON.stringify(value))
            });
            return response.success ? response.data : 0;
        }
        catch (error) {
            logger_1.default.error('Failed to lpush', {
                service: config_1.config.server.serviceName,
                key,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return 0;
        }
    }
    async rpush(key, ...values) {
        try {
            const response = await this.makeRequest('POST', '/list/rpush', {
                key,
                values: values.map(value => JSON.stringify(value))
            });
            return response.success ? response.data : 0;
        }
        catch (error) {
            logger_1.default.error('Failed to rpush', {
                service: config_1.config.server.serviceName,
                key,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return 0;
        }
    }
    async lpop(key) {
        try {
            const response = await this.makeRequest('GET', `/list/${encodeURIComponent(key)}/lpop`);
            if (response.success && response.data) {
                return JSON.parse(response.data);
            }
            return null;
        }
        catch (error) {
            logger_1.default.error('Failed to lpop', {
                service: config_1.config.server.serviceName,
                key,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return null;
        }
    }
    async rpop(key) {
        try {
            const response = await this.makeRequest('GET', `/list/${encodeURIComponent(key)}/rpop`);
            if (response.success && response.data) {
                return JSON.parse(response.data);
            }
            return null;
        }
        catch (error) {
            logger_1.default.error('Failed to rpop', {
                service: config_1.config.server.serviceName,
                key,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return null;
        }
    }
    async llen(key) {
        try {
            const response = await this.makeRequest('GET', `/list/${encodeURIComponent(key)}/length`);
            return response.success ? response.data : 0;
        }
        catch (error) {
            logger_1.default.error('Failed to llen', {
                service: config_1.config.server.serviceName,
                key,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return 0;
        }
    }
    async ltrim(key, start, stop) {
        try {
            const response = await this.makeRequest('POST', '/list/trim', {
                key,
                start,
                stop
            });
            return response.success;
        }
        catch (error) {
            logger_1.default.error('Failed to ltrim', {
                service: config_1.config.server.serviceName,
                key,
                start,
                stop,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return false;
        }
    }
    async sadd(key, ...members) {
        try {
            const response = await this.makeRequest('POST', '/set', {
                key,
                members: members.map(member => JSON.stringify(member))
            });
            return response.success ? response.data : 0;
        }
        catch (error) {
            logger_1.default.error('Failed to sadd', {
                service: config_1.config.server.serviceName,
                key,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return 0;
        }
    }
    async smembers(key) {
        try {
            const response = await this.makeRequest('GET', `/set/${encodeURIComponent(key)}`);
            if (response.success && response.data) {
                return response.data.map((value) => JSON.parse(value));
            }
            return [];
        }
        catch (error) {
            logger_1.default.error('Failed to smembers', {
                service: config_1.config.server.serviceName,
                key,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return [];
        }
    }
    async sismember(key, member) {
        try {
            const response = await this.makeRequest('GET', `/set/${encodeURIComponent(key)}/ismember?member=${encodeURIComponent(JSON.stringify(member))}`);
            return response.success ? response.data : false;
        }
        catch (error) {
            logger_1.default.error('Failed to sismember', {
                service: config_1.config.server.serviceName,
                key,
                member,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return false;
        }
    }
    async exists(key) {
        try {
            const response = await this.makeRequest('GET', `/exists/${encodeURIComponent(key)}`);
            return response.success ? response.data : false;
        }
        catch (error) {
            logger_1.default.error('Failed to check existence', {
                service: config_1.config.server.serviceName,
                key,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return false;
        }
    }
    async expire(key, ttl) {
        try {
            const response = await this.makeRequest('POST', '/expire', {
                key,
                ttl
            });
            return response.success;
        }
        catch (error) {
            logger_1.default.error('Failed to set expiration', {
                service: config_1.config.server.serviceName,
                key,
                ttl,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return false;
        }
    }
    async ttl(key) {
        try {
            const response = await this.makeRequest('GET', `/ttl/${encodeURIComponent(key)}`);
            return response.success ? response.data : -1;
        }
        catch (error) {
            logger_1.default.error('Failed to get TTL', {
                service: config_1.config.server.serviceName,
                key,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return -1;
        }
    }
    async incr(key) {
        try {
            const currentValue = await this.getCache(key);
            const newValue = currentValue ? parseInt(currentValue) + 1 : 1;
            await this.setCache(key, newValue.toString());
            return newValue;
        }
        catch (error) {
            logger_1.default.error('Failed to increment', {
                service: config_1.config.server.serviceName,
                key,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return 0;
        }
    }
    async publish(channel, message) {
        try {
            logger_1.default.warn('Pub/Sub operations not supported in RedisService', {
                service: config_1.config.server.serviceName,
                channel,
            });
            return false;
        }
        catch (error) {
            logger_1.default.error('Failed to publish', {
                service: config_1.config.server.serviceName,
                channel,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return false;
        }
    }
    async subscribe(channel, callback) {
        try {
            logger_1.default.warn('Pub/Sub operations not supported in RedisService', {
                service: config_1.config.server.serviceName,
                channel,
            });
            return false;
        }
        catch (error) {
            logger_1.default.error('Failed to subscribe', {
                service: config_1.config.server.serviceName,
                channel,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return false;
        }
    }
    async cleanup() {
        try {
            await this.disconnect();
            logger_1.default.info('Redis service cleanup completed', {
                service: config_1.config.server.serviceName,
            });
        }
        catch (error) {
            logger_1.default.error('Error during Redis service cleanup', {
                service: config_1.config.server.serviceName,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    async healthCheck() {
        try {
            const response = await this.makeRequest('GET', '/health');
            if (response.success && response.data) {
                return response.data.redis || { session: false, cache: false, queue: false };
            }
            return { session: false, cache: false, queue: false };
        }
        catch (error) {
            logger_1.default.error('Redis service health check failed', {
                service: config_1.config.server.serviceName,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return { session: false, cache: false, queue: false };
        }
    }
    async makeRequest(method, endpoint, data) {
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            method,
            url,
            timeout: this.timeout,
            data,
            headers: {
                'Content-Type': 'application/json',
            },
        };
        let lastError;
        for (let attempt = 1; attempt <= this.retries; attempt++) {
            try {
                const response = await (0, axios_1.default)(config);
                return response.data;
            }
            catch (error) {
                lastError = error;
                if (attempt < this.retries) {
                    await new Promise(resolve => setTimeout(resolve, this.retryDelay));
                }
            }
        }
        throw lastError;
    }
}
exports.RedisService = RedisService;
exports.default = RedisService;
//# sourceMappingURL=RedisService.js.map
const redis = require('redis');
const Logger = require('../utils/logger.js');

class RedisService {
    constructor() {
        this.client = redis.createClient();
        this.publisher = redis.createClient();
        this.subscriber = redis.createClient();
        
        this.connect();
    }

    async connect() {
        try {
            await this.client.connect();
            await this.publisher.connect();
            await this.subscriber.connect();
            Logger.info('Connected to Redis');
        } catch (err) {
            Logger.error('Failed to connect to Redis: ' + err);
        }
    }

    async set(key, value) {
        try {
            await this.client.set(key, JSON.stringify(value));
            Logger.info(`Set key ${key} in Redis`);
        } catch (err) {
            Logger.error(`Failed to set key ${key}: ` + err);
        }
    }

    async get(key) {
        try {
            const value = await this.client.get(key);
            return JSON.parse(value);
        } catch (err) {
            Logger.error(`Failed to get key ${key}: ` + err);
            return null;
        }
    }

    // Pub/Sub functionality
    async publish(channel, message) {
        try {
            await this.publisher.publish(channel, JSON.stringify(message));
            Logger.info(`Published message to ${channel}`);
        } catch (err) {
            Logger.error(`Failed to publish message to ${channel}: ` + err);
        }
    }

    async subscribe(channel, callback) {
        try {
            await this.subscriber.subscribe(channel, (message) => {
                Logger.info(`Received message from ${channel}: ${message}`);
                callback(JSON.parse(message));
            });
            Logger.info(`Subscribed to channel ${channel}`);
        } catch (err) {
            Logger.error(`Failed to subscribe to ${channel}: ` + err);
        }
    }

    async quit() {
        await this.client.quit();
        await this.publisher.quit();
        await this.subscriber.quit();
        Logger.info('Redis clients disconnected');
    }
}

module.exports = RedisService;

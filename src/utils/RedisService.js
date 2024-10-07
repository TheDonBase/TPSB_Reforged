const redis = require('redis'); // Ensure redis is imported
const Logger = require('../utils/logger.js'); // Adjust the path as necessary

class RedisService {
    constructor() {
        this.client = redis.createClient();
        this.connect();
    }

    async connect() {
        try {
            await this.client.connect();
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
            if (value === null) {
                Logger.warn(`Key ${key} does not exist in Redis`);
                return null;
            }
            return JSON.parse(value);
        } catch (err) {
            Logger.error(`Failed to get key ${key}: ` + err);
            return null;
        }
    }

    // Pub/Sub functionality
    async publish(channel, message) {
        try {
            await this.client.publish(channel, JSON.stringify(message));
            Logger.info(`Published message to ${channel}`);
        } catch (err) {
            Logger.error(`Failed to publish message to ${channel}: ` + err);
        }
    }

    async subscribe(channel, callback) {
        try {
            await this.client.subscribe(channel, (message) => {
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
        Logger.info('Redis client disconnected');
    }
}

module.exports = RedisService;
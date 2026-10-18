const { createClient } = require('redis');

const redisClient = createClient({
    url: process.env.REDIS_URL,
    socket: {
        connectTimeout: 10000,
        reconnectStrategy: (retries) => {
            // Keep retrying after transient Redis Cloud/network interruptions.
            // Stopping after a handful of attempts leaves the app permanently
            // disconnected until the backend is manually restarted.
            const delay = Math.min(500 * (2 ** Math.min(retries, 6)), 30000);
            const jitter = Math.floor(Math.random() * 500);
            return delay + jitter;
        }
    }
});

redisClient.on('error', (err) => {
    console.error('Redis client error:', err);
});

redisClient.on('reconnecting', () => {
    console.warn('Redis connection lost; retrying connection...');
});

redisClient.on('ready', () => {
    console.log('Redis connection is ready.');
});

module.exports = redisClient;

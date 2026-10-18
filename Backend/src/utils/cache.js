const redisClient = require('../config/redis');

async function getCachedJson(key) {
    if (!redisClient.isReady) return null;

    try {
        const cached = await redisClient.get(key);
        if (cached === null) return null;

        try {
            return JSON.parse(cached);
        } catch {
            await redisClient.del(key).catch(() => {});
            return null;
        }
    } catch (error) {
        console.warn(`Redis cache read failed for ${key}:`, error.message);
        return null;
    }
}

async function setCachedJson(key, value, ttlSeconds = 60) {
    if (!redisClient.isReady) return;

    try {
        await redisClient.set(key, JSON.stringify(value), { EX: ttlSeconds });
    } catch (error) {
        console.warn(`Redis cache write failed for ${key}:`, error.message);
    }
}

async function invalidateProblemListCache() {
    if (!redisClient.isReady) return;

    try {
        await redisClient.del('cache:problems:list:v1');
    } catch (error) {
        console.warn('Redis problem-list cache invalidation failed:', error.message);
    }
}

module.exports = { getCachedJson, setCachedJson, invalidateProblemListCache };

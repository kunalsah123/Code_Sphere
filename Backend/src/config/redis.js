const{ createClient } = require( 'redis');

const redisClient = createClient({
    username: 'default',
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: 'redis-11437.c8.us-east-1-2.ec2.redns.redis-cloud.com',
        port: 11437
    }
});

module.exports = redisClient;
require('dotenv').config();

const mongoose = require('mongoose');
const redisClient = require('./config/redis');
const connectMongo = require('./config/db');

async function checkConnections() {
    const missing = ['MONGO_URI', 'REDIS_URL'].filter((key) => !process.env[key]);
    if (missing.length) {
        throw new Error(`Missing ${missing.join(', ')}. Add them to Backend/.env first.`);
    }

    try {
        console.log('Checking MongoDB Atlas...');
        await connectMongo();
        await mongoose.connection.db.admin().command({ ping: 1 });
        console.log(`OK MongoDB (${mongoose.connection.name})`);

        console.log('Checking Redis...');
        await redisClient.connect();
        await redisClient.ping();
        console.log('OK Redis (PING/PONG)');
    } finally {
        if (redisClient.isOpen) await redisClient.quit();
        if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
    }
}

checkConnections().catch((error) => {
    console.error(`Connection check failed: ${error.message}`);
    process.exitCode = 1;
});

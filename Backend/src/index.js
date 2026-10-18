const express = require('express');
const app = express();
require('dotenv').config();
const mongoose = require('mongoose');
const main = require('./config/db');
const cookieParser = require('cookie-parser');
const authrouter = require("./routes/userAuth");
const redisClient = require('./config/redis');
const problemRouter = require('./routes/problemCreator');
const submitRouter = require('./routes/submit')
const cors = require('cors');
const aiRouter = require('./routes/aiChatting');
const videoRouter = require('./routes/videoCreator');
const collaborationRouter = require('./routes/collaboration');
const dashboardRouter = require('./routes/dashboard');
const http = require('http');
const { Server } = require('socket.io');
const configureCollaborationSocket = require('./config/collaborationSocket');



const defaultCorsOrigins = process.env.NODE_ENV === 'production'
    ? ['https://codemaster-frontend-g1fq.onrender.com']
    : [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:5174',
        'http://127.0.0.1:5174'
    ];
const allowedCorsOrigins = (process.env.CORS_ORIGINS || defaultCorsOrigins.join(','))
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedCorsOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(new Error(`Origin is not allowed by CORS: ${origin}`));
    },
    credentials: true
}));

// Middleware
app.use(express.json());
app.use(cookieParser());

app.get('/health', (req, res) => {
    const mongoConnected = mongoose.connection.readyState === 1;
    const redisConnected = redisClient.isReady;

    res.status(mongoConnected && redisConnected ? 200 : 503).json({
        status: mongoConnected && redisConnected ? 'ok' : 'unavailable',
        mongo: mongoConnected ? 'connected' : 'disconnected',
        redis: redisConnected ? 'connected' : 'disconnected'
    });
});

// Routes
app.use('/user', authrouter);
app.use('/problem', problemRouter);
app.use('/submission' , submitRouter);
app.use('/ai' , aiRouter);
app.use('/video' , videoRouter)
app.use('/collaboration', collaborationRouter);
app.use('/dashboard', dashboardRouter);


// Initialize DB & Redis, then start server
const initializeConnection = async () => {
    const missingConfiguration = [];
    if (!process.env.MONGO_URI) missingConfiguration.push('MONGO_URI');
    if (!process.env.REDIS_URL) missingConfiguration.push('REDIS_URL');
    if (!process.env.JWT_SECRET) missingConfiguration.push('JWT_SECRET');

    if (missingConfiguration.length > 0) {
        console.error(`❌ Missing required environment variable(s): ${missingConfiguration.join(', ')}. Set them in Backend/.env.`);
        process.exit(1);
    }

    try {
        if (!/^rediss?:\/\//i.test(process.env.REDIS_URL)) {
            throw new Error('REDIS_URL must start with redis:// or rediss://. Copy the full connection URL from your Redis provider.');
        }

        console.log('Connecting to MongoDB Atlas...');
        await main();
        console.log(`✅ MongoDB connected${mongoose.connection.name ? ` (database: ${mongoose.connection.name})` : ''}.`);

        console.log('Connecting to Redis...');
        await redisClient.connect();
        await redisClient.ping();
        console.log('✅ Redis connected and responded to PING.');

        const port = process.env.PORT || 5000;
        const server = http.createServer(app);
        const io = new Server(server, {
            cors: { origin: allowedCorsOrigins, credentials: true },
            transports: ['websocket', 'polling']
        });
        app.set('io', io);
        configureCollaborationSocket(io);
        server.listen(port, '0.0.0.0', () => {
            console.log(`🚀 Server is running on port ${port}`);
        });
    } catch (err) {
        console.error('❌ Backend startup failed:', err.message);
        if (mongoose.connection.readyState !== 0) await mongoose.disconnect().catch(() => {});
        if (redisClient.isOpen) await redisClient.quit().catch(() => {});
        process.exit(1);
    }
};

initializeConnection();

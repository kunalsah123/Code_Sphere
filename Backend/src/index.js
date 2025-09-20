const express = require('express');
const app = express();
require('dotenv').config();
const main = require('./config/db'); // should export a function
const cookieParser = require('cookie-parser');
const authrouter = require("./routes/userAuth");
const redisClient = require('./config/redis');
const problemRouter = require('./routes/problemCreator');
const submitRouter = require('./routes/submit')
const cors = require('cors');
const aiRouter = require('./routes/aiChatting');
const videoRouter = require('./routes/videoCreator');



//the browser protect the frontend to get connected with backedn because both are running at different port so to connect them we want a verfication that's why we use cors 
//import cors -> and read the cors documentation
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? 'https://codemaster-frontend.onrender.com' 
        : 'http://localhost:5173',
    credentials: true
}))

// Middleware
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/user', authrouter);
app.use('/problem', problemRouter);
app.use('/submission' , submitRouter);
app.use('/ai' , aiRouter);
app.use('/video' , videoRouter)


// Initialize DB & Redis, then start server
const initializeConnection = async () => {
    try {
        await Promise.all([main(), redisClient.connect()]);
        console.log("✅ MongoDB and Redis connected successfully!");

        app.listen(process.env.PORT || 5000, () => {
            console.log(`🚀 Server is running on port ${process.env.PORT || 5000}`);
        });
    } catch (err) {
        console.error('❌ Error connecting to the database or Redis:', err);
        process.exit(1);
    }
};

initializeConnection();

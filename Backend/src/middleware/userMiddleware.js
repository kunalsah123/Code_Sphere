const jwt = require('jsonwebtoken');
const User = require('../models/user');
const redisClient = require('../config/redis');


const userMiddleware = async (req, res, next) => {
    try {
        const { token } = req.cookies;
        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Authentication token is missing'
            });
        }

        let payload;
        try {
            payload = jwt.verify(token, process.env.JWT_SECRET);
        } catch {
            return res.status(401).json({ success: false, error: 'Session expired or invalid. Please sign in again.' });
        }
        const { _id } = payload;
        if (!_id) {
            return res.status(401).json({
                success: false,
                error: 'Invalid token'
            });
        }

        const result = await User.findById(_id).select('+tokenVersion');
        if (!result) {
            return res.status(401).json({ success: false, error: 'Account not found. Please sign in again.' });
        }

        if ((payload.tokenVersion || 0) !== (result.tokenVersion || 0)) {
            return res.status(401).json({ success: false, error: 'Session has ended. Please sign in again.' });
        }

        //Redis ke blocklist mein present hain ki nahi
        const isBlocked = await redisClient.get(`token:${token}`);

        //if present then we will throw an error
        if (isBlocked) {
            return res.status(401).json({ success: false, error: 'Session has ended. Please sign in again.' });
        }

        req.result = result;

        next();



    }
    catch (err) {
        console.error('Authentication middleware failed:', err.message);
        return res.status(503).json({ success: false, error: 'Authentication service is temporarily unavailable.' });
    }
}

module.exports = userMiddleware;

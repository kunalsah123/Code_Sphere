const jwt = require('jsonwebtoken');
const User = require('../models/user');
const redisClient = require('../config/redis');

const adminMiddleware = async (req, res, next) => {
    try {
        const { token } = req.cookies;

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Authentication token is missing'
            });
        }

        const payload = jwt.verify(token, process.env.JWT_SECRET);
        const { _id } = payload;

        if (!_id) {
            return res.status(401).json({
                success: false,
                error: 'Invalid token'
            });
        }

        const result = await User.findById(_id);

        // Check user exists
        if (!result) {
            return res.status(401).json({
                success: false,
                error: 'Admin not found'
            });
        }

        // ✅ FIX: Check user's role from DB, not from token
        if (result.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Unauthorized access'
            });
        }

        // Redis Blocklist check
        const isBlocked = await redisClient.get(`token:${token}`);
        if (isBlocked) {
            return res.status(401).json({
                success: false,
                error: 'Token is blocked'
            });
        }

        req.result = result;
        next();

    } catch (err) {
        return res.status(500).json({
            success: false,
            error: err.message || 'Server Error'
        });
    }
};

module.exports = adminMiddleware;

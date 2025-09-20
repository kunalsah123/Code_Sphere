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

        const payload = jwt.verify(token, process.env.JWT_SECRET);
        const { _id } = payload;
        if (!_id) {
            return res.status(401).json({
                success: false,
                error: 'Invalid token'
            });
        }

        const result = await User.findById(_id);
        if (!result) {
            throw new Error('User not found');
        }

        //Redis ke blocklist mein present hain ki nahi
        const isBlocked = await redisClient.get(`token:${token}`);

        //if present then we will throw an error
        if (isBlocked) {
            throw new Error('Token is blocked');
        }

        req.result = result;

        next();



    }
    catch (err) {
        throw new Error(err.message);
    }
}

module.exports = userMiddleware;
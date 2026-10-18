const jwt = require('jsonwebtoken');
const User = require('../models/user');
const CollaborationRoom = require('../models/collaborationRoom');
const redisClient = require('./redis');
const { stateKey, chatKey } = require('../controllers/collaboration');

const languages = new Set(['javascript', 'java', 'cpp']);

function configureCollaborationSocket(io) {
    io.use(async (socket, next) => {
        try {
            const tokenCookie = (socket.handshake.headers.cookie || '').split(';').map((item) => item.trim()).find((item) => item.startsWith('token='));
            const token = tokenCookie ? decodeURIComponent(tokenCookie.slice('token='.length)) : null;
            if (!token) return next(new Error('Please sign in to use collaboration.'));
            const payload = jwt.verify(token, process.env.JWT_SECRET);
            if (await redisClient.get(`token:${token}`)) return next(new Error('Session ended. Please sign in again.'));
            const user = await User.findById(payload._id).select('firstName emailId +tokenVersion');
            if (!user) return next(new Error('Account not found. Please sign in again.'));
            if ((payload.tokenVersion || 0) !== (user.tokenVersion || 0)) return next(new Error('Session has ended. Please sign in again.'));
            socket.data.user = { id: user._id.toString(), name: user.firstName || user.emailId };
            socket.data.token = token;
            socket.data.tokenExpiresAt = payload.exp;
            socket.data.tokenVersion = payload.tokenVersion || 0;
            next();
        } catch (error) {
            next(new Error(error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError'
                ? 'Session expired. Please sign in again.'
                : 'Authentication service is temporarily unavailable.'));
        }
    });

    io.on('connection', (socket) => {
        const joinedRooms = new Set();
        let lastCodeChangeAt = 0;
        const getRoom = async (roomId) => {
            if (Date.now() >= socket.data.tokenExpiresAt * 1000 || await redisClient.get(`token:${socket.data.token}`)) {
                socket.disconnect(true);
                return null;
            }
            const user = await User.findById(socket.data.user.id).select('+tokenVersion');
            if (!user || (user.tokenVersion || 0) !== socket.data.tokenVersion) {
                socket.disconnect(true);
                return null;
            }
            const room = await CollaborationRoom.findById(roomId).select('participants status expiresAt');
            if (!room || room.status !== 'active' || room.expiresAt <= new Date()) return null;
            return room.participants.some((id) => id.toString() === socket.data.user.id) ? room : null;
        };
        const sendPresence = async (roomId) => {
            const sockets = await io.in(roomId).fetchSockets();
            const members = [...new Map(sockets.map((item) => [item.data.user.id, item.data.user])).values()];
            io.to(roomId).emit('room:presence', members);
        };

        socket.on('room:join', async ({ roomId } = {}, acknowledge = () => {}) => {
            try {
                if (!roomId || !await getRoom(roomId)) return acknowledge({ error: 'Room not found, expired, or you have not joined it.' });
                socket.join(roomId);
                joinedRooms.add(roomId);
                const [state, messages] = await Promise.all([redisClient.get(stateKey(roomId)), redisClient.lRange(chatKey(roomId), -100, -1)]);
                acknowledge({ state: state ? JSON.parse(state) : null, messages: messages.map((message) => JSON.parse(message)) });
                await sendPresence(roomId);
            } catch {
                acknowledge({ error: 'Could not join the room.' });
            }
        });

        socket.on('room:code-change', async ({ roomId, code, language } = {}) => {
            if (!joinedRooms.has(roomId) || typeof code !== 'string' || code.length > 100000 || !languages.has(language)) return;
            if (Date.now() - lastCodeChangeAt < 60) return;
            lastCodeChangeAt = Date.now();
            try {
                const room = await getRoom(roomId);
                if (!room) return;
                const update = { code, language, updatedBy: socket.data.user.name, updatedAt: new Date().toISOString() };
                const ttl = Math.max(1, Math.ceil((room.expiresAt.getTime() - Date.now()) / 1000));
                await redisClient.set(stateKey(roomId), JSON.stringify(update), { EX: ttl });
                socket.to(roomId).emit('room:code-change', update);
            } catch {
                socket.emit('room:error', { message: 'Could not save the shared code. Check the Redis connection.' });
            }
        });

        socket.on('room:chat', async ({ roomId, text } = {}) => {
            if (!joinedRooms.has(roomId) || typeof text !== 'string') return;
            const content = text.trim();
            if (!content || content.length > 1000) return;
            try {
                const room = await getRoom(roomId);
                if (!room) return;
                const message = { id: `${Date.now()}-${socket.id}`, userId: socket.data.user.id, name: socket.data.user.name, text: content, createdAt: new Date().toISOString() };
                await redisClient.rPush(chatKey(roomId), JSON.stringify(message));
                await redisClient.lTrim(chatKey(roomId), -100, -1);
                await redisClient.expire(chatKey(roomId), Math.max(1, Math.ceil((room.expiresAt.getTime() - Date.now()) / 1000)));
                io.to(roomId).emit('room:chat', message);
            } catch {
                socket.emit('room:error', { message: 'Could not save the chat message.' });
            }
        });

        socket.on('disconnect', () => {
            for (const roomId of joinedRooms) sendPresence(roomId).catch(() => {});
        });
    });
}

module.exports = configureCollaborationSocket;

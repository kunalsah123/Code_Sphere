const crypto = require('crypto');
const mongoose = require('mongoose');
const CollaborationRoom = require('../models/collaborationRoom');
const Problem = require('../models/problem');
const redisClient = require('../config/redis');

const ROOM_TTL_SECONDS = 24 * 60 * 60;
const MAX_PARTICIPANTS = 3;
const stateKey = (roomId) => `collab:room:${roomId}:state`;
const chatKey = (roomId) => `collab:room:${roomId}:chat`;
const tokenHash = (token) => crypto.createHash('sha256').update(token).digest('hex');

const safeRoom = (room, currentUserId) => ({
    id: room._id.toString(),
    problemId: room.problemId.toString(),
    ownerId: room.ownerId.toString(),
    isOwner: room.ownerId.toString() === currentUserId.toString(),
    status: room.status,
    expiresAt: room.expiresAt,
    participants: (room.participants || []).map((participant) => ({
        id: participant._id?.toString?.() || participant.toString(),
        name: participant.firstName || 'CodeSphere user'
    }))
});

const createRoom = async (req, res) => {
    try {
        const { problemId, code, language } = req.body || {};
        if (!mongoose.isValidObjectId(problemId)) return res.status(400).json({ error: 'A valid problemId is required.' });
        if (typeof code !== 'string' || code.length > 100000) return res.status(400).json({ error: 'Code must be text under 100 KB.' });
        if (!['javascript', 'java', 'cpp'].includes(language)) return res.status(400).json({ error: 'Unsupported language.' });
        const problemExists = await Problem.exists({ _id: problemId });
        if (!problemExists) return res.status(404).json({ error: 'Problem not found.' });

        const inviteToken = crypto.randomBytes(32).toString('hex');
        const room = await CollaborationRoom.create({
            problemId,
            ownerId: req.result._id,
            participants: [req.result._id],
            inviteTokenHash: tokenHash(inviteToken),
            expiresAt: new Date(Date.now() + ROOM_TTL_SECONDS * 1000)
        });
        await redisClient.set(stateKey(room._id), JSON.stringify({ code, language, updatedBy: req.result.firstName }), { EX: ROOM_TTL_SECONDS });
        await redisClient.expire(chatKey(room._id), ROOM_TTL_SECONDS);

        res.status(201).json({
            room: safeRoom(room, req.result._id),
            inviteUrl: `${process.env.FRONTEND_URL || req.get('origin') || 'http://localhost:5173'}/room/${inviteToken}`
        });
    } catch (error) {
        console.error('Could not create collaboration room:', error.message);
        res.status(500).json({ error: 'Could not create a collaboration room.' });
    }
};

const joinRoom = async (req, res) => {
    try {
        const { inviteToken } = req.params;
        if (!/^[a-f\d]{64}$/i.test(inviteToken)) return res.status(404).json({ error: 'Invite link is invalid or expired.' });
        let room = await CollaborationRoom.findOne({ inviteTokenHash: tokenHash(inviteToken), status: 'active', expiresAt: { $gt: new Date() } });
        if (!room) return res.status(404).json({ error: 'Invite link is invalid or expired.' });

        const userId = req.result._id;
        const alreadyMember = room.participants.some((id) => id.toString() === userId.toString());
        if (!alreadyMember) {
            const joinedRoom = await CollaborationRoom.findOneAndUpdate({
                _id: room._id,
                status: 'active',
                expiresAt: { $gt: new Date() },
                participants: { $ne: userId },
                $expr: { $lt: [{ $size: '$participants' }, MAX_PARTICIPANTS] }
            }, { $addToSet: { participants: userId } }, { new: true });
            if (joinedRoom) {
                room = joinedRoom;
            } else {
                room = await CollaborationRoom.findById(room._id);
                if (!room || room.status !== 'active') return res.status(404).json({ error: 'Room has ended or expired.' });
                if (!room.participants.some((id) => id.toString() === userId.toString())) {
                    return res.status(409).json({ error: 'This room is full (maximum 3 members, including its creator).' });
                }
            }
        }

        const [state, messages, populatedRoom] = await Promise.all([
            redisClient.get(stateKey(room._id)),
            redisClient.lRange(chatKey(room._id), -100, -1),
            CollaborationRoom.findById(room._id).populate('participants', 'firstName')
        ]);
        res.json({ room: safeRoom(populatedRoom, userId), state: state ? JSON.parse(state) : null, messages: messages.map((message) => JSON.parse(message)) });
    } catch (error) {
        console.error('Could not join collaboration room:', error.message);
        res.status(500).json({ error: 'Could not join the collaboration room.' });
    }
};

const getRoom = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.roomId)) return res.status(400).json({ error: 'Invalid room id.' });
        const room = await CollaborationRoom.findById(req.params.roomId).populate('participants', 'firstName');
        if (!room || room.status !== 'active' || room.expiresAt <= new Date()) return res.status(404).json({ error: 'Room has ended or expired.' });
        if (!room.participants.some((participant) => participant._id.toString() === req.result._id.toString())) return res.status(403).json({ error: 'Join this room using its invite link first.' });
        const [state, messages] = await Promise.all([redisClient.get(stateKey(room._id)), redisClient.lRange(chatKey(room._id), -100, -1)]);
        res.json({ room: safeRoom(room, req.result._id), state: state ? JSON.parse(state) : null, messages: messages.map((message) => JSON.parse(message)) });
    } catch (error) {
        console.error('Could not load collaboration room:', error.message);
        res.status(500).json({ error: 'Could not load the collaboration room.' });
    }
};

const endRoom = async (req, res) => {
    try {
        const room = await CollaborationRoom.findById(req.params.roomId);
        if (!room) return res.status(404).json({ error: 'Room not found.' });
        if (room.ownerId.toString() !== req.result._id.toString()) return res.status(403).json({ error: 'Only the room creator can end this room.' });
        room.status = 'ended';
        await room.save();
        await Promise.all([redisClient.del(stateKey(room._id), chatKey(room._id))]);
        const io = req.app.get('io');
        io?.to(room._id.toString()).emit('room:ended', { message: 'The room creator ended this room.' });
        res.json({ success: true });
    } catch (error) {
        console.error('Could not end collaboration room:', error.message);
        res.status(500).json({ error: 'Could not end the collaboration room.' });
    }
};

module.exports = { createRoom, joinRoom, getRoom, endRoom, stateKey, chatKey };

const mongoose = require('mongoose');
const { Schema } = mongoose;

const collaborationRoomSchema = new Schema({
    problemId: { type: Schema.Types.ObjectId, ref: 'Problem', required: true, index: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'user', required: true },
    participants: [{ type: Schema.Types.ObjectId, ref: 'user' }],
    inviteTokenHash: { type: String, required: true, unique: true, select: false },
    status: { type: String, enum: ['active', 'ended'], default: 'active', index: true },
    expiresAt: { type: Date, required: true, expires: 0 }
}, { timestamps: true });

module.exports = mongoose.model('CollaborationRoom', collaborationRoomSchema);

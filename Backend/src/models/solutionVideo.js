const mongoose = require("mongoose");
const  {Schema} = mongoose

const videoSchema = new Schema({
    problemId: {
        type: Schema.Types.ObjectId,
        ref: 'problem',
        required: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'user',
        required: true,
    },
    cloudinaryPublicId: {
        type: String,
        required: true,
        unique: true
    },
    secureUrl: {
        type: String,
        required: true
    },
    thumbnailUrl: {
        type: String,
        required: true
    },
    duration: {
        type: Number
    }
}, {
    timestamps: true,
});

module.exports = mongoose.model('solutionVideo', videoSchema);
const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
    firstName: {
        type: String,
        required: true,
        minLength: 3,
        maxLength: 20
    },
    lastName: {
        type: String,
        minLength: 3,
        maxLength: 20
    },
    emailId: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        immutable: true,
    },
    age: {
        type: Number,
        min: 6,
        max: 100
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    problemSolved: {
        type: [{
            type: Schema.Types.ObjectId,
            ref: 'Problem',
            unique: true
        }],
    },
    password: {
        type: String,
        required: true,
    },

}, {
    timestamps: true,
});

//pre-> jo exceute hone se pehle chalta hian 
//post -> jo execute hone ke baad chaltaa hain

//yeh post waala function tbhi chalega jab findOneAndDelete rahegaw tbhi chalega (yeh mongoose ka features nahi hin yeh mongodb ka feteaure hain !!)

userSchema.post('findOneAndDelete', async function (userInfo) {
    if (userInfo) {
        await mongoose.model('submission').deleteMany({ userId: userInfo._id });
    }
});


const User = mongoose.model('user', userSchema);
module.exports = User;
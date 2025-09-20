// Cloudinary library import kar rahe hain v2 version me 
// kyunki images/videos upload & manage karne ke liye ye zaroori hai
const cloudinary = require("cloudinary").v2;

// Problem model import -> ye check karne ke liye ki jis problem ka video upload ho raha hai wo exist karti hai ya nahi
const Problem = require("../models/problem");

// User model -> agar future me user details verify karni ho to kaam aayega
const User = require("../models/user");

// SolutionVideo model -> isme video ke metadata save karenge (DB me record ke liye)
const solutionVideo = require('../models/solutionVideo')


// ================== CLOUDINARY CONFIGURATION ==================
// Cloudinary ko use karne se pehle API credentials set karna padta hai
// Ye credentials .env file me safe hote hain (security ke liye)
// Ye config ke bina hum Cloudinary ke servers ko request nahi bhej paayenge
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET
});


// ================== GENERATE UPLOAD SIGNATURE ==================
// Jab hum client side se directly Cloudinary pe video upload karna chahte hain,
// to ek secure "signature" generate karna padta hai jo server side se banega.
// Ye security ke liye hota hai taki koi random banda bina authorization ke upload na kar sake.
const generateUploadSignature = async (req, res) => {
    try {
        const { problemId } = req.params;

        const userId = req.result._id;
        // Sabse pehle check karna hoga ki problem exist karti hai ya nahi
        const problem = await Problem.findById(problemId);
        if (!problem) {
            return res.status(403).json({ error: 'Problem not Found' });
        }

        // Unique file name (public_id) generate karna
        // Ye structure hoga: leetcode-solutions/{problemId}/{userId_timestamp}
        const timestamp = Math.round(new Date().getTime() / 1000);
        const publicId = `leetcode-solutions/${problemId}/${userId}_${timestamp}`;

        // Cloudinary ko signature generate karne ke liye kuch params chahiye
        const uploadParams = {
            timestamp: timestamp,
            public_id: publicId
        };

        // Actual signature generate karna using secret key
        // Ye hi proof hai ki request trusted server se aa rahi hai
        const signature = cloudinary.utils.api_sign_request(
            uploadParams,
            process.env.CLOUD_API_SECRET
        );

        // Client ko sab details return karenge taki wo direct Cloudinary pe upload kar sake
        res.json({
            signature,
            timestamp,
            public_id: publicId,
            api_key: process.env.CLOUD_API_KEY,
            cloud_name: process.env.CLOUD_NAME,
            upload_url: `https://api.cloudinary.com/v1_1/${process.env.CLOUD_NAME}/video/upload`,
        });
    }
    catch (error) {
        console.log("Error generating upload Signature : " + error);
        res.status(500).json({
            error: 'Failed to generate upload credentials'
        });
    }
}


// ================== SAVE VIDEO METADATA ==================
// Jab video successfully Cloudinary pe upload ho jaata hai, 
// uska ek DB record banana padta hai future reference ke liye.
// Isme hum store karte hain: problemId, userId, video ka URL, duration, thumbnail, etc.
const saveVideoMetaData = async (req, res) => {
    try {
        const {
            problemId,
            cloudinaryPublicId,
            secureUrl,
            duration
        } = req.body;

        const userId = req.result._id; // req.result me authenticated user ka data hota hai

        // Step 1: Verify karna ki video Cloudinary pe actual me exist karta hai
        const cloudinaryResource = await cloudinary.api.resource(
            cloudinaryPublicId,
            { resource_type: 'video' }
        );
        if (!cloudinaryResource) {
            return res.status(400).json({ error: 'Video not found on cloudinary' });
        }

        // Step 2: Check karna ki ye video pehle se DB me save to nahi hai
        const existingVideo = await solutionVideo.findOne({
            problemId,
            userId,
            cloudinaryPublicId
        });

        // Agar video already exist karta hai to dubara save nahi karenge
        if (existingVideo) {
            return res.status(409).json({ error: 'Video already exists' });
        }

        // Step 3: Thumbnail generate karna
        // Cloudinary ka feature use karke video ka snapshot image nikal lete hain
        const thumbnailUrl = cloudinary.url(cloudinaryResource.public_id, {
            resource_type: 'video',
            transformation: [
                { width: 400, height: 255, crop: 'fill' }, // size fix karne ke liye
                { quality: 'auto' }, // auto best quality select karega
                { start_offset: 'auto' } // video ke beech ka frame lega thumbnail ke liye
            ],
            format: 'jpg'
        });

        // Step 4: DB me ek naya record banana
        const videoSolution = await solutionVideo.create({
            problemId,
            userId,
            cloudinaryPublicId,
            secureUrl,
            duration: cloudinaryResource.duration || duration, // agar Cloudinary se mila to wo use karega
            thumbnailUrl
        });


        // Response bhejna client ko
        res.status(200).json({
            message: 'Video Solution Saved Successfully !!',
            videoSolution: {
                id: videoSolution._id,
                thumbnailUrl: videoSolution.thumbnailUrl,
                duration: videoSolution.duration,
                uploadedAt: videoSolution.createdAt
            }
        });

    }
    catch (err) {
        console.log('Error saving video metadata :', err);
        res.status(500).json({ error: 'Failed to save video metadata' });
    }
};


// ================== DELETE VIDEO ==================
// Jab admin ya user video ko delete karna chahe,
// to do jagah se delete karna zaroori hai:
// 1) Cloudinary se (actual video file)
// 2) Database se (video ka record)
const deleteVideo = async (req, res) => {
    try {
        // TODO: Yaha pe logic likhna hoga
        // 1) req.params se video id / public_id lena
        const { problemId } = req.params;
        const userId = req.result._id;
        // Apne MongoDB se uska record delete karna
        const video = await solutionVideo.findOneAndDelete({problemId : problemId})
        if (!video) {
            return res.status(404).json({ error: 'Video Not Found !' })
        }
        // 2) Cloudinary ke API se us video ko delete karna
        await cloudinary.uploader.destroy(video.cloudinaryPublicId, { resource_type: 'video', invalidate: true });


        // 4) Response dena -> "Video deleted successfully"
        res.json({ message: 'video Deleted successfully' });
    }
    catch (err) {
        console.log('Error deleting Video : ', err);
        res.status(500).json({ error: 'Failed to delete the video' });
    }
};

module.exports = { generateUploadSignature, saveVideoMetaData, deleteVideo };


const express = require("express");
const adminMiddleware = require("../middleware/adminMiddleware");
const { generateUploadSignature, saveVideoMetaData, deleteVideo } = require("../controllers/videoSection");
const videoRouter = express.Router();

videoRouter.get('/create/:problemId', adminMiddleware, generateUploadSignature);
videoRouter.post('/save', adminMiddleware, saveVideoMetaData);
videoRouter.delete('/delete/:problemId', adminMiddleware, deleteVideo);

module.exports = videoRouter;
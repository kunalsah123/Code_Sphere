const express = require('express');
const userMiddleware = require('../middleware/userMiddleware');
const {submitCode , runCode} = require('../controllers/userSubmission')
const submitRouter = express.Router();

//yahaan jo id use hua hain voh problem ki id hain
submitRouter.post('/submit/:id' , userMiddleware , submitCode);
submitRouter.post('/run/:id' , userMiddleware , runCode)

module.exports = submitRouter;
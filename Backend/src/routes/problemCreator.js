const express = require('express');
const problem = require('../models/problem');
const adminMiddleware = require('../middleware/adminMiddleware');
const {createProblem , updateProblem , deleteProblem ,getProblemById , getAllProblem , solvedAllProblemByUser , submittedProblem} = require('../controllers/userProblem');
const problemRouter = express.Router();
const userMiddleware = require('../middleware/userMiddleware');




//creating the problem
problemRouter.post('/create',adminMiddleware , createProblem);
problemRouter.put('/update/:id',adminMiddleware , updateProblem);
problemRouter.delete('/delete/:id',adminMiddleware, deleteProblem);


problemRouter.get('/problemById/:id',userMiddleware , getProblemById);
problemRouter.get('/getallProblem',userMiddleware, getAllProblem);
problemRouter.get('/problemSolvedByUser',userMiddleware, solvedAllProblemByUser);
problemRouter.get('/submittedProblem/:pid', userMiddleware ,submittedProblem );

module.exports = problemRouter;
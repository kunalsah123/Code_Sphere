const Problem = require('../models/problem');
const submission = require('../models/submission');
const User = require('../models/user');
const { getlanguageById, submitBatch, submitToken } = require('../utils/problemUtility');

const solutionVideo = require('../models/solutionVideo');

const createProblem = async (req, res) => {

    console.log(req.body);
    const { title, description, difficulty, tags, visibleTestCases, hiddenTestCases, startCode, referenceSolution, problemCreator } = req.body;

    if (!title || !description || !difficulty || !tags || !visibleTestCases || !hiddenTestCases || !startCode || !referenceSolution) {
        return res.status(400).send("All fields are required");
    }

    try {
        for (const { language, completeCode } of referenceSolution) {


            //source code
            //language_id
            //stdin
            //expected_output

            const languageId = getlanguageById(language);


            //creating batch of submissions
            const submissions = visibleTestCases.map((testcase) => ({
                source_code: completeCode,
                language_id: languageId,
                stdin: testcase.input,
                expected_output: testcase.output
            }));

            //submitting the batch of submissions
            const submitresult = await submitBatch(submissions);

            //an array will get created in which a token will be present for each submission
            //we will extract the token from the result
            //eg:- tokens: 'dce7bbc5-a8c9-4159-a28f-ac264e48c371,1ed737ca-ee34-454d-a06f-bbc73836473e,9670af73-519f-4136-869c-340086d406db',
            const resultToken = submitresult.map((value) => value.token);

            //submitToken will return an array of results
            //we will check if all the results are correct or not
            //if not then we will throw an errorq
            const testResult = await submitToken(resultToken);
            console.log(testResult);
            for (const test of testResult) {
                if (test.status_id != 3) {
                    return res.status(400).send('Reference solution is not correct');
                }
            }

        }


        //we can now store the problem in the database
        await Problem.create({
            ...req.body,
            problemCreator: req.result._id
        })

        res.status(201).send("Problem Saved Successfully");


    } catch (err) {
        res.status(500).send({
            success: false,
            error: err.message || 'Server Error'
        });
        return;
    }
}

const updateProblem = async (req, res) => {
    const { id } = req.params;

    const {
        title,
        description,
        difficulty,
        tags,
        visibleTestCases,
        hiddenTestCases,
        startCode,
        referenceSolution,
        problemCreator
    } = req.body;

    if (!title || !description || !difficulty || !tags || !visibleTestCases || !hiddenTestCases || !startCode || !referenceSolution) {
        return res.status(400).send("All fields are required");
    }

    try {
        if (!id) return res.status(400).send('Missing Id !!');

        const DsaProblem = await Problem.findById(id);
        if (!DsaProblem) return res.status(400).send('Id is not present in the Database!!');

        for (const { language, completeCode } of referenceSolution) {
            const languageId = getlanguageById(language);
            if (!languageId) return res.status(400).send(`Unsupported language: ${language}`);

            const submissions = visibleTestCases.map(testcase => ({
                source_code: completeCode,
                language_id: languageId,
                stdin: testcase.input,
                expected_output: testcase.output
            }));

            const submitresult = await submitBatch(submissions);
            const resultToken = submitresult.map(value => value.token);

            const testResult = await submitToken(resultToken);
            console.log(testResult)
            for (const test of testResult) {
                if (test.status_id !== 3) {
                    return res.status(400).send("One or more test cases failed");
                }
            }
        }

        const newProblem = await Problem.findByIdAndUpdate(id, { ...req.body }, { runValidators: true, new: true });
        res.status(200).send(newProblem);

    } catch (err) {
        console.error("Update error:", err);
        res.status(500).send(err.message || "Something went wrong");
    }
}

const deleteProblem = async (req, res) => {

    //to find the id we use req.params
    const { id } = req.params;

    try {
        if (!id) {
            return res.status(400).send('Invalid Id');
        }

        const deletedProblem = await Problem.findByIdAndDelete(id);

        if (!deletedProblem) {
            return res.status(400).send("Problem is not deleted or Undefined !!");
        }

        return res.status(200).send('Problem is Succesfully Deleted !!');
    }
    catch (err) {
        res.status(500).send("Error : " + err);
    }

}

const getProblemById = async (req, res) => {

    const { id } = req.params;

    try {
        if (!id) {
            return res.status(400).send('Id is Missing !!');
        }

        //saaare data ko frontend pe bhejne ka koi zarorat nahi hian !!
        const getProblem = await Problem.findById(id).select('_id title description difficulty tags visibleTestCases startCode referenceSolution hiddenTestCases');


        if (!getProblem) {
            return res.status(400).send("Problem Not Found !!");
        }


        //video k abhi url hain usko yehi se bhej denge
        const videos = await solutionVideo.findOne({ problemId: id });
        if (videos) {
            const responseData = {
                ...getProblem.toObject(),
                secureUrl : videos.secureUrl,
                cloudinaryPublicId : videos.cloudinaryPublicId,
                thumbnailUrl : videos.thumbnailUrl,
                duration : videos.duration
            }

            return res.status(200).send(responseData);
        }

        res.status(200).send(getProblem);

    }
    catch (err) {
        return res.status(400).send('getProblem has a issue !!');
    }
}

const getAllProblem = async (req, res) => {

    try {
        const getProblem = await Problem.find({}).select('_id title difficulty tags');

        if (getProblem.length == 0) {
            return res.status(404).send("Problem is Missing !!");
        }

        res.status(200).send(getProblem)

    }
    catch (err) {
        return res.status(400).send('getProblem has a issue !!');
    }


}

const solvedAllProblemByUser = async (req, res) => {
    try {
        // const count = req.result.problemSolved.length;
        const userId = req.result._id;

        //.populate fetch karke laayiega perticular information
        const user = await User.findById(userId).populate({
            path: 'problemSolved',
            select: '_id title difficulty tags'
        });
        res.status(201).send(user.problemSolved);
    }
    catch (err) {
        return res.status(401).send(err.message);
    }
}

const submittedProblem = async (req, res) => {
    try {

        const userId = req.result._id;
        const problemId = req.params.pid;

        const answer = await submission.find({ userId, problemId });
        if (answer.length == 0) return res.status(201).send('No submission is present!')
        res.status(201).send(answer);
    } catch (err) {
        return res.status(500).send("Error : " + err);
    }
}

module.exports = { createProblem, updateProblem, deleteProblem, getProblemById, getAllProblem, solvedAllProblemByUser, submittedProblem };
const Problem = require('../models/problem');
const Submission = require('../models/submission');
const User = require('../models/user');

const getDashboard = async (req, res) => {
    try {
        const userId = req.result._id;
        const yearAgo = new Date();
        yearAgo.setUTCDate(yearAgo.getUTCDate() - 364);
        yearAgo.setUTCHours(0, 0, 0, 0);

        const [user, totalProblems, difficultyTotals, totalSubmissions, acceptedSubmissions, dailyActivity, recentRows] = await Promise.all([
            User.findById(userId).select('problemSolved').populate({ path: 'problemSolved', select: '_id title difficulty tags' }).lean(),
            Problem.countDocuments(),
            Problem.aggregate([{ $group: { _id: '$difficulty', total: { $sum: 1 } } }]),
            Submission.countDocuments({ userId }),
            Submission.countDocuments({ userId, status: 'accepted' }),
            Submission.aggregate([
                { $match: { userId, createdAt: { $gte: yearAgo } } },
                { $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'UTC' } },
                    submissions: { $sum: 1 },
                    accepted: { $sum: { $cond: [{ $eq: ['$status', 'accepted'] }, 1, 0] } }
                } },
                { $sort: { _id: 1 } }
            ]),
            Submission.find({ userId }).sort({ createdAt: -1 }).limit(8).select('problemId status runtime memory testCasesPassed testCasesTotal createdAt').lean()
        ]);

        const recentProblemIds = [...new Set(recentRows.map((row) => row.problemId.toString()))];
        const recentProblems = await Problem.find({ _id: { $in: recentProblemIds } }).select('_id title difficulty').lean();
        const problemById = new Map(recentProblems.map((problem) => [problem._id.toString(), problem]));
        const activityDays = new Set(dailyActivity.map((day) => day._id));
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        const utcDay = (date) => date.toISOString().slice(0, 10);
        let streakCursor = new Date(today);
        if (!activityDays.has(utcDay(streakCursor))) streakCursor.setUTCDate(streakCursor.getUTCDate() - 1);
        let currentStreak = 0;
        while (activityDays.has(utcDay(streakCursor))) {
            currentStreak += 1;
            streakCursor.setUTCDate(streakCursor.getUTCDate() - 1);
        }

        const solved = user?.problemSolved || [];
        const solvedByDifficulty = { easy: 0, medium: 0, hard: 0 };
        for (const problem of solved) {
            const difficulty = problem?.difficulty?.toLowerCase();
            if (difficulty in solvedByDifficulty) solvedByDifficulty[difficulty] += 1;
        }

        res.json({
            summary: {
                problemsSolved: solved.length,
                totalProblems,
                acceptanceRate: totalSubmissions ? Math.round((acceptedSubmissions / totalSubmissions) * 100) : 0,
                acceptedSubmissions,
                totalSubmissions,
                currentStreak,
                activeDays: activityDays.size
            },
            difficulty: Object.fromEntries(['easy', 'medium', 'hard'].map((name) => [name, {
                solved: solvedByDifficulty[name],
                total: difficultyTotals.find((entry) => entry._id?.toLowerCase() === name)?.total || 0
            }])),
            activity: dailyActivity.map((day) => ({ date: day._id, submissions: day.submissions, accepted: day.accepted })),
            recentSubmissions: recentRows.map((row) => ({
                ...row,
                problem: problemById.get(row.problemId.toString()) || { title: 'Deleted problem', difficulty: 'unknown' }
            }))
        });
    } catch (error) {
        console.error('Could not load user dashboard:', error.message);
        res.status(500).json({ error: 'Could not load dashboard data.' });
    }
};

module.exports = { getDashboard };

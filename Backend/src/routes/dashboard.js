const express = require('express');
const userMiddleware = require('../middleware/userMiddleware');
const { getDashboard } = require('../controllers/userDashboard');

const router = express.Router();
router.get('/me', userMiddleware, getDashboard);

module.exports = router;

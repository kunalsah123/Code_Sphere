const express = require('express');
const userMiddleware = require('../middleware/userMiddleware');
const { createRoom, joinRoom, getRoom, endRoom } = require('../controllers/collaboration');

const router = express.Router();
router.use(userMiddleware);
router.post('/rooms', createRoom);
router.post('/rooms/invite/:inviteToken/join', joinRoom);
router.get('/rooms/:roomId', getRoom);
router.delete('/rooms/:roomId', endRoom);

module.exports = router;

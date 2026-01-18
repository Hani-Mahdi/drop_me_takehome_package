import express from 'express';
import users from '../logic/users.js';
import helpers from '../logic/helpers.js';

const router = express.Router();

router.post('/register', users.registrationRules, helpers.validate, users.registerUser);
router.post('/identify', users.identifyRules, helpers.validate, users.identifyUser);
router.get('/leaderboard', users.handleGetLeaderboard);
router.get('/:userId', users.userIdRules, helpers.validate, users.getUserById);

export default router;

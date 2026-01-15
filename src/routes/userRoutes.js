const express = require('express');
const router = express.Router();
const users = require('../logic/users');
const helpers = require('../logic/helpers');

router.post('/register', users.registrationRules, helpers.validate, users.registerUser);
router.post('/identify', users.identifyRules, helpers.validate, users.identifyUser);
router.get('/leaderboard', users.handleGetLeaderboard);
router.get('/:userId', users.userIdRules, helpers.validate, users.getUserById);

module.exports = router;

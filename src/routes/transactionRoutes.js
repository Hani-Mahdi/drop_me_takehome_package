const express = require('express');
const router = express.Router();
const transactions = require('../logic/transactions');
const users = require('../logic/users');
const helpers = require('../logic/helpers');

router.get('/points-config', transactions.handleGetPointsConfig);
router.post('/recycle', transactions.recycleRules, helpers.validate, transactions.checkDuplicateScan, transactions.checkRapidScanning, transactions.handleRecycle);
router.get('/user/:userId', users.userIdRules, transactions.paginationRules, helpers.validate, transactions.handleGetUserTransactions);
router.get('/:transactionId', transactions.transactionIdRules, helpers.validate, transactions.handleGetTransaction);

module.exports = router;

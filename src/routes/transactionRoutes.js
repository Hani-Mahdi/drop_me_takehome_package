import express from 'express';
import transactions from '../logic/transactions.js';
import users from '../logic/users.js';
import helpers from '../logic/helpers.js';

const router = express.Router();

router.get('/points-config', transactions.handleGetPointsConfig);
router.post('/recycle', transactions.recycleRules, helpers.validate, transactions.checkDuplicateScan, transactions.checkRapidScanning, transactions.handleRecycle);
router.get('/user/:userId', users.userIdRules, transactions.paginationRules, helpers.validate, transactions.handleGetUserTransactions);
router.get('/:transactionId', transactions.transactionIdRules, helpers.validate, transactions.handleGetTransaction);

export default router;

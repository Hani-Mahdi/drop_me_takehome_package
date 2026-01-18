import db from '../database/index.js';
import { v4 as uuid } from 'uuid';
import users from './users.js';
import expressValidator from 'express-validator';

const POINTS = { plastic_bottle: 10, aluminum_can: 15, glass_bottle: 20 };
const MIN_SCAN_INTERVAL = 5;

function createTransaction(userId, itemType, itemBarcode, machineId) {
  const id = uuid();
  const now = new Date().toISOString();
  
  let pointsEarned = 0;
  if (itemType === 'plastic_bottle') { pointsEarned = POINTS.plastic_bottle; }
  else if (itemType === 'aluminum_can') { pointsEarned = POINTS.aluminum_can; }
  else if (itemType === 'glass_bottle') { pointsEarned = POINTS.glass_bottle; }
  
  if (itemBarcode === undefined) { itemBarcode = null; }
  
  const sql = 'INSERT INTO transactions (id, user_id, item_type, item_barcode, points_earned, machine_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)';
  db.run(sql, [id, userId, itemType, itemBarcode, pointsEarned, machineId, now]);
  return findTransactionById(id);
}

function findTransactionById(id) {
  const sql = 'SELECT * FROM transactions WHERE id = ?';
  return db.getOne(sql, [id]);
}

function findTransactionsByUserId(userId, limit, offset) {
  if (limit == null) { limit = 50; }
  if (offset == null) { offset = 0; }
  const sql = 'SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?';
  return db.getAll(sql, [userId, limit, offset]);
}

function findTransactionByBarcode(barcode) {
  const sql = 'SELECT * FROM transactions WHERE item_barcode = ? ORDER BY created_at DESC LIMIT 1';
  return db.getOne(sql, [barcode]);
}

function getLastTransactionByUser(userId) {
  const sql = 'SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1';
  return db.getOne(sql, [userId]);
}

function handleRecycle(req, res, next) {
  const userId = req.body.userId;
  const itemType = req.body.itemType;
  let itemBarcode = req.body.itemBarcode;
  const machineId = req.body.machineId;
  
  const user = users.findUserById(userId);
  if (user === null) {
    res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } });
    return;
  }
  
  const transaction = createTransaction(userId, itemType, itemBarcode, machineId);
  const updatedUser = users.updateUserPoints(userId, transaction.points_earned);
  
  res.status(201).json({
    success: true,
    message: 'Recycling transaction completed successfully',
    data: {
      transaction: {
        id: transaction.id,
        itemType: transaction.item_type,
        itemBarcode: transaction.item_barcode,
        pointsEarned: transaction.points_earned,
        machineId: transaction.machine_id,
        createdAt: transaction.created_at
      },
      user: { id: updatedUser.id, name: updatedUser.name, totalPoints: updatedUser.total_points }
    }
  });
}

function handleGetUserTransactions(req, res, next) {
  const userId = req.params.userId;
  let limit = 50;
  let offset = 0;
  if (req.query.limit != null) { limit = parseInt(req.query.limit); }
  if (req.query.offset != null) { offset = parseInt(req.query.offset); }
  
  const user = users.findUserById(userId);
  if (user === null) {
    res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } });
    return;
  }
  
  const transactions = findTransactionsByUserId(userId, limit, offset);
  const formattedTransactions = [];
  for (let i = 0; i < transactions.length; i++) {
    const t = transactions[i];
    formattedTransactions.push({
      id: t.id, itemType: t.item_type, itemBarcode: t.item_barcode,
      pointsEarned: t.points_earned, machineId: t.machine_id, createdAt: t.created_at
    });
  }
  
  res.status(200).json({
    success: true,
    data: {
      user: { id: user.id, name: user.name, totalPoints: user.total_points },
      transactions: formattedTransactions,
      pagination: { limit: limit, offset: offset, count: formattedTransactions.length }
    }
  });
}

function handleGetTransaction(req, res, next) {
  const transactionId = req.params.transactionId;
  const transaction = findTransactionById(transactionId);
  
  if (transaction === null) {
    res.status(404).json({ success: false, error: { code: 'TRANSACTION_NOT_FOUND', message: 'Transaction not found' } });
    return;
  }
  
  res.status(200).json({
    success: true,
    data: {
      id: transaction.id, userId: transaction.user_id, itemType: transaction.item_type,
      itemBarcode: transaction.item_barcode, pointsEarned: transaction.points_earned,
      machineId: transaction.machine_id, createdAt: transaction.created_at
    }
  });
}

function handleGetPointsConfig(req, res, next) {
  res.status(200).json({
    success: true,
    data: { pointsPerItem: { plastic_bottle: POINTS.plastic_bottle, aluminum_can: POINTS.aluminum_can, glass_bottle: POINTS.glass_bottle } }
  });
}

function checkDuplicateScan(req, res, next) {
  const itemBarcode = req.body.itemBarcode;
  if (itemBarcode == null || itemBarcode === undefined || itemBarcode === '') { next(); return; }

  const existingTransaction = findTransactionByBarcode(itemBarcode);
  if (existingTransaction !== null) {
    res.status(409).json({ success: false, error: { code: 'DUPLICATE_SCAN', message: 'This item has already been recycled on ' + existingTransaction.created_at } });
    return;
  }
  next();
}

function checkRapidScanning(req, res, next) {
  const userId = req.body.userId;
  if (userId == null || userId === undefined) { next(); return; }

  const lastTransaction = getLastTransactionByUser(userId);
  if (lastTransaction === null) { next(); return; }
  
  const lastScanTime = new Date(lastTransaction.created_at);
  const currentTime = new Date();
  const timeDifferenceSeconds = (currentTime.getTime() - lastScanTime.getTime()) / 1000;
  
  if (timeDifferenceSeconds < MIN_SCAN_INTERVAL) {
    const waitTime = Math.ceil(MIN_SCAN_INTERVAL - timeDifferenceSeconds);
    res.status(429).json({ success: false, error: { code: 'RAPID_SCANNING', message: 'Please wait ' + waitTime + ' seconds before scanning another item' } });
    return;
  }
  next();
}

const recycleRules = [
  expressValidator.body('userId').notEmpty().withMessage('User ID is required').isUUID().withMessage('Invalid user ID format'),
  expressValidator.body('itemType').notEmpty().withMessage('Item type is required').isIn(['plastic_bottle', 'aluminum_can', 'glass_bottle']).withMessage('Item type must be one of: plastic_bottle, aluminum_can, glass_bottle'),
  expressValidator.body('itemBarcode').optional().isString().withMessage('Barcode must be a string').isLength({ min: 8, max: 50 }).withMessage('Barcode must be between 8 and 50 characters'),
  expressValidator.body('machineId').notEmpty().withMessage('Machine ID is required').isString().withMessage('Machine ID must be a string')
];

const transactionIdRules = [
  expressValidator.param('transactionId').isUUID().withMessage('Invalid transaction ID format')
];

const paginationRules = [
  expressValidator.query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  expressValidator.query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be a non-negative integer')
];

export default {
  createTransaction: createTransaction,
  findTransactionById: findTransactionById,
  findTransactionsByUserId: findTransactionsByUserId,
  findTransactionByBarcode: findTransactionByBarcode,
  getLastTransactionByUser: getLastTransactionByUser,
  handleRecycle: handleRecycle,
  handleGetUserTransactions: handleGetUserTransactions,
  handleGetTransaction: handleGetTransaction,
  handleGetPointsConfig: handleGetPointsConfig,
  checkDuplicateScan: checkDuplicateScan,
  checkRapidScanning: checkRapidScanning,
  recycleRules: recycleRules,
  transactionIdRules: transactionIdRules,
  paginationRules: paginationRules
};

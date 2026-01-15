const db = require('../database');
const uuid = require('uuid');
const expressValidator = require('express-validator');

function createUser(phoneNumber, name) {
  const id = uuid.v4();
  const now = new Date().toISOString();
  const sql = 'INSERT INTO users (id, phone_number, name, total_points, created_at, updated_at) VALUES (?, ?, ?, 0, ?, ?)';
  db.run(sql, [id, phoneNumber, name, now, now]);
  const newUser = findUserById(id);
  return newUser;
}

function findUserById(id) {
  const sql = 'SELECT * FROM users WHERE id = ?';
  const user = db.getOne(sql, [id]);
  return user;
}

function findUserByPhoneNumber(phoneNumber) {
  const sql = 'SELECT * FROM users WHERE phone_number = ?';
  const user = db.getOne(sql, [phoneNumber]);
  return user;
}

function updateUserPoints(id, pointsToAdd) {
  const now = new Date().toISOString();
  const sql = 'UPDATE users SET total_points = total_points + ?, updated_at = ? WHERE id = ?';
  db.run(sql, [pointsToAdd, now, id]);
  const updatedUser = findUserById(id);
  return updatedUser;
}

function getLeaderboard(limit) {
  if (limit == null) { limit = 10; }
  const sql = 'SELECT id, name, total_points, created_at FROM users ORDER BY total_points DESC LIMIT ?';
  const usersList = db.getAll(sql, [limit]);
  return usersList;
}

function registerUser(req, res, next) {
  const phoneNumber = req.body.phoneNumber;
  const name = req.body.name;
  const existingUser = findUserByPhoneNumber(phoneNumber);
  
  if (existingUser !== null) {
    res.status(409).json({
      success: false,
      error: { code: 'USER_EXISTS', message: 'User with this phone number already exists' }
    });
    return;
  }
  
  const newUser = createUser(phoneNumber, name);
  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      id: newUser.id,
      phoneNumber: newUser.phone_number,
      name: newUser.name,
      totalPoints: newUser.total_points,
      createdAt: newUser.created_at
    }
  });
}

function identifyUser(req, res, next) {
  const phoneNumber = req.body.phoneNumber;
  const user = findUserByPhoneNumber(phoneNumber);
  
  if (user === null) {
    res.status(404).json({
      success: false,
      error: { code: 'USER_NOT_FOUND', message: 'User not found' }
    });
    return;
  }
  
  res.status(200).json({
    success: true,
    data: {
      id: user.id,
      phoneNumber: user.phone_number,
      name: user.name,
      totalPoints: user.total_points,
      createdAt: user.created_at
    }
  });
}

function getUserById(req, res, next) {
  const userId = req.params.userId;
  const user = findUserById(userId);
  
  if (user === null) {
    res.status(404).json({
      success: false,
      error: { code: 'USER_NOT_FOUND', message: 'User not found' }
    });
    return;
  }
  
  res.status(200).json({
    success: true,
    data: {
      id: user.id,
      phoneNumber: user.phone_number,
      name: user.name,
      totalPoints: user.total_points,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    }
  });
}

function handleGetLeaderboard(req, res, next) {
  let limit = 10;
  if (req.query.limit != null) { limit = parseInt(req.query.limit); }
  
  const leaderboard = getLeaderboard(limit);
  const formattedLeaderboard = [];
  
  for (let i = 0; i < leaderboard.length; i++) {
    const user = leaderboard[i];
    formattedLeaderboard.push({
      rank: i + 1,
      id: user.id,
      name: user.name,
      totalPoints: user.total_points
    });
  }
  
  res.status(200).json({ success: true, data: formattedLeaderboard });
}

const registrationRules = [
  expressValidator.body('phoneNumber')
    .notEmpty().withMessage('Phone number is required')
    .matches(/^\+?[1-9]\d{7,14}$/).withMessage('Invalid phone number format'),
  expressValidator.body('name')
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters')
];

const identifyRules = [
  expressValidator.body('phoneNumber').notEmpty().withMessage('Phone number is required')
];

const userIdRules = [
  expressValidator.param('userId').isUUID().withMessage('Invalid user ID format')
];

module.exports = {
  createUser: createUser,
  findUserById: findUserById,
  findUserByPhoneNumber: findUserByPhoneNumber,
  updateUserPoints: updateUserPoints,
  getLeaderboard: getLeaderboard,
  registerUser: registerUser,
  identifyUser: identifyUser,
  getUserById: getUserById,
  handleGetLeaderboard: handleGetLeaderboard,
  registrationRules: registrationRules,
  identifyRules: identifyRules,
  userIdRules: userIdRules
};

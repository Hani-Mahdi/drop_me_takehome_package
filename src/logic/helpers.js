const expressValidator = require('express-validator');

function validate(req, res, next) {
  const errors = expressValidator.validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorArray = errors.array();
    const errorMessages = [];
    for (let i = 0; i < errorArray.length; i++) {
      errorMessages.push({ field: errorArray[i].path, message: errorArray[i].msg });
    }
    res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input data', details: errorMessages } });
    return;
  }
  next();
}

function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let errorCode = err.errorCode || 'INTERNAL_ERROR';
  let errorMessage = (err.message && err.message !== '') ? err.message : 'An unexpected error occurred';
  
  console.log('[' + new Date().toISOString() + '] ERROR: ' + errorCode + ' - ' + errorMessage);
  res.status(statusCode).json({ success: false, error: { code: errorCode, message: errorMessage } });
}

function notFoundHandler(req, res, next) {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Route ' + req.originalUrl + ' not found' } });
}

module.exports = { validate: validate, errorHandler: errorHandler, notFoundHandler: notFoundHandler };

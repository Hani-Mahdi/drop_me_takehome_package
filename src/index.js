const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const db = require('./database');
const helpers = require('./logic/helpers');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

const limiter = rateLimit({
  windowMs: 60000,
  max: 100,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later'
    }
  }
});
app.use(limiter);

app.get('/', function(req, res) {
  res.status(200).json({
    success: true,
    message: 'Welcome to Drop Me Recycling API',
    endpoints: {
      health: '/api/health',
      users: '/api/users',
      transactions: '/api/transactions'
    }
  });
});

app.get('/api/health', function(req, res) {
  res.status(200).json({
    success: true,
    message: 'Drop Me Recycling API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

db.init().then(function() {
  const userRoutes = require('./routes/userRoutes');
  const transactionRoutes = require('./routes/transactionRoutes');
  
  app.use('/api/users', userRoutes);
  app.use('/api/transactions', transactionRoutes);
  app.use(helpers.notFoundHandler);
  app.use(helpers.errorHandler);

  const PORT = 3000;
  app.listen(PORT, function() {
    console.log('Drop Me API server running on port ' + PORT);
    console.log('Health check: http://localhost:' + PORT + '/api/health');
  });
}).catch(function(error) {
  console.log('Failed to initialize database:', error);
  process.exit(1);
});

module.exports = app;

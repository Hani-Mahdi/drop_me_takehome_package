import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import db from './database/index.js';
import helpers from './logic/helpers.js';

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

db.init().then(async () => {
  const userRoutes = await import('./routes/userRoutes.js');
  const transactionRoutes = await import('./routes/transactionRoutes.js');
  
  app.use('/api/users', userRoutes.default);
  app.use('/api/transactions', transactionRoutes.default);
  app.use(helpers.notFoundHandler);
  app.use(helpers.errorHandler);

  const PORT = 8080;
  app.listen(PORT, () => {
    console.log('Drop Me API server running on port ' + PORT);
    console.log('Health check: http://localhost:' + PORT + '/api/health');
  });
}).catch(error => {
  console.log('Failed to initialize database:', error);
  process.exit(1);
});

export default app;

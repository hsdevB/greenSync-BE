import express from 'express';
import dotenv from 'dotenv';
import models from './models/index.js';
import Logger from './utils/logger.js';
import mqttClient from './mqtt/mqttClient.js';
import WeatherCron from './utils/WeatherCron.js';

// Routes
import Router from './routes/index.js';

dotenv.config();

const weatherCron = new WeatherCron();
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/', Router);

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'GreenSync API Server is running!',
    timestamp: new Date().toISOString()
  });
});

// Error Handler
app.use((err, req, res, next) => {
  Logger.error(`Error: ${err.message}`);
  res.status(500).json({
    success: false,
    message: err.message
  });
});

// 404 Handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

models.sequelize.authenticate()
  .then(() => {
    Logger.info('데이터베이스 연결 성공');
    return models.sequelize.sync({ alter : true });
  })
  .then(() => {
    
    app.listen(PORT, () => {
      Logger.info(`🚀 GreenSync API Server started on port ${PORT}`);  
      setTimeout(() => weatherCron.start(), 2000); // 자동 시작!
    });
  })
  .catch((err) => {
    Logger.error(`서버 시작 실패: ${err.message}`);
  })

export default app;
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

// Static file serving
// app.use('/images', express.static('public/images'));
// app.use('/uploads', express.static('public/uploads'));

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
  
  // 이미 응답이 전송되었는지 확인
  if (res.headersSent) {
    return next(err);
  }
  
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
    return models.sequelize.sync();
  })
  .then(() => {
    app.listen(PORT, () => {
      Logger.info(`🚀 GreenSync API Server started on port ${PORT}`);  
      
      // 크론 작업을 안전하게 시작
      setTimeout(() => {
        try {
          weatherCron.start();
          Logger.info('WeatherCron 작업이 성공적으로 시작되었습니다.');
        } catch (error) {
          Logger.error('WeatherCron 시작 실패: ' + error.message);
        }
      }, 5000); // 5초 후 시작하여 서버가 완전히 준비된 후 실행
    });
  })
  .catch((err) => {
    Logger.error(`서버 시작 실패: ${err.message}`);
  })

export default app;
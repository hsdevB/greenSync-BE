import express from 'express';
import dotenv from 'dotenv';
import models from './models/index.js';
import logger from './utils/logger.js';
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
  logger.error(`Error: ${err.message}`);
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

// 개발 환경에서 테이블 생성/수정을 위한 sync 옵션 (GitHub 버전에서 가져온 부분)
// const syncOptions = {
//   force: false,  // true로 설정하면 기존 테이블을 삭제하고 재생성 (주의!)
//   alter: process.env.NODE_ENV === 'development'  // 개발환경에서만 테이블 구조 변경
// };

// 데이터베이스 연결 및 서버 시작
// const startServer = async () => {
//   try {
//     // 데이터베이스 연결 테스트
//     await sequelize.authenticate();
//     logger.info('데이터베이스 연결 성공');
    
//     // 테이블 동기화 (GitHub 버전의 방식 적용)
//     // if (process.env.NODE_ENV === 'development') {
//     //   await sequelize.sync(syncOptions);
//     //   logger.info('데이터베이스 테이블 동기화 완료');
      
//     //   // 생성된 테이블 목록 확인 (GitHub 버전에서 가져온 기능)
//     //   const tableNames = await sequelize.getQueryInterface().showAllTables();
//     //   logger.info(`생성된 테이블 목록: ${tableNames.join(', ')}`);
//     // }
    
//     // 서버 시작
//     app.listen(PORT, () => {
//       logger.info(`🚀 GreenSync API Server started on port ${PORT}`);
//       logger.info(`📖 Health Check: http://localhost:${PORT}/health`);
//     });
    
//   } catch (err) {
//     logger.error(`서버 시작 실패: ${err.message}`);
//     process.exit(1);
//   }
// };

// startServer();

models.sequelize.authenticate()
  .then(() => {
    logger.info('데이터베이스 연결 성공');
    return models.sequelize.sync({ alter : true });
  })
  .then(() => {
    app.listen(PORT, () => {
      logger.info(`🚀 GreenSync API Server started on port ${PORT}`);  
      setTimeout(() => weatherCron.start(), 2000); // 자동 시작!
    });
  })
  .catch((err) => {
    logger.error(`서버 시작 실패: ${err.message}`);
  })

export default app;
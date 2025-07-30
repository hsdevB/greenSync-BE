import express from 'express';
import chartService from '../services/chartService.js';
import Logger from '../utils/logger.js';

const chartRouter = express.Router();


chartRouter.get('/temperature/daily/:farmCode', async (req, res) => {
  try {
    const { farmCode } = req.params;
    
    if (!farmCode || typeof farmCode !== 'string' || farmCode.trim() === '') {
      Logger.error('chartRouter.temperature.daily: 농장 코드 파라미터가 누락되었습니다.'); 
      return res.status(400).json({
        success: false,
        message: '유효한 농장 코드가 필요합니다.' 
      });
    }

    const chartData = await chartService.getTemperatureChartData(farmCode);
    
    res.status(200).json({
      success: true,
      message: '온도 차트 데이터 조회 성공', 
      data: chartData 
    });
  } catch (error) {
    Logger.error(`chartRouter.temperature.daily: 온도 차트 데이터 조회 실패 - 농장코드: ${req.params?.farmCode}, 에러: ${error.message}`); 
    res.status(500).json({
      success: false,
      message: '온도 차트 데이터 조회에 실패했습니다.',
      error: error.message // 디버깅용
    });
  }
});

chartRouter.get('/humidity/daily/:farmCode', async (req, res) => {
  try {
    const { farmCode } = req.params;
    
    if (!farmCode || typeof farmCode !== 'string' || farmCode.trim() === '') {
      Logger.error('chartRouter.humidity.daily: 농장 코드 파라미터가 누락되었습니다.'); 
      return res.status(400).json({
        success: false,
        message: '유효한 농장 코드가 필요합니다.' 
      });
    }

    const chartData = await chartService.getHumidityChartData(farmCode);
    
    res.status(200).json({
      success: true,
      message: '습도 차트 데이터 조회 성공', 
      data: chartData 
    });
  } catch (error) {
    Logger.error(`chartRouter.humidity.daily: 습도 차트 데이터 조회 실패 - 농장코드: ${req.params?.farmCode}, 에러: ${error.message}`); 
    res.status(500).json({
      success: false,
      message: '습도 차트 데이터 조회에 실패했습니다.',
      error: error.message
    });
  }
});

chartRouter.get('/combined/daily/:farmCode', async (req, res) => {
  try {
    const { farmCode } = req.params;

    if (!farmCode || typeof farmCode !== 'string' || farmCode.trim() === '') {
      Logger.error('chartRouter.combined.daily: 농장 코드 파라미터가 누락되었습니다.'); 
      return res.status(400).json({
        success: false,
        message: '유효한 농장 코드가 필요합니다.' 
      });
    }

    const chartData = await chartService.getCombinedChartData(farmCode);
    
    res.status(200).json({
      success: true,
      message: '통합 차트 데이터 조회 성공', 
      data: chartData 
    });
    
  } catch (error) {
    Logger.error(`chartRouter.combined.daily: 통합 차트 데이터 조회 실패 - 농장코드: ${req.params?.farmCode}, 에러: ${error.message}`); 
    res.status(500).json({
      success: false,
      message: '통합 차트 데이터 조회에 실패했습니다.',
      error: error.message
    });
  }
});

chartRouter.get('/combined/daily/:farmCode/:date', async (req, res) => {
  try {
    const { farmCode, date } = req.params;

    if (!farmCode || typeof farmCode !== 'string' || farmCode.trim() === '') {
      Logger.error('chartRouter.combined.daily: 농장 코드 파라미터가 누락되었습니다.'); 
      return res.status(400).json({
        success: false,
        message: '유효한 농장 코드가 필요합니다.' 
      });
    }

    const dateRegex = /^\d{8}$/; 
    if (!dateRegex.test(date)) {
      Logger.error(`chartRouter.combined.daily: 잘못된 날짜 형식 - ${date}`); 
      return res.status(400).json({
        success: false,
        message: '날짜는 YYYYMMDD 형태여야 합니다.' 
      });
    }

    const chartData = await chartService.getCombinedChartData(farmCode, date);
    
    res.status(200).json({
      success: true,
      message: '통합 차트 데이터 조회 성공', 
      data: chartData 
    });
    
  } catch (error) {
    Logger.error(`chartRouter.combined.daily: 통합 차트 데이터 조회 실패 - 농장코드: ${req.params?.farmCode}, 에러: ${error.message}`); 
    res.status(500).json({
      success: false,
      message: '통합 차트 데이터 조회에 실패했습니다.',
      error: error.message
    });
  }
});

export default chartRouter;
import express from 'express';
import WeatherService from '../services/weatherService.js';
import WeatherDao from '../dao/weatherDao.js';
import Logger from '../utils/logger.js';

const weatherRouter = express.Router();

weatherRouter.get('/mapped', async (req, res) => {
  try {
    const result = await WeatherService.getMappedWeatherData('서울');
    
    if (result.success && result.data) {
      
      const { ...dataToSave } = result.data;
      await WeatherDao.saveWeatherData({
        ...dataToSave,
        isDay: dataToSave.isDay,
        isRain: dataToSave.isRain,
      });
    }

    res.status(200).json({
      success: true,
      message: '서울 날씨 데이터 조회 및 저장 성공',
      data: result.data,
      requestTime: result.requestTime
    });
    
  } catch (err) {
    Logger.error('weatherRouter.mapped: 서울 날씨 데이터 조회 실패 - 에러: ' + err.message);
    res.status(500).json({
      success: false,
      message: '서울 날씨 데이터 조회에 실패했습니다.'
    });
  }
});

weatherRouter.get('/auto-collect', async (req, res) => {
  try {    
    const result = await WeatherService.getMappedWeatherData('서울');
    
    if (result.success && result.data) {
      
      const { ...dataToSave } = result.data;
      await WeatherDao.saveWeatherData({
        ...dataToSave,
        isDay: dataToSave.isDay,
        isRain: dataToSave.isRain,
      });
    }

    res.json({ 
      success: true, 
      message: '서울 날씨 자동 수집 완료', 
      data: result.data,
      timestamp: new Date().toLocaleString('ko-KR')
    });
  } catch (err) {
    Logger.error('weatherRouter.autoCollect: 서울 날씨 자동 수집 실패 - 에러: ' + err.message);
    res.status(500).json({ 
      success: false, 
      message: '서울 날씨 자동 수집에 실패했습니다.'
    });
  }
});

export default weatherRouter;
import express from 'express';
import WeatherService from '../services/weatherService.js';
import WeatherDao from '../dao/weatherDao.js';
import logger from '../utils/logger.js';

const weatherRouter = express.Router();

weatherRouter.get('/city/:cityName', async (req, res) => {
  try {
    const { cityName } = req.params;
    
    const result = await WeatherService.getCityWeatherData(cityName);
    
    const { data, ...restResult } = result;
    const { main, sys, ...restData } = data.data;
    
    res.status(200).json({
      success: true,
      message: `${cityName} OpenWeatherMap 데이터 조회 성공`,
      data: {
        ...restResult,
        data: {
          ...restData,
        }
      }
    });
    
  } catch (err) {
    logger.error(`city weather API 오류: ${err.message}`);
    res.status(500).json({
      success: false,
      message: err.message,
      supportedCities: Object.keys(WeatherService.getKoreaCities())
    });
  }
});

weatherRouter.get('/mapped', async (req, res) => {
  try {
    const farmId = req.query.farmId || 1;
    
    console.log(`🌤️ 서울 날씨 데이터 조회 시작 (farmId: ${farmId})`);

    const result = await WeatherService.getMappedWeatherData('서울', farmId);
    
    if (result.success && result.data) {
      console.log('📊 서울 날씨 데이터 DB 저장 중...');
      
      const { cityName, ...dataToSave } = result.data;
      await WeatherDao.saveWeatherData({
        ...dataToSave,
        isDay: dataToSave.isDay,
        isRain: dataToSave.isRain,
        farmId: farmId
      });
      
      console.log(`✅ 서울 날씨 데이터 저장 완료: 온도 ${dataToSave.outsideTemp}°C`);
    }

    res.status(200).json({
      success: true,
      message: '서울 날씨 데이터 조회 및 저장 성공',
      data: result.data,
      requestTime: result.requestTime
    });
    
  } catch (err) {
    logger.error(`mapped weather API 오류: ${err.message}`);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

weatherRouter.get('/mapped/:cityName', async (req, res) => {
  try {
    const { cityName } = req.params;
    const farmId = req.query.farmId || 1;
    
    console.log(`🌤️ ${cityName} 날씨 데이터 조회 시작 (farmId: ${farmId})`);
    
    const result = await WeatherService.getMappedWeatherData(cityName, farmId);

    if (result.success && result.data) {
      console.log(`📊 ${cityName} 날씨 데이터 DB 저장 중...`);
      
      const { cityName: responseCityName, ...dataToSave } = result.data;
      await WeatherDao.saveWeatherData({
        ...dataToSave,
        isDay: dataToSave.isDay,
        isRain: dataToSave.isRain,
        farmId: farmId
      });
      
      console.log(`✅ ${cityName} 날씨 데이터 저장 완료: 온도 ${dataToSave.outsideTemp}°C`);
    }
    
    res.status(200).json({
      success: true,
      message: `${cityName} 테이블 매칭 데이터 조회 성공`,
      data: result.data,
      requestTime: result.requestTime
    });
    
  } catch (err) {
    logger.error(`mapped/:cityName weather API 오류: ${err.message}`);
    res.status(500).json({
      success: false,
      message: err.message,
      supportedCities: Object.keys(WeatherService.getKoreaCities())
    });
  }
});

weatherRouter.get('/auto-collect', async (req, res) => {
  try {
    const farmId = req.query.farmId || 1;
    
    console.log(`🤖 자동 수집: 서울 날씨 데이터 조회 시작 (farmId: ${farmId})`);
    
    const result = await WeatherService.getMappedWeatherData('서울', farmId);
    
    if (result.success && result.data) {
      console.log('📊 자동 수집: 서울 날씨 데이터 DB 저장 중...');
      
      const { cityName, ...dataToSave } = result.data;
      await WeatherDao.saveWeatherData({
        ...dataToSave,
        isDay: dataToSave.isDay,
        isRain: dataToSave.isRain,
        farmId: farmId
      });
      
      console.log(`✅ 자동 수집: 서울 날씨 저장 완료 - 온도: ${dataToSave.outsideTemp}°C, 일사량: ${dataToSave.insolation}`);
    }

    res.json({ 
      success: true, 
      message: '서울 날씨 자동 수집 완료', 
      data: result.data,
      timestamp: new Date().toLocaleString('ko-KR')
    });
  } catch (err) {
    console.log(`❌ 자동 수집 실패: ${err.message}`);
    res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
});

export default weatherRouter;
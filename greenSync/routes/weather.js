import express from 'express';
import WeatherService from '../services/weatherService.js';
import WeatherDao from '../dao/weatherDao.js';
import logger from '../utils/logger.js';

const weatherRouter = express.Router();

weatherRouter.get('/city/:cityName', async (req, res) => {
  try {
    const { cityName } = req.params;
    
    if (!cityName || typeof cityName !== 'string' || cityName.trim() === '') {
      logger.error('weatherRouter.city: 도시명이 제공되지 않았습니다.');
      return res.status(400).json({
        success: false,
        message: '도시명이 필요합니다.'
      });
    }

    const cities = WeatherService.getKoreaCities();
    if (!cities[cityName]) {
      logger.error(`weatherRouter.city: 지원하지 않는 도시 - cityName: ${cityName}`);
      return res.status(400).json({
        success: false,
        message: `지원하지 않는 도시입니다. 지원 도시: ${Object.keys(cities).join(', ')}`
      });
    }
    
    logger.info(`weatherRouter.city: 도시 날씨 데이터 조회 시작 - cityName: ${cityName}`);
    const result = await WeatherService.getCityWeatherData(cityName);
    
    const { data, ...restResult } = result;
    const { main, sys, ...restData } = data.data;
    
    logger.info(`weatherRouter.city: 도시 날씨 데이터 조회 완료 - cityName: ${cityName}`);
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
    logger.error(`weatherRouter.city: 도시 날씨 데이터 조회 실패 - cityName: ${req.params.cityName}, 에러: ${err.message}`);
    res.status(500).json({
      success: false,
      message: '도시 날씨 데이터 조회에 실패했습니다.',
      supportedCities: Object.keys(WeatherService.getKoreaCities())
    });
  }
});

weatherRouter.get('/mapped', async (req, res) => {
  try {
    const farmId = req.query.farmId || 1;
    
    if (farmId && (isNaN(farmId) || parseInt(farmId) <= 0)) {
      logger.error(`weatherRouter.mapped: 유효하지 않은 농장ID - farmId: ${farmId}`);
      return res.status(400).json({
        success: false,
        message: '유효한 농장ID가 필요합니다.'
      });
    }

    logger.info(`weatherRouter.mapped: 서울 날씨 데이터 조회 시작 - farmId: ${farmId}`);

    const result = await WeatherService.getMappedWeatherData('서울', parseInt(farmId));
    
    if (result.success && result.data) {
      logger.info('weatherRouter.mapped: 서울 날씨 데이터 DB 저장 시작');
      
      const { cityName, ...dataToSave } = result.data;
      await WeatherDao.saveWeatherData({
        ...dataToSave,
        isDay: dataToSave.isDay,
        isRain: dataToSave.isRain,
        farmId: parseInt(farmId)
      });
      
      logger.info(`weatherRouter.mapped: 서울 날씨 데이터 저장 완료 - 온도: ${dataToSave.outsideTemp}°C`);
    }

    res.status(200).json({
      success: true,
      message: '서울 날씨 데이터 조회 및 저장 성공',
      data: result.data,
      requestTime: result.requestTime
    });
    
  } catch (err) {
    logger.error(`weatherRouter.mapped: 서울 날씨 데이터 조회 실패 - farmId: ${req.query.farmId || 1}, 에러: ${err.message}`);
    res.status(500).json({
      success: false,
      message: '서울 날씨 데이터 조회에 실패했습니다.'
    });
  }
});

weatherRouter.get('/mapped/:cityName', async (req, res) => {
  try {
    const { cityName } = req.params;
    const farmId = req.query.farmId || 1;
    
    if (!cityName || typeof cityName !== 'string' || cityName.trim() === '') {
      logger.error('weatherRouter.mapped.city: 도시명이 제공되지 않았습니다.');
      return res.status(400).json({
        success: false,
        message: '도시명이 필요합니다.'
      });
    }

    if (farmId && (isNaN(farmId) || parseInt(farmId) <= 0)) {
      logger.error(`weatherRouter.mapped.city: 유효하지 않은 농장ID - farmId: ${farmId}`);
      return res.status(400).json({
        success: false,
        message: '유효한 농장ID가 필요합니다.'
      });
    }

    const cities = WeatherService.getKoreaCities();
    if (!cities[cityName]) {
      logger.error(`weatherRouter.mapped.city: 지원하지 않는 도시 - cityName: ${cityName}`);
      return res.status(400).json({
        success: false,
        message: `지원하지 않는 도시입니다. 지원 도시: ${Object.keys(cities).join(', ')}`
      });
    }
    
    logger.info(`weatherRouter.mapped.city: ${cityName} 날씨 데이터 조회 시작 - farmId: ${farmId}`);
    
    const result = await WeatherService.getMappedWeatherData(cityName, parseInt(farmId));

    if (result.success && result.data) {
      logger.info(`weatherRouter.mapped.city: ${cityName} 날씨 데이터 DB 저장 시작`);
      
      const { cityName: responseCityName, ...dataToSave } = result.data;
      await WeatherDao.saveWeatherData({
        ...dataToSave,
        isDay: dataToSave.isDay,
        isRain: dataToSave.isRain,
        farmId: parseInt(farmId)
      });
      
      logger.info(`weatherRouter.mapped.city: ${cityName} 날씨 데이터 저장 완료 - 온도: ${dataToSave.outsideTemp}°C`);
    }
    
    res.status(200).json({
      success: true,
      message: `${cityName} 테이블 매칭 데이터 조회 성공`,
      data: result.data,
      requestTime: result.requestTime
    });
    
  } catch (err) {
    logger.error(`weatherRouter.mapped.city: ${req.params.cityName} 날씨 데이터 조회 실패 - farmId: ${req.query.farmId || 1}, 에러: ${err.message}`);
    res.status(500).json({
      success: false,
      message: '도시 날씨 데이터 조회에 실패했습니다.',
      supportedCities: Object.keys(WeatherService.getKoreaCities())
    });
  }
});

weatherRouter.get('/auto-collect', async (req, res) => {
  try {
    const farmId = req.query.farmId || 1;
    
    if (farmId && (isNaN(farmId) || parseInt(farmId) <= 0)) {
      logger.error(`weatherRouter.autoCollect: 유효하지 않은 농장ID - farmId: ${farmId}`);
      return res.status(400).json({
        success: false,
        message: '유효한 농장ID가 필요합니다.'
      });
    }
    
    logger.info(`weatherRouter.autoCollect: 서울 날씨 자동 수집 시작 - farmId: ${farmId}`);
    
    const result = await WeatherService.getMappedWeatherData('서울', parseInt(farmId));
    
    if (result.success && result.data) {
      logger.info('weatherRouter.autoCollect: 서울 날씨 데이터 DB 저장 시작');
      
      const { cityName, ...dataToSave } = result.data;
      await WeatherDao.saveWeatherData({
        ...dataToSave,
        isDay: dataToSave.isDay,
        isRain: dataToSave.isRain,
        farmId: parseInt(farmId)
      });
      
      logger.info(`weatherRouter.autoCollect: 서울 날씨 자동 수집 완료 - 온도: ${dataToSave.outsideTemp}°C, 일사량: ${dataToSave.insolation}`);
    }

    res.json({ 
      success: true, 
      message: '서울 날씨 자동 수집 완료', 
      data: result.data,
      timestamp: new Date().toLocaleString('ko-KR')
    });
  } catch (err) {
    logger.error(`weatherRouter.autoCollect: 서울 날씨 자동 수집 실패 - farmId: ${req.query.farmId || 1}, 에러: ${err.message}`);
    res.status(500).json({ 
      success: false, 
      message: '서울 날씨 자동 수집에 실패했습니다.'
    });
  }
});

export default weatherRouter;
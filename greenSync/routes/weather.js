// weather.js (assuming this is weatherRouter.js)
import express from 'express';
import WeatherService from '../services/weatherService.js';
import WeatherDao from '../dao/weatherDao.js';
import Logger from '../utils/logger.js';

const weatherRouter = express.Router();

weatherRouter.get('/city/seoul', async (req, res) => {
  try {
    const result = await WeatherService.getSeoulFullWeatherData();
    
    if (!result.success) {
      Logger.error('weatherRouter.city.seoul: 서울 전체 날씨 데이터 조회 실패 - ' + result.message);
      return res.status(500).json({
        success: false,
        message: '서울 전체 날씨 데이터 조회에 실패했습니다.',
        error: result.message
      });
    }
    
    Logger.info('weatherRouter.city.seoul: 서울 전체 날씨 데이터 조회 완료 - API: ' + result.apiUsed);
    res.status(200).json({
      success: true,
      message: '서울 전체 날씨 데이터 조회 성공',
      cityName: result.cityName,
      coordinates: result.coordinates,
      apiUsed: result.apiUsed,
      data: result.data,
      requestTime: result.requestTime
    });
    
  } catch (err) {
    Logger.error('weatherRouter.city.seoul: 서울 전체 날씨 데이터 조회 예외 - ' + err.message);
    res.status(500).json({
      success: false,
      message: '서울 전체 날씨 데이터 조회 중 예외가 발생했습니다.',
      error: err.message
    });
  }
});
weatherRouter.get('/city/:cityName', async (req, res) => {
  try {
    const { cityName } = req.params;
    
    if (!cityName || typeof cityName !== 'string' || cityName.trim() === '') {
      Logger.error('weatherRouter.city: 도시명이 제공되지 않았습니다.');
      return res.status(400).json({
        success: false,
        message: '도시명이 필요합니다.'
      });
    }

    const cities = WeatherService.getKoreaCities();
    if (!cities[cityName]) {
      Logger.error('weatherRouter.city: 지원하지 않는 도시 - cityName: ' + cityName);
      return res.status(400).json({
        success: false,
        message: '지원하지 않는 도시입니다. 지원 도시: ' + Object.keys(cities).join(', ')
      });
    }
    
    Logger.info('weatherRouter.city: 도시 날씨 데이터 조회 시작 - cityName: ' + cityName);
    const result = await WeatherService.getCityWeatherData(cityName);
    
    const { data, ...restResult } = result; 
    const { ...restData } = data.data; 
    
    res.status(200).json({
      success: true,
      message: cityName + ' OpenWeatherMap 데이터 조회 성공',
      data: {
        ...restResult,
        data: {
          ...restData,
        }
      }
    });
    
  } catch (err) {
    Logger.error('weatherRouter.city: 도시 날씨 데이터 조회 실패 - cityName: ' + req.params.cityName + ', 에러: ' + err.message);
    res.status(500).json({
      success: false,
      message: '도시 날씨 데이터 조회에 실패했습니다.',
      supportedCities: Object.keys(WeatherService.getKoreaCities())
    });
  }
});

weatherRouter.get('/mapped', async (req, res) => {
  try {
    const farmId = req.query.farmId ? parseInt(req.query.farmId) : 1; 
    
    if (farmId !== null && (isNaN(farmId) || farmId <= 0)) {
      Logger.error('weatherRouter.mapped: 유효하지 않은 농장ID - farmId: ' + req.query.farmId);
      return res.status(400).json({
        success: false,
        message: '유효한 농장ID가 필요합니다. (null이거나 0보다 큰 정수)'
      });
    }

    const result = await WeatherService.getMappedWeatherData('서울', farmId);
    
    if (result.success && result.data) {
      
      const { ...dataToSave } = result.data;
      await WeatherDao.saveWeatherData({
        ...dataToSave,
        isDay: dataToSave.isDay,
        isRain: dataToSave.isRain,
        farmId: farmId 
      });
    }

    res.status(200).json({
      success: true,
      message: '서울 날씨 데이터 조회 및 저장 성공',
      data: result.data,
      requestTime: result.requestTime
    });
    
  } catch (err) {
    Logger.error('weatherRouter.mapped: 서울 날씨 데이터 조회 실패 - farmId: ' + (req.query.farmId || '기본값(null)') + ', 에러: ' + err.message);
    res.status(500).json({
      success: false,
      message: '서울 날씨 데이터 조회에 실패했습니다.'
    });
  }
});

weatherRouter.get('/mapped/:cityName', async (req, res) => {
  try {
    const { cityName } = req.params;
    const farmId = req.query.farmId ? parseInt(req.query.farmId) : 1;
    
    if (!cityName || typeof cityName !== 'string' || cityName.trim() === '') {
      Logger.error('weatherRouter.mapped.city: 도시명이 제공되지 않았습니다.');
      return res.status(400).json({
        success: false,
        message: '도시명이 필요합니다.'
      });
    }

    if (farmId !== null && (isNaN(farmId) || farmId <= 0)) {
      Logger.error('weatherRouter.mapped.city: 유효하지 않은 농장ID - farmId: ' + req.query.farmId);
      return res.status(400).json({
        success: false,
        message: '유효한 농장ID가 필요합니다. (null이거나 0보다 큰 정수)'
      });
    }

    const cities = WeatherService.getKoreaCities();
    if (!cities[cityName]) {
      Logger.error('weatherRouter.mapped.city: 지원하지 않는 도시 - cityName: ' + cityName);
      return res.status(400).json({
        success: false,
        message: '지원하지 않는 도시입니다. 지원 도시: ' + Object.keys(cities).join(', ')
      });
    }
    
    const result = await WeatherService.getMappedWeatherData(cityName, farmId);

    if (result.success && result.data) {
      
      const { ...dataToSave } = result.data;
      await WeatherDao.saveWeatherData({
        ...dataToSave,
        isDay: dataToSave.isDay,
        isRain: dataToSave.isRain,
        farmId: farmId 
      });
    }
    
    res.status(200).json({
      success: true,
      message: cityName + ' 테이블 매칭 데이터 조회 성공',
      data: result.data,
      requestTime: result.requestTime
    });
    
  } catch (err) {
    Logger.error('weatherRouter.mapped.city: ' + req.params.cityName + ' 날씨 데이터 조회 실패 - farmId: ' + (req.query.farmId || '기본값(null)') + ', 에러: ' + err.message);
    res.status(500).json({
      success: false,
      message: '도시 날씨 데이터 조회에 실패했습니다.',
      supportedCities: Object.keys(WeatherService.getKoreaCities())
    });
  }
});

weatherRouter.get('/auto-collect', async (req, res) => {
  try {
    const farmId = req.query.farmId ? parseInt(req.query.farmId) : 1; 
    
    if (farmId !== null && (isNaN(farmId) || farmId <= 0)) {
      Logger.error('weatherRouter.autoCollect: 유효하지 않은 농장ID - farmId: ' + req.query.farmId);
      return res.status(400).json({
        success: false,
        message: '유효한 농장ID가 필요합니다. (null이거나 0보다 큰 정수)'
      });
    }
    
    const result = await WeatherService.getMappedWeatherData('서울', farmId);
    
    if (result.success && result.data) {
      
      const { ...dataToSave } = result.data;
      await WeatherDao.saveWeatherData({
        ...dataToSave,
        isDay: dataToSave.isDay,
        isRain: dataToSave.isRain,
        farmId: farmId 
      });
    }

    res.json({ 
      success: true, 
      message: '서울 날씨 자동 수집 완료', 
      data: result.data,
      timestamp: new Date().toLocaleString('ko-KR')
    });
  } catch (err) {
    Logger.error('weatherRouter.autoCollect: 서울 날씨 자동 수집 실패 - farmId: ' + (req.query.farmId || '기본값(null)') + ', 에러: ' + err.message);
    res.status(500).json({ 
      success: false, 
      message: '서울 날씨 자동 수집에 실패했습니다.'
    });
  }
});

export default weatherRouter;
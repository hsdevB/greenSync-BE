import express from 'express';
import WeatherService from '../services/weatherService.js';
import WeatherDao from '../dao/weatherDao.js';
import Logger from '../utils/logger.js';

const weatherRouter = express.Router();

weatherRouter.get('/raw', async (req, res) => {
  try {
    const result = await WeatherService.getOneCallWeatherData(37.5665, 126.9780);
    
    if (result.success) {
      const { current, hourly, daily } = result.data;
      
      const weatherData = {
        ...current,
        clouds: current.clouds || 0,
        pop: hourly?.[0]?.pop || daily?.[0]?.pop || 0,
        rain: current.rain?.['1h'] || hourly?.[0]?.rain?.['1h'] || daily?.[0]?.rain || 0,
        uvi: current.uvi || 0
      };

      res.status(200).json({
        success: true,
        message: '날씨 데이터 조회 성공',
        // data: {
        //   current,
        //   daily,
        //   extended: {
        //     clouds: weatherData.clouds,
        //     pop: weatherData.pop,
        //     rain: weatherData.rain,
        //     uvi: weatherData.uvi
        //   }
        // },
        weatherInfo: {
          temperature: current.temp,
          rain: weatherData.rain,
          main: current.weather[0].main,
          description: current.weather[0].description,
          icon : current.weather[0].icon,
        }
      });
    } else {
      Logger.error('weatherRouter.raw: 날씨 데이터 조회 실패 - ' + result.message);
      res.status(400).json({
        success: false,
        message: result.message || '날씨 데이터 조회에 실패했습니다.'
      });
    }
  } catch (err) {
    Logger.error('weatherRouter.raw: 날씨 데이터 조회 중 예외 발생 - ' + err.message);
    res.status(500).json({
      success: false,
      message: '서버 내부 오류가 발생했습니다.'
    });
  }
});

weatherRouter.get('/raw/:cityName', async (req, res) => {
  try {
    const { cityName } = req.params;
    
    if (!cityName) {
      return res.status(400).json({
        success: false,
        message: '도시명이 필요합니다.'
      });
    }
    
    const cities = WeatherService.getKoreaCities();
    const city = cities[cityName];
    
    if (!city) {
      return res.status(400).json({
        success: false,
        message: `지원하지 않는 도시입니다: ${cityName}`
      });
    }
    
    const result = await WeatherService.getOneCallWeatherData(city.lat, city.lon);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: `${cityName} 날씨 데이터 조회 성공`,
        data: result.data,
      });
    } else {
      Logger.error(`weatherRouter.raw: ${cityName} 날씨 데이터 조회 실패 - ` + result.message);
      res.status(400).json({
        success: false,
        message: result.message || `${cityName} 날씨 데이터 조회에 실패했습니다.`
      });
    }
  } catch (err) {
    Logger.error('weatherRouter.raw: 날씨 데이터 조회 중 예외 발생 - ' + err.message);
    res.status(500).json({
      success: false,
      message: '서버 내부 오류가 발생했습니다.'
    });
  }
});

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
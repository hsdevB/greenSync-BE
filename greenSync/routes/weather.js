// weather.js
import express from 'express';
import WeatherService from '../services/weatherService.js';
import WeatherDao from '../dao/weatherDao.js';
import logger from '../utils/logger.js';
import Middleware from '../utils/middleware.js'; // Middleware 임포트

const weatherRouter = express.Router();

// 1️⃣ 도시별 OpenWeatherMap 원본 데이터 조회 (인증 불필요, DB 저장 없음)
weatherRouter.get('/city/:cityName', async (req, res) => {
  try {
    const { cityName } = req.params;
    
    const result = await WeatherService.getCityWeatherData(cityName);
    
    // 응답 데이터에서 humidity 및 stationNumber 제거 (서비스에서 이미 처리됨)
    const { data, ...restResult } = result;
    const { main, sys, ...restData } = data.data; // OpenWeatherMap 원본 데이터 구조에 따라 조절
    
    res.status(200).json({
      success: true,
      message: `${cityName} OpenWeatherMap 데이터 조회 성공`,
      data: {
        ...restResult,
        data: {
          ...restData,
          // humidity: main?.humidity, // 제거
          // stationNumber: result.stationNumber // 제거
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

// 2️⃣ 테이블 매칭 형식으로 변환된 데이터 조회 (전체 도시) - 인증 필요
weatherRouter.get('/mapped', Middleware.isLoggedIn, async (req, res) => { // Middleware.isLoggedIn 추가
  try {
    const farmId = req.loginUser.farmId; // 로그인한 사용자의 farmId 추출

    const result = await WeatherService.getMappedWeatherData(null, farmId); // farmId 전달
    
    // DB에 데이터 저장
    if (result.success && Array.isArray(result.data) && result.data.length > 0) {
      for (const weatherData of result.data) {
        // DB 저장 시 'cityName' 필드는 제거하고, isDay와 isRain은 Boolean 값으로 변환
        const { cityName, ...dataToSave } = weatherData; // cityName은 응답용, DB 저장에는 불필요
        await WeatherDao.saveWeatherData({
          ...dataToSave,
          isDay: dataToSave.isDay,
          isRain: dataToSave.isRain,
          farmId: farmId // DAO에 farmId 명시적으로 전달
        }); 
      }
    }

    res.status(200).json({
      success: true,
      message: '전체 도시 테이블 매칭 데이터 조회 성공',
      data: result.data, 
      fieldMapping: result.fieldMapping,
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

// 3️⃣ 특정 도시의 테이블 매칭 형식 데이터 조회 - 인증 필요
weatherRouter.get('/mapped/:cityName', Middleware.isLoggedIn, async (req, res) => { // Middleware.isLoggedIn 추가
  try {
    const { cityName } = req.params;
    const farmId = req.loginUser.farmId; // 로그인한 사용자의 farmId 추출
    
    const result = await WeatherService.getMappedWeatherData(cityName, farmId); // farmId 전달

    // DB에 데이터 저장
    if (result.success && result.data) { // 단일 객체일 경우
      // DB 저장 시 'cityName' 필드는 제거하고, isDay와 isRain은 Boolean 값으로 변환
      const { cityName: responseCityName, ...dataToSave } = result.data; // cityName은 응답용, DB 저장에는 불필요
      await WeatherDao.saveWeatherData({
        ...dataToSave,
        isDay: dataToSave.isDay,
        isRain: dataToSave.isRain,
        farmId: farmId // DAO에 farmId 명시적으로 전달
      });
    }
    
    res.status(200).json({
      success: true,
      message: `${cityName} 테이블 매칭 데이터 조회 성공`,
      data: result.data, 
      fieldMapping: result.fieldMapping,
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

export default weatherRouter;
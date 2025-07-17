// weatherService.js
import axios from 'axios';
import logger from '../utils/logger.js';

class WeatherService {
  static API_KEY = process.env.OPEN_WEATHER_KEY;
  static KMA_API_KEY = process.env.KMA_API_KEY; // 기존 기상청 API 키
  static KMA_HUB_API_KEY = process.env.KMA_HUB_API_KEY || 'Qqk6LV2QR3OpOi1dkEdzgg'; // KMA HUB API 키 추가
  static OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';
  static ONECALL_BASE_URL = 'https://api.openweathermap.org/data/3.0';
  static KMA_BASE_URL = 'http://apis.data.go.kr/1360000/AsosHourlyInfoService'; // 기존 기상청 ASOS API
  static KMA_HUB_INSOLATION_BASE_URL = 'https://apihub.kma.go.kr/api/typ01/url/kma_sfctm2.php'; // KMA HUB 일사량 API URL 추가

  // 🇰🇷 한국 주요 도시 좌표 및 기상청 지점번호 데이터
  static getKoreaCities() {
    return {
      '서울': { lat: 37.5665, lon: 126.9780, stationNumber: 108 }, // 서울(종로구)
      '부산': { lat: 35.1796, lon: 129.0756, stationNumber: 159 }, // 부산
      '대구': { lat: 35.8714, lon: 128.6014, stationNumber: 143 }, // 대구
      '인천': { lat: 37.4563, lon: 126.7052, stationNumber: 112 }, // 인천
      '광주': { lat: 35.1595, lon: 126.8526, stationNumber: 156 }, // 광주
      '대전': { lat: 36.3504, lon: 127.3845, stationNumber: 133 }, // 대전
      '울산': { lat: 35.5384, lon: 129.3114, stationNumber: 152 }, // 울산
      '세종': { lat: 36.4800, lon: 127.2890, stationNumber: 129 }, // 세종(조치원)
      '수원': { lat: 37.2636, lon: 127.0286, stationNumber: 119 }, // 수원
      '창원': { lat: 35.2272, lon: 128.6811, stationNumber: 155 }, // 창원
      '제주': { lat: 33.4996, lon: 126.5312, stationNumber: 184 }  // 제주
    };
  }
  static async getOneCallWeatherData(lat, lon) {
    const url = `${this.ONECALL_BASE_URL}/onecall`;
    const params = {
      lat,
      lon,
      appid: this.API_KEY,
      units: 'metric', // 섭씨 온도를 위한 설정
      lang: 'ko',      // 한국어 응답을 위한 설정
      exclude: 'minutely,hourly,daily,alerts' // 필요한 데이터만 포함
    };
    try {
      const response = await axios.get(url, { params, timeout: 5000 });
      return response.data;
    } catch (error) {
      logger.error(`OpenWeatherMap One Call API 호출 실패 (${lat}, ${lon}): ${error.message}`);
      throw new Error(`OpenWeatherMap One Call API 호출 실패: ${error.message}`);
    }
  }
  static async getCurrentWeatherData(lat, lon) {
    const url = `${this.OPENWEATHER_BASE_URL}/weather`;
    const params = {
      lat,
      lon,
      appid: this.API_KEY,
      units: 'metric', // 섭씨 온도를 위한 설정
      lang: 'ko'      // 한국어 응답을 위한 설정
    };
    try {
      const response = await axios.get(url, { params, timeout: 5000 });
      return response.data;
    } catch (error) {
      logger.error(`OpenWeatherMap Current Weather API 호출 실패 (${lat}, ${lon}): ${error.message}`);
      throw new Error(`OpenWeatherMap Current Weather API 호출 실패: ${error.message}`);
    }
  }
  // 🔍 OpenWeatherMap API 버전 자동 감지
  static async detectAvailableAPI() {
    const testCoords = { lat: 37.5665, lon: 126.9780 };

    try {
      await this.testOneCallAPI(testCoords.lat, testCoords.lon);
      logger.info('✅ One Call API 3.0 사용 가능');
      return 'ONE_CALL_3';
    } catch (error) {
      logger.warn(`⚠️ One Call API 3.0 사용 불가: ${error.message}`);
    }

    try {
      await this.testCurrentWeatherAPI(testCoords.lat, testCoords.lon);
      logger.info('✅ Current Weather API 2.5 사용 가능');
      return 'CURRENT_2_5';
    } catch (error) {
      logger.error(`❌ Current Weather API 2.5도 사용 불가: ${error.message}`);
      throw new Error('사용 가능한 OpenWeatherMap API가 없습니다.');
    }
  }

  // One Call API 3.0 테스트
  static async testOneCallAPI(lat, lon) {
    const url = `${this.ONECALL_BASE_URL}/onecall`;
    const params = {
      lat, lon,
      appid: this.API_KEY,
      units: 'metric',
      lang: 'ko'
    };
    const response = await axios.get(url, { params, timeout: 5000 });
    return response.data;
  }

  // Current Weather API 2.5 테스트
  static async testCurrentWeatherAPI(lat, lon) {
    const url = `${this.OPENWEATHER_BASE_URL}/weather`;
    const params = {
      lat, lon,
      appid: this.API_KEY,
      units: 'metric',
      lang: 'ko'
    };
    const response = await axios.get(url, { params, timeout: 5000 });
    return response.data;
  }

  // 🏛️ KMA HUB 일사량 데이터 조회
  static async getKMAHubInsolationData(stationNumber, dateTime) {
    try {
      const tm = dateTime; 
      const url = this.KMA_HUB_INSOLATION_BASE_URL;
      const params = {
        tm: tm, 
        stn: stationNumber,
        help: 1, 
        authKey: this.KMA_HUB_API_KEY
      };
      const response = await axios.get(url, { params, timeout: 10000 });
      const data = response.data;

      const insolationMatch = data.match(/(\d+\.\d+)SI/);
      if (insolationMatch && insolationMatch[1]) {
        return parseFloat(insolationMatch[1]); 
      }
      return null;
    } catch (error) {
      logger.error(`KMA HUB 일사량 조회 실패 (지점: ${stationNumber}, 시간: ${dateTime}): ${error.message}`);
      return null;
    }
  }

  // 1️⃣ 도시별 OpenWeatherMap 원본 데이터 조회
  static async getCityWeatherData(cityName) {
    try {
      const cities = this.getKoreaCities();
      
      if (!cities[cityName]) {
        throw new Error(`지원하지 않는 도시입니다. 지원 도시: ${Object.keys(cities).join(', ')}`);
      }

      const coords = cities[cityName];
      const apiType = await this.detectAvailableAPI();
      
      let weatherData;
      if (apiType === 'ONE_CALL_3') {
        weatherData = await this.getOneCallWeatherData(coords.lat, coords.lon);
      } else {
        weatherData = await this.getCurrentWeatherData(coords.lat, coords.lon);
      }

      return {
        success: true,
        cityName,
        // stationNumber: coords.stationNumber, // 제거
        coordinates: { lat: coords.lat, lon: coords.lon },
        apiUsed: apiType,
        data: weatherData,
        requestTime: new Date().toISOString()
      };

    } catch (err) {
      logger.error(`getCityWeatherData.error: ${err.message}`);
      throw err;
    }
  }

  // 2️⃣ 테이블 매칭 형식으로 변환된 데이터 조회
  static async getMappedWeatherData(cityName = null, farmId = null) { // farmId 파라미터 추가
    try {
      const cities = this.getKoreaCities();
      
      const targetCities = cityName ? 
        (cities[cityName] ? { [cityName]: cities[cityName] } : {}) : 
        cities;

      if (Object.keys(targetCities).length === 0) {
        throw new Error(cityName ? 
          `지원하지 않는 도시입니다: ${cityName}` : 
          '조회할 도시가 없습니다.');
      }

      const apiType = await this.detectAvailableAPI();
      
      const weatherPromises = Object.entries(targetCities).map(async ([city, coords]) => {
        try {
          let weatherData;
          
          if (apiType === 'ONE_CALL_3') {
            weatherData = await this.getOneCallWeatherData(coords.lat, coords.lon);
          } else {
            weatherData = await this.getCurrentWeatherData(coords.lat, coords.lon);
          }

          // DB에 저장될 데이터 (cityName 제거)
          const dbData = await this.convertToTableFormat(weatherData, city, coords, apiType); 
          
          // 여기에 dbData를 저장하는 로직이 있다고 가정합니다.
          // 예: await Weather.create(dbData); 

          // API 응답용 데이터에 cityName 추가
          return {
            cityName: city, // 브루노에서 보이도록 cityName 추가
            ...dbData
          };
          
        } catch (err) {
          logger.warn(`${city} 날씨 조회 실패: ${err.message}`);
          return {
            cityName: city, // 에러 보고 시 cityName 포함 (필요하다면)
            // stationNumber: coords.stationNumber, // 제거
            error: err.message
          };
        }
      });

      const results = await Promise.all(weatherPromises);
      const successData = results.filter(r => !r.error);
      
      const finalData = cityName && successData.length === 1 
                        ? successData[0] 
                        : successData;

      return {
        success: true,
        message: cityName ? `${cityName} 테이블 매칭 데이터 조회 성공` : '전체 도시 테이블 매칭 데이터 조회 성공',
        data: finalData,
        requestTime: new Date().toISOString()
      };

    } catch (err) {
      logger.error(`getMappedWeatherData.error: ${err.message}`);
      throw err;
    }
  }

  // 🔄 OpenWeatherMap 데이터를 테이블 형식으로 변환 및 일사량 추가
  static async convertToTableFormat(weatherData, cityName, coords, apiType) { 
    try {
      const isOneCall = apiType === 'ONE_CALL_3';
      const current = isOneCall ? weatherData.current : weatherData;
      const weather = current.weather ? current.weather[0] : weatherData.weather[0];

      const now = new Date();
      const observationTime = now.getFullYear() +
        String(now.getMonth() + 1).padStart(2, '0') +
        String(now.getDate()).padStart(2, '0') +
        String(now.getHours()).padStart(2, '0') +
        String(now.getMinutes()).padStart(2, '0');

      // 밤낮여부 판단
      const isDayValue = this.calculateIsDayTime(
        weather.icon,
        isOneCall ? current.sunrise : weatherData.sys?.sunrise,
        isOneCall ? current.sunset : weatherData.sys?.sunset
      );

      let insolation = 0.0; 
      // 낮 시간에만 KMA HUB에서 일사량 데이터 조회 시도 (타임아웃 방지)
      if (isDayValue === 'D') { // 'D'일 때만 일사량 조회
        const kmaInsolation = await this.getKMAHubInsolationData(coords.stationNumber, observationTime); 
        if (kmaInsolation !== null) { 
          insolation = kmaInsolation; 
        }
      } else {
          logger.info(`밤 시간대 (isDay: ${isDayValue})이므로 KMA HUB 일사량 조회를 생략하고 일사량을 0으로 설정합니다. 지점: ${cityName}, 시간: ${observationTime}`);
      }

      const isRainValue = this.calculateIsRain(current, weatherData); // 1 또는 0 반환

      return {
        observationTime: observationTime,                    
        windDirection: current.wind_deg || weatherData.wind?.deg || null,  
        windSpeed: current.wind_speed || weatherData.wind?.speed || null,   
        outsideTemp: Math.round(current.temp || weatherData.main?.temp), 
        dewPoint: current.dew_point || weatherData.main?.dew_point || null,
        isRain: isRainValue === 1, // boolean으로 변환              
        isDay: isDayValue === 'D', // boolean으로 변환                                        
        insolation: insolation,                               
      };

    } catch (err) {
      logger.error(`convertToTableFormat.error: ${err.message}`);
      return {
        error: `데이터 변환 실패: ${err.message}`
      };
    }
  }

  // 🌧️ 강수여부 계산
  static calculateIsRain(current, weatherData) {
    if (current && current.rain) {
      return current.rain['1h'] > 0 ? 1 : 0;
    }
    
    if (weatherData && weatherData.rain) {
      return weatherData.rain['1h'] > 0 ? 1 : 0;
    }
    
    return 0;
  }

  // 🌅 밤낮여부 판단
  static calculateIsDayTime(weatherIcon, sunrise, sunset) {
    try {
      // 방법 1: 날씨 아이콘으로 판단 (가장 정확)
      if (weatherIcon && typeof weatherIcon === 'string') {
        const iconSuffix = weatherIcon.slice(-1);
        if (iconSuffix === 'd') return 'D'; // 낮
        if (iconSuffix === 'n') return 'N'; // 밤
      }
      
      // 방법 2: 일출/일몰 시간 비교
      if (sunrise && sunset) {
        const now = new Date();
        const sunriseTime = new Date(sunrise * 1000);
        const sunsetTime = new Date(sunset * 1000);
        
        if (now >= sunriseTime && now <= sunsetTime) {
          return 'D'; // 낮
        } else {
          return 'N'; // 밤
        }
      }
      
      // 방법 3: 시간대로 추정 (한국 기준)
      const currentHour = new Date().getHours();
      // 0부터 23시까지. 오전 6시부터 오후 6시(18시)까지를 낮으로 간주합니다.
      return (currentHour >= 6 && currentHour <= 18) ? 'D' : 'N'; //
      
    } catch (err) {
      logger.warn(`밤낮여부 계산 오류: ${err.message}`);
      return 'N'; // 오류 발생 시 'N' (밤)을 기본값으로 반환
    }
  }
}

export default WeatherService;
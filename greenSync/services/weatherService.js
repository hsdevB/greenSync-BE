import axios from 'axios';
import Logger from '../utils/logger.js';

class WeatherService {
  static API_KEY = process.env.OPEN_WEATHER_KEY;
  static KMA_HUB_API_KEY = process.env.KMA_HUB_API_KEY || 'Qqk6LV2QR3OpOi1dkEdzgg';
  static ONECALL_BASE_URL = 'https://api.openweathermap.org/data/3.0';
  static KMA_HUB_INSOLATION_BASE_URL = 'https://apihub.kma.go.kr/api/typ01/url/kma_sfctm2.php';
  static REALTIME_TOLERANCE_MINUTES = 15;
  
  static lastInsolationValue = 0.0;
  static lastInsolationHour = null;

  static getCurrentSeoulTimestamp() {
    try {
      const now = new Date();
      const timestamp = Math.floor(now.getTime() / 1000);
      return timestamp;
    } catch (error) {
      Logger.error('getCurrentSeoulTimestamp 오류: ' + error.message);
      throw new Error('현재 시간 계산 실패: ' + error.message);
    }
  }

  static formatTimestamp(timestamp) {
    try {
      if (!timestamp || isNaN(timestamp)) {
        throw new Error('유효하지 않은 타임스탬프');
      }
      
      const date = new Date(timestamp * 1000);
      return date.toLocaleString('ko-KR', {
        timeZone: 'Asia/Seoul',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
    } catch (error) {
      Logger.error('formatTimestamp 오류: ' + error.message);
      return 'N/A';
    }
  }

  static isRealtimeData(apiTimestamp, currentTimestamp) {
    try {
      if (!apiTimestamp || !currentTimestamp) {
        throw new Error('타임스탬프가 누락됨');
      }

      const diffSeconds = Math.abs(currentTimestamp - apiTimestamp);
      const diffMinutes = Math.floor(diffSeconds / 60);
      const isRealtime = diffMinutes <= this.REALTIME_TOLERANCE_MINUTES;

      return {
        isRealtime,
        diffMinutes,
        diffSeconds,
        status: isRealtime ? 'REALTIME' : 'OUTDATED'
      };
    } catch (error) {
      Logger.error('isRealtimeData 오류: ' + error.message);
      return {
        isRealtime: false,
        diffMinutes: 0,
        diffSeconds: 0,
        status: 'ERROR'
      };
    }
  }

  static async getMappedWeatherData(cityName) {
    try {
      if (!cityName || typeof cityName !== 'string') {
        throw new Error('유효하지 않은 도시명');
      }

      const cities = this.getKoreaCities();
      const city = cities[cityName];

      if (!city) {
        throw new Error('지원하지 않는 도시: ' + cityName);
      }

      const currentSeoulTimestamp = this.getCurrentSeoulTimestamp();
      const weatherResult = await this.getOneCallWeatherData(city.lat, city.lon);

      if (!weatherResult.success) {
        throw new Error('OpenWeatherMap API 호출 실패: ' + weatherResult.message);
      }

      const apiData = weatherResult.data;
      const apiTimestamp = apiData.current.dt;

      if (!apiTimestamp) {
        throw new Error('API 응답에 타임스탬프가 없음');
      }

      const realtimeCheck = this.isRealtimeData(apiTimestamp, currentSeoulTimestamp);
      const convertedData = await this.convertOneCallDataToTableFormat(
        apiData,
        cityName,
        city,
        {
          apiTimestamp,
          currentTimestamp: currentSeoulTimestamp,
          realtimeStatus: realtimeCheck
        }
      );

      if (convertedData.error) {
        throw new Error('데이터 변환 실패: ' + convertedData.error);
      }

      const finalData = {
        ...convertedData,
      };

      const apiTimeFormatted = this.formatTimestamp(apiTimestamp);
      const currentTimeFormatted = this.formatTimestamp(currentSeoulTimestamp);

      Logger.info(
        'weatherService.getMappedWeatherData: '+
        '날씨데이터 - ' +
        'API호출시간: ' + apiTimeFormatted + ', ' +
        '현재시간: ' + currentTimeFormatted + ', ' +
        '온도: ' + finalData.outsideTemp + '°C, ' +
        '풍향: ' + finalData.windDirection + '°, ' +
        '풍속: ' + finalData.windSpeed + 'm/s, ' +
        '일사량: ' + finalData.insolation + 'MJ/m², ' +
        '이슬점온도: ' + finalData.dewPoint + '°C, ' +
        '밤낮여부: ' + (finalData.isDay ? '낮' : '밤') + ', ' +
        '강수여부: ' + (finalData.isRain ? '있음' : '없음')
      );

      return {
        success: true,
        message: '날씨 데이터 조회 성공',
        data: finalData
      };

    } catch (err) {
      Logger.error('getMappedWeatherData 오류: ' + err.message);
      return { success: false, message: err.message };
    }
  }

  static async getOneCallWeatherData(lat, lon) {
    try {
      if (!this.API_KEY) {
        throw new Error('OpenWeatherMap API 키가 설정되지 않음');
      }

      if (!lat || !lon || isNaN(lat) || isNaN(lon)) {
        throw new Error('유효하지 않은 좌표');
      }

      const url = this.ONECALL_BASE_URL + '/onecall';
      const params = {
        lat,
        lon,
        appid: this.API_KEY,
        units: 'metric',
        lang: 'ko',
        exclude: 'minutely,hourly,daily,alerts'
      };

      const response = await axios.get(url, { params, timeout: 15000 });

      if (!response.data || !response.data.current) {
        throw new Error('API 응답에 current 데이터가 없음');
      }

      if (typeof response.data.current.dew_point === 'undefined') {
        throw new Error('API 응답에 dew_point 필드가 없음');
      }

      return {
        success: true,
        data: response.data,
        apiVersion: '3.0'
      };

    } catch (error) {
      let errorMessage = 'API 호출 실패: ' + error.message;
      
      if (error.response) {
        if (error.response.status === 401) {
          errorMessage = 'API 키 인증 실패';
        } else if (error.response.status === 429) {
          errorMessage = 'API 호출 할당량 초과';
        } else {
          errorMessage = 'API 서버 오류: ' + error.response.status;
        }
      }

      Logger.error('getOneCallWeatherData 오류: ' + errorMessage);
      return {
        success: false,
        message: errorMessage
      };
    }
  }

  static async convertOneCallDataToTableFormat(weatherData, cityName, coords, timestampInfo) {
    try {
      if (!weatherData || !weatherData.current) {
        throw new Error('날씨 데이터가 누락됨');
      }

      if (!coords || !coords.stationNumber) {
        throw new Error('기상청 관측소 정보가 누락됨');
      }

      const current = weatherData.current;
      const weather = current.weather[0];
      const apiTime = new Date(timestampInfo.apiTimestamp * 1000);

      const seoulTimeString = apiTime.toLocaleString('ko-KR', {
        timeZone: 'Asia/Seoul',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });

      const seoulParts = seoulTimeString.match(/(\d{4})\. (\d{2})\. (\d{2})\. (\d{2}):(\d{2})/);
      if (!seoulParts) {
        throw new Error('서울 시간 변환 실패');
      }

      const observationTime = seoulParts[1] + seoulParts[2] + seoulParts[3] + seoulParts[4] + seoulParts[5];
      const windDirection = current.wind_deg || null;
      const windSpeed = current.wind_speed || null;
      const outsideTemp = current.temp || null;
      const dewPoint = current.dew_point || null;

      const isDayValue = this.calculateIsDayTime(
        weather.icon,
        current.sunrise,
        current.sunset
      );

      let insolation = 0.0;
      const insolationResult = await this.getInsolationData(coords.stationNumber);
      if (insolationResult.success) {
        insolation = insolationResult.insolation;
      }

      const isRainValue = this.calculateOneCallRain(current);

      return {
        observationTime: observationTime,
        windDirection: windDirection,
        windSpeed: windSpeed,
        outsideTemp: outsideTemp,
        dewPoint: dewPoint,
        isRain: isRainValue === 1,
        isDay: isDayValue === 'D',
        insolation: insolation
      };

    } catch (err) {
      Logger.error('convertOneCallDataToTableFormat 오류: ' + err.message);
      return {
        error: 'One Call API 데이터 변환 실패: ' + err.message
      };
    }
  }

  static calculateOneCallRain(current) {
    try {
      if (!current) {
        return 0;
      }

      if (current.rain && current.rain['1h'] > 0) {
        return 1;
      }

      if (current.snow && current.snow['1h'] > 0) {
        return 1;
      }

      return 0;
    } catch (error) {
      Logger.error('calculateOneCallRain 오류: ' + error.message);
      return 0;
    }
  }

  static calculateIsDayTime(weatherIcon, sunrise, sunset) {
    try {
      if (weatherIcon && typeof weatherIcon === 'string') {
        const iconSuffix = weatherIcon.slice(-1);
        if (iconSuffix === 'd') {
          return 'D';
        }
        if (iconSuffix === 'n') {
          return 'N';
        }
      }

      if (sunrise && sunset) {
        const now = new Date();
        const sunriseTime = new Date(sunrise * 1000);
        const sunsetTime = new Date(sunset * 1000);
        
        if (now >= sunriseTime && now <= sunsetTime) {
          return 'D';
        } else {
          return 'N';
        }
      }

      const currentHour = new Date().getHours();
      return (currentHour >= 6 && currentHour <= 18) ? 'D' : 'N';

    } catch (err) {
      Logger.error('calculateIsDayTime 오류: ' + err.message);
      return 'N';
    }
  }

  static async getInsolationData(stationNumber) {
    try {
      if (!stationNumber || isNaN(stationNumber)) {
        throw new Error('유효하지 않은 관측소 번호');
      }

      const currentHour = new Date().getHours();

      if (typeof this.lastInsolationValue === 'undefined') {
        this.lastInsolationValue = 0.0;
      }

      if (this.lastInsolationHour === currentHour) {
        return {
          success: true,
          insolation: this.lastInsolationValue,
          reused: true
        };
      }
      
      const result = await this.fetchInsolationFromKMA(stationNumber);
      
      if (result.success) {
        this.lastInsolationHour = currentHour;
        this.lastInsolationValue = result.insolation;
        return {
          success: true,
          insolation: result.insolation,
          reused: false
        };
      } else {
        this.lastInsolationHour = currentHour;
        return {
          success: true,
          insolation: this.lastInsolationValue || 0.0,
          reused: true,
          error: result.error
        };
      }
    } catch (error) {
      this.lastInsolationHour = new Date().getHours();
      Logger.error('getInsolationData 오류: ' + error.message);
      return {
        success: true,
        insolation: this.lastInsolationValue || 0.0,
        reused: true,
        error: error.message
      };
    }
  }

  static async fetchInsolationFromKMA(stationNumber) {
    try {
      if (!this.KMA_HUB_API_KEY) {
        throw new Error('기상청 API 키가 설정되지 않음');
      }

      const timeOptions = this.generateTimeOptions();

      for (const timeStr of timeOptions) {
        try {
          const params = {
            tm: timeStr,
            stn: stationNumber,
            help: 0,
            authKey: this.KMA_HUB_API_KEY
          };

          const response = await axios.get(this.KMA_HUB_INSOLATION_BASE_URL, {
            params,
            timeout: 8000
          });

          const parsed = this.parseKMAResponse(response.data, timeStr);
          if (parsed.success) {
            return parsed;
          } else {
            Logger.warn('정각 시간 ' + timeStr + '에서 일사량 데이터 없음, 다음 시간 시도');
          }

        } catch (error) {
          Logger.warn('정각 시간 ' + timeStr + ' API 호출 실패: ' + error.message + ', 다음 시간 시도');
          continue;
        }
      }

      throw new Error('모든 정각 시간대에서 일사량 데이터 조회 실패');
    } catch (error) {
      Logger.error('fetchInsolationFromKMA 오류: ' + error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  static generateTimeOptions() {
    try {
      const now = new Date();
      const options = [];
      // const currentKST = now.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });

      for (let hours = 0; hours <= 3; hours++) {
        const testTime = new Date(now.getTime() - (hours * 60 * 60 * 1000));

        const timeStr = testTime.getFullYear() +
          String(testTime.getMonth() + 1).padStart(2, '0') +
          String(testTime.getDate()).padStart(2, '0') +
          String(testTime.getHours()).padStart(2, '0') +
          '00';

        options.push(timeStr);
      }

      const uniqueOptions = [...new Set(options)].sort((a, b) => b.localeCompare(a));

      return uniqueOptions;
    } catch (error) {
      Logger.error('generateTimeOptions 오류: ' + error.message);
      return [];
    }
  }

  static parseKMAResponse(rawData) {
    try {
      if (!rawData || typeof rawData !== 'string') {
        return { success: false, error: '응답 데이터가 없음' };
      }

      const lines = rawData.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        if (!line || line.startsWith('#')) { 
          continue;
        }

        if (/^\d{12}/.test(line)) {
          const result = this.extractInsolationFromLine(line);
          if (result.success) {
            return result;
          }
        }
      }

      return { success: false, error: '데이터 라인 없음' };

    } catch (error) {
      Logger.error('parseKMAResponse 오류: ' + error.message);
      return { success: false, error: '파싱 오류: ' + error.message };
    }
  }

  static extractInsolationFromLine(line) {
    try {
      if (!line || typeof line !== 'string') {
        return { success: false, error: '유효하지 않은 라인' };
      }

      const fields = line.trim().split(/\s+/);
      let vsIndex = -1;

      for (let i = 0; i < fields.length; i++) {
        if (/^\d{4}$/.test(fields[i])) {
          vsIndex = i;
          break;
        }
      }
      
      if (vsIndex >= 0) {
        const siIndex = vsIndex + 2;
        
        if (siIndex < fields.length) {
          const siRawValue = fields[siIndex];
          const siValue = parseFloat(siRawValue);
          
          if (!isNaN(siValue) && siValue !== -9) {
            return { success: true, insolation: siValue };
          }
        }
      }
      
      const decimalNumbers = [];
      for (let i = 0; i < fields.length; i++) {
        const value = parseFloat(fields[i]);
        if (!isNaN(value) && fields[i].includes('.') && value > 0 && value < 50) {
          decimalNumbers.push({ index: i, value: value, raw: fields[i] });
        }
      }
      
      const insolationCandidates = decimalNumbers.filter(item => 
        item.value >= 0.5 && item.value <= 10 && 
        item.value !== 1.0
      );
      
      if (insolationCandidates.length > 0) {
        const bestCandidate = insolationCandidates.reduce((max, current) => 
          current.value > max.value ? current : max
        );
        
        return { success: true, insolation: bestCandidate.value };
      }
      
      return { success: false, error: 'SI 일사량 값 없음 또는 결측값' };
      
    } catch (error) {
      Logger.error('extractInsolationFromLine 오류: ' + error.message);
      return { success: false, error: '파싱 오류: ' + error.message };
    }
  }

  static getKoreaCities() {
    return {
      '서울': { lat: 37.5665, lon: 126.9780, stationNumber: 108 },
      '부산': { lat: 35.1796, lon: 129.0756, stationNumber: 159 },
      '대구': { lat: 35.8714, lon: 128.6014, stationNumber: 143 },
      '인천': { lat: 37.4563, lon: 126.7052, stationNumber: 112 },
      '광주': { lat: 35.1595, lon: 126.8526, stationNumber: 156 },
      '대전': { lat: 36.3504, lon: 127.3845, stationNumber: 133 },
      '울산': { lat: 35.5384, lon: 129.3114, stationNumber: 152 },
      '세종': { lat: 36.4800, lon: 127.2890, stationNumber: 239 },
      '수원': { lat: 37.2636, lon: 127.0286, stationNumber: 119 },
      '창원': { lat: 35.2272, lon: 128.6811, stationNumber: 155 },
      '제주': { lat: 33.4996, lon: 126.5312, stationNumber: 184 },
      '춘천': { lat: 37.8813, lon: 127.7293, stationNumber: 101 },
      '강릉': { lat: 37.7519, lon: 128.8762, stationNumber: 105 },
      '청주': { lat: 36.6356, lon: 127.4917, stationNumber: 131 },
      '전주': { lat: 35.8214, lon: 127.1500, stationNumber: 146 },
      '목포': { lat: 34.7886, lon: 126.3905, stationNumber: 165 },
      '여수': { lat: 34.7627, lon: 127.6622, stationNumber: 164 },
      '안동': { lat: 36.5682, lon: 128.7291, stationNumber: 136 }
    };
  }
}

export default WeatherService;
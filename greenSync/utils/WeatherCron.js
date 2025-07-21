import cron from 'node-cron';
import axios from 'axios';
import Logger from './logger.js';

class WeatherCron {
  constructor() {
    this.apiCount = 0;
    this.maxCalls = 1000;
    this.isRunning = false;
    this.task = null;
    this.baseUrl = process.env.WEATHER_API_BASE_URL || 'http://localhost:3000';
  }

  start() {
    if (this.isRunning) {
      Logger.warn('WeatherCron: 이미 실행 중입니다.');
      return;
    }

    Logger.info('WeatherCron: 서울 날씨 API 자동 호출 시작 (5분마다)');
    
    this.task = cron.schedule('*/5 * * * *', () => {
      this.callAPI();
    });

    this.isRunning = true;
    
    // 3초 후 첫 호출
    setTimeout(() => this.callAPI(), 3000);
  }

  async callAPI() {
    if (this.apiCount >= this.maxCalls) {
      Logger.warn('WeatherCron: 1000번 도달로 인한 자동 중지');
      console.log('🚫 1000번 도달! 자동 중지됩니다!');
      this.stop();
      return;
    }

    this.apiCount++;
    
    Logger.info(`WeatherCron: API 호출 시작 - ${this.apiCount}/${this.maxCalls}`);
    try {
      const response = await axios.get(`${this.baseUrl}/weather/auto-collect?farmId=1`, {
        timeout: 30000
      });
      
      if (response.data.success) {
        const data = response.data.data;
        Logger.info(`WeatherCron: API 호출 성공 - 온도: ${data.outsideTemp}°C, 일사량: ${data.insolation}`);
        
        // console.log(`✅ 성공! 서울 날씨 저장됨`);
        // console.log(`   📍 서울: ${data.outsideTemp}°C`);
        // console.log(`   🌞 일사량: ${data.insolation}`);
        // console.log(`   🌧️ 강수: ${data.isRain ? '예' : '아니오'}`);
        // console.log(`   🌅 낮/밤: ${data.isDay ? '낮' : '밤'}`);
        // console.log(`   💨 풍속: ${data.windSpeed || 'N/A'}m/s`);
        // console.log(`   💨 이슬점 온도: ${data.dewPoint || 'N/A'}°C`);
      } else {
        Logger.error(`WeatherCron: API 호출 실패 - ${response.data.message}`);
      }
      
      const remaining = this.maxCalls - this.apiCount;
      
      if (this.apiCount >= 950) {
        Logger.warn('WeatherCron: 50번 남음 경고');
      }
      
    } catch (error) {
      Logger.error(`WeatherCron: API 호출 에러 - ${error.message}`);
    }
  }

  stop() {
    if (this.task) {
      this.task.stop();
      this.task = null;
      this.isRunning = false;
      Logger.info('WeatherCron: 중지됨');
    }
  }

  status() {
    const statusInfo = {
      isRunning: this.isRunning,
      apiCount: this.apiCount,
      maxCalls: this.maxCalls,
      remaining: this.maxCalls - this.apiCount
    };
    
    Logger.info(`WeatherCron 상태: ${JSON.stringify(statusInfo)}`);
    
    return statusInfo;
  }

  reset() {
    this.apiCount = 0;
    Logger.info('WeatherCron: 카운트 리셋');
  }

  // 설정 변경 메서드들
  setMaxCalls(maxCalls) {
    if (maxCalls > 0) {
      this.maxCalls = maxCalls;
      Logger.info(`WeatherCron: 최대 호출 수 변경 - ${maxCalls}`);
    }
  }

  setBaseUrl(url) {
    this.baseUrl = url;
    Logger.info(`WeatherCron: 베이스 URL 변경 - ${url}`);
  }

  // 즉시 API 호출 (테스트용)
  async callNow() {
    Logger.info('WeatherCron: 즉시 호출 요청');
    await this.callAPI();
  }
}

export default WeatherCron;
import cron from 'node-cron';
import axios from 'axios';
import Logger from '../utils/logger.js';

class WeatherCron {
  constructor() {
    this.apiCount = 0;
    this.maxCalls = 1000;
    this.isRunning = false;
    this.task = null;
    this.baseUrl = process.env.WEATHER_API_BASE_URL || 'http://localhost:3000';
    this.successCount = 0;
    this.errorCount = 0;
    this.lastError = null;
    this.lastSuccessData = null;
    this.previousData = null;

    this.validateConfiguration();
  }

  validateConfiguration() {
    try {
      if (!this.baseUrl || typeof this.baseUrl !== 'string') {
        throw new Error('유효하지 않은 베이스 URL');
      }

      if (this.maxCalls <= 0 || isNaN(this.maxCalls)) {
        throw new Error('유효하지 않은 최대 호출 수');
      }

      const url = new URL(this.baseUrl);
      if (!url.protocol || !url.hostname) {
        throw new Error('잘못된 URL 형식');
      }
    } catch (error) {
      Logger.error('WeatherCron 설정 검증 실패: ' + error.message);
      throw error;
    }
  }

  start() {
    try {
      if (this.isRunning) {
        Logger.warn('WeatherCron이 이미 실행 중입니다');
        return;
      }

      Logger.info('WeatherCron 실시간 날씨데이터 수집 시작');
      
      // 크론 작업을 더 안정적으로 실행하기 위한 설정
      this.task = cron.schedule('*/10 * * * *', async () => {
        // 비동기 처리로 블로킹 방지
        setImmediate(async () => {
          try {
            await this.callAPI();
          } catch (error) {
            Logger.error('크론 작업 실행 중 오류: ' + error.message);
          }
        });
      }, {
        scheduled: true,
        timezone: "Asia/Seoul"
      });

      if (!this.task) {
        throw new Error('크론 작업 생성 실패');
      }

      this.isRunning = true;
      
      // 초기 실행을 비동기로 처리
      setTimeout(() => {
        setImmediate(async () => {
          try {
            await this.callAPI();
          } catch (error) {
            Logger.error('초기 크론 실행 중 오류: ' + error.message);
          }
        });
      }, 3000);
    } catch (error) {
      Logger.error('WeatherCron 시작 실패: ' + error.message);
      throw error;
    }
  }

  stop() {
    try {
      if (this.task) {
        this.task.stop();
        this.isRunning = false;
        Logger.info('WeatherCron 날씨데이터 자동 저장 중지');
      } else {
        Logger.warn('중지할 크론 작업이 없습니다');
      }
    } catch (error) {
      Logger.error('WeatherCron 중지 실패: ' + error.message);
    }
  }

  async callAPI() {
    try {
      if (this.apiCount >= this.maxCalls) {
        Logger.warn('최대 호출 수 도달, 자동 호출 중지: ' + this.maxCalls + '번');
        this.stop();
        return;
      }

      this.apiCount++;
      
      const timestamp = Date.now();
      const apiUrl = this.baseUrl + '/weather/mapped?farmId=1&_t=' + timestamp;
      
      if (!apiUrl || typeof apiUrl !== 'string') {
        throw new Error('유효하지 않은 API URL');
      }

      // 비동기 처리를 위한 Promise 기반 요청
      const response = await Promise.race([
        axios.get(apiUrl, { 
          timeout: 30000,
          validateStatus: function (status) {
            return status >= 200 && status < 600;
          }
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('요청 시간 초과')), 30000)
        )
      ]);
      
      if (!response || !response.data) {
        throw new Error('API 응답이 없음');
      }

      if (response.data.success) {
        this.successCount++;
        
        if (!response.data.data) {
          throw new Error('응답에 데이터가 없음');
        }

        this.lastSuccessData = {
          timestamp: new Date().toLocaleString('ko-KR'),
          data: response.data.data
        };

        // 데이터 비교를 비동기로 처리하여 블로킹 방지
        if (this.previousData) {
          setImmediate(() => this.compareData(this.previousData, response.data.data));
        }
        
        this.previousData = response.data.data;

        const data = response.data.data;
        Logger.info(
          'WeatherCron.callAPI: '+
          '크론 데이터수집 성공 - ' +
          '시간: ' + data.observationTime + ', ' +
          '온도: ' + data.outsideTemp + '°C, ' +
          '풍속: ' + data.windSpeed + 'm/s, ' +
          '풍향: ' + data.windDirection + '°, ' +
          '일사량: ' + data.insolation + 'MJ/m², ' +
          '강수: ' + (data.isRain ? '있음' : '없음') + ', ' +
          '낮밤: ' + (data.isDay ? '낮' : '밤') + ', ' +
          '이슬점온도: ' + data.dewPoint + '°C'
        );

      } else {
        this.errorCount++;
        const errorMessage = response.data.message || '알 수 없는 오류';
        this.lastError = {
          timestamp: new Date().toLocaleString('ko-KR'),
          message: errorMessage,
          details: response.data.error || 'N/A'
        };
        Logger.error('WeatherCron.callAPI: ' + errorMessage);
      }
    } catch (error) {
      this.errorCount++;
      let errorMessage = error.message || '알 수 없는 오류';
      let errorDetails = 'N/A';

      if (error.response) {
        errorDetails = '상태: ' + error.response.status;
        if (error.response.status === 404) {
          errorMessage = 'API 엔드포인트를 찾을 수 없음';
        } else if (error.response.status >= 500) {
          errorMessage = '서버 내부 오류';
        }
      } else if (error.code === 'ECONNREFUSED') {
        errorMessage = '서버 연결 거부';
      } else if (error.code === 'ETIMEDOUT') {
        errorMessage = '요청 시간 초과';
      }

      this.lastError = {
        timestamp: new Date().toLocaleString('ko-KR'),
        message: errorMessage,
        details: errorDetails
      };
      
      Logger.error('WeatherCron.callAPI: ' + errorMessage);
    }
  }

  compareData(previous, current) {
    try {
      if (!previous || !current) {
        return;
      }

      const changes = [];
      
      if (previous.outsideTemp !== current.outsideTemp) {
        const diff = (current.outsideTemp - previous.outsideTemp).toFixed(2);
        changes.push('온도: ' + previous.outsideTemp + '°C → ' + current.outsideTemp + '°C (' + diff + ')');
      }
      
      if (previous.windSpeed !== current.windSpeed) {
        const diff = (current.windSpeed - previous.windSpeed).toFixed(2);
        changes.push('풍속: ' + previous.windSpeed + ' → ' + current.windSpeed + 'm/s (' + diff + ')');
      }
      
      if (previous.windDirection !== current.windDirection) {
        const diff = current.windDirection - previous.windDirection;
        changes.push('풍향: ' + previous.windDirection + '° → ' + current.windDirection + '° (' + diff + ')');
      }
      
      if (previous.insolation !== current.insolation) {
        const diff = (current.insolation - previous.insolation).toFixed(2);
        changes.push('일사량: ' + previous.insolation + ' → ' + current.insolation + 'MJ/m² (' + diff + ')');
      }
      
      if (previous.isRain !== current.isRain) {
        changes.push('강수: ' + (previous.isRain ? '있음' : '없음') + ' → ' + (current.isRain ? '있음' : '없음'));
      }
      
      if (changes.length > 0) {
        Logger.info('WeatherCron.compareData: ' + changes.join(', '));
      } 
    } catch (error) {
      Logger.error('WeatherCron.compareData: ' + error.message);
    }
  }

  status() {
    try {
      const totalCalls = this.successCount + this.errorCount;
      const successRate = totalCalls > 0 ? ((this.successCount / totalCalls) * 100).toFixed(2) + '%' : 'N/A';
      
      return {
        isRunning: this.isRunning,
        apiCount: this.apiCount,
        maxCalls: this.maxCalls,
        remaining: Math.max(0, this.maxCalls - this.apiCount),
        successCount: this.successCount,
        errorCount: this.errorCount,
        successRate: successRate,
        lastError: this.lastError,
        lastSuccessData: this.lastSuccessData,
        nextCall: this.task && this.isRunning ? this.task.nextDates().toLocaleString('ko-KR') : 'N/A'
      };
    } catch (error) {
      Logger.error('WeatherCron.status: ' + error.message);
      return {
        isRunning: false,
        error: error.message
      };
    }
  }

  async callNow() {
    try {
      Logger.info('수동 크론 호출 요청');
      await this.callAPI();
    } catch (error) {
      Logger.error('수동 크론 호출 실패: ' + error.message);
      throw error;
    }
  }

  printDetailedStatus() {
    try {
      const status = this.status();
      
      if (status.error) {
        Logger.error('WeatherCron 상태 조회 실패: ' + status.error);
        return;
      }
      
      Logger.info('WeatherCron 상세 상태');
      Logger.info('실행 상태: ' + (status.isRunning ? '실행 중' : '중지됨'));
      Logger.info('호출 진행: ' + status.apiCount + '/' + status.maxCalls + ' (남은 횟수: ' + status.remaining + ')');
      Logger.info('성공률: ' + status.successRate + ' (성공: ' + status.successCount + ', 실패: ' + status.errorCount + ')');
      
      if (status.lastSuccessData && status.lastSuccessData.data) {
        const data = status.lastSuccessData.data;
        Logger.info('최근 성공 (' + status.lastSuccessData.timestamp + '): ' +
          '온도: ' + data.outsideTemp + '°C, ' +
          '일사량: ' + data.insolation + 'MJ/m², ' +
          '강수: ' + (data.isRain ? '있음' : '없음') + ', ' +
          '밤/낮: ' + (data.isDay ? '낮' : '밤')
        );
      }
      
      if (status.lastError) {
        Logger.error('최근 실패 (' + status.lastError.timestamp + '): ' + status.lastError.message);
      }

      Logger.info('다음 호출 예정: ' + status.nextCall);
    } catch (error) {
      Logger.error('WeatherCron.printDetailedStatus: ' + error.message);
    }
  }
}

export default WeatherCron;
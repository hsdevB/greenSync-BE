import cron from 'node-cron';
import axios from 'axios';

class WeatherCron {
  constructor() {
    this.apiCount = 0;
    this.maxCalls = 1000;
    this.isRunning = false;
    this.task = null;
  }

  start() {
    if (this.isRunning) {
      console.log('⚠️ 이미 실행 중입니다.');
      return;
    }

    console.log('🚀 서울 날씨 API 자동 호출 시작! (5분마다)');
    console.log(`📊 현재: ${this.apiCount}/${this.maxCalls}번`);
    
    this.task = cron.schedule('*/5 * * * *', () => {
      this.callAPI();
    });

    this.isRunning = true;
    setTimeout(() => this.callAPI(), 3000);
  }

  async callAPI() {
    if (this.apiCount >= this.maxCalls) {
      console.log('🚫 1000번 도달! 자동 중지됩니다!');
      this.stop();
      return;
    }

    this.apiCount++;
    const now = new Date().toLocaleTimeString('ko-KR');
    
    console.log(`\n🔄 [${now}] 서울 날씨 API 호출 중... (${this.apiCount}/${this.maxCalls})`);

    try {
      const response = await axios.get('http://localhost:3000/weather/auto-collect?farmId=1', {
        timeout: 30000
      });
      
      if (response.data.success) {
        const data = response.data.data;
        console.log(`✅ 성공! 서울 날씨 저장됨`);
        console.log(`   📍 서울: ${data.outsideTemp}°C`);
        console.log(`   🌞 일사량: ${data.insolation}`);
        console.log(`   🌧️ 강수: ${data.isRain ? '예' : '아니오'}`);
        console.log(`   🌅 낮/밤: ${data.isDay ? '낮' : '밤'}`);
        console.log(`   💨 풍속: ${data.windSpeed || 'N/A'}m/s`);
        console.log(`   💨 이슬점 온도: ${data.dewPoint || 'N/A'}°C`);
      } else {
        console.log(`❌ 실패: ${response.data.message}`);
      }
      
      const remaining = this.maxCalls - this.apiCount;
      console.log(`📊 남은 호출: ${remaining}번`);
      
      if (this.apiCount >= 950) {
        console.log('⚠️ 경고: 50번 남았습니다!');
      }
      
    } catch (error) {
      console.log(`❌ 호출 실패: ${error.message}`);
    }
  }

  stop() {
    if (this.task) {
      this.task.stop();
      this.task = null;
      this.isRunning = false;
      console.log('🛑 중지됨');
    }
  }

  status() {
    console.log(`📊 상태: ${this.isRunning ? '실행중' : '중지'}`);
    console.log(`📊 호출 횟수: ${this.apiCount}/${this.maxCalls}`);
  }

  reset() {
    this.apiCount = 0;
    console.log('🔄 카운트 리셋됨');
  }
}

export default WeatherCron;
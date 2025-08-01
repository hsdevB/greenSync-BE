import Logger from '../utils/logger.js';
import TemperatureDao from '../dao/temperatureDao.js';
import HumidityDao from '../dao/humidityDao.js';
import Farm from '../models/farm.js';
import NutrientDao from '../dao/nutrientDao.js';

class ChartService {

  static getCurrentDateString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateString = `${year}${month}${day}`;
    return dateString;
  }

  static async getFarmIdByFarmCode(farmCode) {
    try {
      if (!farmCode || typeof farmCode !== 'string' || farmCode.trim() === '') {
        throw new Error('유효한 농장 코드가 필요합니다.');
      }

      const farm = await Farm.findOne({ where: { farmCode } });
      if (!farm) {
        throw new Error(`농장코드 ${farmCode}에 해당하는 농장을 찾을 수 없습니다.`);
      }
      return farm.id;
    } catch (error) {
      Logger.error(`ChartService.getFarmIdByFarmCode: 농장 ID 조회 실패 - 농장코드: ${farmCode}, 에러: ${error.message}`);
      throw error;
    }
  }

  static getTimeGroupIndex(hour) {
    return Math.floor(hour / 2);
  }

  static parseDate(dateString) {
    const year = parseInt(dateString.substring(0, 4));
    const month = parseInt(dateString.substring(4, 6)) - 1; 
    const day = parseInt(dateString.substring(6, 8));
    const parsedDate = new Date(year, month, day);
    
    return parsedDate;
  }

  static async getTemperatureDataByFarmCodeAndTimeGroups(farmCode, dateString = null) {
    try {
      const targetDateString = dateString || this.getCurrentDateString();
      
      const farmId = await this.getFarmIdByFarmCode(farmCode); 
      const targetDate = this.parseDate(targetDateString);
      const startDate = new Date(targetDate);
      const endDate = new Date(targetDate);
      endDate.setDate(endDate.getDate() + 1); 

      const temperatureData = await TemperatureDao.getTemperatureDataByFarmIdAndDateRange(farmId, startDate, endDate);

      const timeGroups = new Array(13).fill(null).map(() => []);
      temperatureData.forEach(record => {
        const hour = record.createdAt.getHours();
        const groupIndex = this.getTimeGroupIndex(hour);
        timeGroups[groupIndex+1].push(record.temperature);
      });
      timeGroups[0].push(...timeGroups[12]);
      timeGroups.splice(12, 1);

      const averageData = timeGroups.map(group => {
        if (group.length === 0) return null;
        const sum = group.reduce((acc, temp) => acc + temp, 0);
        return Math.round((sum / group.length) * 10) / 10; 
      });

      Logger.info(`ChartService.getTemperatureDataByFarmCodeAndTimeGroups: 최종 결과 - ${JSON.stringify(averageData)}`);
      return averageData;
    } catch (error) {
      Logger.error(`ChartService.getTemperatureDataByFarmCodeAndTimeGroups: 온도 데이터 그룹화 실패 - 농장코드: ${farmCode}, 에러: ${error.message}`);
      throw error;
    }
  }

  static async getHumidityDataByFarmCodeAndTimeGroups(farmCode, dateString = null) {
    try {
      const targetDateString = dateString || this.getCurrentDateString();
      const farmId = await this.getFarmIdByFarmCode(farmCode); 
      const targetDate = this.parseDate(targetDateString);
      const startDate = new Date(targetDate);
      const endDate = new Date(targetDate);
      endDate.setDate(endDate.getDate() + 1);

      const humidityData = await HumidityDao.getHumidityDataByFarmIdAndDateRange(farmId, startDate, endDate);

      const timeGroups = new Array(13).fill(null).map(() => []);

      humidityData.forEach(record => {
        const hour = record.createdAt.getHours();
        const groupIndex = this.getTimeGroupIndex(hour);
        timeGroups[groupIndex+1].push(record.humidity);
      });
      // 이중중첩 배열 삭제하는법
      // timeGroups[0]에 timeGroups[12]를 추가하고
      // timeGroups[12]를 삭제
      
      timeGroups[0].push(...timeGroups[12]);
      timeGroups.splice(12, 1);

      const averageData = timeGroups.map(group => {
        if (group.length === 0) return null;
        const sum = group.reduce((acc, humidity) => acc + humidity, 0);
        return Math.round((sum / group.length) * 10) / 10;
      });

      Logger.info(`ChartService.getHumidityDataByFarmCodeAndTimeGroups: 최종 결과 - ${JSON.stringify(averageData)}`);
      return averageData;
    } catch (error) {
      Logger.error(`ChartService.getHumidityDataByFarmCodeAndTimeGroups: 습도 데이터 그룹화 실패 - 농장코드: ${farmCode}, 에러: ${error.message}`);
      throw error;
    }
  }

  static async getNutrientDataByFarmCodeAndTimeGroups(farmCode, dateString = null) {
    try {
      const targetDateString = dateString || this.getCurrentDateString();
      const farmId = await this.getFarmIdByFarmCode(farmCode); 
      const targetDate = this.parseDate(targetDateString);
      const startDate = new Date(targetDate);
      const endDate = new Date(targetDate);
      endDate.setDate(endDate.getDate() + 1);

      const nutrientData = await NutrientDao.getNutrientDataByFarmIdAndDateRange(farmId, startDate, endDate);

      const phTimeGroups = new Array(13).fill(null).map(() => []);
      const ecTimeGroups = new Array(13).fill(null).map(() => []);
      nutrientData.forEach(record => {
        const hour = record.createdAt.getHours();
        const groupIndex = this.getTimeGroupIndex(hour);
        phTimeGroups[groupIndex+1].push(record.phLevel);
        ecTimeGroups[groupIndex+1].push(record.elcDT);
      });      
      phTimeGroups[0].push(...phTimeGroups[12]);
      ecTimeGroups[0].push(...ecTimeGroups[12]);
      phTimeGroups.splice(12, 1);
      ecTimeGroups.splice(12, 1);

      const phAverageData = phTimeGroups.map(group => {
        if (group.length === 0) return null;
        const sum = group.reduce((acc, phLevel) => acc + phLevel, 0);
        return Math.round((sum / group.length) * 10) / 10;
      });
      const ecAverageData = ecTimeGroups.map(group => {
        if (group.length === 0) return null;
        const sum = group.reduce((acc, ec) => acc + ec, 0);
        return Math.round((sum / group.length) * 10) / 10;
      });

      Logger.info(`ChartService.getNutrientDataByFarmCodeAndTimeGroups: 최종 결과 - ${JSON.stringify(phAverageData)}`);
      Logger.info(`ChartService.getNutrientDataByFarmCodeAndTimeGroups: 최종 결과 - ${JSON.stringify(ecAverageData)}`);
      return { phAverageData, ecAverageData };
    } catch (error) {
      Logger.error(`ChartService.getNutrientDataByFarmCodeAndTimeGroups: 양액 데이터 그룹화 실패 - 농장코드: ${farmCode}, 에러: ${error.message}`);
      throw error;
    }
  }

  static async getTemperatureChartData(farmCode, dateString = null) {
    try {
      const targetDateString = dateString || this.getCurrentDateString();
      
      const sensorData = await this.getTemperatureDataByFarmCodeAndTimeGroups(farmCode, targetDateString); 

      const chartData = {
        datasets: [
          {
            label : '산도',
            data: sensorData.phAverageData,
          },
          {
            label : '전도도',
            data: sensorData.ecAverageData,
          }
        ]
      };

      return chartData;
    } catch (error) {
      Logger.error(`ChartService.getTemperatureChartData: 온도 차트 데이터 조회 실패 - 농장코드: ${farmCode}, 에러: ${error.message}`);
      throw error;
    }
  }

  static async getHumidityChartData(farmCode, dateString = null) {
    try {
      const targetDateString = dateString || this.getCurrentDateString();
      
      const sensorData = await this.getHumidityDataByFarmCodeAndTimeGroups(farmCode, targetDateString); 

      const chartData = {
        datasets: [
          {
            data: sensorData,
          }
        ]
      };

      return chartData;
    } catch (error) {
      Logger.error(`ChartService.getHumidityChartData: 습도 차트 데이터 조회 실패 - 농장코드: ${farmCode}, 에러: ${error.message}`);
      throw error;
    }
  }

  static async getNutrientChartData(farmCode, dateString = null) {
    try {
      const targetDateString = dateString || this.getCurrentDateString();
      
      const sensorData = await this.getNutrientDataByFarmCodeAndTimeGroups(farmCode, targetDateString); 

      const chartData = {
        datasets: [
          {
            data: sensorData,
          }
        ]
      };

      return chartData;
    } catch (error) {
      Logger.error(`ChartService.getNutrientChartData: 양액 차트 데이터 조회 실패 - 농장코드: ${farmCode}, 에러: ${error.message}`);
      throw error;
    }
  }

  static async getCombinedChartData(farmCode, dateString = null) {
    try {
      const targetDateString = dateString || this.getCurrentDateString();
      const [sensorTempData, sensorHumidityData, sensorNutrientData] = await Promise.all([
        this.getTemperatureDataByFarmCodeAndTimeGroups(farmCode, targetDateString), 
        this.getHumidityDataByFarmCodeAndTimeGroups(farmCode, targetDateString),
        this.getNutrientDataByFarmCodeAndTimeGroups(farmCode, targetDateString)
      ]);
      
      const chartData = {
        datasets: [
          {
            label: '센서 온도 (°C)',
            data: sensorTempData,
          },
          {
            label: '센서 습도 (%)',
            data: sensorHumidityData,
          },
          {
            label: '전도도',
            data: sensorNutrientData.ecAverageData,
          },
          {
            label: '산도',
            data: sensorNutrientData.phAverageData,
          }
        ]
      };

      return chartData;
    } catch (error) {
      Logger.error(`ChartService.getCombinedChartData: 통합 차트 데이터 조회 실패 - 농장코드: ${farmCode}, 에러: ${error.message}`);
      throw error;
    }
  }
}

export default ChartService;
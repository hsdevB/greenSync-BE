import Temperature from '../models/temperature.js';
import Farm from '../models/farm.js';
import logger from '../utils/logger.js';

class TemperatureDao {
  static async saveTemperature(temperature, farmCode) {
    try {
      if (temperature === null || temperature === undefined) {
        logger.error('TemperatureDao.saveTemperature: 온도 값이 제공되지 않았습니다.');
        throw new Error('온도 값이 필요합니다.');
      }
      
      if (typeof temperature !== 'number' || isNaN(temperature)) {
        logger.error(`TemperatureDao.saveTemperature: 유효하지 않은 온도 값: ${temperature}`);
        throw new Error('온도 값은 유효한 숫자여야 합니다.');
      }
      
      if (farmCode === null || farmCode === undefined || farmCode.trim() === '') {
        logger.error('TemperatureDao.saveTemperature: 농장코드가 제공되지 않았습니다.');
        throw new Error('농장코드가 필요합니다.');
      }

      const farm = await Farm.findOne({ where: { farmCode } });
      if (!farm) {
        logger.error(`TemperatureDao.saveTemperature: 농장을 찾을 수 없습니다 - 농장코드: ${farmCode}`);
        throw new Error(`농장코드 ${farmCode}에 해당하는 농장을 찾을 수 없습니다.`);
      }

      const result = await Temperature.create({
        temperature,
        farmId: farm.id
      });
      
      logger.info(`TemperatureDao.saveTemperature: 온도 데이터 저장 완료 - ID: ${result.id}, 농장코드: ${farmCode}`);
      return result;
    } catch (error) {
      if (error.message.includes('농장코드') || 
          error.message.includes('온도 값') || 
          error.message.includes('농장코드가 필요합니다')) {
        throw error;
      }
      
      logger.error(`TemperatureDao.saveTemperature: 온도 데이터 저장 실패 - 농장코드: ${farmCode}, 에러: ${error.message}`);
      throw new Error(`온도 데이터 저장에 실패했습니다: ${error.message}`);
    }
  }

  static async getTemperatureByFarmId(farmId) {
    try {
      if (farmId === null || farmId === undefined) {
        logger.error('TemperatureDao.getTemperatureByFarmId: 농장ID가 제공되지 않았습니다.');
        throw new Error('농장ID가 필요합니다.');
      }
      
      if (typeof farmId !== 'number' || isNaN(farmId) || farmId <= 0) {
        logger.error(`TemperatureDao.getTemperatureByFarmId: 유효하지 않은 농장ID: ${farmId}`);
        throw new Error('농장ID는 유효한 양수여야 합니다.');
      }

      const result = await Temperature.findOne({ 
        where: { farmId },
        order: [['createdAt', 'DESC']]
      });
      
      if (result) {
        logger.info(`TemperatureDao.getTemperatureByFarmId: 온도 데이터 조회 완료 - 농장ID: ${farmId}, 온도: ${result.temperature}`);
      } else {
        logger.info(`TemperatureDao.getTemperatureByFarmId: 온도 데이터를 찾을 수 없음 - 농장ID: ${farmId}`);
      }
      
      return result;
    } catch (error) {
      if (error.message.includes('농장ID')) {
        throw error;
      }
      
      logger.error(`TemperatureDao.getTemperatureByFarmId: 농장ID로 온도 데이터 조회 실패 - 농장ID: ${farmId}, 에러: ${error.message}`);
      throw new Error(`농장ID로 온도 데이터 조회에 실패했습니다: ${error.message}`);
    }
  }

  static async getTemperatureByFarmCode(farmCode) {
    try {
      if (farmCode === null || farmCode === undefined || farmCode.trim() === '') {
        logger.error('TemperatureDao.getTemperatureByFarmCode: 농장코드가 제공되지 않았습니다.');
        throw new Error('농장코드가 필요합니다.');
      }

      const farm = await Farm.findOne({ where: { farmCode } });
      if (!farm) {
        logger.error(`TemperatureDao.getTemperatureByFarmCode: 농장을 찾을 수 없습니다 - 농장코드: ${farmCode}`);
        throw new Error(`농장코드 ${farmCode}에 해당하는 농장을 찾을 수 없습니다.`);
      }

      const result = await Temperature.findOne({ 
        where: { farmId: farm.id },
        order: [['createdAt', 'DESC']]
      });
      
      if (result) {
        logger.info(`TemperatureDao.getTemperatureByFarmCode: 온도 데이터 조회 완료 - 농장코드: ${farmCode}, 온도: ${result.temperature}`);
      } else {
        logger.info(`TemperatureDao.getTemperatureByFarmCode: 온도 데이터를 찾을 수 없음 - 농장코드: ${farmCode}`);
      }
      
      return result;
    } catch (error) {
      if (error.message.includes('농장코드') || 
          error.message.includes('농장을 찾을 수 없습니다')) {
        throw error;
      }
      
      logger.error(`TemperatureDao.getTemperatureByFarmCode: 농장코드로 온도 데이터 조회 실패 - 농장코드: ${farmCode}, 에러: ${error.message}`);
      throw new Error(`농장코드로 온도 데이터 조회에 실패했습니다: ${error.message}`);
    }
  }
}

export default TemperatureDao;

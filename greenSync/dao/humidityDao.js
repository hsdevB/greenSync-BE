import Humidity from '../models/humidity.js';
import Farm from '../models/farm.js';
import Logger from '../utils/logger.js';

class HumidityDao {
  static async saveHumidity(humidity, farmCode) {
    try {
      if (humidity === null || humidity === undefined) {
        Logger.error('HumidityDao.saveHumidity: 습도 값이 제공되지 않았습니다.');
        throw new Error('습도 값이 필요합니다.');
      }
      
      if (typeof humidity !== 'number' || isNaN(humidity)) {
        Logger.error(`HumidityDao.saveHumidity: 유효하지 않은 습도 값: ${humidity}`);
        throw new Error('습도 값은 유효한 숫자여야 합니다.');
      }
      
      if (farmCode === null || farmCode === undefined || farmCode.trim() === '') {
        Logger.error('HumidityDao.saveHumidity: 농장코드가 제공되지 않았습니다.');
        throw new Error('농장코드가 필요합니다.');
      }

      const farm = await Farm.findOne({ where: { farmCode } });
      if (!farm) {
        Logger.error(`HumidityDao.saveHumidity: 농장을 찾을 수 없습니다 - 농장코드: ${farmCode}`);
        throw new Error(`농장코드 ${farmCode}에 해당하는 농장을 찾을 수 없습니다.`);
      }

      const result = await Humidity.create({ 
          humidity,
          farmId: farm.id
      });
      
      Logger.info(`HumidityDao.saveHumidity: 습도 데이터 저장 완료 - ID: ${result.id}, 농장코드: ${farmCode}`);
      return result;
    } catch (error) {
      if (error.message.includes('농장코드') || 
          error.message.includes('습도 값') || 
          error.message.includes('농장코드가 필요합니다')) {
        throw error;
      }
      
      Logger.error(`HumidityDao.saveHumidity: 습도 데이터 저장 실패 - 농장코드: ${farmCode}, 에러: ${error.message}`);
      throw new Error(`습도 데이터 저장에 실패했습니다: ${error.message}`);
    }
  }

  static async getHumidityByFarmId(farmId) {
    try {
      if (farmId === null || farmId === undefined) {
        Logger.error('HumidityDao.getHumidityByFarmId: 농장ID가 제공되지 않았습니다.');
        throw new Error('농장ID가 필요합니다.');
      }
      
      if (typeof farmId !== 'number' || isNaN(farmId) || farmId <= 0) {
        Logger.error(`HumidityDao.getHumidityByFarmId: 유효하지 않은 농장ID: ${farmId}`);
        throw new Error('농장ID는 유효한 양수여야 합니다.');
      }

      const result = await Humidity.findOne({ 
        where: { farmId },
        order: [['createdAt', 'DESC']],
      });
      
      Logger.info(`HumidityDao.getHumidityByFarmId: 습도 데이터 조회 완료 - 농장ID: ${farmId}`);
      return result;
    } catch (error) {
      if (error.message.includes('농장ID')) {
        throw error;
      }
      
      Logger.error(`HumidityDao.getHumidityByFarmId: 농장ID로 습도 데이터 조회 실패 - 농장ID: ${farmId}, 에러: ${error.message}`);
      throw new Error(`농장ID로 습도 데이터 조회에 실패했습니다: ${error.message}`);
    }
  }

  static async getHumidityByFarmCode(farmCode) {
    try {
      if (farmCode === null || farmCode === undefined || farmCode.trim() === '') {
        Logger.error('HumidityDao.getHumidityByFarmCode: 농장코드가 제공되지 않았습니다.');
        throw new Error('농장코드가 필요합니다.');
      }

      const farm = await Farm.findOne({ where: { farmCode } });
      if (!farm) {
        Logger.error(`HumidityDao.getHumidityByFarmCode: 농장을 찾을 수 없습니다 - 농장코드: ${farmCode}`);
        throw new Error(`농장코드 ${farmCode}에 해당하는 농장을 찾을 수 없습니다.`);
      }

      const result = await Humidity.findOne({ 
        where: { farmId: farm.id },
        order: [['createdAt', 'DESC']],
      });
      
      Logger.info(`HumidityDao.getHumidityByFarmCode: 습도 데이터 조회 완료 - 농장코드: ${farmCode}`);
      return result;
    } catch (error) {
      if (error.message.includes('농장코드') || 
          error.message.includes('농장을 찾을 수 없습니다')) {
        throw error;
      }
      
      Logger.error(`HumidityDao.getHumidityByFarmCode: 농장코드로 습도 데이터 조회 실패 - 농장코드: ${farmCode}, 에러: ${error.message}`);
      throw new Error(`농장코드로 습도 데이터 조회에 실패했습니다: ${error.message}`);
    }
  }
}

export default HumidityDao;

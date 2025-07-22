import Illuminance from '../models/illuminance.js';
import Farm from '../models/farm.js';
import Logger from '../utils/logger.js';

class IlluminanceDao {
  static async saveIlluminance(illuminance, farmCode) {
    try {
      if (illuminance === null || illuminance === undefined) {
        Logger.error('IlluminanceDao.saveIlluminance: 광량 값이 제공되지 않았습니다.');
        throw new Error('광량 값이 필요합니다.');
      }
      
      if (farmCode === null || farmCode === undefined || farmCode.trim() === '') {
        Logger.error('IlluminanceDao.saveIlluminance: 농장코드가 제공되지 않았습니다.');
        throw new Error('농장코드가 필요합니다.');
      }

      const farm = await Farm.findOne({ where: { farmCode } });
      if (!farm) {
        Logger.error(`IlluminanceDao.saveIlluminance: 농장을 찾을 수 없습니다 - 농장코드: ${farmCode}`);
        throw new Error(`농장코드 ${farmCode}에 해당하는 농장을 찾을 수 없습니다.`);
      }

      const result = await Illuminance.create({ 
          illuminance,
          farmId: farm.id
      });
      
      Logger.info(`IlluminanceDao.saveIlluminance: 광량 데이터 저장 완료 - ID: ${result.id}, 농장코드: ${farmCode}`);
      return result;
    } catch (error) {
      if (error.message.includes('농장코드') || 
          error.message.includes('광량 값') || 
          error.message.includes('농장코드가 필요합니다')) {
        throw error;
      }
      
      Logger.error(`IlluminanceDao.saveIlluminance: 광량 데이터 저장 실패 - 농장코드: ${farmCode}, 에러: ${error.message}`);
      throw new Error(`광량 데이터 저장에 실패했습니다: ${error.message}`);
    }
  }

  static async getIlluminanceByFarmId(farmId) {
    try {
      if (farmId === null || farmId === undefined) {
        Logger.error('IlluminanceDao.getIlluminanceByFarmId: 농장ID가 제공되지 않았습니다.');
        throw new Error('농장ID가 필요합니다.');
      }
      
      if (typeof farmId !== 'number' || isNaN(farmId) || farmId <= 0) {
        Logger.error(`IlluminanceDao.getIlluminanceByFarmId: 유효하지 않은 농장ID: ${farmId}`);
        throw new Error('농장ID는 유효한 양수여야 합니다.');
      }

      const result = await Illuminance.findOne({ 
        where: { farmId },
        order: [['createdAt', 'DESC']],
      });
      
      Logger.info(`IlluminanceDao.getIlluminanceByFarmId: 광량 데이터 조회 완료 - 농장ID: ${farmId}`);
      return result;
    } catch (error) {
      if (error.message.includes('농장ID')) {
        throw error;
      }
      
      Logger.error(`IlluminanceDao.getIlluminanceByFarmId: 농장ID로 광량 데이터 조회 실패 - 농장ID: ${farmId}, 에러: ${error.message}`);
      throw new Error(`농장ID로 광량 데이터 조회에 실패했습니다: ${error.message}`);
    }
  }

  static async getIlluminanceByFarmCode(farmCode) {
    try {
      if (farmCode === null || farmCode === undefined || farmCode.trim() === '') {
        Logger.error('IlluminanceDao.getIlluminanceByFarmCode: 농장코드가 제공되지 않았습니다.');
        throw new Error('농장코드가 필요합니다.');
      }

      const farm = await Farm.findOne({ where: { farmCode } });
      if (!farm) {
        Logger.error(`IlluminanceDao.getIlluminanceByFarmCode: 농장을 찾을 수 없습니다 - 농장코드: ${farmCode}`);
        throw new Error(`농장코드 ${farmCode}에 해당하는 농장을 찾을 수 없습니다.`);
      }

      const result = await Illuminance.findOne({ 
        where: { farmId: farm.id },
        order: [['createdAt', 'DESC']],
      });
      
      Logger.info(`IlluminanceDao.getIlluminanceByFarmCode: 광량 데이터 조회 완료 - 농장코드: ${farmCode}`);
      return result;
    } catch (error) {
      if (error.message.includes('농장코드') || 
          error.message.includes('농장을 찾을 수 없습니다')) {
        throw error;
      }
      
      Logger.error(`IlluminanceDao.getIlluminanceByFarmCode: 농장코드로 광량 데이터 조회 실패 - 농장코드: ${farmCode}, 에러: ${error.message}`);
      throw new Error(`농장코드로 광량 데이터 조회에 실패했습니다: ${error.message}`);
    }
  }
}

export default IlluminanceDao;

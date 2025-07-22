import CarbonDioxide from '../models/carbonDioxide.js';
import Farm from '../models/farm.js';
import Logger from '../utils/logger.js';

class CarbonDioxideDao {
  static async saveCarbonDioxide(co2, farmCode) {
    try {
      if (co2 === null || co2 === undefined) {
        Logger.error('CarbonDioxideDao.saveCarbonDioxide: 이산화탄소 값이 제공되지 않았습니다.');
        throw new Error('이산화탄소 값이 필요합니다.');
      }
      
      if (typeof co2 !== 'number' || isNaN(co2)) {
        Logger.error(`CarbonDioxideDao.saveCarbonDioxide: 유효하지 않은 이산화탄소 값: ${co2}`);
        throw new Error('이산화탄소 값은 유효한 숫자여야 합니다.');
      }
      
      if (farmCode === null || farmCode === undefined || farmCode.trim() === '') {
        Logger.error('CarbonDioxideDao.saveCarbonDioxide: 농장코드가 제공되지 않았습니다.');
        throw new Error('농장코드가 필요합니다.');
      }

      const farm = await Farm.findOne({ where: { farmCode } });
      if (!farm) {
        Logger.error(`CarbonDioxideDao.saveCarbonDioxide: 농장을 찾을 수 없습니다 - 농장코드: ${farmCode}`);
        throw new Error(`농장코드 ${farmCode}에 해당하는 농장을 찾을 수 없습니다.`);
      }

      const result = await CarbonDioxide.create({ 
          co2,
          farmId: farm.id
      });
      
      Logger.info(`CarbonDioxideDao.saveCarbonDioxide: 이산화탄소 데이터 저장 완료 - ID: ${result.id}, 농장코드: ${farmCode}`);
      return result;
    } catch (error) {
      if (error.message.includes('농장코드') || 
          error.message.includes('이산화탄소 값') || 
          error.message.includes('농장코드가 필요합니다')) {
        throw error;
      }
      
      Logger.error(`CarbonDioxideDao.saveCarbonDioxide: 이산화탄소 데이터 저장 실패 - 농장코드: ${farmCode}, 에러: ${error.message}`);
      throw new Error(`이산화탄소 데이터 저장에 실패했습니다: ${error.message}`);
    }
  }

  static async getCarbonDioxideByFarmId(farmId) {
    try {
      if (farmId === null || farmId === undefined) {
        Logger.error('CarbonDioxideDao.getCarbonDioxideByFarmId: 농장ID가 제공되지 않았습니다.');
        throw new Error('농장ID가 필요합니다.');
      }
      
      if (typeof farmId !== 'number' || isNaN(farmId) || farmId <= 0) {
        Logger.error(`CarbonDioxideDao.getCarbonDioxideByFarmId: 유효하지 않은 농장ID: ${farmId}`);
        throw new Error('농장ID는 유효한 양수여야 합니다.');
      }

      const result = await CarbonDioxide.findOne({ 
        where: { farmId },
        order: [['createdAt', 'DESC']],
      }); 
      
      Logger.info(`CarbonDioxideDao.getCarbonDioxideByFarmId: 이산화탄소 데이터 조회 완료 - 농장ID: ${farmId}`);
      return result;
    } catch (error) {
      if (error.message.includes('농장ID')) {
        throw error;
      }
      
      Logger.error(`CarbonDioxideDao.getCarbonDioxideByFarmId: 농장ID로 이산화탄소 데이터 조회 실패 - 농장ID: ${farmId}, 에러: ${error.message}`);
      throw new Error(`농장ID로 이산화탄소 데이터 조회에 실패했습니다: ${error.message}`);
    }
  }

  static async getCarbonDioxideByFarmCode(farmCode) {
    try {
      if (farmCode === null || farmCode === undefined || farmCode.trim() === '') {
        Logger.error('CarbonDioxideDao.getCarbonDioxideByFarmCode: 농장코드가 제공되지 않았습니다.');
        throw new Error('농장코드가 필요합니다.');
      }

      const farm = await Farm.findOne({ where: { farmCode } });
      if (!farm) {
        Logger.error(`CarbonDioxideDao.getCarbonDioxideByFarmCode: 농장을 찾을 수 없습니다 - 농장코드: ${farmCode}`);
        throw new Error(`농장코드 ${farmCode}에 해당하는 농장을 찾을 수 없습니다.`);
      }

      const result = await CarbonDioxide.findOne({ 
        where: { farmId: farm.id },
        order: [['createdAt', 'DESC']],
      });
      
      Logger.info(`CarbonDioxideDao.getCarbonDioxideByFarmCode: 이산화탄소 데이터 조회 완료 - 농장코드: ${farmCode}`);
      return result;
    } catch (error) {
      if (error.message.includes('농장코드') || 
          error.message.includes('농장을 찾을 수 없습니다')) {
        throw error;
      }
      
      Logger.error(`CarbonDioxideDao.getCarbonDioxideByFarmCode: 농장코드로 이산화탄소 데이터 조회 실패 - 농장코드: ${farmCode}, 에러: ${error.message}`);
      throw new Error(`농장코드로 이산화탄소 데이터 조회에 실패했습니다: ${error.message}`);
    }
  }
}

export default CarbonDioxideDao;

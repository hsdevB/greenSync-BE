import Nutrient from '../models/nutrient.js';
import Farm from '../models/farm.js';
import logger from '../utils/logger.js';

class NutrientDao {
  static async saveNutrient(phLevel, elcDT, farmCode) {
    try {
      if (phLevel === null || phLevel === undefined) {
        logger.error('NutrientDao.saveNutrient: pH 레벨이 제공되지 않았습니다.');
        throw new Error('pH 레벨이 필요합니다.');
      }
      
      if (typeof phLevel !== 'number' || isNaN(phLevel)) {
        logger.error(`NutrientDao.saveNutrient: 유효하지 않은 pH 레벨: ${phLevel}`);
        throw new Error('pH 레벨은 유효한 숫자여야 합니다.');
      }
      
      if (elcDT === null || elcDT === undefined) {
        logger.error('NutrientDao.saveNutrient: 전기전도도가 제공되지 않았습니다.');
        throw new Error('전기전도도가 필요합니다.');
      }
      
      if (typeof elcDT !== 'number' || isNaN(elcDT)) {
        logger.error(`NutrientDao.saveNutrient: 유효하지 않은 전기전도도: ${elcDT}`);
        throw new Error('전기전도도는 유효한 숫자여야 합니다.');
      }
      
      if (farmCode === null || farmCode === undefined || farmCode.trim() === '') {
        logger.error('NutrientDao.saveNutrient: 농장코드가 제공되지 않았습니다.');
        throw new Error('농장코드가 필요합니다.');
      }

      const farm = await Farm.findOne({ where: { farmCode } });
      if (!farm) {
        logger.error(`NutrientDao.saveNutrient: 농장을 찾을 수 없습니다 - 농장코드: ${farmCode}`);
        throw new Error(`농장코드 ${farmCode}에 해당하는 농장을 찾을 수 없습니다.`);
      }

      const result = await Nutrient.create({ 
          phLevel,
          elcDT,
          farmId: farm.id
      });
      
      logger.info(`NutrientDao.saveNutrient: 양액 데이터 저장 완료 - ID: ${result.id}, 농장코드: ${farmCode}`);
      return result;
    } catch (error) {
      if (error.message.includes('농장코드') || 
          error.message.includes('pH 레벨') || 
          error.message.includes('전기전도도') || 
          error.message.includes('농장코드가 필요합니다')) {
        throw error;
      }
      
      logger.error(`NutrientDao.saveNutrient: 양액 데이터 저장 실패 - 농장코드: ${farmCode}, 에러: ${error.message}`);
      throw new Error(`양액 데이터 저장에 실패했습니다: ${error.message}`);
    }
  }

  static async getNutrientByFarmId(farmId) {
    try {
      if (farmId === null || farmId === undefined) {
        logger.error('NutrientDao.getNutrientByFarmId: 농장ID가 제공되지 않았습니다.');
        throw new Error('농장ID가 필요합니다.');
      }
      
      if (typeof farmId !== 'number' || isNaN(farmId) || farmId <= 0) {
        logger.error(`NutrientDao.getNutrientByFarmId: 유효하지 않은 농장ID: ${farmId}`);
        throw new Error('농장ID는 유효한 양수여야 합니다.');
      }

      const result = await Nutrient.findAll({ 
        where: { farmId },
        order: [['createdAt', 'DESC']],
        limit: 15
      });
      
      logger.info(`NutrientDao.getNutrientByFarmId: 양액 데이터 조회 완료 - 농장ID: ${farmId}, 조회된 레코드 수: ${result.length}`);
      return result;
    } catch (error) {
      if (error.message.includes('농장ID')) {
        throw error;
      }
      
      logger.error(`NutrientDao.getNutrientByFarmId: 농장ID로 양액 데이터 조회 실패 - 농장ID: ${farmId}, 에러: ${error.message}`);
      throw new Error(`농장ID로 양액 데이터 조회에 실패했습니다: ${error.message}`);
    }
  }

  static async getNutrientByFarmCode(farmCode) {
    try {
      if (farmCode === null || farmCode === undefined || farmCode.trim() === '') {
        logger.error('NutrientDao.getNutrientByFarmCode: 농장코드가 제공되지 않았습니다.');
        throw new Error('농장코드가 필요합니다.');
      }

      const farm = await Farm.findOne({ where: { farmCode } });
      if (!farm) {
        logger.error(`NutrientDao.getNutrientByFarmCode: 농장을 찾을 수 없습니다 - 농장코드: ${farmCode}`);
        throw new Error(`농장코드 ${farmCode}에 해당하는 농장을 찾을 수 없습니다.`);
      }

      const result = await Nutrient.findAll({ 
        where: { farmId: farm.id },
        order: [['createdAt', 'DESC']],
        limit: 15
      });
      
      logger.info(`NutrientDao.getNutrientByFarmCode: 양액 데이터 조회 완료 - 농장코드: ${farmCode}, 조회된 레코드 수: ${result.length}`);
      return result;
    } catch (error) {
      if (error.message.includes('농장코드') || 
          error.message.includes('농장을 찾을 수 없습니다')) {
        throw error;
      }
      
      logger.error(`NutrientDao.getNutrientByFarmCode: 농장코드로 양액 데이터 조회 실패 - 농장코드: ${farmCode}, 에러: ${error.message}`);
      throw new Error(`농장코드로 양액 데이터 조회에 실패했습니다: ${error.message}`);
    }
  }
}

export default NutrientDao;

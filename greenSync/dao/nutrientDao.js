import Nutrient from '../models/nutrient.js';
import Farm from '../models/farm.js';
import Logger from '../utils/logger.js';
import { Op } from 'sequelize';

class NutrientDao {
  static async saveNutrient(phLevel, elcDT, farmCode) {
    try {
      if (phLevel === null || phLevel === undefined) {
        Logger.error('NutrientDao.saveNutrient: pH 레벨이 제공되지 않았습니다.');
        throw new Error('pH 레벨이 필요합니다.');
      }
      
      if (typeof phLevel !== 'number' || isNaN(phLevel)) {
        Logger.error(`NutrientDao.saveNutrient: 유효하지 않은 pH 레벨: ${phLevel}`);
        throw new Error('pH 레벨은 유효한 숫자여야 합니다.');
      }
      
      if (elcDT === null || elcDT === undefined) {
        Logger.error('NutrientDao.saveNutrient: 전기전도도가 제공되지 않았습니다.');
        throw new Error('전기전도도가 필요합니다.');
      }
      
      if (typeof elcDT !== 'number' || isNaN(elcDT)) {
        Logger.error(`NutrientDao.saveNutrient: 유효하지 않은 전기전도도: ${elcDT}`);
        throw new Error('전기전도도는 유효한 숫자여야 합니다.');
      }
      
      if (farmCode === null || farmCode === undefined || farmCode.trim() === '') {
        Logger.error('NutrientDao.saveNutrient: 농장코드가 제공되지 않았습니다.');
        throw new Error('농장코드가 필요합니다.');
      }

      const farm = await Farm.findOne({ where: { farmCode } });
      if (!farm) {
        Logger.error(`NutrientDao.saveNutrient: 농장을 찾을 수 없습니다 - 농장코드: ${farmCode}`);
        throw new Error(`농장코드 ${farmCode}에 해당하는 농장을 찾을 수 없습니다.`);
      }

      const result = await Nutrient.create({ 
          phLevel,
          elcDT,
          farmId: farm.id
      });
      
      Logger.info(`NutrientDao.saveNutrient: 양액 데이터 저장 완료 - ID: ${result.id}, 농장코드: ${farmCode}`);
      return result;
    } catch (error) {
      if (error.message.includes('농장코드') || 
          error.message.includes('pH 레벨') || 
          error.message.includes('전기전도도') || 
          error.message.includes('농장코드가 필요합니다')) {
        throw error;
      }
      
      Logger.error(`NutrientDao.saveNutrient: 양액 데이터 저장 실패 - 농장코드: ${farmCode}, 에러: ${error.message}`);
      throw new Error(`양액 데이터 저장에 실패했습니다: ${error.message}`);
    }
  }

  static async getNutrientByFarmId(farmId) {
    try {
      if (farmId === null || farmId === undefined) {
        Logger.error('NutrientDao.getNutrientByFarmId: 농장ID가 제공되지 않았습니다.');
        throw new Error('농장ID가 필요합니다.');
      }
      
      if (typeof farmId !== 'number' || isNaN(farmId) || farmId <= 0) {
        Logger.error(`NutrientDao.getNutrientByFarmId: 유효하지 않은 농장ID: ${farmId}`);
        throw new Error('농장ID는 유효한 양수여야 합니다.');
      }

      const result = await Nutrient.findOne({ 
        where: { farmId },
        order: [['createdAt', 'DESC']],
      });
      
      Logger.info(`NutrientDao.getNutrientByFarmId: 양액 데이터 조회 완료 - 농장ID: ${farmId}`);
      return result;
    } catch (error) {
      if (error.message.includes('농장ID')) {
        throw error;
      }
      
      Logger.error(`NutrientDao.getNutrientByFarmId: 농장ID로 양액 데이터 조회 실패 - 농장ID: ${farmId}, 에러: ${error.message}`);
      throw new Error(`농장ID로 양액 데이터 조회에 실패했습니다: ${error.message}`);
    }
  }

  static async getNutrientByFarmCode(farmCode) {
    try {
      if (farmCode === null || farmCode === undefined || farmCode.trim() === '') {
        Logger.error('NutrientDao.getNutrientByFarmCode: 농장코드가 제공되지 않았습니다.');
        throw new Error('농장코드가 필요합니다.');
      }

      const farm = await Farm.findOne({ where: { farmCode } });
      if (!farm) {
        Logger.error(`NutrientDao.getNutrientByFarmCode: 농장을 찾을 수 없습니다 - 농장코드: ${farmCode}`);
        throw new Error(`농장코드 ${farmCode}에 해당하는 농장을 찾을 수 없습니다.`);
      }

      const result = await Nutrient.findOne({ 
        where: { farmId: farm.id },
        order: [['createdAt', 'DESC']],
      });
      
      Logger.info(`NutrientDao.getNutrientByFarmCode: 양액 데이터 조회 완료 - 농장코드: ${farmCode}`);
      return result;
    } catch (error) {
      if (error.message.includes('농장코드') || 
          error.message.includes('농장을 찾을 수 없습니다')) {
        throw error;
      }
      
      Logger.error(`NutrientDao.getNutrientByFarmCode: 농장코드로 양액 데이터 조회 실패 - 농장코드: ${farmCode}, 에러: ${error.message}`);
      throw new Error(`농장코드로 양액 데이터 조회에 실패했습니다: ${error.message}`);
    }
  }

  static async getNutrientDataByFarmIdAndDateRange(farmId, startDate, endDate) {
    try {
      if (!farmId || typeof farmId !== 'number' || farmId <= 0) {
        throw new Error('유효한 농장 ID가 필요합니다.');
      }
      if (!startDate || !(startDate instanceof Date)) {
        throw new Error('유효한 시작 날짜가 필요합니다.');
      }
      if (!endDate || !(endDate instanceof Date)) {
        throw new Error('유효한 종료 날짜가 필요합니다.');
      }

      const nutrientData = await Nutrient.findAll({
        where: {
          farmId,
          createdAt: {
            [Op.gte]: startDate,
            [Op.lt]: endDate
          }
        },
        order: [['createdAt', 'ASC']]
      });
      return nutrientData;
    } catch (error) {
      Logger.error(`NutrientDao.getNutrientDataByFarmIdAndDateRange: 양액 데이터 조회 실패 - 농장ID: ${farmId}, 에러: ${error.message}`);
      throw error;
    }
  }
}

export default NutrientDao;

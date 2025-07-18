import logger from '../utils/logger.js';
import Farm from '../models/farm.js';

class FarmDao {
  static async insert(params) {
    try {
      if (!params || typeof params !== 'object') {
        logger.error('FarmDao.insert: 농장 데이터 파라미터가 제공되지 않았습니다.');
        throw new Error('농장 데이터 파라미터가 필요합니다.');
      }

      if (!params.farmCode || params.farmCode.trim() === '') {
        logger.error('FarmDao.insert: 농장코드가 제공되지 않았습니다.');
        throw new Error('농장코드는 필수값입니다.');
      }

      const inserted = await Farm.create(params);
      logger.info(`FarmDao.insert: 농장 데이터 저장 완료 - ID: ${inserted.id}, 농장코드: ${inserted.farmCode}`);
      return { farmId: inserted.id, farmCode: inserted.farmCode };
    } catch (err) {
      if (err.message.includes('농장 데이터 파라미터') || 
          err.message.includes('농장코드는 필수값입니다')) {
        throw err;
      }
      logger.error(`FarmDao.insert: 농장 데이터 저장 실패 - 에러: ${err.message}`);
      throw new Error(`농장 데이터 저장에 실패했습니다: ${err.message}`);
    }
  }

  static async selectByFarmCode(farmCode) {
    try {
      if (!farmCode || farmCode.trim() === '') {
        logger.error('FarmDao.selectByFarmCode: 농장코드가 제공되지 않았습니다.');
        throw new Error('농장코드는 필수값입니다.');
      }

      const result = await Farm.findOne({
        where: { farmCode }
      });
      
      if (result) {
        logger.info(`FarmDao.selectByFarmCode: 농장 조회 완료 - 농장코드: ${farmCode}, ID: ${result.id}`);
      } else {
        logger.info(`FarmDao.selectByFarmCode: 농장을 찾을 수 없음 - 농장코드: ${farmCode}`);
      }
      
      return result;
    } catch (err) {
      if (err.message.includes('농장코드는 필수값입니다')) {
        throw err;
      }
      logger.error(`FarmDao.selectByFarmCode: 농장 조회 실패 - 농장코드: ${farmCode}, 에러: ${err.message}`);
      throw new Error(`농장 조회에 실패했습니다: ${err.message}`);
    }
  }

  static async selectById(id) {
    try {
      if (!id || typeof id !== 'number' || isNaN(id) || id <= 0) {
        logger.error(`FarmDao.selectById: 유효하지 않은 농장ID: ${id}`);
        throw new Error('유효한 농장ID가 필요합니다.');
      }

      const result = await Farm.findByPk(id);
      
      if (result) {
        logger.info(`FarmDao.selectById: 농장 조회 완료 - ID: ${id}, 농장코드: ${result.farmCode}`);
      } else {
        logger.info(`FarmDao.selectById: 농장을 찾을 수 없음 - ID: ${id}`);
      }
      
      return result;
    } catch (err) {
      if (err.message.includes('유효한 농장ID가 필요합니다')) {
        throw err;
      }
      logger.error(`FarmDao.selectById: 농장 조회 실패 - ID: ${id}, 에러: ${err.message}`);
      throw new Error(`농장 조회에 실패했습니다: ${err.message}`);
    }
  }

  static async checkFarmCodeExists(farmCode) {
    try {
      if (!farmCode || farmCode.trim() === '') {
        logger.error('FarmDao.checkFarmCodeExists: 농장코드가 제공되지 않았습니다.');
        throw new Error('농장코드는 필수값입니다.');
      }

      const count = await Farm.count({
        where: { farmCode }
      });
      
      const exists = count > 0;
      logger.info(`FarmDao.checkFarmCodeExists: 농장코드 존재 여부 확인 완료 - 농장코드: ${farmCode}, 존재: ${exists}`);
      return exists;
    } catch (err) {
      if (err.message.includes('농장코드는 필수값입니다')) {
        throw err;
      }
      logger.error(`FarmDao.checkFarmCodeExists: 농장코드 존재 여부 확인 실패 - 농장코드: ${farmCode}, 에러: ${err.message}`);
      throw new Error(`농장코드 존재 여부 확인에 실패했습니다: ${err.message}`);
    }
  }
}

export default FarmDao;
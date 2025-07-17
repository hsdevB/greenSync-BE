import logger from '../utils/logger.js';
import Farm from '../models/farm.js';

class FarmDao {
  static async insert(params) {
    try {
      const inserted = await Farm.create(params);
      return { farmId: inserted.id, farmCode: inserted.farmCode };
    } catch (err) {
      logger.error(`farmDao.insert error: ${err.message}`);
      throw err;
    }
  }

  static async selectByFarmCode(farmCode) {
    try {
      if (!farmCode) {
        throw new Error('farmCode(팜코드)는 필수값입니다.');
      }
      const result = await Farm.findOne({
        where: { farmCode }
      });
      return result;
    } catch (err) {
      logger.error(`farmDao.selectByFarmCode error: ${err.message}`);
      throw err;
    }
  }

  static async selectById(id) {
    try {
      const result = await Farm.findByPk(id);
      return result;
    } catch (err) {
      logger.error(`farmDao.selectById error: ${err.message}`);
      throw err;
    }
  }

  static async checkFarmCodeExists(farmCode) {
    try {
      const count = await Farm.count({
        where: { farmCode }
      });
      return count > 0;
    } catch (err) {
      logger.error(`farmDao.checkFarmCodeExists error: ${err.message}`);
      throw err;
    }
  }
}

export default FarmDao;
import FarmDao from '../dao/farmDao.js';
import FarmCodeGenerator from '../utils/farmCode.js';
import logger from '../utils/logger.js';

class FarmService {
  static async generateFarmCode() {
    try {
      let farmCode;
      let isUnique = false;
      let attempts = 0;
      const maxAttempts = 100;

      // 중복되지 않는 팜코드 생성
      while (!isUnique && attempts < maxAttempts) {
        farmCode = FarmCodeGenerator.farmCode();
        const exists = await FarmDao.checkFarmCodeExists(farmCode);
        
        if (!exists) {
          isUnique = true;
        }
        attempts++;
      }

      if (!isUnique) {
        throw new Error('팜코드 생성 실패: 최대 시도 횟수 초과');
      }

      // 생성된 팜코드로 농장 정보 저장
      const farmData = {
        farmCode,
        description: `자동 생성된 농장 (코드: ${farmCode})`,
        isActive: true
      };

      const result = await FarmDao.insert(farmData);
      
      logger.info(`farmService.generateFarmCode.response result: ${JSON.stringify(result)}`);
      return {
        farmId: result.insertedId,
        farmCode: farmCode,
      };
      
    } catch (err) {
      logger.error(`farmService.generateFarmCode error: ${err.message}`);
      throw err;
    }
  }

  static async getFarmByCode(farmCode) {
    try {
      if (!FarmCodeGenerator.validateFarmCode(farmCode)) {
        throw new Error('유효하지 않은 팜코드 형식입니다.');
      }

      const result = await FarmDao.selectByFarmCode(farmCode);
      
      if (!result) {
        throw new Error('존재하지 않는 팜코드입니다.');
      }

      return result;
      
    } catch (err) {
      logger.error(`farmService.getFarmByCode error: ${err.message}`);
      throw err;
    }
  }
}

export default FarmService;
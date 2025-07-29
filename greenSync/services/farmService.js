import FarmDao from '../dao/farmDao.js';
import FarmCode from '../utils/farmCode.js';
import deviceStatusDao from '../dao/deviceStatusDao.js';
import Logger from '../utils/logger.js';

class FarmService {
  static async generateFarmCode() {
    try {
      let farmCode;
      let isUnique = false;
      let attempts = 0;
      const maxAttempts = 100;

      while (!isUnique && attempts < maxAttempts) {
        farmCode = FarmCode.createFarmCode();
        const exists = await FarmDao.checkFarmCodeExists(farmCode);
        
        if (!exists) {
          isUnique = true;
        }
        attempts++;
      }

      if (!isUnique) {
        Logger.error('FarmService.generateFarmCode: 최대 시도 횟수 초과로 팜코드 생성 실패');
        throw new Error('팜코드 생성 실패: 최대 시도 횟수 초과');
      }

      const farmData = {
        farmCode,
        farmType: null,
        houseType: null,
      };

      const result = await FarmDao.insert(farmData);
      
      // deviceStatus 초기 데이터 생성
      await deviceStatusDao.createInitialDeviceStatus(result.farmId);
      
      Logger.info(`FarmService.generateFarmCode: 팜코드 생성 완료 - 농장코드: ${result.farmCode}, 농장ID: ${result.farmId}`);
      return {
        farmCode: result.farmCode,
        farmId: result.farmId
      };
      
    } catch (err) {
      if (err.message.includes('최대 시도 횟수 초과')) {
        throw err;
      }
      Logger.error(`FarmService.generateFarmCode: 팜코드 생성 실패 - 에러: ${err.message}`);
      throw new Error(`팜코드 생성에 실패했습니다: ${err.message}`);
    }
  }

  static async getFarmByCode(farmCode) {
    try {
      if (!farmCode || typeof farmCode !== 'string' || farmCode.trim() === '') {
        Logger.error('FarmService.getFarmByCode: 농장코드가 제공되지 않았습니다.');
        throw new Error('농장코드가 필요합니다.');
      }

      if (!FarmCode.validateFarmCode(farmCode)) {
        Logger.error(`FarmService.getFarmByCode: 유효하지 않은 농장코드 형식 - farmCode: ${farmCode}`);
        throw new Error('유효하지 않은 팜코드 형식입니다.');
      }

      const result = await FarmDao.selectByFarmCode(farmCode);
      
      if (!result) {
        Logger.error(`FarmService.getFarmByCode: 존재하지 않는 농장코드 - farmCode: ${farmCode}`);
        throw new Error('존재하지 않는 팜코드입니다.');
      }

      Logger.info(`FarmService.getFarmByCode: 농장 정보 조회 완료 - 농장코드: ${farmCode}, 농장ID: ${result.farmId}`);
      return result;
      
    } catch (err) {
      if (err.message.includes('농장코드가 필요합니다') || 
          err.message.includes('유효하지 않은 팜코드 형식') || 
          err.message.includes('존재하지 않는 팜코드')) {
        throw err;
      }
      Logger.error(`FarmService.getFarmByCode: 농장 정보 조회 실패 - farmCode: ${farmCode}, 에러: ${err.message}`);
      throw new Error(`농장 정보 조회에 실패했습니다: ${err.message}`);
    }
  }
}

export default FarmService;
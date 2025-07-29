import Logger from '../utils/logger.js';
import DeviceStatus from '../models/deviceStatus.js';
import Farm from '../models/farm.js';

class DeviceStatusDao {
  static async saveDeviceStatus(fan, leds, farmCode) {
    try {
      if (!farmCode || typeof farmCode !== 'string' || farmCode.trim() === '') {
        Logger.error('DeviceStatusDao.saveDeviceStatus: 농장코드가 제공되지 않았습니다.');
        throw new Error('농장코드는 필수값입니다.');
      }
      const farm = await Farm.findOne({ where: { farmCode: farmCode } });
      
      if (!farm) {
        Logger.error('DeviceStatusDao.saveDeviceStatus: 농장을 찾을 수 없습니다.');
        throw new Error('농장을 찾을 수 없습니다.');
      }

      if (typeof fan !== 'boolean') {
        Logger.error('DeviceStatusDao.saveDeviceStatus: 팬 상태는 true 또는 false여야 합니다.');
        throw new Error('팬 상태는 true 또는 false여야 합니다.');
      }

      if (!Array.isArray(leds) || leds.length !== 4 || !leds.every(val => typeof val === 'boolean')) {
        Logger.error('DeviceStatusDao.saveDeviceStatus: LEDs 배열은 4개의 불리언 값이어야 합니다.');
        throw new Error('LEDs 배열은 4개의 불리언 값으로 구성되어야 합니다.');
      }

      const record = await DeviceStatus.create({
        farmId: farm.id,
        fan,
        led1: leds[0],
        led2: leds[1],
        led3: leds[2],
        led4: leds[3],
        timestamp: new Date()
      });

      Logger.info(`DeviceStatusDao.saveDeviceStatus: 장치 상태 저장 완료 - ID: ${record.id}, 농장코드: ${farmCode}`);
      return record;
    } catch (err) {
      Logger.error(`DeviceStatusDao.saveDeviceStatus: 장치 상태 저장 실패 - 에러: ${err.message}`);
      throw new Error(`장치 상태 저장에 실패했습니다: ${err.message}`);
    }
  }

  static async getLatestStatusByFarmCode(farmCode) {
    try {
      if (!farmCode || farmCode.trim() === '') {
        Logger.error('DeviceStatusDao.getLatestStatusByFarmCode: 농장코드가 제공되지 않았습니다.');
        throw new Error('농장코드는 필수값입니다.');
      }

      const farm = await Farm.findOne({ where: { farmCode: farmCode } });
      if (!farm) {
        Logger.error('DeviceStatusDao.getLatestStatusByFarmCode: 농장을 찾을 수 없습니다.');
        throw new Error('농장을 찾을 수 없습니다.');
      }

      const result = await DeviceStatus.findOne({
        include: [{
          model: Farm,
          as: 'farm',
          where: { id: farm.id }
        }],
        order: [['timestamp', 'DESC']]
      });

      if (result) {
        Logger.info(`DeviceStatusDao.getLatestStatusByFarmCode: 최신 장치 상태 조회 완료 - 농장코드: ${farmCode}, ID: ${result.id}`);
      } else {
        Logger.info(`DeviceStatusDao.getLatestStatusByFarmCode: 장치 상태 없음 - 농장코드: ${farmCode}`);
      }

      return result;
    } catch (err) {
      Logger.error(`DeviceStatusDao.getLatestStatusByFarmCode: 장치 상태 조회 실패 - 농장코드: ${farmCode}, 에러: ${err.message}`);
      throw new Error(`장치 상태 조회에 실패했습니다: ${err.message}`);
    }
  }

  static async createInitialDeviceStatus(farmId) {
    try {
      if (!farmId || typeof farmId !== 'number' || isNaN(farmId) || farmId <= 0) {
        Logger.error('DeviceStatusDao.createInitialDeviceStatus: 유효하지 않은 농장ID');
        throw new Error('유효한 농장ID가 필요합니다.');
      }

      const record = await DeviceStatus.create({
        farmId: farmId,
        fan: null,
        led1: null,
        led2: null,
        led3: null,
        led4: null,
        controlTemperature: 0,
        controlHumidity: 0,
        timestamp: new Date()
      });

      Logger.info(`DeviceStatusDao.createInitialDeviceStatus: 초기 장치 상태 생성 완료 - ID: ${record.id}, 농장ID: ${farmId}`);
      return record;
    } catch (err) {
      Logger.error(`DeviceStatusDao.createInitialDeviceStatus: 초기 장치 상태 생성 실패 - 농장ID: ${farmId}, 에러: ${err.message}`);
      throw new Error(`초기 장치 상태 생성에 실패했습니다: ${err.message}`);
    }
  }

  static async updateDeviceStatus(farmCode, fan, leds) {
    try {
      if (!farmCode || typeof farmCode !== 'string' || farmCode.trim() === '') {
        Logger.error('DeviceStatusDao.updateDeviceStatus: 농장코드가 제공되지 않았습니다.');
        throw new Error('농장코드는 필수값입니다.');
      }

      const farm = await Farm.findOne({ where: { farmCode: farmCode } });
      if (!farm) {
        Logger.error('DeviceStatusDao.updateDeviceStatus: 농장을 찾을 수 없습니다.');
        throw new Error('농장을 찾을 수 없습니다.');
      }

      if (typeof fan !== 'boolean') {
        Logger.error('DeviceStatusDao.updateDeviceStatus: 팬 상태는 true 또는 false여야 합니다.');
        throw new Error('팬 상태는 true 또는 false여야 합니다.');
      }

      if (!Array.isArray(leds) || leds.length !== 4 || !leds.every(val => typeof val === 'boolean')) {
        Logger.error('DeviceStatusDao.updateDeviceStatus: LEDs 배열은 4개의 불리언 값이어야 합니다.');
        throw new Error('LEDs 배열은 4개의 불리언 값으로 구성되어야 합니다.');
      }

      // 기존 장치 상태 조회
      const existingStatus = await DeviceStatus.findOne({
        where: { farmId: farm.id },
        order: [['timestamp', 'DESC']]
      });

      if (existingStatus) {
        // 기존 데이터 업데이트
        await existingStatus.update({
          fan,
          led1: leds[0],
          led2: leds[1],
          led3: leds[2],
          led4: leds[3],
          timestamp: new Date()
        });

        Logger.info(`DeviceStatusDao.updateDeviceStatus: 장치 상태 업데이트 완료 - ID: ${existingStatus.id}, 농장코드: ${farmCode}`);
        return existingStatus;
      } else {
        // 데이터가 없으면 새로 생성
        const record = await DeviceStatus.create({
          farmId: farm.id,
          fan,
          led1: leds[0],
          led2: leds[1],
          led3: leds[2],
          led4: leds[3],
          timestamp: new Date()
        });

        Logger.info(`DeviceStatusDao.updateDeviceStatus: 장치 상태 생성 완료 - ID: ${record.id}, 농장코드: ${farmCode}`);
        return record;
      }
    } catch (err) {
      Logger.error(`DeviceStatusDao.updateDeviceStatus: 장치 상태 업데이트 실패 - 농장코드: ${farmCode}, 에러: ${err.message}`);
      throw new Error(`장치 상태 업데이트에 실패했습니다: ${err.message}`);
    }
  }

  static async updateControlSettings(farmCode, controlTemperature, controlHumidity) {
    try {
      if (!farmCode || typeof farmCode !== 'string' || farmCode.trim() === '') {
        Logger.error('DeviceStatusDao.updateControlSettings: 농장코드가 제공되지 않았습니다.');
        throw new Error('농장코드는 필수값입니다.');
      }

      const farm = await Farm.findOne({ where: { farmCode: farmCode } });
      if (!farm) {
        Logger.error('DeviceStatusDao.updateControlSettings: 농장을 찾을 수 없습니다.');
        throw new Error('농장을 찾을 수 없습니다.');
      }

      if (controlTemperature !== null && controlTemperature !== undefined) {
        if (typeof controlTemperature !== 'number' || isNaN(controlTemperature)) {
          Logger.error('DeviceStatusDao.updateControlSettings: 제어온도는 유효한 숫자여야 합니다.');
          throw new Error('제어온도는 유효한 숫자여야 합니다.');
        }
      }

      if (controlHumidity !== null && controlHumidity !== undefined) {
        if (typeof controlHumidity !== 'number' || isNaN(controlHumidity)) {
          Logger.error('DeviceStatusDao.updateControlSettings: 제어습도는 유효한 숫자여야 합니다.');
          throw new Error('제어습도는 유효한 숫자여야 합니다.');
        }
      }

      // 기존 장치 상태 조회
      const existingStatus = await DeviceStatus.findOne({
        where: { farmId: farm.id },
        order: [['timestamp', 'DESC']]
      });

      if (existingStatus) {
        // 기존 데이터 업데이트
        const updateData = {};
        if (controlTemperature !== null && controlTemperature !== undefined) {
          updateData.controlTemperature = controlTemperature;
        }
        if (controlHumidity !== null && controlHumidity !== undefined) {
          updateData.controlHumidity = controlHumidity;
        }
        updateData.timestamp = new Date();

        await existingStatus.update(updateData);

        Logger.info(`DeviceStatusDao.updateControlSettings: 제어 설정 업데이트 완료 - ID: ${existingStatus.id}, 농장코드: ${farmCode}`);
        return existingStatus;
      } else {
        // 데이터가 없으면 새로 생성
        const record = await DeviceStatus.create({
          farmId: farm.id,
          fan: null,
          led1: null,
          led2: null,
          led3: null,
          led4: null,
          controlTemperature: controlTemperature || 0,
          controlHumidity: controlHumidity || 0,
          timestamp: new Date()
        });

        Logger.info(`DeviceStatusDao.updateControlSettings: 제어 설정 생성 완료 - ID: ${record.id}, 농장코드: ${farmCode}`);
        return record;
      }
    } catch (err) {
      Logger.error(`DeviceStatusDao.updateControlSettings: 제어 설정 업데이트 실패 - 농장코드: ${farmCode}, 에러: ${err.message}`);
      throw new Error(`제어 설정 업데이트에 실패했습니다: ${err.message}`);
    }
  }

  static async updateDeviceControl(farmCode, controlTemperature, controlHumidity, fan, leds) {
    try {
      if (!farmCode || typeof farmCode !== 'string' || farmCode.trim() === '') {
        Logger.error('DeviceStatusDao.updateDeviceControl: 농장코드가 제공되지 않았습니다.');
        throw new Error('농장코드는 필수값입니다.');
      }

      const farm = await Farm.findOne({ where: { farmCode: farmCode } });
      if (!farm) {
        Logger.error('DeviceStatusDao.updateDeviceControl: 농장을 찾을 수 없습니다.');
        throw new Error('농장을 찾을 수 없습니다.');
      }

      // 기존 장치 상태 조회
      const existingStatus = await DeviceStatus.findOne({
        where: { farmId: farm.id },
        order: [['timestamp', 'DESC']]
      });

      if (existingStatus) {
        // 기존 데이터 업데이트
        const updateData = {};
        
        if (controlTemperature !== null && controlTemperature !== undefined) {
          updateData.controlTemperature = controlTemperature;
        }
        if (controlHumidity !== null && controlHumidity !== undefined) {
          updateData.controlHumidity = controlHumidity;
        }
        if (fan !== null && fan !== undefined) {
          updateData.fan = fan;
        }
        if (leds !== null && leds !== undefined) {
          updateData.led1 = leds[0];
          updateData.led2 = leds[1];
          updateData.led3 = leds[2];
          updateData.led4 = leds[3];
        }
        
        updateData.timestamp = new Date();

        await existingStatus.update(updateData);

        Logger.info(`DeviceStatusDao.updateDeviceControl: 장치 제어 설정 업데이트 완료 - ID: ${existingStatus.id}, 농장코드: ${farmCode}`);
        return existingStatus;
      } else {
        // 데이터가 없으면 새로 생성
        const record = await DeviceStatus.create({
          farmId: farm.id,
          fan: fan !== null && fan !== undefined ? fan : null,
          led1: leds !== null && leds !== undefined ? leds[0] : null,
          led2: leds !== null && leds !== undefined ? leds[1] : null,
          led3: leds !== null && leds !== undefined ? leds[2] : null,
          led4: leds !== null && leds !== undefined ? leds[3] : null,
          controlTemperature: controlTemperature || 0,
          controlHumidity: controlHumidity || 0,
          timestamp: new Date()
        });

        Logger.info(`DeviceStatusDao.updateDeviceControl: 장치 제어 설정 생성 완료 - ID: ${record.id}, 농장코드: ${farmCode}`);
        return record;
      }
    } catch (err) {
      Logger.error(`DeviceStatusDao.updateDeviceControl: 장치 제어 설정 업데이트 실패 - 농장코드: ${farmCode}, 에러: ${err.message}`);
      throw new Error(`장치 제어 설정 업데이트에 실패했습니다: ${err.message}`);
    }
  }
}

export default DeviceStatusDao;

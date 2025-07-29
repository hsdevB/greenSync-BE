import temperatureDao from '../dao/temperatureDao.js';
import humidityDao from '../dao/humidityDao.js';
import nutrientDao from '../dao/nutrientDao.js';
import carbonDioxideDao from '../dao/carbonDioxideDao.js';
import illuminanceDao from '../dao/illuminanceDao.js';
import deviceStatusDao from '../dao/deviceStatusDao.js';
import Logger from '../utils/logger.js';


const SENSOR_RANGES = {
  temperature: { min: -50, max: 100 },
  humidity: { min: 0, max: 100 },
  phLevel: { min: 0, max: 14 },
  elcDT: { min: 0, max: 10 },
  co2: { min: 0, max: 5000 },
  illuminance: { min: 0, max: 100000 }
};

const validateSensorData = (data, farmCode) => {
  const errors = [];

  if (!farmCode || typeof farmCode !== 'string' || farmCode.trim() === '') {
    errors.push('농장코드는 필수이며 유효한 문자열이어야 합니다.');
  }

  if (!data || typeof data !== 'object') {
    errors.push('센서 데이터는 유효한 객체여야 합니다.');
    return errors;
  }

  const sensorFields = ['temperature', 'humidity', 'phLevel', 'elcDT', 'co2', 'illuminance'];

  Object.keys(data).forEach(key => {
    const value = data[key];
    if (!sensorFields.includes(key)) {
      return;
    }
    
    if (value !== undefined && value !== null) {
      if (typeof value !== 'number' || isNaN(value)) {
        errors.push(`${key}는 유효한 숫자여야 합니다.`);
        return;
      }

      if (SENSOR_RANGES[key]) {
        const { min, max } = SENSOR_RANGES[key];
        if (value < min || value > max) {
          errors.push(`${key}는 ${min}에서 ${max} 사이의 값이어야 합니다. (현재값: ${value})`);
        }
      }
    }
  });

  return errors;
};

class SensorDataService {
  static async saveSensorData(data, farmCode) {
    try {
      const validationErrors = validateSensorData(data, farmCode);
      if (validationErrors.length > 0) {
        const errorMessage = `센서 데이터 유효성 검사 실패: ${validationErrors.join(', ')}`;
        throw new Error(errorMessage);
      }

      const {
        temperature,
        humidity,
        phLevel,
        elcDT,
        co2,
        illuminance
      } = data;

      const savedData = {};

      if (temperature !== undefined) {
        try {
          savedData.temperature = await temperatureDao.saveTemperature(temperature, farmCode);
        } catch (error) {
          throw new Error(`온도 데이터 저장 실패: ${error.message}`);
        }
      }

      if (humidity !== undefined) {
        try {
          savedData.humidity = await humidityDao.saveHumidity(humidity, farmCode);
        } catch (error) {
          throw new Error(`습도 데이터 저장 실패: ${error.message}`);
        }
      }

      if (phLevel !== undefined && elcDT !== undefined) {
        try {
          savedData.nutrient = await nutrientDao.saveNutrient(phLevel, elcDT, farmCode);
        } catch (error) {
          throw new Error(`양액 데이터 저장 실패: ${error.message}`);
        }
      }

      if (co2 !== undefined) {
        try {
          savedData.co2 = await carbonDioxideDao.saveCarbonDioxide(co2, farmCode);
        } catch (error) {
          throw new Error(`CO2 데이터 저장 실패: ${error.message}`);
        }
      }

      if (illuminance !== undefined) {
        try {
          savedData.illuminance = await illuminanceDao.saveIlluminance(illuminance, farmCode);
        } catch (error) {
          throw new Error(`조도 데이터 저장 실패: ${error.message}`);
        }
      }

      Logger.info(`sensorDataService.saveSensorData.response result: ${JSON.stringify(savedData)}`);
      return savedData;

    } catch (error) {
      Logger.error(`sensorDataService.saveSensorData.error: ${error.message}`);
      throw error;
    }
  }

  static async saveDeviceStatus(data, farmCode) {
    try {
      if (!farmCode || typeof farmCode !== 'string' || farmCode.trim() === '') {
        throw new Error('농장코드는 필수이며 유효한 문자열이어야 합니다.');
      }

      if (!data || typeof data !== 'object') {
        throw new Error('장치 상태 데이터는 유효한 객체여야 합니다.');
      }

      const { fan, leds } = data;

      if (typeof fan !== 'boolean') {
        throw new Error('fan 값은 true 또는 false여야 합니다.');
      }

      if (!Array.isArray(leds) || leds.length !== 4 || !leds.every(val => typeof val === 'boolean')) {
        throw new Error('leds는 4개의 불리언 값으로 구성된 배열이어야 합니다.');
      }

      const result = await deviceStatusDao.updateDeviceStatus(farmCode, fan, leds);

      Logger.info(`sensorDataService.saveDeviceStatus.response result: ${JSON.stringify(result)}`);
      return result;

    } catch (error) {
      Logger.error(`sensorDataService.saveDeviceStatus.error: ${error.message}`);
      throw error;
    }
  }

  static async getTemperatureByFarmId(farmId) {
    try {
      if (!farmId || typeof farmId !== 'number' || isNaN(farmId) || farmId <= 0) {
        throw new Error('농장ID는 유효한 양수여야 합니다.');
      }

      const result = await temperatureDao.getTemperatureByFarmId(farmId);
      Logger.info(`sensorDataService.getTemperatureByFarmId.response result: ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      Logger.error(`sensorDataService.getTemperatureByFarmId.error: ${error.message}`);
      throw error;
    }
  }

  static async getTemperatureByFarmCode(farmCode) {
    try {
      if (!farmCode || typeof farmCode !== 'string' || farmCode.trim() === '') {
        throw new Error('농장코드는 필수이며 유효한 문자열이어야 합니다.');
      }

      const result = await temperatureDao.getTemperatureByFarmCode(farmCode);
      Logger.info(`sensorDataService.getTemperatureByFarmCode.response result: ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      Logger.error(`sensorDataService.getTemperatureByFarmCode.error: ${error.message}`);
      throw error;
    }
  }

  static async getHumidityByFarmId(farmId) {
    try {
      if (!farmId || typeof farmId !== 'number' || isNaN(farmId) || farmId <= 0) {
        throw new Error('농장ID는 유효한 양수여야 합니다.');
      }

      const result = await humidityDao.getHumidityByFarmId(farmId);
      Logger.info(`sensorDataService.getHumidityByFarmId.response result: ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      Logger.error(`sensorDataService.getHumidityByFarmId.error: ${error.message}`);
      throw error;
    }
  }

  static async getHumidityByFarmCode(farmCode) {
    try {
      if (!farmCode || typeof farmCode !== 'string' || farmCode.trim() === '') {
        throw new Error('농장코드는 필수이며 유효한 문자열이어야 합니다.');
      }

      const result = await humidityDao.getHumidityByFarmCode(farmCode);
      Logger.info(`sensorDataService.getHumidityByFarmCode.response result: ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      Logger.error(`sensorDataService.getHumidityByFarmCode.error: ${error.message}`);
      throw error;
    }
  }

  static async getCarbonDioxideByFarmId(farmId) {
    try {
      if (!farmId || typeof farmId !== 'number' || isNaN(farmId) || farmId <= 0) {
        throw new Error('농장ID는 유효한 양수여야 합니다.');
      }

      const result = await carbonDioxideDao.getCarbonDioxideByFarmId(farmId);
      Logger.info(`sensorDataService.getCarbonDioxideByFarmId.response result: ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      Logger.error(`sensorDataService.getCarbonDioxideByFarmId.error: ${error.message}`);
      throw error;
    }
  }

  static async getCarbonDioxideByFarmCode(farmCode) {
    try {
      if (!farmCode || typeof farmCode !== 'string' || farmCode.trim() === '') {
        throw new Error('농장코드는 필수이며 유효한 문자열이어야 합니다.');
      }

      const result = await carbonDioxideDao.getCarbonDioxideByFarmCode(farmCode);
      Logger.info(`sensorDataService.getCarbonDioxideByFarmCode.response result: ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      Logger.error(`sensorDataService.getCarbonDioxideByFarmCode.error: ${error.message}`);
      throw error;
    }
  }

  static async getNutrientByFarmId(farmId) {
    try {
      if (!farmId || typeof farmId !== 'number' || isNaN(farmId) || farmId <= 0) {
        throw new Error('농장ID는 유효한 양수여야 합니다.');
      }

      const result = await nutrientDao.getNutrientByFarmId(farmId);
      Logger.info(`sensorDataService.getNutrientByFarmId.response result: ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      Logger.error(`sensorDataService.getNutrientByFarmId.error: ${error.message}`);
      throw error;
    }
  }

  static async getNutrientByFarmCode(farmCode) {
    try {
      if (!farmCode || typeof farmCode !== 'string' || farmCode.trim() === '') {
        throw new Error('농장코드는 필수이며 유효한 문자열이어야 합니다.');
      }

      const result = await nutrientDao.getNutrientByFarmCode(farmCode);
      Logger.info(`sensorDataService.getNutrientByFarmCode.response result: ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      Logger.error(`sensorDataService.getNutrientByFarmCode.error: ${error.message}`);
      throw error;
    }
  }

  static async getIlluminanceByFarmId(farmId) {
    try {
      if (!farmId || typeof farmId !== 'number' || isNaN(farmId) || farmId <= 0) {
        throw new Error('농장ID는 유효한 양수여야 합니다.');
      }

      const result = await illuminanceDao.getIlluminanceByFarmId(farmId);
      Logger.info(`sensorDataService.getIlluminanceByFarmId.response result: ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      Logger.error(`sensorDataService.getIlluminanceByFarmId.error: ${error.message}`);
      throw error;
    }
  }

  static async getIlluminanceByFarmCode(farmCode) {
    try {
      if (!farmCode || typeof farmCode !== 'string' || farmCode.trim() === '') {
        throw new Error('농장코드는 필수이며 유효한 문자열이어야 합니다.');
      }

      const result = await illuminanceDao.getIlluminanceByFarmCode(farmCode);
      Logger.info(`sensorDataService.getIlluminanceByFarmCode.response result: ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      Logger.error(`sensorDataService.getIlluminanceByFarmCode.error: ${error.message}`);
      throw error;
    }
  }

  static async getDeviceStatusByFarmCode(farmCode) {
    try {
      if (!farmCode || typeof farmCode !== 'string' || farmCode.trim() === '') {
        throw new Error('농장코드는 필수이며 유효한 문자열이어야 합니다.');
      }

      const result = await deviceStatusDao.getLatestStatusByFarmCode(farmCode);
      Logger.info(`sensorDataService.getDeviceStatusByFarmCode.response result: ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      Logger.error(`sensorDataService.getDeviceStatusByFarmCode.error: ${error.message}`);
      throw error;
    }
  }

  static async updateControlSettings(farmCode, controlTemperature, controlHumidity) {
    try {
      if (!farmCode || typeof farmCode !== 'string' || farmCode.trim() === '') {
        throw new Error('농장코드는 필수이며 유효한 문자열이어야 합니다.');
      }

      if (controlTemperature !== null && controlTemperature !== undefined) {
        if (typeof controlTemperature !== 'number' || isNaN(controlTemperature)) {
          throw new Error('제어온도는 유효한 숫자여야 합니다.');
        }
      }

      if (controlHumidity !== null && controlHumidity !== undefined) {
        if (typeof controlHumidity !== 'number' || isNaN(controlHumidity)) {
          throw new Error('제어습도는 유효한 숫자여야 합니다.');
        }
      }

      const result = await deviceStatusDao.updateControlSettings(farmCode, controlTemperature, controlHumidity);
      Logger.info(`sensorDataService.updateControlSettings.response result: ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      Logger.error(`sensorDataService.updateControlSettings.error: ${error.message}`);
      throw error;
    }
  }

  static async updateDeviceControl(farmCode, controlTemperature, controlHumidity, fan, leds) {
    try {
      if (!farmCode || typeof farmCode !== 'string' || farmCode.trim() === '') {
        throw new Error('농장코드는 필수이며 유효한 문자열이어야 합니다.');
      }

      // 제어온도 유효성 검사
      if (controlTemperature !== null && controlTemperature !== undefined) {
        if (typeof controlTemperature !== 'number' || isNaN(controlTemperature)) {
          throw new Error('제어온도는 유효한 숫자여야 합니다.');
        }
      }

      // 제어습도 유효성 검사
      if (controlHumidity !== null && controlHumidity !== undefined) {
        if (typeof controlHumidity !== 'number' || isNaN(controlHumidity)) {
          throw new Error('제어습도는 유효한 숫자여야 합니다.');
        }
      }

      // fan 유효성 검사
      if (fan !== null && fan !== undefined && typeof fan !== 'boolean') {
        throw new Error('fan 값은 true 또는 false여야 합니다.');
      }

      // LED 배열 유효성 검사
      if (leds !== null && leds !== undefined) {
        if (!Array.isArray(leds) || leds.length !== 4 || !leds.every(val => typeof val === 'boolean')) {
          throw new Error('leds는 4개의 불리언 값으로 구성된 배열이어야 합니다.');
        }
      }

      const result = await deviceStatusDao.updateDeviceControl(farmCode, controlTemperature, controlHumidity, fan, leds);
      Logger.info(`sensorDataService.updateDeviceControl.response result: ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      Logger.error(`sensorDataService.updateDeviceControl.error: ${error.message}`);
      throw error;
    }
  }
}

export default SensorDataService;

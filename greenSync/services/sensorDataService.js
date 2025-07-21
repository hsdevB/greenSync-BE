import temperatureDao from '../dao/temperatureDao.js';
import humidityDao from '../dao/humidityDao.js';
import nutrientDao from '../dao/nutrientDao.js';
import carbonDioxideDao from '../dao/carbonDioxideDao.js';
import illuminanceDao from '../dao/illuminanceDao.js';
import logger from '../utils/logger.js';

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

  Object.keys(data).forEach(key => {
    const value = data[key];
    
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

      logger.info(`sensorDataService.saveSensorData.response result: ${JSON.stringify(savedData)}`);
      return savedData;

    } catch (error) {
      logger.error(`sensorDataService.saveSensorData.error: ${error.message}`);
      throw error;
    }
  }

  static async getTemperatureByFarmId(farmId) {
    try {
      if (!farmId || typeof farmId !== 'number' || isNaN(farmId) || farmId <= 0) {
        throw new Error('농장ID는 유효한 양수여야 합니다.');
      }

      const result = await temperatureDao.getTemperatureByFarmId(farmId);
      logger.info(`sensorDataService.getTemperatureByFarmId.response result: ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      logger.error(`sensorDataService.getTemperatureByFarmId.error: ${error.message}`);
      throw error;
    }
  }

  static async getTemperatureByFarmCode(farmCode) {
    try {
      if (!farmCode || typeof farmCode !== 'string' || farmCode.trim() === '') {
        throw new Error('농장코드는 필수이며 유효한 문자열이어야 합니다.');
      }

      const result = await temperatureDao.getTemperatureByFarmCode(farmCode);
      logger.info(`sensorDataService.getTemperatureByFarmCode.response result: ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      logger.error(`sensorDataService.getTemperatureByFarmCode.error: ${error.message}`);
      throw error;
    }
  }

  static async getHumidityByFarmId(farmId) {
    try {
      if (!farmId || typeof farmId !== 'number' || isNaN(farmId) || farmId <= 0) {
        throw new Error('농장ID는 유효한 양수여야 합니다.');
      }

      const result = await humidityDao.getHumidityByFarmId(farmId);
      logger.info(`sensorDataService.getHumidityByFarmId.response result: ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      logger.error(`sensorDataService.getHumidityByFarmId.error: ${error.message}`);
      throw error;
    }
  }

  static async getHumidityByFarmCode(farmCode) {
    try {
      if (!farmCode || typeof farmCode !== 'string' || farmCode.trim() === '') {
        throw new Error('농장코드는 필수이며 유효한 문자열이어야 합니다.');
      }

      const result = await humidityDao.getHumidityByFarmCode(farmCode);
      logger.info(`sensorDataService.getHumidityByFarmCode.response result: ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      logger.error(`sensorDataService.getHumidityByFarmCode.error: ${error.message}`);
      throw error;
    }
  }

  static async getCarbonDioxideByFarmId(farmId) {
    try {
      if (!farmId || typeof farmId !== 'number' || isNaN(farmId) || farmId <= 0) {
        throw new Error('농장ID는 유효한 양수여야 합니다.');
      }

      const result = await carbonDioxideDao.getCarbonDioxideByFarmId(farmId);
      logger.info(`sensorDataService.getCarbonDioxideByFarmId.response result: ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      logger.error(`sensorDataService.getCarbonDioxideByFarmId.error: ${error.message}`);
      throw error;
    }
  }

  static async getCarbonDioxideByFarmCode(farmCode) {
    try {
      if (!farmCode || typeof farmCode !== 'string' || farmCode.trim() === '') {
        throw new Error('농장코드는 필수이며 유효한 문자열이어야 합니다.');
      }

      const result = await carbonDioxideDao.getCarbonDioxideByFarmCode(farmCode);
      logger.info(`sensorDataService.getCarbonDioxideByFarmCode.response result: ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      logger.error(`sensorDataService.getCarbonDioxideByFarmCode.error: ${error.message}`);
      throw error;
    }
  }

  static async getNutrientByFarmId(farmId) {
    try {
      if (!farmId || typeof farmId !== 'number' || isNaN(farmId) || farmId <= 0) {
        throw new Error('농장ID는 유효한 양수여야 합니다.');
      }

      const result = await nutrientDao.getNutrientByFarmId(farmId);
      logger.info(`sensorDataService.getNutrientByFarmId.response result: ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      logger.error(`sensorDataService.getNutrientByFarmId.error: ${error.message}`);
      throw error;
    }
  }

  static async getNutrientByFarmCode(farmCode) {
    try {
      if (!farmCode || typeof farmCode !== 'string' || farmCode.trim() === '') {
        throw new Error('농장코드는 필수이며 유효한 문자열이어야 합니다.');
      }

      const result = await nutrientDao.getNutrientByFarmCode(farmCode);
      logger.info(`sensorDataService.getNutrientByFarmCode.response result: ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      logger.error(`sensorDataService.getNutrientByFarmCode.error: ${error.message}`);
      throw error;
    }
  }

  static async getIlluminanceByFarmId(farmId) {
    try {
      if (!farmId || typeof farmId !== 'number' || isNaN(farmId) || farmId <= 0) {
        throw new Error('농장ID는 유효한 양수여야 합니다.');
      }

      const result = await illuminanceDao.getIlluminanceByFarmId(farmId);
      logger.info(`sensorDataService.getIlluminanceByFarmId.response result: ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      logger.error(`sensorDataService.getIlluminanceByFarmId.error: ${error.message}`);
      throw error;
    }
  }

  static async getIlluminanceByFarmCode(farmCode) {
    try {
      if (!farmCode || typeof farmCode !== 'string' || farmCode.trim() === '') {
        throw new Error('농장코드는 필수이며 유효한 문자열이어야 합니다.');
      }

      const result = await illuminanceDao.getIlluminanceByFarmCode(farmCode);
      logger.info(`sensorDataService.getIlluminanceByFarmCode.response result: ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      logger.error(`sensorDataService.getIlluminanceByFarmCode.error: ${error.message}`);
      throw error;
    }
  }
}

export default SensorDataService;

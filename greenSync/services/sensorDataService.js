import temperatureDao from '../dao/temperatureDao.js';
import humidityDao from '../dao/humidityDao.js';
import nutrientDao from '../dao/nutrientDao.js';
import carbonDioxideDao from '../dao/carbonDioxideDao.js';
import illuminanceDao from '../dao/illuminanceDao.js';

const sensorDataService = {
  saveSensorData: async (data, farmCode) => {
    const {
      temperature,
      humidity,
      phLevel,
      elcDT,
      co2,
      illuminance
    } = data;

    if (temperature !== undefined) {
      await temperatureDao.saveTemperature(temperature, farmCode);
    }

    if (humidity !== undefined) {
      await humidityDao.saveHumidity(humidity, farmCode);
    }

    if (phLevel !== undefined && elcDT !== undefined) {
      await nutrientDao.saveNutrient(phLevel, elcDT, farmCode);
    }

    if (co2 !== undefined) {
      await carbonDioxideDao.saveCarbonDioxide(co2, farmCode);
    }

    if (illuminance !== undefined) {
      await illuminanceDao.saveIlluminance(illuminance, farmCode);
    }
  },

  getTemperatureByFarmId: async (farmId) => {
    return await temperatureDao.getTemperatureByFarmId(farmId);
  },

  getTemperatureByFarmCode: async (farmCode) => {
    return await temperatureDao.getTemperatureByFarmCode(farmCode);
  },

  getHumidityByFarmId: async (farmId) => {
    return await humidityDao.getHumidityByFarmId(farmId);
  },

  getHumidityByFarmCode: async (farmCode) => {
    return await humidityDao.getHumidityByFarmCode(farmCode);
  },

  getCarbonDioxideByFarmId: async (farmId) => {
    return await carbonDioxideDao.getCarbonDioxideByFarmId(farmId);
  },

  getCarbonDioxideByFarmCode: async (farmCode) => {
    return await carbonDioxideDao.getCarbonDioxideByFarmCode(farmCode);
  },

  getNutrientByFarmId: async (farmId) => {
    return await nutrientDao.getNutrientByFarmId(farmId);
  },

  getNutrientByFarmCode: async (farmCode) => {
    return await nutrientDao.getNutrientByFarmCode(farmCode);
  },

  getIlluminanceByFarmId: async (farmId) => {
    return await illuminanceDao.getIlluminanceByFarmId(farmId);
  },

  getIlluminanceByFarmCode: async (farmCode) => {
    return await illuminanceDao.getIlluminanceByFarmCode(farmCode);
  }
};

export default sensorDataService;

import temperatureDao from '../dao/temperatureDao.js';
import humidityDao from '../dao/humidityDao.js';
import nutrientDao from '../dao/nutrientDao.js';
import carbonDioxideDao from '../dao/carbonDioxideDao.js';

const sensorDataService = {
  saveSensorData: async (data, farmCode) => {
    const {
      temperature,
      humidity,
      phLevel,
      elcDT,
      co2
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
  },

  getTemperatureByFarmId: async (farmId) => {
    return await temperatureDao.getTemperatureByFarmId(farmId);
  },

  getTemperatureByFarmCode: async (farmCode) => {
    return await temperatureDao.getTemperatureByFarmCode(farmCode);
  }
};

export default sensorDataService;

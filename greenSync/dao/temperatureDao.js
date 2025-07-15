import Temperature from '../models/temperature.js';
import Farm from '../models/farm.js';

const temperatureDao = {
  saveTemperature: async (temperature, farmCode) => {
    const farm = await Farm.findOne({ where: { farmCode } });
    if (!farm) {
      throw new Error(`Farm with code ${farmCode} not found.`);
    }

    return await Temperature.create({
      temperature,
      farmId: farm.id
    });
  },

  getTemperatureByFarmId: async (farmId) => {
    return await Temperature.findOne({ 
      where: { farmId },
      order: [['createdAt', 'DESC']]
    });
  },

  getTemperatureByFarmCode: async (farmCode) => {
    const farm = await Farm.findOne({ where: { farmCode } });
    if (!farm) {
      throw new Error(`Farm with code ${farmCode} not found.`);
    }

    return await Temperature.findOne({ 
      where: { farmId: farm.id },
      order: [['createdAt', 'DESC']]
    });
  }
};

export default temperatureDao;

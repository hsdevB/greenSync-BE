import Humidity from '../models/humidity.js';
import Farm from '../models/farm.js';

const humidityDao = {
  saveHumidity: async (humidity, farmCode) => {
    const farm = await Farm.findOne({ where: { farmCode } });
    if (!farm) {
      throw new Error(`Farm with code ${farmCode} not found.`);
    }

    return await Humidity.create({ 
        humidity,
        farmId: farm.id
    });
  },

  getHumidityByFarmId: async (farmId) => {
    return await Humidity.findAll({ 
      where: { farmId },
      order: [['createdAt', 'DESC']],
      limit: 15
    });
  },

  getHumidityByFarmCode: async (farmCode) => {
    const farm = await Farm.findOne({ where: { farmCode } });
    if (!farm) {
      throw new Error(`Farm with code ${farmCode} not found.`);
    }
    return await Humidity.findAll({ 
      where: { farmId: farm.id },
      order: [['createdAt', 'DESC']],
      limit: 15
    });
  }
};

export default humidityDao;

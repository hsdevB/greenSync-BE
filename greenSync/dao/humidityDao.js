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
  }
};

export default humidityDao;

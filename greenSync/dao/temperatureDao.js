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
  }
};

export default temperatureDao;

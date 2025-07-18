import Temperature from '../models/temperature.js';
import Farm from '../models/farm.js';

class TemperatureDao {
  static async saveTemperature(temperature, farmCode) {
    const farm = await Farm.findOne({ where: { farmCode } });
    if (!farm) {
      throw new Error(`Farm with code ${farmCode} not found.`);
    }

    return await Temperature.create({
      temperature,
      farmId: farm.id
    });
  }

  static async getTemperatureByFarmId(farmId) {
    return await Temperature.findOne({ 
      where: { farmId },
      order: [['createdAt', 'DESC']]
    });
  }

  static async getTemperatureByFarmCode(farmCode) {
    const farm = await Farm.findOne({ where: { farmCode } });
    if (!farm) {
      throw new Error(`Farm with code ${farmCode} not found.`);
    }

    return await Temperature.findOne({ 
      where: { farmId: farm.id },
      order: [['createdAt', 'DESC']]
    });
  }
}

export default TemperatureDao;

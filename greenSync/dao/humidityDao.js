import Humidity from '../models/humidity.js';
import Farm from '../models/farm.js';

class HumidityDao {
  static async saveHumidity(humidity, farmCode) {
    const farm = await Farm.findOne({ where: { farmCode } });
    if (!farm) {
      throw new Error(`Farm with code ${farmCode} not found.`);
    }

    return await Humidity.create({ 
        humidity,
        farmId: farm.id
    });
  }

  static async getHumidityByFarmId(farmId) {
    return await Humidity.findAll({ 
      where: { farmId },
      order: [['createdAt', 'DESC']],
      limit: 15
    });
  }

  static async getHumidityByFarmCode(farmCode) {
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
}

export default HumidityDao;

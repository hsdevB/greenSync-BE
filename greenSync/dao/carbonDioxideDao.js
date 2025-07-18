import CarbonDioxide from '../models/carbonDioxide.js';
import Farm from '../models/farm.js';

class CarbonDioxideDao {
  static async saveCarbonDioxide(co2, farmCode) {
    const farm = await Farm.findOne({ where: { farmCode } });
    if (!farm) {
      throw new Error(`Farm with code ${farmCode} not found.`);
    }

    return await CarbonDioxide.create({ 
        co2,
        farmId: farm.id
    });
  }

  static async getCarbonDioxideByFarmId(farmId) {
    return await CarbonDioxide.findAll({ 
      where: { farmId },
      order: [['createdAt', 'DESC']],
      limit: 15
    });
  }

  static async getCarbonDioxideByFarmCode(farmCode) {
    const farm = await Farm.findOne({ where: { farmCode } });
    if (!farm) {
      throw new Error(`Farm with code ${farmCode} not found.`);
    }

    return await CarbonDioxide.findAll({ 
      where: { farmId: farm.id },
      order: [['createdAt', 'DESC']],
      limit: 15
    });
  }
}

export default CarbonDioxideDao;

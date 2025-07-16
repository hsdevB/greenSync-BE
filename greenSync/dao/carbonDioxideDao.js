import CarbonDioxide from '../models/carbonDioxide.js';
import Farm from '../models/farm.js';

const carbonDioxideDao = {
  saveCarbonDioxide: async (co2, farmCode) => {
    const farm = await Farm.findOne({ where: { farmCode } });
    if (!farm) {
      throw new Error(`Farm with code ${farmCode} not found.`);
    }

    return await CarbonDioxide.create({ 
        co2,
        farmId: farm.id
    });
  },

  getCarbonDioxideByFarmId: async (farmId) => {
    return await CarbonDioxide.findAll({ 
      where: { farmId },
      order: [['createdAt', 'DESC']],
      limit: 15
    });
  },

  getCarbonDioxideByFarmCode: async (farmCode) => {
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
};

export default carbonDioxideDao;

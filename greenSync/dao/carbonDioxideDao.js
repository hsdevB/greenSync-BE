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
  }
};

export default carbonDioxideDao;

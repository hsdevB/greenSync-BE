import Nutrient from '../models/nutrient.js';
import Farm from '../models/farm.js';

const nutrientDao = {
  saveNutrient: async (phLevel, elcDT, farmCode) => {
    const farm = await Farm.findOne({ where: { farmCode } });
    if (!farm) {
      throw new Error(`Farm with code ${farmCode} not found.`);
    }
    return await Nutrient.create({ 
        phLevel,
        elcDT,
        farmId: farm.id
    });
  },

  getNutrientByFarmId: async (farmId) => {
    return await Nutrient.findAll({ 
      where: { farmId },
      order: [['createdAt', 'DESC']],
      limit: 15
    });
  },

  getNutrientByFarmCode: async (farmCode) => {
    const farm = await Farm.findOne({ where: { farmCode } });
    if (!farm) {
      throw new Error(`Farm with code ${farmCode} not found.`);
    }
    return await Nutrient.findAll({ 
      where: { farmId: farm.id },
      order: [['createdAt', 'DESC']],
      limit: 15
    });
  },
};

export default nutrientDao;

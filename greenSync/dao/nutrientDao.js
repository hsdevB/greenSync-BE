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
  }
};

export default nutrientDao;

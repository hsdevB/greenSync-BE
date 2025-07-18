import Nutrient from '../models/nutrient.js';
import Farm from '../models/farm.js';

class NutrientDao {
  static async saveNutrient(phLevel, elcDT, farmCode) {
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

  static async getNutrientByFarmId(farmId) {
    return await Nutrient.findAll({ 
      where: { farmId },
      order: [['createdAt', 'DESC']],
      limit: 15
    });
  }

  static async getNutrientByFarmCode(farmCode) {
    const farm = await Farm.findOne({ where: { farmCode } });
    if (!farm) {
      throw new Error(`Farm with code ${farmCode} not found.`);
    }
    return await Nutrient.findAll({ 
      where: { farmId: farm.id },
      order: [['createdAt', 'DESC']],
      limit: 15
    });
  }
};

export default NutrientDao;

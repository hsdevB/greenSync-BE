import express from 'express';
import sensorDataService from '../services/sensorDataService.js';
import logger from '../utils/logger.js';

const sensorRouter = express.Router();

sensorRouter.get('/temperature/:farmId', async (req, res) => {
  try {
    const { farmId } = req.params;
    const temperatureData = await sensorDataService.getTemperatureByFarmId(farmId);
    logger.info(`sensorRouter.temperature.response temperatureData: ${JSON.stringify(temperatureData)}`);
    res.json(temperatureData);
  } catch (error) {
    logger.error(`sensorRouter.temperature.error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

sensorRouter.get('/temperature/code/:farmCode', async (req, res) => {
  try {
    const { farmCode } = req.params;
    const temperatureData = await sensorDataService.getTemperatureByFarmCode(farmCode);
    logger.info(`sensorRouter.temperature.code.response temperatureData: ${JSON.stringify(temperatureData)}`);
    res.json(temperatureData);
  } catch (error) {
    logger.error(`sensorRouter.temperature.code.error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

sensorRouter.get('/humidity/:farmId', async (req, res) => {
  try {
    const { farmId } = req.params;
    const humidityData = await sensorDataService.getHumidityByFarmId(farmId);
    logger.info(`sensorRouter.humidity.response humidityData: ${JSON.stringify(humidityData)}`);
    res.json(humidityData);
  } catch (error) {
    logger.error(`sensorRouter.humidity.error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

sensorRouter.get('/humidity/code/:farmCode', async (req, res) => {
  try {
    const { farmCode } = req.params;
    const humidityData = await sensorDataService.getHumidityByFarmCode(farmCode);
    logger.info(`sensorRouter.humidity.code.response humidityData: ${JSON.stringify(humidityData)}`);
    res.json(humidityData);
  } catch (error) {
    logger.error(`sensorRouter.humidity.code.error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

sensorRouter.get('/carbonDioxide/:farmId', async (req, res) => {
  try {
    const { farmId } = req.params;
    const carbonDioxideData = await sensorDataService.getCarbonDioxideByFarmId(farmId);
    logger.info(`sensorRouter.carbonDioxide.response carbonDioxideData: ${JSON.stringify(carbonDioxideData)}`);
    res.json(carbonDioxideData);
  } catch (error) {
    logger.error(`sensorRouter.carbonDioxide.error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

sensorRouter.get('/carbonDioxide/code/:farmCode', async (req, res) => {
  try {
    const { farmCode } = req.params;
    const carbonDioxideData = await sensorDataService.getCarbonDioxideByFarmCode(farmCode);
    logger.info(`sensorRouter.carbonDioxide.code.response carbonDioxideData: ${JSON.stringify(carbonDioxideData)}`);
    res.json(carbonDioxideData);
  } catch (error) {
    logger.error(`sensorRouter.carbonDioxide.code.error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

sensorRouter.get('/nutrient/:farmId', async (req, res) => {
  try {
    const { farmId } = req.params;
    const nutrientData = await sensorDataService.getNutrientByFarmId(farmId);
    logger.info(`sensorRouter.nutrient.response nutrientData: ${JSON.stringify(nutrientData)}`);
    res.json(nutrientData);
  } catch (error) {
    logger.error(`sensorRouter.nutrient.error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

sensorRouter.get('/nutrient/code/:farmCode', async (req, res) => {
  try {
    const { farmCode } = req.params;
    const nutrientData = await sensorDataService.getNutrientByFarmCode(farmCode);
    logger.info(`sensorRouter.nutrient.code.response nutrientData: ${JSON.stringify(nutrientData)}`);
    res.json(nutrientData);
  } catch (error) {
    logger.error(`sensorRouter.nutrient.code.error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

export default sensorRouter;

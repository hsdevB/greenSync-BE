import express from 'express';
import sensorDataService from '../services/sensorDataService.js';

const sensorRouter = express.Router();

// Get temperature data by farm ID
sensorRouter.get('/temperature/:farmId', async (req, res) => {
  try {
    const { farmId } = req.params;
    const temperatureData = await sensorDataService.getTemperatureByFarmId(farmId);
    res.json(temperatureData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get temperature data by farm code
sensorRouter.get('/temperature/code/:farmCode', async (req, res) => {
  try {
    const { farmCode } = req.params;
    const temperatureData = await sensorDataService.getTemperatureByFarmCode(farmCode);
    res.json(temperatureData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default sensorRouter;

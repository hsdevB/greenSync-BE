import express from 'express';
import sensorDataService from '../services/sensorDataService.js';
import Logger from '../utils/logger.js';

const sensorRouter = express.Router();

sensorRouter.get('/temperature/:farmId', async (req, res) => {
  try {
    const { farmId } = req.params;
    
    if (!farmId || isNaN(farmId) || parseInt(farmId) <= 0) {
      Logger.error(`sensorRouter.temperature: 유효하지 않은 농장ID - farmId: ${farmId}`);
      return res.status(400).json({
        success: false,
        message: '유효한 농장ID가 필요합니다.'
      });
    }

    const temperatureData = await sensorDataService.getTemperatureByFarmId(parseInt(farmId));
    Logger.info(`sensorRouter.temperature: 온도 데이터 조회 완료 - 농장ID: ${farmId}`);
    
    res.status(200).json({
      success: true,
      message: '온도 데이터 조회 성공',
      data: temperatureData
    });
  } catch (error) {
    Logger.error(`sensorRouter.temperature: 온도 데이터 조회 실패 - 농장ID: ${req.params.farmId}, 에러: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '온도 데이터 조회에 실패했습니다.'
    });
  }
});

sensorRouter.get('/temperature/code/:farmCode', async (req, res) => {
  try {
    const { farmCode } = req.params;
    
    if (!farmCode || typeof farmCode !== 'string' || farmCode.trim() === '') {
      Logger.error(`sensorRouter.temperature.code: 유효하지 않은 농장코드 - farmCode: ${farmCode}`);
      return res.status(400).json({
        success: false,
        message: '유효한 농장코드가 필요합니다.'
      });
    }

    const temperatureData = await sensorDataService.getTemperatureByFarmCode(farmCode);
    Logger.info(`sensorRouter.temperature.code: 온도 데이터 조회 완료 - 농장코드: ${farmCode}`);
    
    res.status(200).json({
      success: true,
      message: '온도 데이터 조회 성공',
      data: temperatureData
    });
  } catch (error) {
    Logger.error(`sensorRouter.temperature.code: 온도 데이터 조회 실패 - 농장코드: ${req.params.farmCode}, 에러: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '온도 데이터 조회에 실패했습니다.'
    });
  }
});

sensorRouter.get('/humidity/:farmId', async (req, res) => {
  try {
    const { farmId } = req.params;
    
    if (!farmId || isNaN(farmId) || parseInt(farmId) <= 0) {
      Logger.error(`sensorRouter.humidity: 유효하지 않은 농장ID - farmId: ${farmId}`);
      return res.status(400).json({
        success: false,
        message: '유효한 농장ID가 필요합니다.'
      });
    }

    const humidityData = await sensorDataService.getHumidityByFarmId(parseInt(farmId));
    Logger.info(`sensorRouter.humidity: 습도 데이터 조회 완료 - 농장ID: ${farmId}`);
    
    res.status(200).json({
      success: true,
      message: '습도 데이터 조회 성공',
      data: humidityData
    });
  } catch (error) {
    Logger.error(`sensorRouter.humidity: 습도 데이터 조회 실패 - 농장ID: ${req.params.farmId}, 에러: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '습도 데이터 조회에 실패했습니다.'
    });
  }
});

sensorRouter.get('/humidity/code/:farmCode', async (req, res) => {
  try {
    const { farmCode } = req.params;
    
    if (!farmCode || typeof farmCode !== 'string' || farmCode.trim() === '') {
      Logger.error(`sensorRouter.humidity.code: 유효하지 않은 농장코드 - farmCode: ${farmCode}`);
      return res.status(400).json({
        success: false,
        message: '유효한 농장코드가 필요합니다.'
      });
    }

    const humidityData = await sensorDataService.getHumidityByFarmCode(farmCode);
    Logger.info(`sensorRouter.humidity.code: 습도 데이터 조회 완료 - 농장코드: ${farmCode}`);
    
    res.status(200).json({
      success: true,
      message: '습도 데이터 조회 성공',
      data: humidityData
    });
  } catch (error) {
    Logger.error(`sensorRouter.humidity.code: 습도 데이터 조회 실패 - 농장코드: ${req.params.farmCode}, 에러: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '습도 데이터 조회에 실패했습니다.'
    });
  }
});

sensorRouter.get('/carbonDioxide/:farmId', async (req, res) => {
  try {
    const { farmId } = req.params;
    
    if (!farmId || isNaN(farmId) || parseInt(farmId) <= 0) {
      Logger.error(`sensorRouter.carbonDioxide: 유효하지 않은 농장ID - farmId: ${farmId}`);
      return res.status(400).json({
        success: false,
        message: '유효한 농장ID가 필요합니다.'
      });
    }

    const carbonDioxideData = await sensorDataService.getCarbonDioxideByFarmId(parseInt(farmId));
    Logger.info(`sensorRouter.carbonDioxide: 이산화탄소 데이터 조회 완료 - 농장ID: ${farmId}`);
    
    res.status(200).json({
      success: true,
      message: '이산화탄소 데이터 조회 성공',
      data: carbonDioxideData
    });
  } catch (error) {
    Logger.error(`sensorRouter.carbonDioxide: 이산화탄소 데이터 조회 실패 - 농장ID: ${req.params.farmId}, 에러: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '이산화탄소 데이터 조회에 실패했습니다.'
    });
  }
});

sensorRouter.get('/carbonDioxide/code/:farmCode', async (req, res) => {
  try {
    const { farmCode } = req.params;
    
    if (!farmCode || typeof farmCode !== 'string' || farmCode.trim() === '') {
      Logger.error(`sensorRouter.carbonDioxide.code: 유효하지 않은 농장코드 - farmCode: ${farmCode}`);
      return res.status(400).json({
        success: false,
        message: '유효한 농장코드가 필요합니다.'
      });
    }

    const carbonDioxideData = await sensorDataService.getCarbonDioxideByFarmCode(farmCode);
    Logger.info(`sensorRouter.carbonDioxide.code: 이산화탄소 데이터 조회 완료 - 농장코드: ${farmCode}`);
    
    res.status(200).json({
      success: true,
      message: '이산화탄소 데이터 조회 성공',
      data: carbonDioxideData
    });
  } catch (error) {
    Logger.error(`sensorRouter.carbonDioxide.code: 이산화탄소 데이터 조회 실패 - 농장코드: ${req.params.farmCode}, 에러: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '이산화탄소 데이터 조회에 실패했습니다.'
    });
  }
});

sensorRouter.get('/nutrient/:farmId', async (req, res) => {
  try {
    const { farmId } = req.params;
    
    if (!farmId || isNaN(farmId) || parseInt(farmId) <= 0) {
      Logger.error(`sensorRouter.nutrient: 유효하지 않은 농장ID - farmId: ${farmId}`);
      return res.status(400).json({
        success: false,
        message: '유효한 농장ID가 필요합니다.'
      });
    }

    const nutrientData = await sensorDataService.getNutrientByFarmId(parseInt(farmId));
    Logger.info(`sensorRouter.nutrient: 양액 데이터 조회 완료 - 농장ID: ${farmId}`);
    
    res.status(200).json({
      success: true,
      message: '양액 데이터 조회 성공',
      data: nutrientData
    });
  } catch (error) {
    Logger.error(`sensorRouter.nutrient: 양액 데이터 조회 실패 - 농장ID: ${req.params.farmId}, 에러: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '양액 데이터 조회에 실패했습니다.'
    });
  }
});

sensorRouter.get('/nutrient/code/:farmCode', async (req, res) => {
  try {
    const { farmCode } = req.params;
    
    if (!farmCode || typeof farmCode !== 'string' || farmCode.trim() === '') {
      Logger.error(`sensorRouter.nutrient.code: 유효하지 않은 농장코드 - farmCode: ${farmCode}`);
      return res.status(400).json({
        success: false,
        message: '유효한 농장코드가 필요합니다.'
      });
    }

    const nutrientData = await sensorDataService.getNutrientByFarmCode(farmCode);
    Logger.info(`sensorRouter.nutrient.code: 양액 데이터 조회 완료 - 농장코드: ${farmCode}`);
    
    res.status(200).json({
      success: true,
      message: '양액 데이터 조회 성공',
      data: nutrientData
    });
  } catch (error) {
    Logger.error(`sensorRouter.nutrient.code: 양액 데이터 조회 실패 - 농장코드: ${req.params.farmCode}, 에러: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '양액 데이터 조회에 실패했습니다.'
    });
  }
});

sensorRouter.get('/illuminance/:farmId', async (req, res) => {
  try {
    const { farmId } = req.params;
    
    if (!farmId || isNaN(farmId) || parseInt(farmId) <= 0) {
      Logger.error(`sensorRouter.illuminance: 유효하지 않은 농장ID - farmId: ${farmId}`);
      return res.status(400).json({
        success: false,
        message: '유효한 농장ID가 필요합니다.'
      });
    }

    const illuminanceData = await sensorDataService.getIlluminanceByFarmId(parseInt(farmId));
    Logger.info(`sensorRouter.illuminance: 조도 데이터 조회 완료 - 농장ID: ${farmId}`);
    
    res.status(200).json({
      success: true,
      message: '조도 데이터 조회 성공',
      data: illuminanceData
    });
  } catch (error) {
    Logger.error(`sensorRouter.illuminance: 조도 데이터 조회 실패 - 농장ID: ${req.params.farmId}, 에러: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '조도 데이터 조회에 실패했습니다.'
    });
  }
});

sensorRouter.get('/illuminance/code/:farmCode', async (req, res) => {
  try {
    const { farmCode } = req.params;
    
    if (!farmCode || typeof farmCode !== 'string' || farmCode.trim() === '') {
      Logger.error(`sensorRouter.illuminance.code: 유효하지 않은 농장코드 - farmCode: ${farmCode}`);
      return res.status(400).json({
        success: false,
        message: '유효한 농장코드가 필요합니다.'
      });
    }

    const illuminanceData = await sensorDataService.getIlluminanceByFarmCode(farmCode);
    Logger.info(`sensorRouter.illuminance.code: 조도 데이터 조회 완료 - 농장코드: ${farmCode}`);
    
    res.status(200).json({
      success: true,
      message: '조도 데이터 조회 성공',
      data: illuminanceData
    });
  } catch (error) {
    Logger.error(`sensorRouter.illuminance.code: 조도 데이터 조회 실패 - 농장코드: ${req.params.farmCode}, 에러: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '조도 데이터 조회에 실패했습니다.'
    });
  }
});

export default sensorRouter;

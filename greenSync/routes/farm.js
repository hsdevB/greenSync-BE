import express from 'express';
import FarmService from '../services/farmService.js';
import logger from '../utils/logger.js';

const farmRouter = express.Router();

// 팜코드 생성 및 발급
farmRouter.get('/farmcode', async (req, res) => {
  try {
    const result = await FarmService.generateFarmCode();
    
    logger.info(`farmRouter.farmcode: 농장코드 생성 완료 - 농장ID: ${result.farmId}, 농장코드: ${result.farmCode}`);
    res.status(200).json({
      success: true,
      message: '농장코드가 성공적으로 생성되었습니다.',
      data: result
    });
    
  } catch (err) {
    logger.error(`farmRouter.farmcode: 농장코드 생성 실패 - 에러: ${err.message}`);
    res.status(500).json({
      success: false,
      message: err.message || '농장코드 생성 중 오류가 발생했습니다.'
    });
  }
});

export default farmRouter;
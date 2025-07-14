import express from 'express';
import FarmService from '../services/farmService.js';
import logger from '../utils/logger.js';

const farmRouter = express.Router();

// 팜코드 생성 및 발급
farmRouter.get('/farmcode', async (req, res) => {
  try {
    logger.info('팜코드 생성 요청');
    
    const result = await FarmService.generateFarmCode();
    
    logger.info(`farmRouter.farmcode.response result: ${JSON.stringify(result)}`);
    res.status(200).json({
      success: true,
      message: '팜코드가 성공적으로 생성되었습니다.',
      data: result
    });
    
  } catch (err) {
    logger.error(`farmRouter.farmcode.error: ${err.message}`);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

export default farmRouter;
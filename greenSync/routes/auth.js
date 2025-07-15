import express from 'express';
import Middleware from '../utils/middleware.js';
import logger from '../utils/logger.js';

const authRouter = express.Router();

authRouter.get('/me', Middleware.isLoggedIn, (req, res) => {
    try {
      const userPayload = req.loginUser;
  
      if (!userPayload) {
          throw new Error("사용자 정보를 찾을 수 없습니다. 토큰이 유효하지 않거나 누락되었습니다.");
      }
  
      const userInfo = {
        userId: userPayload.userId,
        name: userPayload.name,
        farmId: userPayload.farmId,
      };
  
      logger.info(`authRouter.me.response result: ${JSON.stringify(userInfo)}`);
      res.status(200).json({
        success: true,
        message: '사용자 정보 요청 성공',
        data: userInfo
      });
    } catch (err) {
      logger.error(`authRouter.me.error: ${err.message}`);
      res.status(500).json({
        success: false,
        message: "사용자 정보를 가져오는 데 실패했습니다."
      });
    }
  });
  export default authRouter;
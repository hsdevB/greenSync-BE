import express from 'express';
import Middleware from '../utils/middleware.js';
import logger from '../utils/logger.js';

const authRouter = express.Router();

authRouter.get('/me', Middleware.isLoggedIn, (req, res) => {
    try {
      const userPayload = req.loginUser;
  
      if (!userPayload) {
          logger.error('authRouter.me: 사용자 정보를 찾을 수 없습니다. 토큰이 유효하지 않거나 누락되었습니다.');
          return res.status(401).json({
            success: false,
            message: "사용자 정보를 찾을 수 없습니다. 토큰이 유효하지 않거나 누락되었습니다."
          });
      }

      // 필수 필드 검증
      if (!userPayload.userId) {
          logger.error('authRouter.me: 사용자 ID가 누락되었습니다.');
          return res.status(400).json({
            success: false,
            message: "사용자 ID가 누락되었습니다."
          });
      }

      if (!userPayload.name) {
          logger.error('authRouter.me: 사용자 이름이 누락되었습니다.');
          return res.status(400).json({
            success: false,
            message: "사용자 이름이 누락되었습니다."
          });
      }

      if (!userPayload.farmId) {
          logger.error('authRouter.me: 농장 ID가 누락되었습니다.');
          return res.status(400).json({
            success: false,
            message: "농장 ID가 누락되었습니다."
          });
      }

      const userInfo = {
        userId: userPayload.userId,
        name: userPayload.name,
        farmId: userPayload.farmId,
      };
  
      logger.info(`authRouter.me: 사용자 정보 조회 완료 - 사용자ID: ${userInfo.userId}, 이름: ${userInfo.name}, 농장ID: ${userInfo.farmId}`);
      res.status(200).json({
        success: true,
        message: '사용자 정보 요청 성공',
        data: userInfo
      });
    } catch (err) {
      logger.error(`authRouter.me: 사용자 정보 조회 중 오류 발생 - 에러: ${err.message}`);
      res.status(500).json({
        success: false,
        message: "사용자 정보를 가져오는 데 실패했습니다."
      });
    }
  });

export default authRouter;
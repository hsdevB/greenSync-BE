import express from 'express';
import AuthMiddleware from '../utils/authMiddleware.js';
import Logger from '../utils/logger.js';

const authRouter = express.Router();

authRouter.get('/me', AuthMiddleware.isLoggedIn, (req, res) => {
    try {
      const userPayload = req.loginUser;
  
      if (!userPayload) {
          Logger.error('authRouter.me: 사용자 정보를 찾을 수 없습니다. 토큰이 유효하지 않거나 누락되었습니다.');
          return res.status(401).json({
            success: false,
            message: "사용자 정보를 찾을 수 없습니다. 토큰이 유효하지 않거나 누락되었습니다."
          });
      }

      if (!userPayload.userId) {
          Logger.error('authRouter.me: 사용자 ID가 누락되었습니다.');
          return res.status(400).json({
            success: false,
            message: "사용자 ID가 누락되었습니다."
          });
      }

      if (!userPayload.name) {
          Logger.error('authRouter.me: 사용자 이름이 누락되었습니다.');
          return res.status(400).json({
            success: false,
            message: "사용자 이름이 누락되었습니다."
          });
      }

      const userInfo = {
        userId: userPayload.userId,
        name: userPayload.name,
      };
  
      Logger.info(`authRouter.me: 사용자 정보 조회 완료 - 사용자ID: ${userInfo.userId}, 이름: ${userInfo.name}`);
      res.status(200).json({
        success: true,
        message: '사용자 정보 요청 성공',
        data: userInfo
      });
    } catch (err) {
      Logger.error(`authRouter.me: 사용자 정보 조회 중 오류 발생 - 에러: ${err.message}`);
      res.status(500).json({
        success: false,
        message: "사용자 정보를 가져오는 데 실패했습니다."
      });
    }
  });

export default authRouter;
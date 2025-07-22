import Logger from './logger.js';
import TokenUtil from './tokenUtil.js';

class AuthMiddleware {
  static async isLoggedIn(req, res, next) {
    try {
      if (!req || typeof req !== 'object') {
        Logger.error('AuthMiddleware.isLoggedIn: 요청 객체가 제공되지 않았습니다.');
        return res.status(400).json({
          success: false,
          message: '잘못된 요청입니다.'
        });
      }

      if (!req.headers || typeof req.headers !== 'object') {
        Logger.error('AuthMiddleware.isLoggedIn: 요청 헤더가 제공되지 않았습니다.');
        return res.status(400).json({
          success: false,
          message: '요청 헤더가 필요합니다.'
        });
      }

      const token = req.headers.token || req.headers.authorization?.replace('Bearer ', '');

      if (!token || typeof token !== 'string' || token.trim() === '') {
        Logger.error('AuthMiddleware.isLoggedIn: 토큰이 제공되지 않았습니다.');
        return res.status(401).json({
          success: false,
          message: '인증 토큰이 필요합니다.'
        });
      }

      const decoded = TokenUtil.verifyToken(token);

      if (!decoded || typeof decoded !== 'object') {
        Logger.error('AuthMiddleware.isLoggedIn: 토큰 검증 실패 - 유효하지 않은 토큰');
        return res.status(401).json({
          success: false,
          message: '유효하지 않은 토큰입니다.'
        });
      }

      // 토큰에 필요한 정보가 있는지 확인 (farmId 제거됨)
      if (!decoded.userId || !decoded.name) {
        Logger.error('AuthMiddleware.isLoggedIn: 토큰에 필요한 정보가 누락됨 - userId, name 중 하나 이상 누락');
        return res.status(401).json({
          success: false,
          message: '토큰에 필요한 정보가 누락되었습니다.'
        });
      }

      req.loginUser = decoded;
      
      Logger.info(`AuthMiddleware.isLoggedIn: 인증 성공 - 사용자ID: ${decoded.userId}, 이름: ${decoded.name}`);
      next();

    } catch (err) {
      Logger.error(`AuthMiddleware.isLoggedIn: 인증 처리 중 오류 발생 - 에러: ${err.message}`);
      return res.status(500).json({
        success: false,
        message: '인증 처리 중 오류가 발생했습니다.'
      });
    }
  }
}

export default AuthMiddleware;
import jwt from 'jsonwebtoken';
import Logger from './logger.js';

const secretKey = process.env.JWT_SECRET || 'your-default-strong-secret-key-if-env-fails';
const options = {
  expiresIn: process.env.JWT_EXPIRES_IN || '2h'
};

class TokenUtil {
  static makeToken(user) {
    try {
      if (!user || typeof user !== 'object') {
        Logger.error('TokenUtil.makeToken: 사용자 정보가 제공되지 않았습니다.');
        throw new Error('사용자 정보가 필요합니다.');
      }

      if (!user.userId || typeof user.userId !== 'string' || user.userId.trim() === '') {
        Logger.error('TokenUtil.makeToken: 사용자ID가 제공되지 않았습니다.');
        throw new Error('사용자ID가 필요합니다.');
      }

      if (!user.name || typeof user.name !== 'string' || user.name.trim() === '') {
        Logger.error('TokenUtil.makeToken: 사용자 이름이 제공되지 않았습니다.');
        throw new Error('사용자 이름이 필요합니다.');
      }

      if (!secretKey || secretKey === 'your-default-strong-secret-key-if-env-fails') {
        Logger.error('TokenUtil.makeToken: JWT_SECRET 환경변수가 설정되지 않았습니다.');
        throw new Error('JWT_SECRET 환경변수가 필요합니다.');
      }

      const payload = {
        userId: user.userId,
        name: user.name,
      };

      const token = jwt.sign(payload, secretKey, options);
      
      Logger.info(`TokenUtil.makeToken: JWT 토큰 생성 완료 - 사용자ID: ${user.userId}, 이름: ${user.name}`);
      return token;
    } catch (err) {
      if (err.message.includes('사용자 정보가 필요합니다') ||
          err.message.includes('사용자ID가 필요합니다') ||
          err.message.includes('사용자 이름이 필요합니다') ||
          err.message.includes('JWT_SECRET 환경변수')) {
        throw err;
      }
      Logger.error(`TokenUtil.makeToken: JWT 토큰 생성 실패 - 사용자ID: ${user?.userId}, 에러: ${err.message}`);
      throw new Error(`JWT 토큰 생성에 실패했습니다: ${err.message}`);
    }
  }

  static verifyToken(token) {
    try {
      if (!token || typeof token !== 'string' || token.trim() === '') {
        Logger.error('TokenUtil.verifyToken: 토큰이 제공되지 않았습니다.');
        return null;
      }

      if (!secretKey || secretKey === 'your-default-strong-secret-key-if-env-fails') {
        Logger.error('TokenUtil.verifyToken: JWT_SECRET 환경변수가 설정되지 않았습니다.');
        return null;
      }

      const decoded = jwt.verify(token, secretKey);
      
      if (!decoded || typeof decoded !== 'object') {
        Logger.error('TokenUtil.verifyToken: 토큰 디코딩 결과가 유효하지 않습니다.');
        return null;
      }

      // 필수 필드 검증 (farmId 제거됨)
      if (!decoded.userId || !decoded.name) {
        Logger.error('TokenUtil.verifyToken: 토큰에 필요한 정보가 누락됨 - userId, name 중 하나 이상 누락');
        return null;
      }

      Logger.info(`TokenUtil.verifyToken: JWT 토큰 검증 완료 - 사용자ID: ${decoded.userId}, 이름: ${decoded.name}`);
      return decoded;
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        Logger.error('TokenUtil.verifyToken: JWT 토큰이 만료되었습니다.');
        return null;
      } else if (err.name === 'JsonWebTokenError') {
        Logger.error('TokenUtil.verifyToken: 유효하지 않은 JWT 토큰 형식입니다.');
        return null;
      } else if (err.name === 'NotBeforeError') {
        Logger.error('TokenUtil.verifyToken: JWT 토큰이 아직 유효하지 않습니다.');
        return null;
      }
      
      Logger.error(`TokenUtil.verifyToken: JWT 토큰 검증 실패 - 에러: ${err.message}`);
      return null;
    }
  }
}

export default TokenUtil;
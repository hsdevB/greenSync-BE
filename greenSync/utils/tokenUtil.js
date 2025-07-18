import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';

const secretKey = process.env.JWT_SECRET || 'your-default-strong-secret-key-if-env-fails'; // .env의 JWT_SECRET 사용

const options = {
  expiresIn: process.env.JWT_EXPIRES_IN || '2h'
};

class TokenUtil {
  static makeToken(user) {
    try {
    const payload = {
      userId: user.userId,
      name: user.name,
    };
    const token = jwt.sign(payload, secretKey, options);
    logger.info(`tokenUtil.makeToken.success: token=${token}`);
    return token;
    } catch (err) {
      logger.error(`tokenUtil.makeToken.error: ${err.message}`);
      throw err;
    }
  }

  static verifyToken(token) {
    try {
      const decoded = jwt.verify(token, secretKey);
      return decoded;
    } catch (err) {
      console.error('tokenUtil.verifyToken.error:', err.name, err.message);
      return null;
    }
  }
}

export default TokenUtil;
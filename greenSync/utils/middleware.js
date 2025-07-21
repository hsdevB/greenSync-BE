import logger from './logger.js';
import TokenUtil from './tokenUtil.js';

class Middleware {
  static async isLoggedIn(req, res, next) {
    const token = req.headers && req.headers.token;

    if (token) {
      const decoded = TokenUtil.verifyToken(token);

      if (decoded) {
        req.loginUser = decoded;
        next();
      } else {
        const err = new Error('토큰검증 실패');
        logger.error(err.toString());
        res.status(401).json({ 
          success: false,
          message: '토큰 검증 실패'
        });
      }
    } else {
      const err = new Error('토큰이 없습니다.');
      logger.error(err.toString());
      res.status(401).json({ 
        success: false,
        message: '토큰이 없습니다.'
      });
    }
  }
}

export default Middleware;
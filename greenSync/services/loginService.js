import UserDao from '../dao/userDao.js';
import HashUtil from '../utils/hashUtil.js';
import TokenUtil from '../utils/tokenUtil.js';
import logger from '../utils/logger.js';


class LoginService {
static async login(params) {
    try {
      // 1. 사용자 조회
      const userInfo = await UserDao.selectUser(params);

      if (!userInfo) {
        throw new Error(`${params.userId} 계정정보가 존재하지 않습니다.`);
      }
      // 2. 비밀번호 검증
      const isValidPassword = await HashUtil.checkPasswordHash(params.password, userInfo.password);

      if (!isValidPassword) {
        throw new Error('입력하신 비밀번호가 일치하지 않습니다.');
      }

      // 3. JWT 토큰 발급 (farmId는 이제 farmCode 역할을 함)
      const tokenData = {
        userId: userInfo.userId,
        name: userInfo.name,
        farmId: userInfo.farmId, 
      };

      const token = TokenUtil.makeToken(tokenData);

      logger.info(`로그인 성공: ${userInfo.userId}, farmCode: ${userInfo.farmId}`);

      return {
        token,
        user: {
          userId: userInfo.userId,
          name: userInfo.name,
          farmId: userInfo.farmId, 
        }
      };

    } catch (err) {
      logger.error(`LoginService.login.error: ${err.message}`);
      throw err;
    }
  }
}

export default LoginService;

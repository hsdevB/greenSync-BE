import UserDao from '../dao/userDao.js';
import FarmDao from '../dao/farmDao.js';
import HashUtil from '../utils/hashUtil.js';
import TokenUtil from '../utils/tokenUtil.js';
import Logger from '../utils/logger.js';


class LoginService {
  static async login(params) {
    try {
      if (!params || typeof params !== 'object') {
        Logger.error('LoginService.login: 로그인 파라미터가 제공되지 않았습니다.');
        throw new Error('로그인 정보가 필요합니다.');
      }

      if (!params.userId || typeof params.userId !== 'string' || params.userId.trim() === '') {
        Logger.error('LoginService.login: 사용자ID가 제공되지 않았습니다.');
        throw new Error('사용자ID가 필요합니다.');
      }

      if (!params.password || typeof params.password !== 'string' || params.password.trim() === '') {
        Logger.error('LoginService.login: 비밀번호가 제공되지 않았습니다.');
        throw new Error('비밀번호가 필요합니다.');
      }

      const userInfo = await UserDao.select(params);

      if (!userInfo) {
        Logger.error(`LoginService.login: 존재하지 않는 사용자 - userId: ${params.userId}`);
        throw new Error(`${params.userId} 계정정보가 존재하지 않습니다.`);
      }

      const isValidPassword = await HashUtil.checkPasswordHash(params.password, userInfo.password);

      if (!isValidPassword) {
        Logger.error(`LoginService.login: 비밀번호 불일치 - userId: ${params.userId}`);
        throw new Error('입력하신 비밀번호가 일치하지 않습니다.');
      }

      const farmInfo = await FarmDao.selectById(userInfo.farmId);
      
      if (!farmInfo) {
        Logger.error(`LoginService.login: 농장 정보를 찾을 수 없음 - farmId: ${userInfo.farmId}`);
        throw new Error('농장 정보를 찾을 수 없습니다.');
      }

      const tokenData = {
        userId: userInfo.userId,
        name: userInfo.name,
      };

      const token = TokenUtil.makeToken(tokenData);

      Logger.info(`LoginService.login: 로그인 성공 - 사용자ID: ${userInfo.userId}, 이름: ${userInfo.name}, 농장코드: ${farmInfo.farmCode}`);

      return {
        token,
        farmCode: farmInfo.farmCode,
      };

    } catch (err) {
      if (err.message.includes('계정정보가 존재하지 않습니다') || 
          err.message.includes('비밀번호가 일치하지 않습니다') ||
          err.message.includes('로그인 정보가 필요합니다') ||
          err.message.includes('사용자ID가 필요합니다') ||
          err.message.includes('비밀번호가 필요합니다') ||
          err.message.includes('농장 정보를 찾을 수 없습니다')) {
        throw err;
      }
      Logger.error(`LoginService.login: 로그인 처리 실패 - userId: ${params?.userId}, 에러: ${err.message}`);
      throw new Error(`로그인 처리에 실패했습니다: ${err.message}`);
    }
  }
}

export default LoginService;

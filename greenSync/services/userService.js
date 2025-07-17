import UserDao from '../dao/userDao.js';
import FarmService from './farmService.js';
import HashUtil from '../utils/hashUtil.js';
import logger from '../utils/logger.js';

class UserService {
  static async signup(params) {
    try {
      // 1. 팜코드 유효성 검사 및 농장 정보 조회
      const farm = await FarmService.getFarmByCode(params.farmCode);
      if (!farm) { // 팜코드가 없을 경우 오류 처리
        throw new Error('유효하지 않은 팜코드입니다.');
      }

      // 2. 사용자 아이디 중복 검사
      const userExists = await UserDao.checkUserExists(params.userId);
      if (userExists) {
        throw new Error('이미 존재하는 사용자 아이디입니다.');
      }
      const passwordHash = await HashUtil.makePasswordHash(params.password);
      const finalPassword = passwordHash.hash;
      // 3. 사용자 정보 저장
      const userData = {
        farmId: farm.id, // <-- 이 부분을 수정: farm 객체에서 실제 정수형 ID를 사용
        userId: params.userId,
        password: finalPassword,
        name: params.name,
        email: params.email || null,
        phoneNumber: params.phoneNumber || null,
      };

      const result = await UserDao.insert(userData);

      logger.info(`userService.signup.response result: ${JSON.stringify(result)}`);
      return {
        success: true,
        message: '회원가입이 성공적으로 완료되었습니다.',
        data: {
          id: result.insertedId,
          userId: params.userId,
          name: params.name,
          farmId: farm.id, // <-- 응답 데이터에도 정수형 ID를 사용
        }
      };

    } catch (err) {
      logger.error(`userService.signup error: ${err.message}`);
      throw err;
    }
  }

  static async list(params) {
    try {
      const result = await UserDao.selectList(params);
      logger.debug('userService.list', params, result);
      return result;
    } catch (err) {
      logger.error(`userService.list error: ${err.message}`);
      throw err;
    }
  }

  static async info(params) {
    try {
      const result = await UserDao.selectInfo(params);
      logger.debug('userService.info', params, result);
      return result;
    } catch (err) {
      logger.error(`userService.info error: ${err.message}`);
      throw err;
    }
  }

  static async update(params) {
    try {
      // 비밀번호가 있으면 해시화
      if (params.password) {
        params.password = await HashUtil.makePasswordHash(params.password);
      }

      const result = await UserDao.update(params);
      logger.debug('userService.update', params, result);
      return result;
    } catch (err) {
      logger.error(`userService.update error: ${err.message}`);
      throw err;
    }
  }
}

export default UserService;
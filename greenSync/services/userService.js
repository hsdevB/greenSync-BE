import UserDao from '../dao/userDao.js';
import FarmService from './farmService.js';
import HashUtil from '../utils/hashUtil.js';
import Logger from '../utils/logger.js';

class UserService {
  static async signup(params) {
    try {
      if (!params || typeof params !== 'object') {
        Logger.error('UserService.signup: 회원가입 파라미터가 제공되지 않았습니다.');
        throw new Error('회원가입 정보가 필요합니다.');
      }

      if (!params.farmCode || typeof params.farmCode !== 'string' || params.farmCode.trim() === '') {
        Logger.error('UserService.signup: 농장코드가 제공되지 않았습니다.');
        throw new Error('농장코드가 필요합니다.');
      }

      if (!params.userId || typeof params.userId !== 'string' || params.userId.trim() === '') {
        Logger.error('UserService.signup: 사용자ID가 제공되지 않았습니다.');
        throw new Error('사용자ID가 필요합니다.');
      }

      if (!params.password || typeof params.password !== 'string' || params.password.trim() === '') {
        Logger.error('UserService.signup: 비밀번호가 제공되지 않았습니다.');
        throw new Error('비밀번호가 필요합니다.');
      }

      if (!params.name || typeof params.name !== 'string' || params.name.trim() === '') {
        Logger.error('UserService.signup: 이름이 제공되지 않았습니다.');
        throw new Error('이름이 필요합니다.');
      }

      if (params.email && typeof params.email !== 'string') {
        Logger.error('UserService.signup: 유효하지 않은 이메일 형식');
        throw new Error('유효한 이메일 형식이 필요합니다.');
      }

      if (params.phoneNumber && typeof params.phoneNumber !== 'string') {
        Logger.error('UserService.signup: 유효하지 않은 전화번호 형식');
        throw new Error('유효한 전화번호 형식이 필요합니다.');
      }

      const farm = await FarmService.getFarmByCode(params.farmCode);
      if (!farm) {
        Logger.error(`UserService.signup: 유효하지 않은 농장코드 - farmCode: ${params.farmCode}`);
        throw new Error('유효하지 않은 팜코드입니다.');
      }

      const userExists = await UserDao.checkUserExists(params.userId);
      if (userExists) {
        Logger.error(`UserService.signup: 이미 존재하는 사용자ID - userId: ${params.userId}`);
        throw new Error('이미 존재하는 사용자 아이디입니다.');
      }

      const passwordHash = await HashUtil.makePasswordHash(params.password);
      const finalPassword = passwordHash.hash;

      const userData = {
        farmId: farm.id,
        userId: params.userId,
        password: finalPassword,
        name: params.name,
        email: params.email || null,
        phoneNumber: params.phoneNumber || null,
      };

      const result = await UserDao.insert(userData);

      Logger.info(`UserService.signup: 회원가입 완료 - 사용자ID: ${params.userId}, 이름: ${params.name}, 농장ID: ${farm.id}`);
      return {
        success: true,
        message: '회원가입이 성공적으로 완료되었습니다.',
        data: {
          id: result.insertedId,
          userId: params.userId,
          name: params.name,
          farmId: farm.id,
        }
      };

    } catch (err) {
      if (err.message.includes('유효하지 않은 팜코드') || 
          err.message.includes('이미 존재하는 사용자') ||
          err.message.includes('회원가입 정보가 필요합니다') ||
          err.message.includes('농장코드가 필요합니다') ||
          err.message.includes('사용자ID가 필요합니다') ||
          err.message.includes('비밀번호가 필요합니다') ||
          err.message.includes('이름이 필요합니다') ||
          err.message.includes('유효한 이메일 형식') ||
          err.message.includes('유효한 전화번호 형식')) {
        throw err;
      }
      Logger.error(`UserService.signup: 회원가입 처리 실패 - userId: ${params?.userId}, 에러: ${err.message}`);
      throw new Error(`회원가입 처리에 실패했습니다: ${err.message}`);
    }
  }

  static async list(params) {
    try {
      if (!params || typeof params !== 'object') {
        Logger.error('UserService.list: 조회 파라미터가 제공되지 않았습니다.');
        throw new Error('조회 조건이 필요합니다.');
      }

      const result = await UserDao.selectList(params);
      
      Logger.info(`UserService.list: 사용자 목록 조회 완료 - 조회된 사용자 수: ${result?.length || 0}`);
      return result;
    } catch (err) {
      if (err.message.includes('조회 조건이 필요합니다')) {
        throw err;
      }
      Logger.error(`UserService.list: 사용자 목록 조회 실패 - 에러: ${err.message}`);
      throw new Error(`사용자 목록 조회에 실패했습니다: ${err.message}`);
    }
  }

  static async info(params) {
    try {
      if (!params || typeof params !== 'object') {
        Logger.error('UserService.info: 사용자 정보 조회 파라미터가 제공되지 않았습니다.');
        throw new Error('사용자 정보 조회 조건이 필요합니다.');
      }

      if (!params.id || isNaN(params.id) || parseInt(params.id) <= 0) {
        Logger.error(`UserService.info: 유효하지 않은 사용자ID - id: ${params.id}`);
        throw new Error('유효한 사용자ID가 필요합니다.');
      }

      const result = await UserDao.selectInfo(params);
      
      if (!result) {
        Logger.error(`UserService.info: 존재하지 않는 사용자 - id: ${params.id}`);
        throw new Error('존재하지 않는 사용자입니다.');
      }

      Logger.info(`UserService.info: 사용자 정보 조회 완료 - 사용자ID: ${result.userId}, 이름: ${result.name}`);
      return result;
    } catch (err) {
      if (err.message.includes('사용자 정보 조회 조건이 필요합니다') ||
          err.message.includes('유효한 사용자ID가 필요합니다') ||
          err.message.includes('존재하지 않는 사용자')) {
        throw err;
      }
      Logger.error(`UserService.info: 사용자 정보 조회 실패 - id: ${params?.id}, 에러: ${err.message}`);
      throw new Error(`사용자 정보 조회에 실패했습니다: ${err.message}`);
    }
  }

  static async update(params) {
    try {
      if (!params || typeof params !== 'object') {
        Logger.error('UserService.update: 수정 파라미터가 제공되지 않았습니다.');
        throw new Error('수정할 정보가 필요합니다.');
      }

      if (!params.id || isNaN(params.id) || parseInt(params.id) <= 0) {
        Logger.error(`UserService.update: 유효하지 않은 사용자ID - id: ${params.id}`);
        throw new Error('유효한 사용자ID가 필요합니다.');
      }

      if (params.password && (typeof params.password !== 'string' || params.password.trim() === '')) {
        Logger.error('UserService.update: 유효하지 않은 비밀번호 형식');
        throw new Error('유효한 비밀번호 형식이 필요합니다.');
      }

      if (params.password) {
        params.password = await HashUtil.makePasswordHash(params.password);
      }

      const result = await UserDao.update(params);
      
      Logger.info(`UserService.update: 사용자 정보 수정 완료 - 사용자ID: ${params.id}`);
      return result;
    } catch (err) {
      if (err.message.includes('수정할 정보가 필요합니다') ||
          err.message.includes('유효한 사용자ID가 필요합니다') ||
          err.message.includes('유효한 비밀번호 형식')) {
        throw err;
      }
      Logger.error(`UserService.update: 사용자 정보 수정 실패 - id: ${params?.id}, 에러: ${err.message}`);
      throw new Error(`사용자 정보 수정에 실패했습니다: ${err.message}`);
    }
  }
}

export default UserService;
import UserDao from '../dao/userDao.js';
import FarmService from './farmService.js';
import HashUtil from '../utils/hashUtil.js';
import Logger from '../utils/logger.js';

class UserService {
  // static async signup(params, uploadedFile = null) {
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
        // imgPath: uploadedFile ? `/${uploadedFile.filename}` : null,
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

  static async getUserProfile(userId) {
    try {
      if (!userId || typeof userId !== 'string' || userId.trim() === '') {
        Logger.error('UserService.getUserProfile: 사용자ID가 제공되지 않았습니다.');
        throw new Error('사용자ID가 필요합니다.');
      }

      const user = await UserDao.select({ userId });
      
      if (!user) {
        Logger.error(`UserService.getUserProfile: 존재하지 않는 사용자 - userId: ${userId}`);
        throw new Error('존재하지 않는 사용자입니다.');
      }

      const farm = await FarmService.getFarmByCode(user.farmId);
      if (!farm) {
        Logger.error(`UserService.getUserProfile: 존재하지 않는 농장 - farmId: ${user.farmId}`);
        throw new Error('존재하지 않는 농장입니다.');
      }

      Logger.info(`UserService.getUserProfile: 사용자 프로필 조회 완료 - userId: ${userId}`);
      return {
        success: true,
        data: {
          userId: user.userId,
          name: user.name,
          email: user.email,
          phoneNumber: user.phoneNumber,
          farmCode: farm.farmCode,
          // profileImage: user.imgPath ? `/uploads/profiles${user.imgPath}` : '/images/default-profile.png'
        }
      };
    } catch (err) {
      if (err.message.includes('사용자ID가 필요합니다') || 
          err.message.includes('존재하지 않는 사용자') ||
          err.message.includes('존재하지 않는 농장')) {
        throw err;
      }
      Logger.error(`UserService.getUserProfile: 사용자 프로필 조회 실패 - userId: ${userId}, 에러: ${err.message}`);
      throw new Error(`사용자 프로필 조회에 실패했습니다: ${err.message}`);
    }
  }

  // static async updateUserProfile(userId, updateData, uploadedFile = null) {
  static async updateUserProfile(userId, updateData) {
    try {
      if (!userId || typeof userId !== 'string' || userId.trim() === '') {
        Logger.error('UserService.updateUserProfile: 사용자ID가 제공되지 않았습니다.');
        throw new Error('사용자ID가 필요합니다.');
      }

      if (!updateData || typeof updateData !== 'object') {
        Logger.error('UserService.updateUserProfile: 수정할 데이터가 제공되지 않았습니다.');
        throw new Error('수정할 데이터가 필요합니다.');
      }

      const existingUser = await UserDao.select({ userId });
      if (!existingUser) {
        Logger.error(`UserService.updateUserProfile: 존재하지 않는 사용자 - userId: ${userId}`);
        throw new Error('존재하지 않는 사용자입니다.');
      }

      const allowedFields = ['name', 'email', 'phoneNumber'];
      const filteredData = {};
      
      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          if (field === 'email' && updateData[field] !== null && typeof updateData[field] !== 'string') {
            throw new Error('유효한 이메일 형식이 필요합니다.');
          }
          if (field === 'phoneNumber' && updateData[field] !== null && typeof updateData[field] !== 'string') {
            throw new Error('유효한 전화번호 형식이 필요합니다.');
          }
          filteredData[field] = updateData[field];
        }
      }

      // 이미지 파일이 업로드된 경우
      // if (uploadedFile) {
      //   filteredData.imgPath = `/${uploadedFile.filename}`;
      // }

      if (updateData.password) {
        if (typeof updateData.password !== 'string' || updateData.password.trim() === '') {
          throw new Error('유효한 비밀번호가 필요합니다.');
        }
        const passwordHash = await HashUtil.makePasswordHash(updateData.password);
        filteredData.password = passwordHash.hash;
      }

      if (Object.keys(filteredData).length === 0) {
        throw new Error('수정할 데이터가 없습니다.');
      }

      const result = await UserDao.update({
        id: existingUser.id,
        ...filteredData
      });

      Logger.info(`UserService.updateUserProfile: 사용자 프로필 수정 완료 - userId: ${userId}`);
      return {
        success: true,
        message: '프로필이 성공적으로 수정되었습니다.',
        data: { updatedCount: result.updatedCount }
      };
    } catch (err) {
      if (err.message.includes('사용자ID가 필요합니다') ||
          err.message.includes('수정할 데이터가 필요합니다') ||
          err.message.includes('존재하지 않는 사용자') ||
          err.message.includes('유효한 이메일 형식') ||
          err.message.includes('유효한 전화번호 형식') ||
          err.message.includes('유효한 비밀번호가 필요합니다') ||
          err.message.includes('수정할 데이터가 없습니다')) {
        throw err;
      }
      Logger.error(`UserService.updateUserProfile: 사용자 프로필 수정 실패 - userId: ${userId}, 에러: ${err.message}`);
      throw new Error(`사용자 프로필 수정에 실패했습니다: ${err.message}`);
    }
  }

  static async deleteUser(userId) {
    try {
      if (!userId || typeof userId !== 'string' || userId.trim() === '') {
        Logger.error('UserService.deleteUser: 사용자ID가 제공되지 않았습니다.');
        throw new Error('사용자ID가 필요합니다.');
      }

      const existingUser = await UserDao.select({ userId });
      if (!existingUser) {
        Logger.error(`UserService.deleteUser: 존재하지 않는 사용자 - userId: ${userId}`);
        throw new Error('존재하지 않는 사용자입니다.');
      }

      const result = await UserDao.delete({ id: existingUser.id });

      Logger.info(`UserService.deleteUser: 사용자 삭제 완료 - userId: ${userId}`);
      return {
        success: true,
        message: '사용자가 성공적으로 삭제되었습니다.',
        data: { deletedCount: result.deletedCount }
      };
    } catch (err) {
      if (err.message.includes('사용자ID가 필요합니다') ||
          err.message.includes('존재하지 않는 사용자')) {
        throw err;
      }
      Logger.error(`UserService.deleteUser: 사용자 삭제 실패 - userId: ${userId}, 에러: ${err.message}`);
      throw new Error(`사용자 삭제에 실패했습니다: ${err.message}`);
    }
  }
}

export default UserService;
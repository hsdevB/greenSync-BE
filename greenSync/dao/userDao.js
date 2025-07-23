import Logger from '../utils/logger.js';
import User from '../models/user.js';
import Farm from '../models/farm.js';

class UserDao {
  static async insert(params) {
    try {
      if (!params || typeof params !== 'object') {
        Logger.error('UserDao.insert: 사용자 데이터 파라미터가 제공되지 않았습니다.');
        throw new Error('사용자 데이터 파라미터가 필요합니다.');
      }

      if (!params.userId || params.userId.trim() === '') {
        Logger.error('UserDao.insert: 사용자 ID가 제공되지 않았습니다.');
        throw new Error('사용자 ID는 필수값입니다.');
      }

      if (!params.password || params.password.trim() === '') {
        Logger.error('UserDao.insert: 비밀번호가 제공되지 않았습니다.');
        throw new Error('비밀번호는 필수값입니다.');
      }

      const inserted = await User.create(params);
      Logger.info(`UserDao.insert: 사용자 데이터 저장 완료 - ID: ${inserted.id}, 사용자ID: ${inserted.userId}`);
      return { insertedId: inserted.id };
    } catch (err) {
      if (err.message.includes('사용자 데이터 파라미터') || 
          err.message.includes('사용자 ID는 필수값입니다') || 
          err.message.includes('비밀번호는 필수값입니다')) {
        throw err;
      }
      Logger.error(`UserDao.insert: 사용자 데이터 저장 실패 - 에러: ${err.message}`);
      throw new Error(`사용자 데이터 저장에 실패했습니다: ${err.message}`);
    }
  }

  static async select(params) {
    try {
      if (!params || !params.userId) {
        Logger.error('UserDao.select: 사용자 ID가 제공되지 않았습니다.');
        throw new Error('사용자 ID가 필요합니다.');
      }

      if (typeof params.userId !== 'string' || params.userId.trim() === '') {
        Logger.error(`UserDao.select: 유효하지 않은 사용자 ID: ${params.userId}`);
        throw new Error('유효한 사용자 ID가 필요합니다.');
      }

      const result = await User.findOne({
        attributes: ['id', 'farmId', 'userId', 'password', 'name', 'email', 'phoneNumber'],
        where: {
          userId: params.userId
        },
        include: [
          {
            model: Farm,
            as: 'farm',
            attributes: ['id', 'farmCode']
          }
        ]
      });
      
      if (result) {
        Logger.info(`UserDao.select: 사용자 조회 완료 - 사용자ID: ${params.userId}, ID: ${result.id}`);
      } else {
        Logger.info(`UserDao.select: 사용자를 찾을 수 없음 - 사용자ID: ${params.userId}`);
      }
      
      return result;
    } catch (err) {
      if (err.message.includes('사용자 ID가 필요합니다') || 
          err.message.includes('유효한 사용자 ID가 필요합니다')) {
        throw err;
      }
      Logger.error(`UserDao.select: 사용자 조회 실패 - 사용자ID: ${params.userId}, 에러: ${err.message}`);
      throw new Error(`사용자 조회에 실패했습니다: ${err.message}`);
    }
  }

  static async update(params) {
    try {
      if (!params || !params.id) {
        Logger.error('UserDao.update: 사용자 ID가 제공되지 않았습니다.');
        throw new Error('사용자 ID가 필요합니다.');
      }

      if (typeof params.id !== 'number' || isNaN(params.id) || params.id <= 0) {
        Logger.error(`UserDao.update: 유효하지 않은 사용자 ID: ${params.id}`);
        throw new Error('유효한 사용자 ID가 필요합니다.');
      }

      const [result] = await User.update(params, {
        where: { id: params.id }
      });
      
      Logger.info(`UserDao.update: 사용자 정보 수정 완료 - ID: ${params.id}, 수정된 레코드 수: ${result}`);
      return { updatedCount: result };
    } catch (err) {
      if (err.message.includes('사용자 ID가 필요합니다') || 
          err.message.includes('유효한 사용자 ID가 필요합니다')) {
        throw err;
      }
      Logger.error(`UserDao.update: 사용자 정보 수정 실패 - ID: ${params.id}, 에러: ${err.message}`);
      throw new Error(`사용자 정보 수정에 실패했습니다: ${err.message}`);
    }
  }

  static async delete(params) {
    try {
      if (!params || !params.id) {
        Logger.error('UserDao.delete: 사용자 ID가 제공되지 않았습니다.');
        throw new Error('사용자 ID가 필요합니다.');
      }

      if (typeof params.id !== 'number' || isNaN(params.id) || params.id <= 0) {
        Logger.error(`UserDao.delete: 유효하지 않은 사용자 ID: ${params.id}`);
        throw new Error('유효한 사용자 ID가 필요합니다.');
      }

      const result = await User.destroy({
        where: { id: params.id }
      });
      
      Logger.info(`UserDao.delete: 사용자 삭제 완료 - ID: ${params.id}, 삭제된 레코드 수: ${result}`);
      return { deletedCount: result };
    } catch (err) {
      if (err.message.includes('사용자 ID가 필요합니다') || 
          err.message.includes('유효한 사용자 ID가 필요합니다')) {
        throw err;
      }
      Logger.error(`UserDao.delete: 사용자 삭제 실패 - ID: ${params.id}, 에러: ${err.message}`);
      throw new Error(`사용자 삭제에 실패했습니다: ${err.message}`);
    }
  }

  static async checkUserExists(userId) {
    try {
      if (!userId || typeof userId !== 'string' || userId.trim() === '') {
        Logger.error('UserDao.checkUserExists: 사용자 ID가 제공되지 않았습니다.');
        throw new Error('사용자 ID가 필요합니다.');
      }

      const count = await User.count({
        where: { userId }
      });
      
      const exists = count > 0;
      Logger.info(`UserDao.checkUserExists: 사용자 존재 여부 확인 완료 - 사용자ID: ${userId}, 존재: ${exists}`);
      return exists;
    } catch (err) {
      if (err.message.includes('사용자 ID가 필요합니다')) {
        throw err;
      }
      Logger.error(`UserDao.checkUserExists: 사용자 존재 여부 확인 실패 - 사용자ID: ${userId}, 에러: ${err.message}`);
      throw new Error(`사용자 존재 여부 확인에 실패했습니다: ${err.message}`);
    }
  }
}

export default UserDao;
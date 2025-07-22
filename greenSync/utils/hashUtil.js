import bcrypt from 'bcrypt';
import Logger from './logger.js';

class HashUtil {
  static async generateSalt(rounds = 10) {
    try {
      if (rounds && (isNaN(rounds) || parseInt(rounds) <= 0 || parseInt(rounds) > 20)) {
        Logger.error(`HashUtil.generateSalt: 유효하지 않은 라운드 수 - rounds: ${rounds}`);
        throw new Error('유효한 라운드 수가 필요합니다. (1-20 범위)');
      }

      const saltRounds = parseInt(rounds) || 10;
      const salt = await bcrypt.genSalt(saltRounds);
      
      Logger.info(`HashUtil.generateSalt: 솔트 생성 완료 - 라운드 수: ${saltRounds}`);
      return salt;
    } catch (err) {
      if (err.message.includes('유효한 라운드 수가 필요합니다')) {
        throw err;
      }
      Logger.error(`HashUtil.generateSalt: 솔트 생성 실패 - rounds: ${rounds}, 에러: ${err.message}`);
      throw new Error(`솔트 생성에 실패했습니다: ${err.message}`);
    }
  }

  static async makePasswordHash(password) {
    try {
      if (!password || typeof password !== 'string' || password.trim() === '') {
        Logger.error('HashUtil.makePasswordHash: 비밀번호가 제공되지 않았습니다.');
        throw new Error('비밀번호가 필요합니다.');
      }

      if (password.length < 8) {
        Logger.error('HashUtil.makePasswordHash: 비밀번호가 너무 짧습니다.');
        throw new Error('비밀번호는 최소 8자 이상이어야 합니다.');
      }

      const saltRounds = process.env.SALT_ROUNDS ? parseInt(process.env.SALT_ROUNDS) : 10;
      if (saltRounds && (isNaN(saltRounds) || saltRounds <= 0 || saltRounds > 20)) {
        Logger.error(`HashUtil.makePasswordHash: 유효하지 않은 SALT_ROUNDS 환경변수 - SALT_ROUNDS: ${process.env.SALT_ROUNDS}`);
        throw new Error('유효한 SALT_ROUNDS 환경변수가 필요합니다. (1-20 범위)');
      }

      const salt = await HashUtil.generateSalt(saltRounds);
      const hash = await bcrypt.hash(password, salt);
      
      Logger.info(`HashUtil.makePasswordHash: 비밀번호 해시화 완료 - 라운드 수: ${saltRounds}`);
      
      return {
        hash: hash, 
      };
      
    } catch (err) {
      if (err.message.includes('비밀번호가 필요합니다') ||
          err.message.includes('비밀번호는 최소 6자 이상') ||
          err.message.includes('유효한 SALT_ROUNDS 환경변수') ||
          err.message.includes('유효한 라운드 수가 필요합니다')) {
        throw err;
      }
      Logger.error(`HashUtil.makePasswordHash: 비밀번호 해시화 실패 - 에러: ${err.message}`);
      throw new Error(`비밀번호 해시화에 실패했습니다: ${err.message}`);
    }
  }

  static async checkPasswordHash(password, encryptedPassword) {
    try {
      if (!password || typeof password !== 'string' || password.trim() === '') {
        Logger.error('HashUtil.checkPasswordHash: 비밀번호가 제공되지 않았습니다.');
        throw new Error('비밀번호가 필요합니다.');
      }

      if (!encryptedPassword || typeof encryptedPassword !== 'string' || encryptedPassword.trim() === '') {
        Logger.error('HashUtil.checkPasswordHash: 암호화된 비밀번호가 제공되지 않았습니다.');
        throw new Error('암호화된 비밀번호가 필요합니다.');
      }

      if (!encryptedPassword.startsWith('$2b$') && !encryptedPassword.startsWith('$2a$')) {
        Logger.error('HashUtil.checkPasswordHash: 유효하지 않은 bcrypt 해시 형식');
        throw new Error('유효한 bcrypt 해시 형식이 필요합니다.');
      }

      const result = await bcrypt.compare(password, encryptedPassword);
      
      Logger.info(`HashUtil.checkPasswordHash: 비밀번호 검증 완료 - 결과: ${result ? '일치' : '불일치'}`);
      return result;
      
    } catch (err) {
      if (err.message.includes('비밀번호가 필요합니다') ||
          err.message.includes('암호화된 비밀번호가 필요합니다') ||
          err.message.includes('유효한 bcrypt 해시 형식')) {
        throw err;
      }
      Logger.error(`HashUtil.checkPasswordHash: 비밀번호 검증 실패 - 에러: ${err.message}`);
      throw new Error(`비밀번호 검증에 실패했습니다: ${err.message}`);
    }
  }

  static extractSaltFromHash(bcryptHash) {
    try {
      if (!bcryptHash || typeof bcryptHash !== 'string' || bcryptHash.trim() === '') {
        Logger.error('HashUtil.extractSaltFromHash: bcrypt 해시가 제공되지 않았습니다.');
        throw new Error('bcrypt 해시가 필요합니다.');
      }

      if (!bcryptHash.startsWith('$2b$') && !bcryptHash.startsWith('$2a$')) {
        Logger.error('HashUtil.extractSaltFromHash: 유효하지 않은 bcrypt 해시 형식');
        throw new Error('유효한 bcrypt 해시 형식이 필요합니다.');
      }
      
      const parts = bcryptHash.split('$');
      if (parts.length !== 4) {
        Logger.error(`HashUtil.extractSaltFromHash: 잘못된 bcrypt 해시 형식 - parts.length: ${parts.length}`);
        throw new Error('bcrypt 해시 형식이 올바르지 않습니다.');
      }
      
      const algorithm = parts[1]; 
      const rounds = parts[2];    
      const saltAndHash = parts[3]; 
      
      if (!saltAndHash || saltAndHash.length < 22) {
        Logger.error('HashUtil.extractSaltFromHash: 솔트와 해시 부분이 너무 짧습니다.');
        throw new Error('bcrypt 해시의 솔트와 해시 부분이 올바르지 않습니다.');
      }
      
      const salt = saltAndHash.substring(0, 22); 
      const fullSalt = `$${algorithm}$${rounds}$${salt}`;
      
      Logger.info(`HashUtil.extractSaltFromHash: 솔트 추출 완료 - 알고리즘: ${algorithm}, 라운드: ${rounds}`);
      
      return {
        algorithm: algorithm,
        rounds: parseInt(rounds),
        salt: salt,
        fullSalt: fullSalt
      };
      
    } catch (err) {
      if (err.message.includes('bcrypt 해시가 필요합니다') ||
          err.message.includes('유효한 bcrypt 해시 형식') ||
          err.message.includes('bcrypt 해시 형식이 올바르지 않습니다') ||
          err.message.includes('솔트와 해시 부분이 너무 짧습니다')) {
        throw err;
      }
      Logger.error(`HashUtil.extractSaltFromHash: 솔트 추출 실패 - 에러: ${err.message}`);
      throw new Error(`솔트 추출에 실패했습니다: ${err.message}`);
    }
  }
}

export default HashUtil;
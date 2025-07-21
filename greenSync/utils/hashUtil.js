import bcrypt from 'bcrypt';
import logger from './logger.js';

class HashUtil {
  // Salt 생성 함수 (bcrypt 사용)
  static async generateSalt(rounds = 10) {
    try {
      const salt = await bcrypt.genSalt(rounds);
      logger.info(`hashUtil.generateSalt.success: salt generated with ${rounds} rounds`);
      return salt;
    } catch (err) {
      logger.error(`hashUtil.generateSalt.error: ${err.message}`);
      throw err;
    }
  }

  static async makePasswordHash(password) {
    try {
      if (!password) {
        throw new Error('password가 입력되지 않았습니다!');
      }

      //Salt 생성
      const saltRounds = process.env.SALT_ROUNDS ? parseInt(process.env.SALT_ROUNDS) : 10;
      const salt = await HashUtil.generateSalt(saltRounds);
      
      logger.info(`hashUtil.makePasswordHash.info: salt=${salt}`); 
      
      // 생성된 salt로 비밀번호 해싱
      const hash = await bcrypt.hash(password, salt);
      
      logger.info(`hashUtil.makePasswordHash.success: password hashed successfully`);
      
      // salt와 hash를 분리해서 저장할 수 있도록 반환
      return {
        hash: hash, 
      };
      
    } catch (err) {
      logger.error(`hashUtil.makePasswordHash.error: ${err.message}`);
      throw err;
    }
  }

  static async checkPasswordHash(password, encryptedPassword) {
    try {
      if (!password || !encryptedPassword) {
        throw new Error('password, encryptedPassword는 필수값입니다!');
      }

      const result = await bcrypt.compare(password, encryptedPassword);
      return result;
      
    } catch (err) {
      logger.error(`hashUtil.checkPasswordHash.error: ${err.message}`);
      throw err; 
    }
  }

  // bcrypt 해시에서 salt 추출하는 유틸리티 함수
  static extractSaltFromHash(bcryptHash) {
    try {
      if (!bcryptHash || typeof bcryptHash !== 'string') {
        throw new Error('유효하지 않은 bcrypt 해시입니다.');
      }
      
      const parts = bcryptHash.split('$');
      if (parts.length !== 4) {
        throw new Error('bcrypt 해시 형식이 올바르지 않습니다.');
      }
      
      const algorithm = parts[1]; 
      const rounds = parts[2];    
      const saltAndHash = parts[3]; 
      const salt = saltAndHash.substring(0, 22); 
      
      const fullSalt = `$${algorithm}$${rounds}$${salt}`;
      
      logger.info(`hashUtil.extractSaltFromHash.success: algorithm=${algorithm}, rounds=${rounds}, salt=${salt}`);
      
      return {
        algorithm: algorithm,
        rounds: parseInt(rounds),
        salt: salt,
        fullSalt: fullSalt
      };
      
    } catch (err) {
      logger.error(`hashUtil.extractSaltFromHash.error: ${err.message}`);
      throw err;
    }
  }
}

export default HashUtil;
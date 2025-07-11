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

      // 1. Salt 생성 (환경변수로 rounds 조정 가능)
      const saltRounds = process.env.SALT_ROUNDS ? parseInt(process.env.SALT_ROUNDS) : 10;
      const salt = await HashUtil.generateSalt(saltRounds);
      
      logger.info(`hashUtil.makePasswordHash.info: salt=${salt}`); // Salt 정보 로깅
      
      // 2. 생성된 salt로 비밀번호 해싱
      const hash = await bcrypt.hash(password, salt);
      
      logger.info(`hashUtil.makePasswordHash.success: password hashed successfully`);
      
      // 3. salt와 hash를 분리해서 저장할 수 있도록 반환
      return {
        hash: hash, // 전체 bcrypt 해시만 반환 (salt는 해시에 포함되어 있음)
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

      // bcrypt.compare는 일반 텍스트 비밀번호와 전체 bcrypt 해시를 비교합니다.
      // 암호화된 비밀번호가 'salt.hash' 형태의 레거시 포맷인 경우, bcrypt.compare는 자동으로 실패합니다.
      // 따라서, 모든 비밀번호는 전체 bcrypt 해시 형태로 저장되어야 하며,
      // 레거시 형식은 이 함수에서 직접 처리하지 않고, 필요하다면 데이터 마이그레이션을 권장합니다.
      const result = await bcrypt.compare(password, encryptedPassword);
      
      // bcrypt 해시에서 salt 부분 추출해서 로깅 (참고용, 실제 검증에 사용되지 않음)
      const saltFromHash = encryptedPassword.substring(0, 29); // bcrypt salt는 보통 29자
      logger.info(`hashUtil.checkPasswordHash.info: extracted salt=${saltFromHash}`);
      logger.info(`hashUtil.checkPasswordHash.success: password check completed, match=${result}`);
      
      return result;
      
    } catch (err) {
      logger.error(`hashUtil.checkPasswordHash.error: ${err.message}`);
      throw err; // HTTP 응답 처리는 서비스 또는 라우트 계층에서 담당
    }
  }

  // 추가: bcrypt 해시에서 salt 추출하는 유틸리티 함수
  static extractSaltFromHash(bcryptHash) {
    try {
      if (!bcryptHash || typeof bcryptHash !== 'string') {
        throw new Error('유효하지 않은 bcrypt 해시입니다.');
      }
      
      // bcrypt 해시 형식: $2b$10$salt22characters$hash31characters
      const parts = bcryptHash.split('$');
      if (parts.length !== 4) {
        throw new Error('bcrypt 해시 형식이 올바르지 않습니다.');
      }
      
      const algorithm = parts[1]; // 2a, 2b 등
      const rounds = parts[2];    // salt rounds
      const saltAndHash = parts[3]; // salt(22자) + hash(31자)
      const salt = saltAndHash.substring(0, 22); // salt 부분만 추출
      
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
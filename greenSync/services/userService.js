import UserDao from '../dao/userDao.js';
import FarmService from './farmService.js';
import HashUtil from '../utils/hashUtil.js';
import Logger from '../utils/logger.js';
import nodemailer from 'nodemailer';

// 이메일 인증 코드 저장소 (실제 운영에서는 Redis나 DB 사용 권장)
const emailCodeStore = {};

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

  static async sendEmailCode(params) {
    try {
      if (!params || typeof params !== 'object') {
        Logger.error('UserService.sendEmailCode: 파라미터가 제공되지 않았습니다.');
        throw new Error('이메일은 필수값입니다.');
      }

      const { email } = params;

      if (!email || typeof email !== 'string' || email.trim() === '') {
        Logger.error('UserService.sendEmailCode: 이메일이 제공되지 않았습니다.');
        throw new Error('이메일은 필수값입니다.');
      }

      // 이메일 형식 검증
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        Logger.error(`UserService.sendEmailCode: 유효하지 않은 이메일 형식 - email: ${email}`);
        throw new Error('유효한 이메일 형식이 아닙니다.');
      }

      // 이미 회원가입된 이메일인지 확인
      // const existingUser = await UserDao.findByEmail(email);
      // if (existingUser) {
      //   Logger.error(`UserService.sendEmailCode: 이미 회원가입된 이메일 - email: ${email}`);
      //   throw new Error('이미 회원가입된 이메일입니다.');
      // }

      // 인증 코드 생성 (6자리 숫자)
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      
      // 코드 저장 (10분 만료)
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10분
      emailCodeStore[email] = {
        code,
        expiresAt,
        attempts: 0 // 시도 횟수 제한
      };

      // 이메일 발송
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
      });

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: '[GreenSync] 이메일 인증 코드',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2E7D32;">GreenSync 이메일 인증</h2>
            <p>안녕하세요! GreenSync 회원가입을 위한 이메일 인증 코드를 발송드립니다.</p>
            <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
              <h3 style="color: #2E7D32; margin: 0; font-size: 24px;">${code}</h3>
            </div>
            <p><strong>주의사항:</strong></p>
            <ul>
              <li>이 인증 코드는 10분간 유효합니다.</li>
              <li>인증 코드는 5회까지 시도할 수 있습니다.</li>
              <li>본인이 요청하지 않은 경우 이 이메일을 무시하세요.</li>
            </ul>
            <p style="color: #666; font-size: 12px; margin-top: 30px;">
              이 이메일은 GreenSync 회원가입 인증을 위해 발송되었습니다.
            </p>
          </div>
        `
      });

      Logger.info(`UserService.sendEmailCode: 이메일 인증 코드 발송 완료 - email: ${email}`);
      return {
        success: true,
        message: '이메일 인증코드가 발송되었습니다.',
        data: { email }
      };

    } catch (err) {
      if (err.message.includes('이메일은 필수값입니다') ||
          err.message.includes('유효한 이메일 형식이 아닙니다') ||
          err.message.includes('이미 회원가입된 이메일입니다')) {
        throw err;
      }
      Logger.error(`UserService.sendEmailCode: 이메일 인증 코드 발송 실패 - email: ${params?.email || '알 수 없음'}, 에러: ${err.message}`);
      throw new Error('이메일 발송에 실패했습니다.');
    }
  }

  static async verifyEmailCode(params) {
    try {
      if (!params || typeof params !== 'object') {
        Logger.error('UserService.verifyEmailCode: 파라미터가 제공되지 않았습니다.');
        throw new Error('이메일과 인증코드는 필수값입니다.');
      }

      const { email, code } = params;

      if (!email || typeof email !== 'string' || email.trim() === '') {
        Logger.error('UserService.verifyEmailCode: 이메일이 제공되지 않았습니다.');
        throw new Error('이메일은 필수값입니다.');
      }

      if (!code || typeof code !== 'string' || code.trim() === '') {
        Logger.error('UserService.verifyEmailCode: 인증코드가 제공되지 않았습니다.');
        throw new Error('인증코드는 필수값입니다.');
      }

      // 이메일 형식 검증
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        Logger.error(`UserService.verifyEmailCode: 유효하지 않은 이메일 형식 - email: ${email}`);
        throw new Error('유효한 이메일 형식이 아닙니다.');
      }

      // 저장된 코드 확인
      const storedData = emailCodeStore[email];
      if (!storedData) {
        Logger.error(`UserService.verifyEmailCode: 인증코드가 존재하지 않음 - email: ${email}`);
        throw new Error('인증코드가 존재하지 않습니다. 다시 발송해주세요.');
      }

      // 만료 시간 확인
      if (new Date() > storedData.expiresAt) {
        delete emailCodeStore[email];
        Logger.error(`UserService.verifyEmailCode: 인증코드 만료 - email: ${email}`);
        throw new Error('인증코드가 만료되었습니다. 다시 발송해주세요.');
      }

      // 시도 횟수 확인
      if (storedData.attempts >= 5) {
        delete emailCodeStore[email];
        Logger.error(`UserService.verifyEmailCode: 인증코드 시도 횟수 초과 - email: ${email}`);
        throw new Error('인증코드 시도 횟수를 초과했습니다. 다시 발송해주세요.');
      }

      // 시도 횟수 증가
      storedData.attempts++;

      // 코드 일치 확인
      if (storedData.code !== code) {
        Logger.error(`UserService.verifyEmailCode: 인증코드 불일치 - email: ${email}, 입력코드: ${code}`);
        throw new Error('인증코드가 일치하지 않습니다.');
      }

      // 인증 성공 - 저장된 데이터 삭제
      delete emailCodeStore[email];

      Logger.info(`UserService.verifyEmailCode: 이메일 인증 성공 - email: ${email}`);
      return {
        success: true,
        message: '이메일 인증이 성공적으로 완료되었습니다.',
        data: { email, verified: true }
      };

    } catch (err) {
      if (err.message.includes('이메일과 인증코드는 필수값입니다') ||
          err.message.includes('이메일은 필수값입니다') ||
          err.message.includes('인증코드는 필수값입니다') ||
          err.message.includes('유효한 이메일 형식이 아닙니다') ||
          err.message.includes('인증코드가 존재하지 않습니다') ||
          err.message.includes('인증코드가 만료되었습니다') ||
          err.message.includes('인증코드 시도 횟수를 초과했습니다') ||
          err.message.includes('인증코드가 일치하지 않습니다')) {
        throw err;
      }
      Logger.error(`UserService.verifyEmailCode: 이메일 인증 실패 - email: ${params?.email || '알 수 없음'}, 에러: ${err.message}`);
      throw new Error('이메일 인증 중 오류가 발생했습니다.');
    }
  }

  // 만료된 코드 정리 메서드 (주기적으로 호출)
  static cleanupExpiredCodes() {
    const now = new Date();
    let cleanedCount = 0;
    
    for (const [email, data] of Object.entries(emailCodeStore)) {
      if (now > data.expiresAt) {
        delete emailCodeStore[email];
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      Logger.info(`UserService.cleanupExpiredCodes: 만료된 인증코드 ${cleanedCount}개 정리 완료`);
    }
  }
}

export default UserService;
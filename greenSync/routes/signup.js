import express from 'express';
import UserService from '../services/userService.js';
import logger from '../utils/logger.js';

const signupRouter = express.Router();

signupRouter.post('/', async (req, res) => {
    try {
        if (!req.body || typeof req.body !== 'object') {
            logger.error('signupRouter.signup: 요청 본문이 제공되지 않았습니다.');
            return res.status(400).json({
                success: false,
                message: '요청 본문이 필요합니다.'
            });
        }

        const params = {
            farmCode: req.body.farmCode,
            userId: req.body.userId,
            password: req.body.password,
            name: req.body.name,
            email: req.body.email,
            phoneNumber: req.body.phoneNumber,
        };

        if (!params.farmCode || typeof params.farmCode !== 'string' || params.farmCode.trim() === '') {
            logger.error('signupRouter.signup: 농장코드가 제공되지 않았습니다.');
            return res.status(400).json({
                success: false,
                message: '농장코드는 필수값입니다.'
            });
        }

        if (!params.userId || typeof params.userId !== 'string' || params.userId.trim() === '') {
            logger.error('signupRouter.signup: 사용자 ID가 제공되지 않았습니다.');
            return res.status(400).json({
                success: false,
                message: '사용자 ID는 필수값입니다.'
            });
        }

        if (!params.password || typeof params.password !== 'string' || params.password.trim() === '') {
            logger.error('signupRouter.signup: 비밀번호가 제공되지 않았습니다.');
            return res.status(400).json({
                success: false,
                message: '비밀번호는 필수값입니다.'
            });
        }

        if (!params.name || typeof params.name !== 'string' || params.name.trim() === '') {
            logger.error('signupRouter.signup: 사용자 이름이 제공되지 않았습니다.');
            return res.status(400).json({
                success: false,
                message: '사용자 이름은 필수값입니다.'
            });
        }

        if (params.userId.length < 3 || params.userId.length > 50) {
            logger.error(`signupRouter.signup: 사용자 ID 길이가 유효하지 않습니다 - 길이: ${params.userId.length}`);
            return res.status(400).json({
                success: false,
                message: '사용자 ID는 3자 이상 50자 이하여야 합니다.'
            });
        }

        if (params.password.length < 8) {
            logger.error('signupRouter.signup: 비밀번호가 너무 짧습니다.');
            return res.status(400).json({
                success: false,
                message: '비밀번호는 8자 이상이어야 합니다.'
            });
        }

        if (params.name.length < 2 || params.name.length > 50) {
            logger.error(`signupRouter.signup: 사용자 이름 길이가 유효하지 않습니다 - 길이: ${params.name.length}`);
            return res.status(400).json({
                success: false,
                message: '사용자 이름은 2자 이상 50자 이하여야 합니다.'
            });
        }

        if (params.email && typeof params.email === 'string' && params.email.trim() !== '') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(params.email)) {
                logger.error(`signupRouter.signup: 유효하지 않은 이메일 형식 - email: ${params.email}`);
                return res.status(400).json({
                    success: false,
                    message: '유효한 이메일 형식이 아닙니다.'
                });
            }
        }

        if (params.phoneNumber && typeof params.phoneNumber === 'string' && params.phoneNumber.trim() !== '') {
            const phoneRegex = /^[0-9-+\s()]+$/;
            if (!phoneRegex.test(params.phoneNumber) || params.phoneNumber.length < 10) {
                logger.error(`signupRouter.signup: 유효하지 않은 전화번호 형식 - phoneNumber: ${params.phoneNumber}`);
                return res.status(400).json({
                    success: false,
                    message: '유효한 전화번호 형식이 아닙니다.'
                });
            }
        }

        logger.info(`signupRouter.signup: 회원가입 요청 - 사용자ID: ${params.userId}, 이름: ${params.name}, 농장코드: ${params.farmCode}`);

        const result = await UserService.signup(params);

        logger.info(`signupRouter.signup: 회원가입 완료 - 사용자ID: ${params.userId}, ID: ${result.data.id}`);
        res.status(201).json({
            success: true,
            message: '회원가입이 성공적으로 완료되었습니다.',
            data: result.data
        });

    } catch (err) {
        let statusCode = 500;
        let errorMessage = '회원가입 중 오류가 발생했습니다.';
        
        const errMsg = err.message;
        
        const clientErrors = [
            '유효하지 않은 팜코드입니다.',
            '이미 존재하는 사용자 아이디입니다.',
            '농장코드는 필수값입니다.',
            '사용자 ID는 필수값입니다.',
            '비밀번호는 필수값입니다.',
            '사용자 이름은 필수값입니다.',
            '사용자 ID는 3자 이상 50자 이하여야 합니다.',
            '비밀번호는 8자 이상이어야 합니다.',
            '사용자 이름은 2자 이상 50자 이하여야 합니다.',
            '유효한 이메일 형식이 아닙니다.',
            '유효한 전화번호 형식이 아닙니다.'
        ];
        
        if (clientErrors.includes(errMsg)) {
            statusCode = 400;
            errorMessage = err.message;
        }
        
        logger.error(`signupRouter.signup: 회원가입 실패 - 사용자ID: ${req.body?.userId || '알 수 없음'}, 에러: ${err.message}`);
        res.status(statusCode).json({
            success: false,
            message: errorMessage
        });
    }
});

export default signupRouter;
import express from 'express';
import LoginService from '../services/loginService.js';
import logger from '../utils/logger.js';

const loginRouter = express.Router();

loginRouter.post('/', async (req, res) => {
    try {
        if (!req.body || typeof req.body !== 'object') {
            logger.error('loginRouter.login: 요청 본문이 제공되지 않았습니다.');
            return res.status(400).json({
                success: false,
                message: '요청 본문이 필요합니다.'
            });
        }

        const params = {
            userId: req.body.userId,
            password: req.body.password
        };

        if (!params.userId || typeof params.userId !== 'string' || params.userId.trim() === '') {
            logger.error('loginRouter.login: 사용자 ID가 제공되지 않았습니다.');
            return res.status(400).json({
                success: false,
                message: '사용자 ID는 필수값입니다.'
            });
        }

        if (!params.password || typeof params.password !== 'string' || params.password.trim() === '') {
            logger.error('loginRouter.login: 비밀번호가 제공되지 않았습니다.');
            return res.status(400).json({
                success: false,
                message: '비밀번호는 필수값입니다.'
            });
        }

        if (params.userId.length < 3 || params.userId.length > 50) {
            logger.error(`loginRouter.login: 사용자 ID 길이가 유효하지 않습니다 - 길이: ${params.userId.length}`);
            return res.status(400).json({
                success: false,
                message: '사용자 ID는 3자 이상 50자 이하여야 합니다.'
            });
        }

        if (params.password.length < 8) {
            logger.error('loginRouter.login: 비밀번호가 너무 짧습니다.');
            return res.status(400).json({
                success: false,
                message: '비밀번호는 8자 이상이어야 합니다.'
            });
        }

        logger.info(`loginRouter.login: 로그인 요청 - 사용자ID: ${params.userId}`);

        const result = await LoginService.login(params);

        logger.info(`loginRouter.login: 로그인 성공 - 사용자ID: ${params.userId}, 농장ID: ${result.user.farmId}`);
        res.status(200).json({
            success: true,
            message: '로그인 성공',
            data: result
        });

    } catch (err) {
        let statusCode = 500;
        let errorMessage = '로그인 중 오류가 발생했습니다.';
        
        if (err.message.includes('계정정보가 존재하지 않습니다')) {
            statusCode = 401;
            errorMessage = err.message;
        } else if (err.message.includes('비밀번호가 일치하지 않습니다')) {
            statusCode = 401;
            errorMessage = err.message;
        } else if (err.message.includes('사용자 ID는 필수값입니다') || 
                   err.message.includes('비밀번호는 필수값입니다') ||
                   err.message.includes('사용자 ID는 3자 이상') ||
                   err.message.includes('비밀번호는 6자 이상')) {
            statusCode = 400;
            errorMessage = err.message;
        }
        
        logger.error(`loginRouter.login: 로그인 실패 - 사용자ID: ${req.body?.userId || '알 수 없음'}, 에러: ${err.message}`);
        res.status(statusCode).json({
            success: false,
            message: errorMessage
        });
    }
});

export default loginRouter;
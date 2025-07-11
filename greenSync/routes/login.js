import express from 'express';
import LoginService from '../services/loginService.js';
import logger from '../utils/logger.js';

const apiRouter = express.Router();

// 로그인
apiRouter.post('/', async (req, res) => {
    try {
        const params = {
            userId: req.body.userId,
            password: req.body.password
        };

        logger.info(`로그인 요청: ${JSON.stringify({...params, password: '***'})}`);

    // 필수값 체크
    if (!params.userId || !params.password) {
        throw new Error('사용자아이디, 비밀번호는 필수값입니다.');
    }

        const result = await LoginService.login(params);

        logger.info(`loginRouter.login.response result: ${JSON.stringify(result)}`);
        res.status(200).json({
            success: true,
            message: '로그인 성공',
            data: result
        });

    } catch (err) {
        logger.error(`loginRouter.login.error: ${err.message}`);
        res.status(401).json({
            success: false,
            message: err.message
        });
    }
});

export default apiRouter;
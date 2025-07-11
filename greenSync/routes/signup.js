import express from 'express';
import UserService from '../services/userService.js';
import logger from '../utils/logger.js';

const apiRouter = express.Router();

// 회원가입
apiRouter.post('/', async (req, res) => {
    try {
        const params = {
            farmCode: req.body.farmCode,
            userId: req.body.userId,
            password: req.body.password,
            name: req.body.name,
            email: req.body.email,
            phoneNumber: req.body.phoneNumber,
        };

        logger.info(`signupRouter.reg.request params: ${JSON.stringify({...params, password: '***'})}`);

        const result = await UserService.signup(params);

        logger.info(`signupRouter.reg.response result: ${JSON.stringify(result)}`);
        res.status(201).json({
            success: true,
            data: result
        });

    } catch (err) {
        logger.error(`signupRouter.reg.error: ${err.message}`);
        res.status(400).json({
            success: false,
            message: err.message
        });
    }
});

export default apiRouter;
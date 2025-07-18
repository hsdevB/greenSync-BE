import express from 'express';

import loginRouter from './login.js';   
import authRouter from './auth.js';     
import farmRouter from './farm.js';     
import signupRouter from './signup.js'; 
import weatherRouter from './weather.js';
import sensorRouter from './sensor.js';

const router = express.Router();

router.use('/login', loginRouter);
router.use('/auth', authRouter);
router.use('/farm', farmRouter);
router.use('/signup', signupRouter);
router.use('/weather', weatherRouter);
router.use('/sensor', sensorRouter);

export default router;

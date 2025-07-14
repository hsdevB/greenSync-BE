import express from 'express';

import loginRouter from './login.js';   
import authRouter from './auth.js';     
import farmRouter from './farm.js';     
import signupRouter from './signup.js'; 

const apirouter = express.Router();

apirouter.use('/login', loginRouter);
apirouter.use('/auth', authRouter);
apirouter.use('/farm', farmRouter);
apirouter.use('/signup', signupRouter);

export default apirouter;

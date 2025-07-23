import express from 'express';
import UserService from '../services/userService.js';
import Logger from '../utils/logger.js';
import AuthMiddleware from '../utils/authMiddleware.js';

const userRouter = express.Router();

userRouter.get('/profile', AuthMiddleware.isLoggedIn, async (req, res) => {
  try {
    const userId = req.loginUser.userId;
    
    if (!userId || userId.trim() === '') {
      return res.status(400).json({
        success: false,
        message: '사용자ID가 필요합니다.'
      });
    }

    const result = await UserService.getUserProfile(userId);
    
    res.status(200).json(result);
  } catch (error) {
    Logger.error(`GET /user/profile - 에러: ${error.message}`);
    
    if (error.message.includes('사용자ID가 필요합니다')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    if (error.message.includes('존재하지 않는 사용자')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
});

userRouter.put('/profile', AuthMiddleware.isLoggedIn, async (req, res) => {
  try {
    const userId = req.loginUser.userId;
    const updateData = req.body;
    
    if (!userId || userId.trim() === '') {
      return res.status(400).json({
        success: false,
        message: '사용자ID가 필요합니다.'
      });
    }

    if (!updateData || Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: '수정할 데이터가 필요합니다.'
      });
    }

    const result = await UserService.updateUserProfile(userId, updateData);
    
    res.status(200).json(result);
  } catch (error) {
    Logger.error(`PUT /user/profile - 에러: ${error.message}`);
    
    if (error.message.includes('사용자ID가 필요합니다') ||
        error.message.includes('수정할 데이터가 필요합니다') ||
        error.message.includes('유효한 이메일 형식') ||
        error.message.includes('유효한 전화번호 형식') ||
        error.message.includes('유효한 비밀번호가 필요합니다') ||
        error.message.includes('수정할 데이터가 없습니다')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    if (error.message.includes('존재하지 않는 사용자')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
});

userRouter.delete('/', AuthMiddleware.isLoggedIn, async (req, res) => {
  try {
    const userId = req.loginUser.userId;
    
    if (!userId || userId.trim() === '') {
      return res.status(400).json({
        success: false,
        message: '사용자ID가 필요합니다.'
      });
    }

    const result = await UserService.deleteUser(userId);
    
    res.status(200).json(result);
  } catch (error) {
    Logger.error(`DELETE /user - 에러: ${error.message}`);
    
    if (error.message.includes('사용자ID가 필요합니다')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    if (error.message.includes('존재하지 않는 사용자')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
});

export default userRouter;
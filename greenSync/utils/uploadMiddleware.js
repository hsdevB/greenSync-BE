import multer from 'multer';
import path from 'path';
import fs from 'fs';
import logger from '../utils/logger.js';

// 업로드 디렉토리 생성
const uploadDir = 'public/uploads/profiles';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 파일 저장 설정
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// 파일 필터링
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('지원하지 않는 파일 형식입니다. JPEG, PNG, GIF 파일만 업로드 가능합니다.'), false);
  }
};

// 업로드 설정
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB 제한
  }
});

// 에러 핸들링 미들웨어
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: '파일 크기는 5MB를 초과할 수 없습니다.'
      });
    }
    return res.status(400).json({
      success: false,
      message: '파일 업로드 중 오류가 발생했습니다.'
    });
  }
  
  if (err) {
    logger.error('(uploadMiddleware.handleUploadError) 파일 업로드 실패', {
      error: err.toString(),
      timestamp: new Date().toISOString()
    });
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  
  next();
};

export { upload, handleUploadError }; 
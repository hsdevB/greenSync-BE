import jwt from 'jsonwebtoken';

const secretKey = process.env.JWT_SECRET || 'your-default-strong-secret-key-if-env-fails'; // .env의 JWT_SECRET 사용

const options = {
  expiresIn: process.env.JWT_EXPIRES_IN || '2h'
};

class TokenUtil {
  static makeToken(user) {
    const payload = {
      userId: user.userId,
      name: user.name,
      farmId: user.farmId,
    };

    const token = jwt.sign(payload, secretKey, options);
    return token;
  }

  static verifyToken(token) {
    try {
      const decoded = jwt.verify(token, secretKey);
      return decoded;
    } catch (err) {
      console.error('tokenUtil.verifyToken.error:', err.name, err.message);
      return null;
    }
  }
}

export default TokenUtil;
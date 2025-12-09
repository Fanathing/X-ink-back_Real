const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

/**
 * JWT 인증 미들웨어
 * req.cookies.accessToken을 읽어서 JWT 검증하고
 * 유효하면 req.user에 payload를 저장
 */
const authMiddleware = (req, res, next) => {
  const token = req.cookies.accessToken;

  // 토큰이 없으면 401 반환
  if (!token) {
    return res.status(401).json({
      success: false,
      message: '인증 토큰이 없습니다.',
    });
  }

  try {
    // JWT 검증
    const payload = jwt.verify(token, JWT_SECRET);
    
    // req.user에 payload 저장
    req.user = payload;
    
    // 다음 미들웨어로 진행
    next();
  } catch (error) {
    // 토큰이 유효하지 않으면 401 반환
    return res.status(401).json({
      success: false,
      message: '유효하지 않은 토큰입니다.',
    });
  }
};

module.exports = authMiddleware;


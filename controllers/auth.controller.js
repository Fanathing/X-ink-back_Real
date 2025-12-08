const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { Companies } = require('../models');
const config = require('../config/cookie');
const JWT_SECRET = process.env.JWT_SECRET;
/**
 * POST /auth/login
 * 사용자 로그인
 */
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. 입력 값 검증
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: '이메일과 비밀번호를 입력해주세요.',
      });
    }

    // 2. 이메일로 사용자 조회
    const user = await User.findOne({ where: { email } });

    // 3. 사용자가 존재하지 않는 경우
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '존재하지 않는 이메일입니다.',
      });
    }

    // 4. 비밀번호 비교 (해시값 길이 10설정함 참고)
    const isPasswordValid = await bcrypt.compare(password, user.PASSWORD);

    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: '비밀번호가 일치하지 않습니다.',
      });
    }

    // 5. JWT 토큰 생성
    const accessToken = jwt.sign(
      {
        id: user.ID,
        name: user.NAME,
        role: 'user',
        provider: 'local',
      },

      JWT_SECRET,
      {
        expiresIn: '1h',
      },
    );

    // https://x-ink.store
    // https://api.x-ink.store
    // 6. 로그인 성공 응답
    res.cookie('accessToken', accessToken, config);

    return res.status(200).json({ message: '유저 로그인 성공' });
  } catch (error) {
    console.error('로그인 오류:', error);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.',
    });
  }
};

// 기업 로그인
const companiesLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: '이메일과 비밀번호를 입력해주세요.',
      });
    }

    const companies = await Companies.findOne({ where: { email } });

    if (!companies) {
      return res.status(404).json({
        success: false,
        message: '존재하지 않는 이메일입니다.',
      });
    }

    const isPasswordValid = await bcrypt.compare(password, companies.PASSWORD);

    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: '비밀번호가 일치하지 않습니다.',
      });
    }

    const accessToken = jwt.sign(
      {
        id: companies.ID,
        name: companies.NAME,
        role: 'companies',
        provider: 'local',
      },

      JWT_SECRET,
      {
        expiresIn: '1h',
      },
    );

    // https://x-ink.store
    // https://api.x-ink.store

    res.cookie('accessToken', accessToken, config);

    return res.status(200).json({ message: '기업 로그인 성공' });
  } catch (error) {
    console.error('로그인 오류:', error);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.',
    });
  }
};

// 로그인한 사용자정보
const authMe = async (req, res) => {
  try {
    // 쿠키에서 accessToken 가져오기
    const token = req.cookies.accessToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: '인증 토큰이 없습니다.',
      });
    }

    // JWT 검증부터 들어감 만료됐거나 이상하면 바로 catch로
    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: '유효하지 않은 토큰입니다.',
      });
    }

    // role이 무엇인지에 따라 회사테이블에서 가져올건지 아님 user에서 가져올건지 정함
    if (payload.role === 'companies') {
      // Companies 테이블에서 조회
      const company = await Companies.findOne({
        where: { ID: payload.id },
        attributes: { exclude: ['PASSWORD', 'CREATED_AT'] },
      });

      if (!company) {
        return res.status(404).json({
          success: false,
          message: '기업 정보를 찾을 수 없습니다.',
        });
      }

      return res.status(200).json({
        success: true,
        data: company,
      });
    } else if (payload.role === 'user') {
      // User 테이블에서 조회
      const user = await User.findOne({
        where: { ID: payload.id },
        attributes: { exclude: ['PASSWORD', 'CREATED_AT'] },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: '사용자 정보를 찾을 수 없습니다.',
        });
      }

      return res.status(200).json({
        success: true,
        data: user,
      });
    } else {
      // role이 없으면 여기로 근데 없을 일이 있나
      return res.status(403).json({
        success: false,
        message: '유효하지 않은 권한입니다.',
      });
    }
  } catch (error) {
    console.error('사용자 정보 조회 오류:', error);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.',
    });
  }
};

module.exports = {
  login,
  companiesLogin,
  authMe,
};

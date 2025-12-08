const bcrypt = require('bcrypt');
const { User, Companies } = require('../models');

/**
 * POST /join/companies
 * 기업 회원가입
 */
const companiesJoin = async (req, res) => {
  const { email, password, name, address, phone, business_number } = req.body;

  try {
    // 필수 값 검증
    if (
      !email ||
      !password ||
      !name ||
      !address ||
      !phone ||
      !business_number
    ) {
      return res.status(400).json({
        success: false,
        message: '모든 필수 항목을 입력해주세요.',
      });
    }

    // 이메일 중복 확인 (Companies 테이블)
    const existingCompany = await Companies.findOne({
      where: { email },
    });

    if (existingCompany) {
      return res.status(400).json({
        success: false,
        message: '이미 사용 중인 이메일입니다. 다른 이메일을 사용해주세요.',
      });
    }

    // 이메일 중복 확인 (User 테이블)
    const existingUser = await User.findOne({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: '이미 사용 중인 이메일입니다. 다른 이메일을 사용해주세요.',
      });
    }

    // 비밀번호 해시화
    const hashedPassword = await bcrypt.hash(password, 10);

    // 기업 계정 생성
    await Companies.create({
      EMAIL: email,
      PASSWORD: hashedPassword,
      NAME: name,
      ADDRESS: address,
      PHONE: phone,
      BUSINESS_NUMBER: business_number,
    });

    return res.status(201).json({
      success: true,
      message: '기업 회원가입이 완료되었습니다.',
    });
  } catch (error) {
    console.error('기업 회원가입 오류:', error);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.',
    });
  }
};

/**
 * POST /join/volunteer
 * 일반 유저 회원가입
 */
const volunteerJoin = async (req, res) => {
  const { email, name, password, phone_number, birth_date } = req.body;

  try {
    // 필수 값 검증
    if (!email || !name || !password || !phone_number || !birth_date) {
      return res.status(400).json({
        success: false,
        message: '모든 필수 항목을 입력해주세요.',
      });
    }

    // 이메일 중복 확인 (User 테이블)
    const existingUser = await User.findOne({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: '이미 사용 중인 이메일입니다. 다른 이메일을 사용해주세요.',
      });
    }

    // 이메일 중복 확인 (Companies 테이블)
    const existingCompany = await Companies.findOne({
      where: { email },
    });

    if (existingCompany) {
      return res.status(400).json({
        success: false,
        message: '이미 사용 중인 이메일입니다. 다른 이메일을 사용해주세요.',
      });
    }

    // 비밀번호 해시화
    const hashedPassword = await bcrypt.hash(password, 10);

    // 유저 계정 생성
    await User.create({
      EMAIL: email,
      PASSWORD: hashedPassword,
      NAME: name,
      PHONE_NUMBER: phone_number,
      BIRTH_DATE: birth_date,
    });

    return res.status(201).json({
      success: true,
      message: '유저 회원가입이 완료되었습니다.',
    });
  } catch (error) {
    console.error('유저 회원가입 오류:', error);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.',
    });
  }
};

module.exports = {
  companiesJoin,
  volunteerJoin,
};

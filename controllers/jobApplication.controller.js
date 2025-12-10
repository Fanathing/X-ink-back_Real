const { JobApplications, Jobs, User } = require('../models');

/**
 * POST /jobapplications/:id
 * 공고 지원서 생성
 */
const createApplication = async (req, res) => {
  try {
    const { id } = req.params; // Jobs 테이블의 ID
    const userId = req.user.id; // authMiddleware에서 설정된 USER_ID

    // 요청 바디 필수값 검증
    const { email, name, phone_number, position, intro } = req.body;

    if (!email || !name || !phone_number || !position || !intro) {
      return res.status(400).json({
        success: false,
        message: '모든 필수 항목을 입력해주세요.',
      });
    }

    // 공고 존재 확인
    const job = await Jobs.findOne({
      where: { ID: id },
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: '공고를 찾을 수 없습니다.',
      });
    }

    // 중복 지원 확인 (같은 USER_ID와 JOBS_ID 조합이 이미 있는지)
    const existingApplication = await JobApplications.findOne({
      where: {
        USER_ID: userId,
        JOBS_ID: id,
      },
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: '이미 지원한 공고입니다.',
      });
    }

    // User 테이블에서 BIRTH_DATE 조회
    const user = await User.findOne({
      where: { ID: userId },
      attributes: ['BIRTH_DATE'],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '사용자 정보를 찾을 수 없습니다.',
      });
    }

    // 지원서 생성
    const application = await JobApplications.create({
      JOBS_ID: id,
      USER_ID: userId,
      USER_EMAIL: email,
      USER_NAME: name,
      USER_PHONE_NUMBER: phone_number,
      USER_BIRTH_DATE: user.BIRTH_DATE,
      USER_POSITION: position,
      USER_INTRO: intro,
      STATUS: '지원완료', // 기본값
    });

    return res.status(201).json({
      success: true,
      message: '지원서가 성공적으로 제출되었습니다.',
      data: {
        id: application.ID,
      },
    });
  } catch (error) {
    console.error('지원서 생성 오류:', error);
    return res.status(500).json({
      success: false,
      message: '지원서 제출 중 오류가 발생했습니다.',
    });
  }
};

module.exports = {
  createApplication,
};

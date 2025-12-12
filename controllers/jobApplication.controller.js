const { JobApplications, Jobs, User, Companies } = require('../models');

/**
 * POST /jobapplications/:id
 * 공고 지원서 생성
 */
const createApplication = async (req, res) => {
  try {
    const { id } = req.params; // Jobs 테이블의 ID
    const userId = req.user.id; // authMiddleware에서 설정된 USER_ID
    const role = req.user.role;

    if (role !== 'user') {
      return res.status(403).json({
        success: false,
        message: '개인 회원만 지원하실 수 있습니다.',
      });
    }

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

// 회사가 받은 지원 내역 조회
const getCheck = async (req, res) => {
  try {
    const { id: companyId, role } = req.user;

    // role이 "user"인 경우 접근 차단
    if (role === 'user') {
      return res.status(403).json({
        success: false,
        message: '기업 회원만 접근 가능합니다.',
      });
    }

    // COMPANIES → JOBS → JOB_APPLICATIONS 구조로 조회
    // 해당 회사의 공고에 지원한 모든 지원 정보 조회
    const applications = await JobApplications.findAll({
      include: [
        {
          model: Jobs,
          as: 'job',
          where: { COMPANIES_ID: companyId },
          attributes: ['ID', 'COMPANIES_ID'],
        },
        {
          model: User,
          as: 'user',
          attributes: ['THUMBNAIL_URL'],
        },
      ],
      attributes: [
        'ID',
        'JOBS_ID',
        'USER_ID',
        'USER_EMAIL',
        'USER_NAME',
        'USER_PHONE_NUMBER',
        'USER_BIRTH_DATE',
        'USER_POSITION',
        'USER_INTRO',
        'STATUS',
        'CREATED_AT',
      ],
    });

    // 응답 데이터 구성
    const result = applications.map((application) => {
      const user = application.user;

      return {
        id: application.ID,
        jobsId: application.JOBS_ID,
        userId: application.USER_ID,
        userEmail: application.USER_EMAIL,
        userName: application.USER_NAME,
        userPhoneNumber: application.USER_PHONE_NUMBER,
        userBirthDate: application.USER_BIRTH_DATE,
        userPosition: application.USER_POSITION,
        userIntro: application.USER_INTRO,
        status: application.STATUS,
        createdAt: application.CREATED_AT,
        thumbnailUrl: user ? user.THUMBNAIL_URL : null,
      };
    });

    if (result.length == 0) {
      return res.status(200).json({
        success: true,
        message: '아직 해당 공고에 지원한 이력이 없습니다.',
      });
    }
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('지원 내역 조회 오류:', error);
    return res.status(500).json({
      success: false,
      message: '지원 내역 조회 중 오류가 발생했습니다.',
    });
  }
};

// 내가 지원한 공고들
const getApplications = async (req, res) => {
  try {
    const userId = req.user.id;

    const applications = await JobApplications.findAll({
      where: { USER_ID: userId },
      include: [
        {
          model: Jobs,
          as: 'job',
          attributes: [
            'ID',
            'COMPANIES_ID',
            'TITLE',
            'JOB_DESCRIPTION',
            'START_LINE',
            'DEAD_LINE',
            'POSITION',
            'STATUS',
          ],
          include: [
            {
              model: Companies,
              as: 'company',
              attributes: ['NAME', 'LOGO_URL'],
            },
          ],
        },
      ],
      attributes: [
        'ID',
        'JOBS_ID',
        'USER_ID',
        'USER_EMAIL',
        'USER_NAME',
        'USER_PHONE_NUMBER',
        'USER_BIRTH_DATE',
        'USER_POSITION',
        'USER_INTRO',
        'STATUS',
        'CREATED_AT',
      ],
    });

    // dday 계산하여 응답 데이터 구성
    const result = applications.map((application) => {
      const job = application.job;

      // dday 계산
      let dday = null;
      if (job && job.DEAD_LINE) {
        const deadline = new Date(job.DEAD_LINE);
        const now = new Date();
        const diff = deadline - now;
        dday = Math.ceil(diff / (1000 * 60 * 60 * 24));
      }

      return {
        id: application.ID,
        status: application.STATUS,
        job: job
          ? {
              id: job.ID,
              companiesId: job.COMPANIES_ID,
              companyName: job.company ? job.company.NAME : null,
              companyLogoURL: job.company ? job.company.LOGO_URL : null,
              title: job.TITLE,
              deadLine: job.DEAD_LINE,
              position: job.POSITION,
              status: job.STATUS,
              dday: dday,
            }
          : null,
      };
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('지원 내역 조회 오류:', error);
    return res.status(500).json({
      success: false,
      message: '지원 내역 조회 중 오류가 발생했습니다.',
    });
  }
};

const getVolunteers = async (req, res) => {
  try {
    const { role } = req.user;

    if (role !== 'companies') {
      return res.status(403).json({
        success: false,
        message: '기업 회원만 접근 가능합니다.',
      });
    }
    const volunteers = await User.findAll({
      attributes: {
        exclude: ['PASSWORD', 'CREATED_AT', 'INTRO'],
      },
    });

    const result = volunteers.map((volunteer) => {
      return {
        id: volunteer.ID,
        email: volunteer.EMAIL,
        name: volunteer.NAME,
        phoneNumber: volunteer.PHONE_NUMBER,
        birthDate: volunteer.BIRTH_DATE,
        position: volunteer.POSITION,
        thumbnailUrl: volunteer.THUMBNAIL_URL,
      };
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('구직자 목록 조회 오류:', error);
    return res.status(500).json({
      success: false,
      message: '구직자 목록 조회 중 오류가 발생했습니다.',
    });
  }
};

module.exports = {
  getApplications,
  createApplication,
  getCheck,
  getVolunteers,
};

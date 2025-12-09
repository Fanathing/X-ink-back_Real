const { Jobs, Companies, JobApplications } = require('../models');

const getJobs = async (req, res) => {
  try {
    const jobs = await Jobs.findAll({
      attributes: [
        'ID',
        'COMPANIES_ID',
        'TITLE',
        'START_LINE',
        'DEAD_LINE',
        'POSITION',
        'STATUS',
      ],
      include: [
        {
          model: Companies,
          as: 'company',
          attributes: ['NAME'],
        },
      ],
    });

    // 디데이 데이터 가공
    const result = jobs.map((job) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const deadLine = new Date(job.DEAD_LINE);
      deadLine.setHours(0, 0, 0, 0);

      const diffTime = deadLine - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const dday = `D-${diffDays}`;

      return {
        id: job.ID,
        companyId: job.COMPANIES_ID,
        companyName: job.company ? job.company.NAME : null,
        title: job.TITLE,
        dday: dday,
        position: job.POSITION,
        status: job.STATUS,
      };
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error('Jobs 전체 공고 목록 오류:', error);
    return res.status(500).json({
      success: false,
      message: '공고 목록을 불러오는데 문제가 발생했습니다.',
    });
  }
};

/**
 * GET /jobs/detail/:id
 * 특정 공고 상세 정보 조회
 */
const getJobDetail = async (req, res) => {
  try {
    const { id } = req.params;

    // Jobs 테이블에서 id로 조회 (Companies와 조인)
    const job = await Jobs.findOne({
      where: { ID: id },
      attributes: [
        'ID',
        'TITLE',
        'JOB_DESCRIPTION',
        'POSITION',
        'STATUS',
        'DEAD_LINE',
      ],
      include: [
        {
          model: Companies,
          as: 'company',
          attributes: ['NAME'],
        },
      ],
    });

    // 공고가 존재하지 않는 경우
    if (!job) {
      return res.status(404).json({
        success: false,
        message: '공고를 찾을 수 없습니다.',
      });
    }

    // 디데이 계산
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const deadLine = new Date(job.DEAD_LINE);
    deadLine.setHours(0, 0, 0, 0);

    const diffTime = deadLine - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const dday = `D-${diffDays}`;

    // JobApplications 테이블에서 지원자 수 계산
    const volunteerCount = await JobApplications.count({
      where: { JOBS_ID: id },
    });

    // 응답 데이터 구성
    const result = {
      id: job.ID,
      companyName: job.company ? job.company.NAME : null,
      title: job.TITLE,
      jobDescription: job.JOB_DESCRIPTION,
      position: job.POSITION,
      status: job.STATUS,
      deadline: job.DEAD_LINE,
      dday: dday,
      volunteerCount: volunteerCount,
    };

    return res.status(200).json(result);
  } catch (error) {
    console.error('공고 상세 조회 오류:', error);
    return res.status(500).json({
      success: false,
      message: '공고 상세 정보를 불러오는데 문제가 발생했습니다.',
    });
  }
};

/**
 * POST /jobs
 * 공고 생성
 */
const createJob = async (req, res) => {
  try {
    // req.user는 authMiddleware에서 설정됨
    const payload = req.user;

    // role이 "companies"가 아닌 경우
    if (payload.role !== 'companies') {
      return res.status(403).json({
        success: false,
        message: '권한이 없습니다.',
      });
    }

    // 필수값 검증
    const { TITLE, POSITION, START_LINE, DEAD_LINE, JOB_DESCRIPTION } =
      req.body;

    if (!TITLE || !POSITION || !START_LINE || !DEAD_LINE || !JOB_DESCRIPTION) {
      return res.status(400).json({
        success: false,
        message: '모든 필수 항목을 입력해주세요.',
      });
    }

    // 공고 생성
    const newJob = await Jobs.create({
      COMPANIES_ID: payload.id,
      TITLE,
      POSITION,
      START_LINE,
      DEAD_LINE,
      JOB_DESCRIPTION,
    });

    return res.status(201).json({
      success: true,
      id: newJob.ID,
      message: '공고가 성공적으로 생성되었습니다.',
    });
  } catch (error) {
    console.error('공고 생성 오류:', error);
    return res.status(500).json({
      success: false,
      message: '공고 생성 중 오류가 발생했습니다.',
    });
  }
};

/**
 * PATCH /jobs/:id
 * 공고 수정
 */
const updateJob = async (req, res) => {
  try {
    // req.user는 authMiddleware에서 설정됨
    const payload = req.user;

    // role이 "companies"가 아닌 경우
    if (payload.role !== 'companies') {
      return res.status(403).json({
        success: false,
        message: '권한이 없습니다.',
      });
    }

    const { id } = req.params;

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

    // 권한 확인: 공고의 COMPANIES_ID와 JWT payload.id 일치 확인
    if (job.COMPANIES_ID !== payload.id) {
      return res.status(403).json({
        success: false,
        message: '이 공고를 수정할 권한이 없습니다.',
      });
    }

    // 수정 가능한 필드
    const { TITLE, POSITION, START_LINE, DEAD_LINE, JOB_DESCRIPTION } =
      req.body;

    // 업데이트할 데이터 객체 생성
    const updateData = {};

    if (TITLE !== undefined) updateData.TITLE = TITLE;
    if (POSITION !== undefined) updateData.POSITION = POSITION;
    if (START_LINE !== undefined) {
      updateData.START_LINE = START_LINE;
    }
    if (DEAD_LINE !== undefined) {
      updateData.DEAD_LINE = DEAD_LINE;
    }
    if (JOB_DESCRIPTION !== undefined)
      updateData.JOB_DESCRIPTION = JOB_DESCRIPTION;

    // 업데이트 실행
    await Jobs.update(updateData, {
      where: { ID: id },
    });

    return res.status(200).json({
      success: true,
      message: '공고가 성공적으로 수정되었습니다.',
    });
  } catch (error) {
    console.error('공고 수정 오류:', error);
    return res.status(500).json({
      success: false,
      message: '공고 수정 중 오류가 발생했습니다.',
    });
  }
};

/**
 * DELETE /jobs/:id
 * 공고 삭제
 */
const deleteJob = async (req, res) => {
  try {
    // req.user는 authMiddleware에서 설정됨
    const payload = req.user;

    // role이 "companies"가 아닌 경우
    if (payload.role !== 'companies') {
      return res.status(403).json({
        success: false,
        message: '권한이 없습니다.',
      });
    }

    const { id } = req.params;

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

    // 권한 확인: 공고의 COMPANIES_ID와 JWT payload.id 일치 확인
    if (job.COMPANIES_ID !== payload.id) {
      return res.status(403).json({
        success: false,
        message: '이 공고를 삭제할 권한이 없습니다.',
      });
    }

    // 공고 삭제
    await Jobs.destroy({
      where: { ID: id },
    });

    return res.status(200).json({
      success: true,
      message: '공고가 성공적으로 삭제되었습니다.',
    });
  } catch (error) {
    console.error('공고 삭제 오류:', error);
    return res.status(500).json({
      success: false,
      message: '공고 삭제 중 오류가 발생했습니다.',
    });
  }
};

module.exports = {
  getJobs,
  getJobDetail,
  createJob,
  updateJob,
  deleteJob,
};

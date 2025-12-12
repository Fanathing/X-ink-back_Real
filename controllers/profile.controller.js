const { User, Companies } = require('../models');

const updateVolunteer = async (req, res) => {
  try {
    const { id, role } = req.user;

    if (role != 'user') {
      return res.status(403).json({
        success: false,
        message: '지원자만 이용 가능한 프로필 관리 입니다.',
      });
    }

    const { phone_number, birth_date, position, intro } = req.body;

    if (!phone_number || !birth_date || !position || !intro) {
      return res.status(400).json({
        success: false,
        message: '모든 필수 항목을 입력해주세요.',
      });
    }

    const updateData = {
      PHONE_NUMBER: phone_number,
      BIRTH_DATE: birth_date,
      POSITION: position,
      INTRO: intro,
    };

    await User.update(updateData, {
      where: { ID: id },
    });

    const updatedUser = await User.findOne({
      where: { ID: id },
      attributes: {
        exclude: ['PASSWORD', 'CREATED_AT'],
      },
    });

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: '사용자 정보를 찾을 수 없습니다.',
      });
    }

    return res.status(200).json({
      success: true,
      message: '프로필이 수정되었습니다.',
      data: updatedUser,
    });
  } catch (error) {
    console.error('프로필 수정 오류:', error);
    return res.status(500).json({
      success: false,
      message: '프로필 수정 중 오류가 발생했습니다.',
      error: error.message,
    });
  }
};

const updateCompanies = async (req, res) => {
  try {
    const { id, role } = req.user;

    if (role != 'companies') {
      return res.status(403).json({
        success: false,
        message: '기업만 이용 가능한 프로필 관리 입니다.',
      });
    }

    const { address, phone, description } = req.body;

    // 필수값 검증
    if (!address || !phone || !description) {
      return res.status(400).json({
        success: false,
        message: '모든 필수 항목을 입력해주세요.',
      });
    }

    const updateData = {
      ADDRESS: address,
      PHONE: phone,
      DESCRIPTION: description,
    };

    await Companies.update(updateData, {
      where: { ID: id },
    });

    const updatedCompany = await Companies.findOne({
      where: { ID: id },
      attributes: {
        exclude: ['PASSWORD', 'CREATED_AT'],
      },
    });

    if (!updatedCompany) {
      return res.status(404).json({
        success: false,
        message: '기업 정보를 찾을 수 없습니다.',
      });
    }

    return res.status(200).json({
      success: true,
      message: '프로필이 수정되었습니다.',
      data: updatedCompany,
    });
  } catch (error) {
    console.error('프로필 수정 오류:', error);
    return res.status(500).json({
      success: false,
      message: '프로필 수정 중 오류가 발생했습니다.',
      error: error.message,
    });
  }
};

module.exports = {
  updateCompanies,
  updateVolunteer,
};

const s3 = require('../config/aws');
const { v4: uuidv4 } = require('uuid');
const { User, Companies } = require('../models');

/**
 * POST /api/upload
 * 파일을 S3에 업로드
 */
const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '썹네일이 업로드되지 않았습니다.',
      });
    }

    const file = req.file;
    const fileExtension = file.originalname.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;

    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: `uploads/${fileName}`, // 아마존 S3 내 버킷에 있는 경로설정임 지금은 업로드란 폴더에 해당 파일을 저장하겠단거
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    // 얘가 사실상 upload를 해주는 것 params 규칙대로 업로드가 진행됨
    const uploadResult = await s3.upload(params).promise();

    console.log(uploadResult.Location);

    const id = req.user.id;
    const role = req.user.role;

    if (role === 'user') {
      const updateUrl = {};

      updateUrl.THUMBNAIL_URL = uploadResult.Location;

      await User.update(updateUrl, {
        where: { ID: id },
      });

      return res.status(200).json({
        success: true,
        message: '썸네일이 성공적으로 업로드되었습니다.',
      });
    } else {
      const updateUrl = {};

      updateUrl.LOGO_URL = uploadResult.Location;

      await Companies.update(updateUrl, {
        where: { ID: id },
      });

      return res.status(200).json({
        success: true,
        message: '기업 로고가 성공적으로 업로드되었습니다.',
      });
    }
  } catch (error) {
    console.error('썸네일 업로드 오류:', error);
    return res.status(500).json({
      success: false,
      message: '썸네일 업로드 중 오류가 발생했습니다.',
      error: error.message,
    });
  }
};

module.exports = {
  uploadFile,
};

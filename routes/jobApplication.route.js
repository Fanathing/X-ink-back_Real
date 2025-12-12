const express = require('express');
const router = express.Router();
const jobApplicationController = require('../controllers/jobApplication.controller');
const authMiddleware = require('../middleware/auth.middleware');

// 우리회사 공고에 지원한 목록 보기
router.get('/check', authMiddleware, jobApplicationController.getCheck);

// 내가 지원한 공고목록
router.get('/', authMiddleware, jobApplicationController.getApplications);

// POST /jobapplications/:id - 공고 지원 (인증 필요)
router.post('/:id', authMiddleware, jobApplicationController.createApplication);

module.exports = router;

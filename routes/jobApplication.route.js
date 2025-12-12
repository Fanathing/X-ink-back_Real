const express = require('express');
const router = express.Router();
const jobApplicationController = require('../controllers/jobApplication.controller');
const authMiddleware = require('../middleware/auth.middleware');

// GET /jobapplications - 지원 내역 조회 (인증 필요)
router.get('/', authMiddleware, jobApplicationController.getApplications);

// POST /jobapplications/:id - 공고 지원 (인증 필요)
router.post('/:id', authMiddleware, jobApplicationController.createApplication);

module.exports = router;


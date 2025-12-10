const express = require('express');
const router = express.Router();
const jobApplicationController = require('../controllers/jobApplication.controller');
const authMiddleware = require('../middleware/auth.middleware');

// POST /jobapplications/:id - 공고 지원 (인증 필요)
router.post('/:id', authMiddleware, jobApplicationController.createApplication);

module.exports = router;


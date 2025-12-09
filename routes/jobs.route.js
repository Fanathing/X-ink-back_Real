const express = require('express');
const router = express.Router();
const jobsController = require('../controllers/jobs.controller');
const authMiddleware = require('../middleware/auth.middleware');

// GET /jobs
router.get('/', jobsController.getJobs);

// GET /jobs/detail/:id
router.get('/detail/:id', jobsController.getJobDetail);

// POST /jobs - 공고 생성 (인증 필요)
router.post('/', authMiddleware, jobsController.createJob);

// PATCH /jobs/:id - 공고 수정 (인증 필요)
router.patch('/:id', authMiddleware, jobsController.updateJob);

// DELETE /jobs/:id - 공고 삭제 (인증 필요)
router.delete('/:id', authMiddleware, jobsController.deleteJob);

module.exports = router;


const express = require('express');
require('dotenv').config();
const cors = require('cors');
const cookieParser = require('cookie-parser');
const authRouter = require('./routes/auth.route.js');
const jobsRouter = require('./routes/jobs.route.js');
const joinRouter = require('./routes/join.route.js');
const jobApplicationRouter = require('./routes/jobApplication.route.js');
const { sequelize } = require('./models');
const seedUsers = require('./seeders/user.seed');
const seedCompanies = require('./seeders/companies.seed.js');
const seedJobs = require('./seeders/jobs.seed.js');

const app = express();
const PORT = process.env.PORT || 3001;

// CORS 설정
app.use(
  cors({
    origin: [
      'http://43.201.39.164',
      'http://localhost:3000',
      'https://x-ink.store',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }),
);

// 미들웨어
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 기본 라우트
app.get('/', (req, res) => {
  res.json({ message: '구인구직 서비스 V1 백엔드 API' });
});

// 헬스 체크
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 인증 라우트
app.use('/auth', authRouter);

// Jobs 라우트
app.use('/jobs', jobsRouter);

// 회원가입 라우트
app.use('/join', joinRouter);

// JobApplications 라우트
app.use('/jobapplications', jobApplicationRouter);

// 서버 시작 (Sequelize 연결 확인 + 더미 데이터 시딩 포함)
const startServer = async () => {
  try {
    // 데이터베이스 연결 테스트
    await sequelize.authenticate();
    console.log('✅ 데이터베이스 연결이 성공적으로 설정되었습니다.\n');

    await sequelize.sync({ alter: true });
    console.log('테이블 모델 변경사항 적용');

    // 더미 사용자 데이터 시딩
    await seedUsers();
    await seedCompanies();
    await seedJobs();

    app.listen(PORT, () => {
      console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
    });
  } catch (error) {
    console.error('서버 시작 중 오류가 발생했습니다:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;

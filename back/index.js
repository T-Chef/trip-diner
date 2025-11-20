// back/index.js
import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import cors from 'cors';

// 라우터 가져오기
import cityRouter from './routes/city.js';
import categoryRouter from './routes/category.js';
import placeRouter from './routes/place.js';
import reviewRouter from './routes/review.js';
import tripRouter from './routes/trip.js';
import usersRouter from './routes/users.js';

const app = express();

/* -------------------------------------------------------
   미들웨어 설정
------------------------------------------------------- */

// helmet 기본 구성 (contentSecurityPolicy 비활성화 → React 개발환경 충돌 방지)
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

// JSON 파싱
app.use(express.json());

// 쿠키 파싱
app.use(cookieParser());

// CORS (React 3000 → Node 4000 접속 허용)
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

/* -------------------------------------------------------
   테스트용
------------------------------------------------------- */
app.get('/api/test', (req, res) => {
  res.json({ message: 'server ok' });
});

/* -------------------------------------------------------
   실제 API 라우트 등록
------------------------------------------------------- */
app.use('/api/auth', usersRouter);       // 로그인/회원가입
app.use('/api/city', cityRouter);
app.use('/api/category', categoryRouter);
app.use('/api/place', placeRouter);
app.use('/api/review', reviewRouter);
app.use('/api/trip', tripRouter);

/* -------------------------------------------------------
   포트 설정
------------------------------------------------------- */
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
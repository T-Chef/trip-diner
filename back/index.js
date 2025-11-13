// back/index.js
import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import cors from 'cors';  // ★ 추가됨

// 라우터 가져오기
import cityRouter from './routes/city.js';
import categoryRouter from './routes/category.js';
import placeRouter from './routes/place.js';
import reviewRouter from './routes/review.js';
import tripRouter from './routes/trip.js';
import usersRouter from './routes/users.js';

const app = express();

// 미들웨어
app.use(helmet());
app.use(express.json());
app.use(cookieParser());
app.use(cors());   // 프론트(3000) → 백엔드(4000) 요청 허용

// 테스트 라우트
app.get('/api/test', (req, res) => {
  res.json({ message: 'server ok' });
});

// 실제 API 라우트 등록
app.use('/api/city', cityRouter);
app.use('/api/category', categoryRouter);
app.use('/api/place', placeRouter);
app.use('/api/review', reviewRouter);
app.use('/api/trip', tripRouter);

//  회원가입 라우트는 /api/auth
app.use('/api/auth', usersRouter);

// 포트 설정
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
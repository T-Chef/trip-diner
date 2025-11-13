// back/index.js
import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

// 라우터(폴더에 있는 친구들 꺼내쓰는 용도)
import cityRouter from './routes/city.js';
import categoryRouter from './routes/category.js';
import placeRouter from './routes/place.js';
import reviewRouter from './routes/review.js';
import tripRouter from './routes/trip.js';
import usersRouter from './routes/users.js';

const app = express();

app.use(helmet());
app.use(express.json());
app.use(cookieParser());

// 테스트용 라우트 (health)
app.get('/api/test', (req, res) => {
  res.json({ message: 'server ok' });
});

// 라우터들 등록(추후에 수정 할 가능성 있음.)
app.use('/api/city', cityRouter);
app.use('/api/category', categoryRouter);
app.use('/api/place', placeRouter);
app.use('/api/review', reviewRouter);
app.use('/api/trip', tripRouter);
app.use('/api/users', usersRouter);

// 포트 (수정 x)
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
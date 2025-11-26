// back/index.js
console.log("🔑 OPENAI KEY LOADED:", process.env.OPENAI_API_KEY);
import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

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
import tourRouter from "./routes/tour.js";
import aiRouter from "./routes/ai.js";

const app = express();

/* -------------------------------------------------------
   미들웨어 설정
------------------------------------------------------- */
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

/* -------------------------------------------------------
   테스트
------------------------------------------------------- */
app.get('/api/test', (req, res) => {
  res.json({ message: 'server ok' });
});

/* -------------------------------------------------------
   라우터
------------------------------------------------------- */
app.use('/api/auth', usersRouter);
app.use('/api/city', cityRouter);
app.use('/api/category', categoryRouter);
app.use('/api/tour', placeRouter);
app.use('/api/review', reviewRouter);
app.use('/api/trip', tripRouter);
app.use("/api/tour", tourRouter);
app.use("/api/ai", aiRouter);

/* -------------------------------------------------------
   포트
------------------------------------------------------- */
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// back/index.js
import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from "path";
import { fileURLToPath } from "url";

// 라우터 가져오기
import cityRouter from './routes/city.js';
import categoryRouter from './routes/category.js';
import placeRouter from './routes/place.js';
import eventRouter from './routes/event.js';
import reviewRouter from './routes/review.js';
import tripRouter from './routes/trip.js';
import usersRouter from './routes/users.js';
import tourRouter from "./routes/tour.js";
import aiRouter from "./routes/ai.js";
import profileRouter from "./routes/mypage/profile.js";

const app = express();

// ESModule용 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* -------------------------------------------------------
   프로필 이미지 차단 되는거 방지
------------------------------------------------------- */
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

app.use(express.json());
app.use(cookieParser());

/* -------------------------------------------------------
   프론트 3000 허용 시켜주는 거
------------------------------------------------------- */
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

/* -------------------------------------------------------
   Chrome & Edge 이미지 차단 문제 해결
------------------------------------------------------- */
app.use(
  "/uploads",
  (req, res, next) => {
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    res.setHeader("Cross-Origin-Embedder-Policy", "unsafe-none");
    next();
  },
  express.static(path.join(__dirname, "uploads"))
);

console.log("STATIC PATH:", path.join(__dirname, "uploads"));

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

app.use('/api/tour', tourRouter);     // 도시/시군구
app.use('/api/place', placeRouter);   // 관광지 목록/상세 통합
app.use('/api/event', eventRouter); // 축제/이벤트 목록/상세 통합

// 🔥 Google Place TextSearch + Detail
import googlePlaceRouter from "./routes/googlePlace.js";
app.use("/api", googlePlaceRouter);

// 🔥 Naver Image Search
import naverSearchRouter from "./routes/naverSearch.js";
app.use("/api", naverSearchRouter);

app.use('/api/review', reviewRouter);
app.use('/api/trip', tripRouter);
app.use("/api/ai", aiRouter);
app.use("/api/profile", profileRouter);

/* -------------------------------------------------------
   포트
------------------------------------------------------- */
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
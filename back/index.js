// back/index.js
import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";

import express from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import cors from "cors";

// ------------------------------
//  ESModule용 __dirname
// ------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("NAVER ID LOADED:", process.env.NAVER_CLIENT_ID ? "YES" : "NO");
console.log("NAVER SECRET LOADED:", process.env.NAVER_CLIENT_SECRET ? "YES" : "NO");

// ------------------------------
//  라우터 import 
// ------------------------------
import cityRouter from "./routes/city/city.js";
import categoryRouter from "./routes/schedule/category.js";
import placeRouter from "./routes/city/place.js";
import eventRouter from "./routes/city/event.js";
import reviewRouter from "./routes/review.js";
import tripRouter from "./routes/schedule/trip.js";
import usersRouter from "./routes/users.js";
import tourRouter from "./routes/schedule/tour.js";
import aiRouter from "./routes/schedule/ai.js";
import profileRouter from "./routes/mypage/profile.js";
import weatherRouter from "./routes/city/weather.js";
import planRouter from "./routes/schedule/plan.js";

// 게시판
import postlikeRouter from "./routes/board/postlike.js";
import postRouter from "./routes/board/post.js";
import commentRouter from "./routes/board/comment.js";

// 외부 연동용 라우터
import googlePlaceRouter from "./routes/schedule/googlePlace.js";
import naverSearchRouter from "./routes/schedule/naverSearch.js";

const app = express();

/* -------------------------------------------------------
   보안/공통 미들웨어
------------------------------------------------------- */
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

app.use(express.json());
app.use(cookieParser());

/* -------------------------------------------------------
   CORS – 프론트 3000 허용
------------------------------------------------------- */
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

/* -------------------------------------------------------
   업로드 파일(static) – 프로필 이미지 등
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
   게시글 이미지 postImages
------------------------------------------------------- */
app.use(
  "/postImages",
  (req, res, next) => {
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    res.setHeader("Cross-Origin-Embedder-Policy", "unsafe-none");
    next();
  },
  express.static(path.join(__dirname, "uploads/postImages"))
);

/* -------------------------------------------------------
  테스트 API
------------------------------------------------------- */
app.get("/api/test", (req, res) => {
  res.json({ message: "server ok" });
});

/* -------------------------------------------------------
   도메인 라우터
------------------------------------------------------- */
// 인증 / 유저
app.use("/api/auth", usersRouter);
app.use("/api/profile", profileRouter);

// 도시/카테고리/관광공사 연동
app.use("/api/city", cityRouter);
app.use("/api/category", categoryRouter);
app.use("/api/tour", tourRouter);
app.use("/api/place", placeRouter);
app.use("/api/event", eventRouter);
app.use("/api/weather", weatherRouter);

// 리뷰 / 일정
app.use("/api/review", reviewRouter);
app.use("/api/trip", tripRouter);

// 게시판
app.use("/api/posts", postlikeRouter);
app.use("/api/posts", postRouter);
app.use("/api/comment", commentRouter);

// AI 관련
app.use("/api/ai", aiRouter);

// 외부 검색 전용 라우터
app.use("/api", googlePlaceRouter);
app.use("/api", naverSearchRouter);

// plan
app.use("/api/plan", planRouter);

/* -------------------------------------------------------
   서버 시작
------------------------------------------------------- */
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

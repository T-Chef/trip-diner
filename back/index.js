// back/index.js
import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import express from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// ------------------------------
//  ESModule용 __dirname
// ------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ------------------------------
//  라우터 import
// ------------------------------
import cityRouter from "./routes/city.js";
import categoryRouter from "./routes/category.js";
import placeRouter from "./routes/place.js";
import eventRouter from "./routes/event.js";
import reviewRouter from "./routes/review.js";
import tripRouter from "./routes/trip.js";
import usersRouter from "./routes/users.js";
import tourRouter from "./routes/tour.js";
import aiRouter from "./routes/ai.js";
import profileRouter from "./routes/mypage/profile.js";

// 게시판
import postlikeRouter from "./routes/board/postlike.js";
import postRouter from "./routes/board/post.js";
import commentRouter from "./routes/board/comment.js";

// 외부 연동용 라우터
import googlePlaceRouter from "./routes/googlePlace.js";
import naverSearchRouter from "./routes/naverSearch.js";

const app = express();

/* -------------------------------------------------------
   보안/공통 미들웨어
------------------------------------------------------- */
app.use(
  helmet({
    contentSecurityPolicy: false, // 이미지 차단 방지용
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
app.use("/api/tour", tourRouter);      // 시/도 + 시군구 코드
app.use("/api/place", placeRouter);    // 관광지 목록/상세 통합
app.use("/api/event", eventRouter);    // 축제/이벤트 목록/상세

// 리뷰 / 일정
app.use("/api/review", reviewRouter);
app.use("/api/trip", tripRouter);

// 게시판
app.use("/api/posts", postlikeRouter);
app.use("/api/posts", postRouter);
app.use("/api/comment", commentRouter);

// AI 관련
app.use("/api/ai", aiRouter);

/* -------------------------------------------------------
   외부 검색 전용 라우터 (Google / Naver)
   - googlePlace.js   : /api/place-search, /api/place-details ...
   - naverSearch.js   : /api/naver-image-search (예: 파일 안에서 정의된 경로)
------------------------------------------------------- */
app.use("/api", googlePlaceRouter);
app.use("/api", naverSearchRouter);

/* -------------------------------------------------------
   서버 시작
------------------------------------------------------- */
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

console.log("placeRouter loaded:", placeRouter);
console.log("postlikeRouter loaded:", postlikeRouter);
console.log("postRouter loaded:", postRouter);
console.log("commentRouter loaded:", commentRouter);


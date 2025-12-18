
import dotenv from "dotenv";

// ------------------------------
//  ESModule용 __dirname
// ------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });
console.log("NAVER ID LOADED:", process.env.NAVER_CLIENT_ID ? "YES" : "NO");
console.log("NAVER SECRET LOADED:", process.env.NAVER_CLIENT_SECRET ? "YES" : "NO");

import express from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

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
import weatherRouter from "./routes/weather.js";
import planRouter from "./routes/plan.js";

// 게시판
import postRouter from "./routes/board/post.js";
import commentRouter from "./routes/board/comment.js";

// 좋아요
import placeLikeRouter from "./routes/like/PlaceLike.js";
import postLikeRouter from "./routes/like/PostLike.js";

// 외부 연동용 라우터
import googlePlaceRouter from "./routes/googlePlace.js";
import naverSearchRouter from "./routes/naverSearch.js";

// 관리자
import adminRouter from "./routes/admin/admin.js";
import adminLoginRouter from "./routes/admin/adminLogin.js";

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
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  })
);

/* =================================================
   Static / 게시글, 프로필 이미지
================================================= */
app.use(
  "/uploads",
  (req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
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

// 관리자
app.use("/api/admin", adminLoginRouter);
app.use("/api/admin", adminRouter);

// 도시/카테고리/관광공사 연동
app.use("/api/city", cityRouter);
app.use("/api/category", categoryRouter);
app.use("/api/tour", tourRouter);      // 시/도 + 시군구 코드
app.use("/api/place", placeRouter);    // 관광지 목록/상세 통합
app.use("/api/event", eventRouter);    // 축제/이벤트 목록/상세
app.use("/api/weather", weatherRouter); // 도시별 날씨

// 리뷰 / 일정
app.use("/api/review", reviewRouter);
app.use("/api/trip", tripRouter);

// 게시판
app.use("/api/posts", postRouter);
app.use("/api/comment", commentRouter);

// 좋아요
app.use("/api/like", placeLikeRouter);
app.use("/api/like", postLikeRouter);

// AI 관련
app.use("/api/ai", aiRouter);

/* -------------------------------------------------------
   외부 검색 전용 라우터 (Google / Naver)
   - googlePlace.js   : /api/place-search, /api/place-details ...
   - naverSearch.js   : /api/naver-image-search (예: 파일 안에서 정의된 경로)
------------------------------------------------------- */
app.use("/api", googlePlaceRouter);
app.use("/api", naverSearchRouter);
app.use("/api/plan", planRouter);

/* -------------------------------------------------------
   서버 시작
------------------------------------------------------- */
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

console.log("placeRouter loaded:", placeRouter);
console.log("postlikeRouter loaded:", postLikeRouter);
console.log("postRouter loaded:", postRouter);
console.log("commentRouter loaded:", commentRouter);


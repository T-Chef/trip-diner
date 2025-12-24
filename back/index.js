import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import express from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import cors from "cors";
import { PrismaClient } from "@prisma/client";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

const prisma = new PrismaClient();

// ------------------------------
//  라우터 -> 여기에 추가하면 됨.
// ------------------------------
import cityRouter from "./routes/city/city.js";
import categoryRouter from "./routes/schedule/category.js";
import placeRouter from "./routes/city/place.js";
import eventRouter from "./routes/city/event.js";

import tripRouter from "./routes/schedule/trip.js";
import usersRouter from "./routes/users.js";

import tourRouter from "./routes/schedule/tour.js";
import aiRouter from "./routes/schedule/ai.js";
import profileRouter from "./routes/mypage/profile.js";
import weatherRouter from "./routes/city/weather.js";
import planRouter from "./routes/schedule/plan.js";

// 게시판
import postRouter from "./routes/board/post.js";
import commentRouter from "./routes/board/comment.js";

// 좋아요
import placeLikeRouter from "./routes/like/PlaceLike.js";
import postLikeRouter from "./routes/like/PostLike.js";

// 외부 연동
import googlePlaceRouter from "./routes/schedule/googlePlace.js";
import naverSearchRouter from "./routes/schedule/naverSearch.js";

// 관리자
import adminRouter from "./routes/admin/admin.js";
import adminLoginRouter from "./routes/admin/adminLogin.js";
import adminQnaRouter from "./routes/admin/adminQnA.js";

const app = express();

app.set("json replacer", (key, value) =>
  typeof value === "bigint" ? value.toString() : value
);

BigInt.prototype.toJSON = function () {
  return this.toString();
};

/* -------------------------------------------------------
   보안
------------------------------------------------------- */
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

app.use(express.json());
app.use(cookieParser());

/* -------------------------------------------------------
   CORS
------------------------------------------------------- */
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  })
);

/* -------------------------------------------------------
   Static
------------------------------------------------------- */
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
   관리자 게시글 관리
------------------------------------------------------- */

app.get("/api/admin/posts", async (req, res) => {
  try {
    const posts = await prisma.post.findMany({
      orderBy: { post_id: "desc" },
      select: {
        post_id: true,
        title: true,
        category: true,
        deleted: true,
        created_at: true,
      },
    });

    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "관리자 게시글 조회 실패" });
  }
});

app.patch("/api/admin/posts/:id/delete", async (req, res) => {
  try {
    const postId = BigInt(req.params.id);

    await prisma.post.update({
      where: { post_id: postId },
      data: { deleted: 1 },
    });

    res.json({ message: "게시글 삭제 완료" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "게시글 삭제 실패" });
  }
});

app.patch("/api/admin/posts/:id/restore", async (req, res) => {
  try {
    const postId = BigInt(req.params.id);

    await prisma.post.update({
      where: { post_id: postId },
      data: { deleted: 0 },
    });

    res.json({ message: "게시글 복구 완료" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "게시글 복구 실패" });
  }
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

// 도시
app.use("/api/city", cityRouter);
app.use("/api/category", categoryRouter);
app.use("/api/tour", tourRouter);
app.use("/api/place", placeRouter);
app.use("/api/event", eventRouter);
app.use("/api/weather", weatherRouter);

// 일정
app.use("/api/trip", tripRouter);

// 게시판
app.use("/api/posts", postRouter);
app.use("/api/comment", commentRouter);

// 좋아요
app.use("/api/like", placeLikeRouter);
app.use("/api/like", postLikeRouter);

// AI
app.use("/api/ai", aiRouter);

// 외부 API
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
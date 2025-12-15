// back/index.js
import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import express from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// 라우터
import cityRouter from "./routes/city.js";
import categoryRouter from "./routes/category.js";
import placeRouter from "./routes/place.js";
import reviewRouter from "./routes/review.js";
import tripRouter from "./routes/trip.js";
import usersRouter from "./routes/users.js";
import tourRouter from "./routes/tour.js";
import aiRouter from "./routes/ai.js";
import profileRouter from "./routes/mypage/profile.js";

// 관리자
import adminRouter from "./routes/admin/admin.js";
import adminLoginRouter from "./routes/admin/adminLogin.js";

const app = express();

// ESModule용 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* -------------------------------------------------------
   보안 헤더 (프로필 이미지 차단 방지)
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
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

/* -------------------------------------------------------
   Static 이미지
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

/* -------------------------------------------------------
   테스트
------------------------------------------------------- */
app.get("/api/test", (req, res) => {
  res.json({ message: "server ok" });
});

/* -------------------------------------------------------
   API 라우터
------------------------------------------------------- */
app.use("/api/auth", usersRouter);
app.use("/api/city", cityRouter);
app.use("/api/category", categoryRouter);
app.use("/api/tour", tourRouter);
app.use("/api/place", placeRouter);
app.use("/api/review", reviewRouter);
app.use("/api/trip", tripRouter);
app.use("/api/ai", aiRouter);
app.use("/api/profile", profileRouter);

// ✅ 관리자
app.use("/api/admin", adminLoginRouter); 
app.use("/api/admin", adminRouter);           

/* -------------------------------------------------------
   서버 시작
------------------------------------------------------- */
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

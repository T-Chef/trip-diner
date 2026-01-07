import express from "express";
import adminUsersRouter from "./adminUsers.js";
import adminPostsRouter from "./adminPosts.js";
import adminQnaRouter from "./adminQnA.js";
import { adminAuth } from "../../middleware/adminAuth.js";

const router = express.Router();

// admin 들어올려고 하면 로그인
router.use(adminAuth);

router.use("/users", adminUsersRouter);
router.use("/posts", adminPostsRouter);
router.use("/qna", adminQnaRouter);

router.get("/check", (req, res) => {
  res.json({ ok: true });
});

export default router;

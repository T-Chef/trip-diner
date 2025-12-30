import express from "express";
import adminUsersRouter from "./adminUsers.js";
import adminPostsRouter from "./adminPosts.js";
import adminQnaRouter from "./adminQnA.js";

const router = express.Router();

router.use("/users", adminUsersRouter);
router.use("/posts", adminPostsRouter);
router.use("/qna", adminQnaRouter);

export default router;

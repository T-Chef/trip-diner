import express from "express";
import prisma from "../../prisma/prismaClient.js";
import { userAuth } from "../../middleware/userAuth.js";

const router = express.Router();

const safeJson = (obj) =>
  JSON.parse(
    JSON.stringify(obj, (_, v) =>
      typeof v === "bigint" ? v.toString() : v
    )
  );

// 댓글 목록
router.get("/:postId", async (req, res) => {
  const comments = await prisma.comment.findMany({
    where: { post_id: Number(req.params.postId) },
    orderBy: { created_at: "asc" },
    include: { user: { select: { name: true, profile_img: true } } },
  });

  res.json(safeJson(comments));
});

// 댓글 작성
router.post("/", userAuth, async (req, res) => {
  const { post_id, content, parent_id } = req.body;
  const user_id = Number(req.user.user_id);

  const comment = await prisma.comment.create({
    data: {
      post_id: Number(post_id),
      user_id,
      parent_id: parent_id ? Number(parent_id) : null,
      content,
    },
  });
  res.json(safeJson(comment));
});

// 댓글 수정
router.put("/:id", userAuth, async (req, res) => {
  const user_id = Number(req.user.user_id);
  const comment = await prisma.comment.findUnique({
    where: { comment_id: Number(req.params.id) },
  });

  if (!comment || comment.user_id !== user_id) {
    return res.status(403).json({ error: "권한 없음" });

  }

  const updated = await prisma.comment.update({
    where: { comment_id: Number(req.params.id) },
    data: { content: req.body.content },
  });

  res.json(safeJson(updated));
});

// 댓글 삭제
router.delete("/:id", userAuth, async (req, res) => {
  const user_id = Number(req.user.user_id);
  const comment = await prisma.comment.findUnique({
    where: { comment_id: Number(req.params.id) },
  });

  if (!comment || comment.user_id !== user_id) {
    return res.status(403).json({ error: "권한 없음" });
  }

  await prisma.comment.delete({
    where: { comment_id: Number(req.params.id) },
  });

  res.json({ success: true });
});

export default router;


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

router.get("/:postId", async (req, res) => {
  try {
    const comments = await prisma.comment.findMany({
      where: { post_id: Number(req.params.postId) },
      orderBy: { created_at: "asc" },
      include: { 
        user: { 
          select: { name: true, profile_img: true } 
        } 
      },
    });
    res.json(safeJson(comments));
  } catch (error) {
    console.error("댓글 목록 로드 오류:", error);
    res.status(500).json({ error: "서버 오류" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { post_id, content, parent_id, user_id } = req.body;

    if (!user_id) {
      return res.status(401).json({ error: "로그인이 필요합니다." });
    }

    const comment = await prisma.comment.create({
      data: {
        post_id: Number(post_id),
        user_id: Number(user_id), 
        parent_id: parent_id ? Number(parent_id) : null,
        content,
      },
    });

    res.json(safeJson(comment));
  } catch (error) {
    console.error("댓글 생성 오류:", error);
    res.status(500).json({ error: "서버 오류" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { content, user_id } = req.body;
    const commentId = Number(req.params.id);

    const comment = await prisma.comment.findUnique({
      where: { comment_id: commentId },
    });

    if (!comment || comment.user_id !== Number(user_id)) {
      return res.status(403).json({ error: "수정 권한이 없습니다." });
    }

    const updated = await prisma.comment.update({
      where: { comment_id: commentId },
      data: { content },
    });

    res.json(safeJson(updated));
  } catch (error) {
    console.error("댓글 수정 오류:", error);
    res.status(500).json({ error: "서버 오류" });
  }
});

router.get("/user/:userId", async (req, res) => {
  try {
    const userId = Number(req.params.userId);

    const comments = await prisma.comment.findMany({
      where: {
        user_id: userId
      },
      orderBy: { created_at: "desc" },
      include: {
        post: {
          select: { post_id: true, title: true }
        }
      }
    });

    res.json(safeJson(comments));
  } catch (error) {
    console.error("내 댓글 불러오기 실패:", error);
    res.status(500).json({ error: "서버 오류" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const user_id = Number(req.query.user_id); 
    const commentId = Number(req.params.id);

    const comment = await prisma.comment.findUnique({
      where: { comment_id: commentId },
    });

    if (!comment || comment.user_id !== user_id) {
      return res.status(403).json({ error: "삭제 권한이 없습니다." });
    }

    await prisma.comment.delete({
      where: { comment_id: commentId },
    });

    res.json({ success: true, message: "댓글이 삭제되었습니다." });
  } catch (error) {
    console.error("댓글 삭제 오류:", error);
    res.status(500).json({ error: "서버 오류" });
  }
});

export default router;
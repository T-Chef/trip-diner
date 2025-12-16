import express from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = express.Router();

/* =================================================
   1️⃣ 게시글 좋아요 토글
   POST /api/like/post
================================================= */
router.post("/post", async (req, res) => {
  const { userId, postId, liked } = req.body;

  if (!userId || !postId) {
    return res.status(400).json({ error: "userId, postId 필요" });
  }

  let uid, pid;
  try {
    uid = BigInt(userId);
    pid = BigInt(postId);
  } catch {
    return res.status(400).json({ error: "잘못된 ID 형식" });
  }

  try {
    const exists = await prisma.post_like.findFirst({
      where: { user_id: uid, post_id: pid },
    });

    // 좋아요 해제
    if (!liked) {
      if (exists) {
        await prisma.post_like.delete({
          where: { like_id: exists.like_id },
        });
      }
      return res.json({ liked: false });
    }

    // 좋아요 추가
    if (!exists) {
      await prisma.post_like.create({
        data: {
          user_id: uid,
          post_id: pid,
        },
      });
    }

    return res.json({ liked: true });
  } catch (err) {
    console.error("게시글 좋아요 토글 오류:", err);
    res.status(500).json({ error: "서버 오류" });
  }
});

/* =================================================
   2️⃣ 내가 좋아요한 게시글 목록
   GET /api/like/post/:userId
================================================= */
router.get("/post/:userId", async (req, res) => {
  const { userId } = req.params;

  let uid;
  try {
    uid = BigInt(userId);
  } catch {
    return res.status(400).json({ error: "잘못된 userId 형식" });
  }

  try {
    const result = await prisma.post_like.findMany({
      where: { user_id: uid },
      include: {
        post: {
          select: {
            post_id: true,
            title: true,
            content: true,
            image_url: true,
            created_at: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    const safeResult = result.map((row) => ({
      like_id: Number(row.like_id),
      user_id: Number(row.user_id),
      post_id: Number(row.post_id),
      created_at: row.created_at,
      post: row.post
        ? {
            ...row.post,
            post_id: Number(row.post.post_id),
          }
        : null,
    }));

    res.json(safeResult);
  } catch (err) {
    console.error("게시글 좋아요 조회 오류:", err);
    res.status(500).json([]);
  }
});

export default router;

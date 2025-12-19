import express from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = express.Router();

// 1. 좋아요 토글 (POST /api/like/post/:postId)
router.post("/post/:postId", async (req, res) => {
  const { postId } = req.params;
  const { user_id } = req.body;

  if (!user_id || !postId) return res.status(400).json({ error: "데이터 부족" });

  try {
    const uid = BigInt(user_id);
    const pid = BigInt(postId);

    const exists = await prisma.post_like.findFirst({
      where: { user_id: uid, post_id: pid },
    });

    if (exists) {
      await prisma.post_like.delete({ where: { like_id: exists.like_id } });
      return res.json({ liked: false });
    } else {
      await prisma.post_like.create({ data: { user_id: uid, post_id: pid } });
      return res.json({ liked: true });
    }
  } catch (err) {
    res.status(500).json({ error: "서버 오류" });
  }
});

// 2. 좋아요 상태 및 개수 조회 (GET /api/like/post/:postId/status)
router.get("/post/:postId/status", async (req, res) => {
  const { postId } = req.params;
  const { user_id } = req.query;

  try {
    const pid = BigInt(postId);
    const count = await prisma.post_like.count({ where: { post_id: pid } });
    
    let liked = false;
    if (user_id) {
      const exists = await prisma.post_like.findFirst({
        where: { user_id: BigInt(user_id), post_id: pid }
      });
      liked = !!exists;
    }
    res.json({ count, liked });
  } catch (err) {
    res.status(500).json({ count: 0, liked: false });
  }
});

// 3. 사용자가 좋아요한 게시물 목록 조회 (GET /api/like/post/:userId)
router.get("/post/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const uid = BigInt(userId);

    const likedPosts = await prisma.post_like.findMany({
      where: { user_id: uid },
      include: {
        post: {
          include: {
            user: { select: { name: true } } // 게시글 작성자 정보가 필요하면 포함
          }
        }
      },
      orderBy: { created_at: 'desc' } // 최신순 정렬
    });

    // BigInt 포함된 데이터를 JSON으로 변환 (에러 방지)
    const safeResult = JSON.parse(
      JSON.stringify(likedPosts, (key, value) =>
        typeof value === "bigint" ? value.toString() : value
      )
    );

    res.json(safeResult);
  } catch (err) {
    console.error("좋아요 목록 조회 오류:", err);
    res.status(500).json({ error: "서버 오류" });
  }
});

export default router;

import express from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = express.Router();

router.post("/post/:postId", async (req, res) => {
  const { postId } = req.params;
  const { user_id } = req.body;

  if (!user_id || !postId)
    return res.status(400).json({ error: "데이터 부족" });

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

router.get("/post/:postId/status", async (req, res) => {
  const { postId } = req.params;
  const { user_id } = req.query;

  try {
    const pid = BigInt(postId);
    const count = await prisma.post_like.count({ where: { post_id: pid } });

    let liked = false;
    if (user_id) {
      const exists = await prisma.post_like.findFirst({
        where: { user_id: BigInt(user_id), post_id: pid },
      });
      liked = !!exists;
    }
    res.json({ count, liked });
  } catch (err) {
    res.status(500).json({ count: 0, liked: false });
  }
});

router.get("/post/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const uid = BigInt(userId);

    const likedPosts = await prisma.post_like.findMany({
      where: { user_id: uid },
      include: {
        post: {
          include: {
            user: { select: { name: true } },
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

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

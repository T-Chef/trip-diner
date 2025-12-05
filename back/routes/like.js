import express from "express";
import prisma from "../prisma/index.js";

const router = express.Router();

/* ===========================
   여행지 좋아요 (TOGGLE)
=========================== */
router.post("/place", async (req, res) => {
  try {
    const { user_id, place_id } = req.body;

    if (!user_id || !place_id) {
      return res.status(400).json({ message: "user_id, place_id 필요" });
    }

    // 이미 좋아요 되어 있는지 확인
    const existing = await prisma.place_like.findFirst({
      where: { user_id, place_id }
    });

    if (existing) {
      // 좋아요 취소
      await prisma.place_like.delete({
        where: { place_like_id: existing.place_like_id }
      });
      return res.json({ liked: false });
    }

    // 좋아요 추가
    await prisma.place_like.create({
      data: { user_id, place_id }
    });

    return res.json({ liked: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/* 좋아요 목록 조회 */
router.get("/place/:userId", async (req, res) => {
  const userId = Number(req.params.userId);

  const result = await prisma.place_like.findMany({
    where: { user_id: userId },
    include: { place: true }
  });

  res.json(result);
});

/* ===========================
   게시글 좋아요 (TOGGLE)
=========================== */
router.post("/post", async (req, res) => {
  try {
    const { user_id, post_id } = req.body;

    if (!user_id || !post_id) {
      return res.status(400).json({ message: "user_id, post_id 필요" });
    }

    const existing = await prisma.post_like.findFirst({
      where: { user_id, post_id }
    });

    if (existing) {
      await prisma.post_like.delete({
        where: { post_like_id: existing.post_like_id }
      });
      return res.json({ liked: false });
    }

    await prisma.post_like.create({
      data: { user_id, post_id }
    });

    res.json({ liked: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* 게시글 좋아요 목록 조회 */
router.get("/post/:userId", async (req, res) => {
  const userId = Number(req.params.userId);

  const result = await prisma.post_like.findMany({
    where: { user_id: userId },
    include: { post: true }
  });

  res.json(result);
});

export default router;

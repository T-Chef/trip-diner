import express from "express";
import prisma from "../../prisma/prismaClient.js";

const router = express.Router();

router.post("/:post_id/like", async (req, res) => {
  try {
    const post_id = Number(req.params.post_id);
    const { user_id } = req.body; 

    if (!user_id) {
      return res.status(400).json({ success: false, message: "user_id 필요" });
    }

    const already = await prisma.post_like.findFirst({
      where: { post_id, user_id: Number(user_id) }
    });

    if (already) {
      await prisma.post_like.delete({
        where: { like_id: already.like_id }
      });

      return res.json({ success: true, liked: false });
    }

    await prisma.post_like.create({
      data: {
        post_id,
        user_id: Number(user_id)
      }
    });

    return res.json({ success: true, liked: true });
  } catch (err) {
    console.error("좋아요 토글 오류:", err);
    res.status(500).json({ success: false });
  }
});

router.get("/:post_id/like-status", async (req, res) => {
  try {
    const post_id = Number(req.params.post_id);
    const user_id = Number(req.query.user_id);

    const liked = await prisma.post_like.findFirst({
      where: { post_id, user_id }
    });

    res.json({ liked: !!liked });
  } catch (err) {
    res.status(500).json({ liked: false });
  }
});

router.get("/:post_id/likes-count", async (req, res) => {
  try {
    const post_id = Number(req.params.post_id);

    const count = await prisma.post_like.count({
      where: { post_id }
    });

    res.json({ count });
  } catch (err) {
    res.status(500).json({ count: 0 });
  }
});

export default router;

import express from "express";
import prisma from "../../prisma/prismaClient.js";
import { adminAuth } from "../../middleware/adminAuth.js";

const router = express.Router();

// 게시글 조회
router.get("/", adminAuth, async (req, res) => {
  try {
    const posts = await prisma.post.findMany({
      orderBy: { created_at: "desc" },
      include: {
        user: {
          select: { name: true },
        },
      },
    });

    res.json(
      posts.map((p) => ({
        ...p,
        post_id: p.post_id.toString(),
        user_id: p.user_id.toString(),
      }))
    );
  } catch (err) {
    console.error("관리자 게시글 조회 오류:", err);
    res.status(500).json({ message: "게시글 조회 실패" });
  }
});

// 게시글 삭제
router.patch("/:id/delete", adminAuth, async (req, res) => {
  try {
    await prisma.post.update({
      where: { post_id: BigInt(req.params.id) },
      data: { deleted: 1 },
    });

    res.json({ success: true });
  } catch (err) {
    console.error("게시글 삭제 오류:", err);
    res.status(500).json({ message: "삭제 실패" });
  }
});

// 게시글 복구
router.patch("/:id/restore", adminAuth, async (req, res) => {
  try {
    await prisma.post.update({
      where: { post_id: BigInt(req.params.id) },
      data: { deleted: 0 },
    });

    res.json({ success: true });
  } catch (err) {
    console.error("게시글 복구 오류:", err);
    res.status(500).json({ message: "복구 실패" });
  }
});

export default router;
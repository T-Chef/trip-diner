import express from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = express.Router();

/* ===========================
   여행지 좋아요 (TOGGLE)
=========================== */
router.get("/place/:userId", async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ error: "userId 필요" });
  }

  let uid;
  try {
    uid = BigInt(userId);
  } catch (e) {
    return res.status(400).json({ error: "userId가 잘못되었습니다." });
  }

  const result = await prisma.place_like.findMany({
    where: { user_id: uid },
    include: { place: true }
  });

  res.json(result);
});

/* ===========================
   게시글 좋아요 (TOGGLE)
=========================== */
router.get("/post/:userId", async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ error: "userId 필요" });
  }

  let uid;
  try {
    uid = BigInt(userId);
  } catch (e) {
    return res.status(400).json({ error: "userId가 잘못되었습니다." });
  }

  const result = await prisma.post_like.findMany({
    where: { user_id: uid },
    include: { post: true }
  });

  res.json(result);
});


/* 게시글 좋아요 목록 조회 */
router.get("/post/:userId", async (req, res) => {
  const userId = BigInt(req.params.userId);

  const result = await prisma.post_like.findMany({
    where: { user_id: userId },
    include: { post: true }
  });

  res.json(result);
});

export default router;

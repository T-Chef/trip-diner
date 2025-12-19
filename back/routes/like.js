import express from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = express.Router();

/* =======================================
   여행지 좋아요 목록 조회하기 (수정완료)
========================================== */
router.get("/place/:userId", async (req, res) => {
  const { userId } = req.params;

  let uid;
  try {
    uid = BigInt(userId);
  } catch {
    return res.status(400).json({ error: "잘못된 userId 형식" });
  }

  const result = await prisma.place_like.findMany({
    where: { user_id: uid },
    include: { place: true },
  });

  res.json(result);
});

/* =============================================
   게시글 좋아요 목록 조회하기 (수정완료)
================================================ */
router.get("/post/:userId", async (req, res) => {
  const { userId } = req.params;

  let uid;
  try {
    uid = BigInt(userId);
  } catch {
    return res.status(400).json({ error: "잘못된 userId 형식" });
  }

  const result = await prisma.post_like.findMany({
    where: { user_id: uid },
    include: { post: true },
  });

  res.json(result);
});

export default router;

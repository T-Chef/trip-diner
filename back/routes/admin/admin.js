import express from "express";
import prisma from "../../prisma/prismaClient.js";
import { adminAuth } from "../../middleware/adminAuth.js";

const router = express.Router();

/* ==========================
  관리자: 전체 유저 목록
========================== */
router.get("/users", adminAuth, async (req, res) => {
  const users = await prisma.user.findMany({
    orderBy: { user_id: "desc" },
  });

  res.json(
    users.map((u) => ({
      ...u,
      user_id: Number(u.user_id),
    }))
  );
});

/* ==========================
   유저 비활성화
========================== */
router.patch("/users/:userId/deactivate", adminAuth, async (req, res) => {
  const { userId } = req.params;

  try {
    await prisma.user.update({
      where: { user_id: BigInt(userId) },
      data: { deleted: 1 },
    });

    res.json({ success: true });
  } catch (err) {
    console.error("유저 비활성화 오류:", err);
    res.status(500).json({ message: "비활성화 실패" });
  }
});

/* ==========================
   유저 활성화
========================== */
router.patch("/users/:userId/activate", adminAuth, async (req, res) => {
  const { userId } = req.params;

  try {
    await prisma.user.update({
      where: { user_id: BigInt(userId) },
      data: { deleted: 0 },
    });

    res.json({ success: true });
  } catch (err) {
    console.error("유저 활성화 오류:", err);
    res.status(500).json({ message: "활성화 실패" });
  }
});

export default router;

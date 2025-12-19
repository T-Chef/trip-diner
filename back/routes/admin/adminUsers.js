import express from "express";
import prisma from "../../prisma/prismaClient.js";
import { adminAuth } from "../../middleware/adminAuth.js";

const router = express.Router();

/* ===============================
   전체 유저 목록 조회
   GET /api/admin/users
================================ */
router.get("/users", adminAuth, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { user_id: "desc" },
      select: {
        user_id: true,
        email: true,
        name: true,
        deleted: true,
      },
    });

    const safeUsers = users.map((u) => ({
      ...u,
      user_id: u.user_id.toString(),
    }));

    res.json(safeUsers);
  } catch (err) {
    console.error("관리자 유저 목록 오류:", err);
    res.status(500).json({ message: "유저 목록 조회 실패" });
  }
});

/* ===============================
   유저 비활성화
   PATCH /api/admin/users/:id/deactivate
================================ */
router.patch("/users/:id/deactivate", adminAuth, async (req, res) => {
  try {
    await prisma.user.update({
      where: { user_id: BigInt(req.params.id) },
      data: { deleted: 1 },
    });

    res.json({ message: "비활성화 완료" });
  } catch (err) {
    console.error("유저 비활성화 오류:", err);
    res.status(500).json({ message: "비활성화 실패" });
  }
});

/* ===============================
   유저 활성화
   PATCH /api/admin/users/:id/activate
================================ */
router.patch("/users/:id/activate", adminAuth, async (req, res) => {
  try {
    await prisma.user.update({
      where: { user_id: BigInt(req.params.id) },
      data: { deleted: 0 },
    });

    res.json({ message: "활성화 완료" });
  } catch (err) {
    console.error("유저 활성화 오류:", err);
    res.status(500).json({ message: "활성화 실패" });
  }
});

export default router;
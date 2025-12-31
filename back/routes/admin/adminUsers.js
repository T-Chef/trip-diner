import express from "express";
import prisma from "../../prisma/prismaClient.js";
import { adminAuth } from "../../middleware/adminAuth.js";

const router = express.Router();

/* 전체 유저 목록 */
router.get("/", adminAuth, async (req, res) => {
  const users = await prisma.user.findMany({
    orderBy: { user_id: "desc" },
    select: {
      user_id: true,
      email: true,
      name: true,
      deleted: true,
    },
  });

  res.json(
    users.map((u) => ({
      ...u,
      user_id: u.user_id.toString(),
    }))
  );
});

/* 비활성화 */
router.patch("/:id/deactivate", adminAuth, async (req, res) => {
  await prisma.user.update({
    where: { user_id: BigInt(req.params.id) },
    data: { deleted: 1 },
  });
  res.json({ success: true });
});

/* 활성화 */
router.patch("/:id/activate", adminAuth, async (req, res) => {
  await prisma.user.update({
    where: { user_id: BigInt(req.params.id) },
    data: { deleted: 0 },
  });
  res.json({ success: true });
});

export default router;
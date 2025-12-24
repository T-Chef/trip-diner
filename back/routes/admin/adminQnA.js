// back/routes/admin/adminQnA.js
import express from "express";
import prisma from "../../prisma/prismaClient.js";

const router = express.Router();

// 관리자 QnA 목록
router.get("/", async (req, res) => {
  const list = await prisma.qna.findMany({
    orderBy: { created_at: "desc" },
    include: {
      user: { select: { name: true } },
      qna_answer: true,
    },
  });
  res.json(list);
});

// 관리자 답변
router.post("/:qnaId/answer", async (req, res) => {
  const { qnaId } = req.params;
  const { admin_id, content } = req.body;

  await prisma.qna_answer.create({
    data: {
      qna_id: Number(qnaId),
      admin_id,
      content,
    },
  });

  await prisma.qna.update({
    where: { qna_id: Number(qnaId) },
    data: { status: "ANSWERED" },
  });

  res.json({ success: true });
});

export default router;
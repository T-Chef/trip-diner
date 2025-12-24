import express from "express";
import prisma from "../../prisma/prismaClient.js";

const router = express.Router();

// 관리자 QnA 목록 조회
router.get("/", async (req, res) => {
  try {
    const list = await prisma.qna.findMany({
      orderBy: { created_at: "desc" },
      include: {
        user: {
          select: {
            name: true,
          },
        },
        answers: true,
      },
    });

    res.json(list);
  } catch (err) {
    console.error("관리자 QnA 목록 조회 오류:", err);
    res.status(500).json({
      success: false,
      message: "QnA 목록 조회 실패",
    });
  }
});


// 관리자 답변 등록
router.post("/:qnaId/answer", async (req, res) => {
  const { qnaId } = req.params;
  const { admin_id, content } = req.body;

  try {
    await prisma.qna_answer.create({
      data: {
        qna_id: Number(qnaId),
        admin_id: Number(admin_id),
        content,
      },
    });

    await prisma.qna.update({
      where: { qna_id: Number(qnaId) },
      data: { status: "ANSWERED" },
    });

    res.json({ success: true });
  } catch (err) {
    console.error("관리자 QnA 답변 등록 오류:", err);
    res.status(500).json({
      success: false,
      message: "답변 등록 실패",
    });
  }
});

router.get("/", async (req, res) => {
  try {
    const list = await prisma.qna.findMany({
      orderBy: { created_at: "desc" },
      include: {
        user: { select: { name: true } },
        answers: true,
      },
    });

    res.json(list);
  } catch (err) {
    console.error("관리자 QnA 조회 오류:", err);
    res.status(500).json({ message: "조회 실패" });
  }
});

export default router;
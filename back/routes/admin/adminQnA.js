import express from "express";
import prisma from "../../prisma/prismaClient.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const list = await prisma.qna.findMany({
      orderBy: { created_at: "desc" },
      include: {
        user: { select: { name: true } },
        qna_answer: true,
      },
    });

    return res.json({
      success: true,
      data: list,
    });

  } catch (err) {
    console.error("관리자 QnA 목록 조회 오류:", err);
    res.status(500).json({
      success: false,
      message: "QnA 목록 조회 실패",
    });
  }
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const qna = await prisma.qna.findFirst({
      where: { qna_id: Number(id) },
      include: {
        user: { select: { name: true } },
        qna_answer: true,
      },
    });

    if (!qna) {
      return res.status(404).json({
        success: false,
        message: "존재하지 않는 문의입니다",
      });
    }

    return res.json({
      success: true,
      data: qna,
    });

  } catch (err) {
    console.error("관리자 QnA 상세 오류:", err);
    res.status(500).json({
      success: false,
      message: "문의 상세 조회 실패",
    });
  }
});

router.post("/:qnaId/answer", async (req, res) => {
  const { qnaId } = req.params;
  const { admin_id, content } = req.body;

  try {
    const qnaIdBigInt = BigInt(qnaId);

    console.log("답변 등록 요청:", { qnaIdBigInt, admin_id, content });

    await prisma.qna_answer.create({
      data: {
        qna_id: qnaIdBigInt,
        admin_id: Number(admin_id),
        content,
      },
    });

    await prisma.qna.update({
      where: { qna_id: Number(qnaId) },
      data: { status: "DONE" },
    });

    return res.json({
      success: true,
      message: "답변 등록 완료",
    });

  } catch (err) {
    console.error("관리자 QnA 답변 등록 오류:", err);
    return res.status(500).json({
      success: false,
      message: "답변 등록 실패",
      error: err.message,
    });
  }
});

export default router;
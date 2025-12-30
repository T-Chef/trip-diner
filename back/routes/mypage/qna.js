import express from "express";
import prisma from "../../prisma/prismaClient.js";
import { userAuth } from "../../middleware/userAuth.js";

const router = express.Router();

/**
 * 사용자 문의 등록
 */
router.post("/", userAuth, async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: "제목과 내용을 입력하세요.",
      });
    }

    await prisma.qna.create({
      data: {
        user_id: BigInt(req.user.user_id),
        title,
        content,
        status: "WAITING",
      },
    });

    res.json({ success: true });
  } catch (err) {
    console.error("QnA 등록 오류:", err);
    res.status(500).json({ success: false });
  }
});

/**
 * 사용자 QnA 상세 조회 (관리자 답변 포함)
 */
router.get("/:id", userAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const qna = await prisma.qna.findUnique({
      where: { qna_id: BigInt(id) },
      include: {
        answer: true, // ⭐ 관리자 답변 포함
      },
    });

    if (!qna) {
      return res.status(404).json({
        success: false,
        message: "존재하지 않는 문의입니다.",
      });
    }

    // 본인 것만 볼 수 있도록 보호
    if (qna.user_id !== BigInt(req.user.user_id)) {
      return res.status(403).json({
        success: false,
        message: "접근 권한이 없습니다.",
      });
    }

    res.json({ success: true, data: qna });
  } catch (err) {
    console.error("QnA 상세 오류:", err);
    res.status(500).json({ success: false });
  }
});

export default router;
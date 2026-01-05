import express from "express";
import prisma from "../../prisma/prismaClient.js";
import { userAuth } from "../../middleware/userAuth.js";

const router = express.Router();

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

router.get("/my", userAuth, async (req, res) => {
  try {
    const list = await prisma.qna.findMany({
      where: { user_id: BigInt(req.user.user_id) },
      orderBy: { created_at: "desc" },
      select: {
        qna_id: true,
        title: true,
        status: true,
        created_at: true,
      },
    });

    return res.json({
      success: true,
      data: list,
    });

  } catch (err) {
    console.error("내 QnA 목록 오류:", err);
    res.status(500).json({ success: false });
  }
});

router.get("/", userAuth, async (req, res) => {
  try {
    const list = await prisma.qna.findMany({
      where: { user_id: BigInt(req.user.user_id) },
      orderBy: { created_at: "desc" },
      include: {
        qna_answer: true,
      },
    });

    res.json({
      success: true,
      data: list,
    });

  } catch (err) {
    console.error("사용자 QnA 목록 오류:", err);
    res.status(500).json({ success: false });
  }
});


router.get("/:id", userAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const qna = await prisma.qna.findUnique({
      where: { qna_id: BigInt(id) },
      include: {
        qna_answer: true,
      },
    });

    if (!qna) {
      return res.status(404).json({
        success: false,
        message: "존재하지 않는 문의입니다.",
      });
    }

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

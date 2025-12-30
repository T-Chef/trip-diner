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
        user_id: BigInt(req.user.user_id), // ⭐ JWT에서 꺼냄
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

export default router;

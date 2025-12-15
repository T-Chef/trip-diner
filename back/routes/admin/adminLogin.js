import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../../prisma/prismaClient.js";

const router = express.Router();

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const admin = await prisma.admin.findUnique({
      where: { email },
    });

    if (!admin) {
      return res.status(400).json({ message: "관리자 계정이 없습니다." });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({ message: "비밀번호가 틀렸습니다." });
    }

    const token = jwt.sign(
      {
        admin_id: admin.admin_id.toString(),
        role: admin.role,
      },
      process.env.ADMIN_SECRET,
      { expiresIn: "2h" }
    );

    res.json({
      success: true,
      token,
    });
  } catch (err) {
    console.error("관리자 로그인 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

export default router;
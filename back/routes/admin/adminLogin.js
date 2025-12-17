import express from "express";
import jwt from "jsonwebtoken";
import prisma from "../../prisma/prismaClient.js";
import bcrypt from "bcrypt";

const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await prisma.admin.findUnique({
      where: { email },
    });

    if (!admin) {
      return res.status(401).json({ message: "관리자 정보 없음" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: "비밀번호 불일치" });
    }

    const payload = {
      admin_id: admin.admin_id.toString(), // BigInt 제거
      role: "ADMIN",
      email: admin.email,
    };

    const token = jwt.sign(
      payload,
      process.env.ADMIN_JWT_SECRET, // 🔥 여기
      { expiresIn: "2h" }
    );

    res.json({ token });
  } catch (err) {
    console.error("관리자 로그인 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

export default router;

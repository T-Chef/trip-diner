import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../../prisma/prismaClient.js";
import { adminAuth } from "../../middleware/adminAuth.js";

const router = express.Router();

// 관리자 로그인
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const admin = await prisma.admin.findUnique({
      where: { email }
    });

    if (!admin) {
      return res.status(400).json({
        success: false,
        message: "존재하지 않는 관리자입니다."
      });
    }

    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "비밀번호가 일치하지 않습니다."
      });
    }

    const token = jwt.sign(
      {
        admin_id: admin.admin_id.toString(),
        role: admin.role
      },
      process.env.ADMIN_SECRET,
      { expiresIn: "2h" }
    );

    return res.json({
      success: true,
      token,
      admin: {
        admin_id: admin.admin_id.toString(),
        email: admin.email,
        role: admin.role
      }
    });

  } catch (err) {
    console.error("관리자 로그인 오류:", err);
    res.status(500).json({
      success: false,
      message: "서버 오류가 발생했습니다."
    });
  }
});

export default router;

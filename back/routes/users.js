// back/routes/users.js
import express from "express";
import bcrypt from "bcrypt";
import prisma from "../prisma/prismaClient.js";

const router = express.Router();

/* -------------------------------------------------------
   회원가입
------------------------------------------------------- */
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        provider: "LOCAL",
      },
    });

    const safeUser = {
      ...user,
      user_id: user.user_id.toString(),
    };

    return res.status(200).json({
      success: true,
      message: "회원가입 성공",
      user: safeUser,
    });
  } catch (err) {
    console.error("회원가입 에러:", err);
    return res.status(500).json({
      success: false,
      message: "회원가입 실패",
    });
  }
});

/* -------------------------------------------------------
   로그인
------------------------------------------------------- */
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "존재하지 않는 이메일입니다.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "비밀번호가 일치하지 않습니다.",
      });
    }

    const safeUser = {
      ...user,
      user_id: user.user_id.toString(),
    };

    return res.status(200).json({
      success: true,
      message: "로그인 성공",
      user: safeUser,
    });
  } catch (err) {
    console.error("로그인 에러:", err);
    return res.status(500).json({
      success: false,
      message: "로그인 실패",
    });
  }
});

export default router;
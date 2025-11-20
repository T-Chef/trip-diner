// back/routes/users.js
import express from "express";
import bcrypt from "bcrypt";
import prisma from "../prisma/prismaClient.js";

const router = express.Router();

/* -------------------------------------------------------
   회원가입
------------------------------------------------------- */
router.post("/register", async (req, res) => {
  console.log("회원가입 요청 데이터:", req.body);

  const { name, email, password } = req.body;

  try {
    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false,
        message: "모든 필드를 입력해주세요." 
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: name,       // ✔ 반드시 저장
        email: email,
        password: hashedPassword,
        provider: "LOCAL",
      },
    });

    return res.status(200).json({
      success: true,
      message: "회원가입 성공",
      user: {
        user_id: user.user_id.toString(),
        email: user.email,
        name: user.name,
      }
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

    // BigInt 쓰지 않고 순수 JSON으로 재구성
    const safeUser = {
      user_id: user.user_id.toString(),
      email: user.email,
      name: user.name || "사용자",   // name이 NULL이면 기본값
      provider: user.provider,
      created_at: user.created_at,
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
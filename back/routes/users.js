// back/routes/users.js
import express from "express";
import bcrypt from "bcrypt";
import prisma from "../prisma/prismaClient.js";

const router = express.Router();

// 회원가입
router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // 비밀번호 암호화
    const hashedPassword = await bcrypt.hash(password, 10);

    // DB에 저장
    const user = await prisma.users.create({
      data: {
        username,
        email,
        password: hashedPassword,
      },
    });

    res.json({ message: "회원가입 성공", user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "회원가입 실패" });
  }
});

// 로그인
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1) 이메일로 사용자 찾기
    const user = await prisma.users.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(400).json({ message: "존재하지 않는 이메일입니다." });
    }

    // 2) 비밀번호 비교
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "비밀번호가 일치하지 않습니다." });
    }

    // 3) 로그인 성공
    res.json({ message: "로그인 성공", user });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "로그인 실패" });
  }
});

export default router;

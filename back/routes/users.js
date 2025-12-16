// back/routes/users.js
import express from "express";
import bcrypt from "bcrypt";
import prisma from "../prisma/prismaClient.js";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

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

    // ⭐ 비활성화 유저 차단
    if (user.deleted === 1) {
      return res.status(403).json({
        success: false,
        message: "비활성화된 계정입니다. 관리자에게 문의하세요.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "비밀번호가 일치하지 않습니다.",
      });
    }

    const accessToken = jwt.sign(
      { user_id: user.user_id.toString(), email: user.email },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
      { user_id: user.user_id.toString(), email: user.email },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const safeUser = {
      user_id: user.user_id.toString(),
      email: user.email,
      name: user.name || "사용자",
      provider: user.provider,
      created_at: user.created_at,
      profile_img: user.profile_img,
    };

    return res.status(200).json({
      success: true,
      message: "로그인 성공",
      accessToken,
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

/* ------------------------------------
      nodemailer 설정
-------------------------------------*/
const transporter = nodemailer.createTransport({
  service: "naver",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/*  -----------------------------------
       이메일 중복 체크
--------------------------------------*/
router.get("/check-email", async (req, res) => {
  const { email } = req.query;

  const user = await prisma.user.findUnique({ where: { email } });
  if (user) return res.json({ exists: true });

  res.json({ exists: false });
});

/* -------------------------------------
   비밀번호 재설정 메일 요청
--------------------------------------*/
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return res.json({
      success: false,
      message: "등록되지 않은 이메일입니다.",
    });
  }

  // ⚠ must include user_id in token payload!
  const token = jwt.sign(
    { user_id: user.user_id.toString() }, 
    process.env.JWT_SECRET || "secretkey",
    { expiresIn: "1h" }
  );

  // URL 인코딩
  const resetLink = `http://localhost:3000/reset-password?token=${encodeURIComponent(token)}`;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "비밀번호 재설정 링크",
      text: `비밀번호 재설정 링크: ${resetLink}`,
    });

    console.log("Generated reset token:", token); // ✔ 디버깅용

    res.json({ success: true, message: "메일 전송 완료" });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "메일 전송 실패" });
  }
});

/* ---------------------------------------
      비밀번호 변경
----------------------------------------*/
router.post("/reset-password", async (req, res) => {
  const { token, password } = req.body;

  try {
    // 토큰 검증 → payload 안에 user_id 포함됨
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secretkey");

    // password hash
    const hash = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { user_id: BigInt(decoded.user_id) }, // payload에 user_id가 있어야 작동
      data: { password: hash },
    });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "토큰이 만료되었거나 잘못되었습니다." });
  }
});

// 유저 정보 조회
router.get("/user/:id", async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { user_id: Number(req.params.id) },
    });

    if (!user) {
      return res.status(404).json({ error: "유저 없음" });
    }

    return res.json(user);
  } catch (err) {
    console.error("유저 정보 조회 오류:", err);
    return res.status(500).json({ error: "서버 오류" });
  }
});


export default router;
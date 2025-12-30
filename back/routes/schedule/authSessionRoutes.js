// back/routes/schedule/authSessionRoutes.js
import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import prisma from "../../prisma/prismaClient.js";

const router = express.Router();

const sha256 = (s) => crypto.createHash("sha256").update(s).digest("hex");

const signAccess = (user) =>
  jwt.sign(
    { user_id: user.user_id.toString(), email: user.email },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "15m" }
  );

const setRefreshCookie = (res, token) => {
  res.cookie("refresh_token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: false, // 배포(https)면 true
    path: "/",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30일
  });
};

// ✅ 로그인 (DB refresh_session 방식)
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "존재하지 않는 이메일입니다.",
      });
    }

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

    const accessToken = signAccess(user);

    // ✅ refresh_token 생성/저장 (JWT X, 랜덤 토큰 + DB 해시 저장)
    const refreshToken = crypto.randomBytes(64).toString("hex");
    const tokenHash = sha256(refreshToken);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // (선택) 기존 세션 전부 폐기 = 1인 1세션 정책
    await prisma.refresh_session.updateMany({
      where: { user_id: user.user_id, revoked_at: null },
      data: { revoked_at: new Date() },
    });

    await prisma.refresh_session.create({
      data: {
        user_id: user.user_id,
        token_hash: tokenHash,
        expires_at: expiresAt,
      },
    });

    setRefreshCookie(res, refreshToken);

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
    return res.status(500).json({ success: false, message: "로그인 실패" });
  }
});

// ✅ refresh: 쿠키 refresh_token으로 access 재발급 (+ refresh 로테이션)
router.post("/refresh", async (req, res) => {
  try {
    const refreshToken = req.cookies?.refresh_token;
    if (!refreshToken) return res.status(401).json({ success: false });

    const tokenHash = sha256(refreshToken);

    const session = await prisma.refresh_session.findUnique({
      where: { token_hash: tokenHash },
    });

    if (!session || session.revoked_at) return res.status(401).json({ success: false });
    if (session.expires_at < new Date()) return res.status(401).json({ success: false });

    // ✅ 로테이션: 기존 세션 폐기 + 새 refresh 발급
    await prisma.refresh_session.update({
      where: { session_id: session.session_id },
      data: { revoked_at: new Date() },
    });

    const newRefreshToken = crypto.randomBytes(64).toString("hex");
    const newHash = sha256(newRefreshToken);
    const newExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await prisma.refresh_session.create({
      data: {
        user_id: session.user_id,
        token_hash: newHash,
        expires_at: newExpiresAt,
      },
    });

    setRefreshCookie(res, newRefreshToken);

    // access 재발급
    const user = await prisma.user.findUnique({ where: { user_id: session.user_id } });
    if (!user) return res.status(401).json({ success: false });

    const accessToken = signAccess(user);
    return res.json({ success: true, accessToken });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false });
  }
});

// ✅ 로그아웃: DB 세션 폐기 + 쿠키 삭제
router.post("/logout", async (req, res) => {
  try {
    const refreshToken = req.cookies?.refresh_token;

    if (refreshToken) {
      const tokenHash = sha256(refreshToken);
      await prisma.refresh_session.updateMany({
        where: { token_hash: tokenHash, revoked_at: null },
        data: { revoked_at: new Date() },
      });
    }

    res.clearCookie("refresh_token", {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      path: "/",
    });

    return res.json({ success: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false });
  }
});

export default router;